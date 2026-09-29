// Scopes, Meals and the Daily log end to end: swipe the bar between scopes
// (icons + accent change), generate a week, mark a meal eaten, shopping
// ticks, a second device pulls the same plan, the daily log's two touches
// and routine ticks, laptop sidebar switch. node tests/browser/meals.js
// SHOTS=1 also writes screenshots to /tmp/meals-*.png.
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m,d)=>{console.log((c?'ok   ':'FAIL ')+m+(d!==undefined&&!c?' :: '+JSON.stringify(d):'')); if(!c) fails++;};
const SHOTS=!!process.env.SHOTS;
const shot=async(p,name)=>{ if(SHOTS) await p.screenshot({path:`/tmp/meals-${name}.png`,fullPage:false}); };
async function settle(p,ms=1500){ await p.clock.runFor(ms); await W(400); }
async function swipe(p,dx){
  const box=await p.locator('#nav').boundingBox(); const y=box.y+box.height/2, x0=box.x+box.width/2;
  const t=(x)=>({identifier:1,clientX:x,clientY:y});
  await p.evaluate(({x0,dx,y})=>{
    const nav=document.getElementById('nav');
    const mk=(type,x)=>{const e=new Event(type,{bubbles:true}); e.touches=[{clientX:x,clientY:y}]; return e;};
    nav.dispatchEvent(mk('touchstart',x0));
    for(let i=1;i<=6;i++) nav.dispatchEvent(mk('touchmove',x0+dx*i/6));
    const end=new Event('touchend',{bubbles:true}); end.touches=[]; nav.dispatchEvent(end);
  },{x0,dx,y});
  await W(450);
}
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-30T08:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-30T08:30:00+01:00',storage:{pb_profile:{settings:{theme:process.env.THEME||'light'}}}});
  const p=A.page;
  await p.goto('http://app.local/index.html'); await settle(p,3000);
  const scope=()=>p.evaluate(()=>({scope:document.body.dataset.scope, screen:App.screen, accent:getComputedStyle(document.body).getPropertyValue('--accent').trim(),
    label:document.querySelector('#nav-scopebar span')?.textContent, onGroup:document.querySelector('.nav-group.on')?.dataset.scope}));
  let s=await scope();
  ok(s.scope==='train'&&s.onGroup==='train'&&s.label==='Training','boots in Training',s);
  const trainAccent=s.accent;
  await shot(p,'1-training');

  // swipe left → Daily log, left again → Meals, right → back
  await swipe(p,-200); s=await scope();
  ok(s.scope==='daylog'&&s.screen==='daylog-checkin'&&s.label==='Daily log','swipe left → Daily log check-in',s);
  ok(s.accent!==trainAccent,'accent changes with scope',s.accent);
  await swipe(p,-200); s=await scope();
  ok(s.scope==='meals'&&s.screen==='meals-week','swipe left → Meals week',s);
  await swipe(p,-200); s=await scope();
  ok(s.scope==='meals','rubber band at the last scope',s);
  await swipe(p,40); s=await scope();
  ok(s.scope==='meals','short drag does not change scope',s);
  const hiddenFocusable=await p.evaluate(()=>[...document.querySelectorAll('.nav-group:not(.on)')].every(g=>g.hasAttribute('inert')));
  ok(hiddenFocusable,'off-screen groups are inert');

  // Meals: empty state, food settings uses the latest weigh-in, generate
  await p.evaluate(()=>Vitals.addWeight('2026-09-23',73.3));
  await p.click('.nav-btn[data-screen="meals-me"]'); await W(200);
  const me=await p.evaluate(()=>document.getElementById('meals-body').innerText);
  ok(/73\.3 kg from your latest weigh-in/.test(me),'Food settings reads the weigh-in');
  const dl7=await p.evaluate(()=>[...document.querySelectorAll('[data-ml="dtype"]')].map(b=>b.getAttribute('aria-label')));
  ok(dl7.length===7&&dl7.some(x=>/Zone 2 long run, hard/.test(x))&&dl7.some(x=>/Strength A, moderate/.test(x)),'training days listed with their session',dl7);
  await shot(p,'2-me');
  await p.click('.nav-btn[data-screen="meals-week"]'); await W(200);
  ok(await p.locator('[data-ml="generate"]').count()===1,'empty week offers generate');
  await p.click('[data-ml="generate"]'); await W(300);
  const wk=await p.evaluate(()=>({slots:document.querySelectorAll('.ml-slot').length, days:document.querySelectorAll('.ml-day').length, today:document.querySelector('.ml-day.is-today .ml-dd')?.textContent, effort:document.querySelector('.ml-effort')?.textContent}));
  ok(wk.slots===3&&wk.days===7&&wk.today==='30','week board with today (Wed 30)',wk);
  ok(/Plyo|Power|moderate|hard|easy/i.test(wk.effort||''),'day shows its training and tier',wk.effort);
  const guide=await p.evaluate(()=>[...document.querySelectorAll('.ml-slot[data-v="l"] .ml-gl b')].map(b=>b.textContent));
  ok(guide.length&&guide.includes('Ready'),'weekday lunch reads as a box from Sunday',guide);
  await shot(p,'3-week');
  // mark lunch eaten via the slot sheet
  await p.click('.ml-slot[data-v="l"]'); await W(250);
  ok(await p.evaluate(()=>getComputedStyle(document.getElementById('ml-sheet-back')).display)==='flex','slot sheet opens');
  await shot(p,'4-slot-sheet');
  await p.click('#ml-sheet [data-ml="done"]'); await W(250);
  ok(await p.locator('.ml-pchip--done').count()===1,'lunch marked eaten');
  // prep + shop
  await p.click('.nav-btn[data-screen="meals-prep"]'); await W(200);
  ok(await p.locator('.ml-session').count()>=2,'prep sessions listed');
  const prep=await p.evaluate(()=>({rows:document.querySelectorAll('#ml-prep-0 .ml-wr:not(.ml-wh)').length, cells:document.querySelectorAll('#ml-prep-0 .ml-wr span.is-on').length, boxes:document.querySelectorAll('#ml-prep-0 .ml-box').length, uses:document.querySelectorAll('#ml-prep-0 .ml-use').length}));
  ok(prep.rows>=4&&prep.cells>=8&&prep.boxes>=6&&prep.uses>=8,'Sunday shows what goes where, which meals each pot feeds, and the boxes to pack',prep);
  await shot(p,'5-prep');
  await p.click('.nav-btn[data-screen="meals-shop"]'); await W(200);
  const n0=await p.locator('.ml-item.is-checked').count();
  await p.locator('.ml-item input[data-ml-change="check"]').first().check(); await W(200);
  ok(await p.locator('.ml-item.is-checked').count()===n0+1,'shopping tick sticks');
  await shot(p,'6-shop');
  await p.click('.nav-btn[data-screen="meals-recipes"]'); await W(200);
  ok(await p.locator('.ml-rcard').count()>15,'recipe library');
  await p.fill('#ml-libq','salmon'); await W(200);
  ok(await p.locator('.ml-rcard').count()>=2 && await p.evaluate(()=>document.activeElement.id)==='ml-libq','search filters and keeps focus');

  // sync: second device pulls the same week
  await settle(p,3000);
  ok(sb.rows('overrides').some(r=>r.store_key==='meals'),'meals row on the server');
  const B=await newDevice(browser,sb,{time:'2026-09-30T09:00:00+01:00'});
  await B.page.goto('http://app.local/index.html'); await settle(B.page,3000);
  await B.page.evaluate(()=>navTo('meals-week')); await W(300);
  const bw=await B.page.evaluate(()=>({slots:document.querySelectorAll('.ml-slot').length, eaten:document.querySelectorAll('.ml-pchip--done').length}));
  ok(bw.slots===3&&bw.eaten===1,'second device sees the plan and the eaten lunch',bw);
  await B.ctx.close();

  // Daily log
  await p.evaluate(()=>Scopes.go('daylog')); await W(250);
  ok(await p.evaluate(()=>App.screen)==='daylog-checkin','Scopes.go opens check-in');
  await p.click('[data-dl="rate"][data-part="am"][data-f="sleepQ"][data-v="4"]'); await W(100);
  await p.click('[data-dl="rate"][data-part="am"][data-f="energy"][data-v="3"]'); await W(100);
  const ck=await p.evaluate(()=>({sleep:App.checkin.sleep, energy:App.checkin.energy}));
  ok(ck.sleep===4&&ck.energy===3,'morning ratings seed the training check-in',ck);
  await p.click('[data-dl="rate"][data-part="am"][data-f="mood"][data-v="4"]'); await W(80);
  await p.click('[data-dl="rate"][data-part="am"][data-f="calm"][data-v="3"]'); await W(80);
  await p.click('[data-dl="mins"][data-v="med1"][data-n="20"]'); await W(100);
  await p.click('[data-dl="tick"][data-v="wake"]'); await W(100);
  const dl=await p.evaluate(()=>DB.get('daylog').days['2026-09-30']);
  ok(dl.am.sleepQ===4&&dl.am.mood===4&&dl.done.wake&&dl.done.med1&&dl.med.med1===20,'check-in and routine saved',dl);
  ok(await p.evaluate(()=>document.querySelector('.dl-touch')?.querySelector('.dl-h2')?.textContent)==='Evening','once the morning is in, the evening leads');
  await shot(p,'7-checkin');
  await p.fill('#dl-note','Calm open, one clean trade'); await p.press('#dl-note','Enter'); await W(150);
  ok((await p.evaluate(()=>DB.get('daylog').days['2026-09-30'].pm.note))==='Calm open, one clean trade','evening line saved');
  await p.click('.nav-btn[data-screen="daylog-sleep"]'); await W(200);
  ok(await p.locator('.dl-night').count()===14,'sleep: two weeks of nights');
  await shot(p,'8-sleep');
  await p.click('.nav-btn[data-screen="daylog-trends"]'); await W(200);
  ok(await p.locator('.dl-grow').count()===9,'trends grid has the nine routines');
  await shot(p,'9-trends');
  // edit list
  await p.click('.nav-btn[data-screen="daylog-checkin"]'); await W(150);
  await p.click('[data-dl="editlist"]'); await W(150);
  await p.fill('#dl-newr','Screens off by 22:30'); await p.click('[data-dl="addr"]'); await W(150);
  ok((await p.evaluate(()=>DB.get('daylog').routines.length))===10,'routine added');

  // swipe back right twice → Training, last tab remembered
  await swipe(p,220); await swipe(p,220); s=await scope();
  ok(s.scope==='train'&&s.screen==='home','swipe right twice → Training',s);
  await swipe(p,-220); s=await scope();
  ok(s.screen==='daylog-checkin','Daily log reopens its last tab',s);
  await p.evaluate(()=>navTo('today')); s=await scope();
  ok(s.scope==='train'&&s.onGroup==='train','navTo a training screen moves the bar back',s);

  // laptop: sidebar switch
  await p.setViewportSize({width:1280,height:820}); await W(200);
  await p.click('.nav-scopes [data-scope-go="meals"]'); await W(250); s=await scope();
  const vis=await p.evaluate(()=>[...document.querySelectorAll('.nav-btn')].filter(b=>b.offsetParent).map(b=>b.dataset.screen));
  ok(s.scope==='meals'&&vis.every(x=>x.startsWith('meals-'))&&vis.length===5,'sidebar switch shows only the Meals items',vis);
  await shot(p,'10-desktop');
  await p.click('.nav-btn[data-screen="meals-week"]'); await W(150);
  await p.click('.ml-slot[data-v="d"]'); await W(250);
  await shot(p,'11-desktop-sheet');
  await p.keyboard.press('Escape'); await W(450);
  ok(await p.evaluate(()=>getComputedStyle(document.getElementById('ml-sheet-back')).display)==='none','Escape closes the sheet');
  await p.click('.nav-scopes [data-scope-go="train"]'); await W(200);
  ok(await p.evaluate(()=>[...document.querySelectorAll('.nav-btn')].filter(b=>b.offsetParent).some(b=>b.dataset.screen==='settings')),'Training items back in the sidebar');

  ok((p._errors||[]).length===0,'no page errors',p._errors);
  await A.ctx.close(); await browser.close();
  console.log(fails?`${fails} FAILED`:'all passed'); process.exit(fails?1:0);
})();
