// Screen swipe: sideways on the page moves to the next / previous tab of the
// current app (Training, Daily log, Meals) in bar order; the bar swipe still
// changes app. Rubber band at the first/last tab, short slow drags and
// vertical scrolls ignored, a quick flick counts, the week slider / sheets /
// laptop layout keep their own behaviour, and a real CDP touch works.
// node tests/browser/screen-swipe.js   (SHOTS=1 → /tmp/swipe-*.png)
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m,d)=>{console.log((c?'ok   ':'FAIL ')+m+(d!==undefined&&!c?' :: '+JSON.stringify(d):'')); if(!c) fails++;};
const SHOTS=!!process.env.SHOTS;

// Synthetic touch drag on an element: n moves, `gap` ms apart (timestamps set).
async function drag(p,sel,dx,{dy=0,n=8,gap=30,y=null}={}){
  await p.evaluate(({sel,dx,dy,n,gap,y})=>{
    const el=document.querySelector(sel); const r=el.getBoundingClientRect();
    const x0=Math.min(r.left+r.width/2, innerWidth/2), y0=y!=null?y:Math.min(r.top+r.height/2, innerHeight/2);
    const T0=performance.now();
    const mk=(type,x,yy,i)=>{const e=new Event(type,{bubbles:true,cancelable:true}); e.touches=type==='touchend'?[]:[{clientX:x,clientY:yy}]; Object.defineProperty(e,'timeStamp',{value:T0+i*gap}); return e;};
    el.dispatchEvent(mk('touchstart',x0,y0,0));
    for(let i=1;i<=n;i++) el.dispatchEvent(mk('touchmove',x0+dx*i/n,y0+dy*i/n,i));
    el.dispatchEvent(mk('touchend',0,0,n+1));
  },{sel,dx,dy,n,gap,y});
  await p.clock.runFor(500); await W(120);
}
const act='main.screen.active';

(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-30T08:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-30T08:30:00+01:00',storage:{pb_profile:{settings:{theme:'light'}}}});
  const p=A.page;
  await p.goto('http://app.local/index.html'); await p.clock.runFor(3000); await W(400);
  const st=()=>p.evaluate(()=>({screen:App.screen, scope:document.body.dataset.scope,
    active:document.querySelector('.nav-btn.active')?.dataset.screen,
    styled:[...document.querySelectorAll('main.screen')].filter(m=>m.style.transform||m.style.opacity).map(m=>m.id)}));
  let s=await st();
  ok(s.screen==='home','boots on Block',s);
  ok(JSON.stringify(await p.evaluate(()=>Scopes.tabs('train')))===JSON.stringify(['home','today','progress','stats','log','notes','settings']),'training tabs in bar order, hidden Live skipped');

  // Training: left → Today → Progress, right → Today
  await drag(p,act,-220); s=await st();
  ok(s.screen==='today'&&s.active==='today','swipe left on Block → Today (bar follows)',s);
  ok(s.styled.length===0,'no leftover inline transform',s.styled);
  if(SHOTS) await p.screenshot({path:'/tmp/swipe-1-today.png'});
  await drag(p,act,-220); s=await st();
  ok(s.screen==='progress','swipe left → Progress',s);
  await drag(p,act,220); s=await st();
  ok(s.screen==='today','swipe right → back to Today',s);
  await drag(p,act,220); s=await st();
  ok(s.screen==='home','swipe right → Block',s);
  await drag(p,act,220); s=await st();
  ok(s.screen==='home'&&s.styled.length===0,'rubber band at the first tab',s);

  // short slow drag ignored; short fast flick counts
  await drag(p,act,-50,{n:10,gap:60}); s=await st();
  ok(s.screen==='home','short slow drag ignored',s);
  await drag(p,act,-60,{n:4,gap:12}); s=await st();
  ok(s.screen==='today','quick flick → Today',s);

  // vertical-ish drag is a scroll, not a swipe
  await drag(p,act,-90,{dy:160}); s=await st();
  ok(s.screen==='today'&&s.styled.length===0,'diagonal/vertical drag ignored',s);

  // the Block week slider keeps its sideways scroll
  await p.evaluate(()=>navTo('home')); await p.clock.runFor(300); await W(100);
  if(await p.locator('[data-wks-track]').count()){
    await drag(p,'[data-wks-track]',-220); s=await st();
    ok(s.screen==='home','drag on the week slider does not change tab',s);
  } else ok(true,'(no week slider rendered — skipped)');

  // last tab: rubber band, never crosses into another app
  await p.evaluate(()=>navTo('settings')); await p.clock.runFor(300); await W(100);
  await drag(p,act,-220); s=await st();
  ok(s.screen==='settings'&&s.scope==='train','last Training tab: stays, stays in Training',s);

  // Live tab joins the order while a session runs
  await p.evaluate(()=>{document.querySelector('.session-nav').style.display='flex';});
  ok(JSON.stringify(await p.evaluate(()=>Scopes.tabs('train')).then(t=>t.slice(0,3)))===JSON.stringify(['home','today','session']),'Live joins the order when shown');
  await p.evaluate(()=>{document.querySelector('.session-nav').style.display='none';});

  // Daily log: check-in → sleep → trends, stays at trends
  await p.evaluate(()=>Scopes.go('daylog')); await p.clock.runFor(300); await W(150);
  s=await st(); ok(s.screen==='daylog-checkin','Daily log opens on Check-in',s);
  await drag(p,act,-220); s=await st();
  ok(s.screen==='daylog-sleep'&&s.active==='daylog-sleep','Daily log: swipe left → Sleep',s);
  if(SHOTS) await p.screenshot({path:'/tmp/swipe-2-sleep.png'});
  await drag(p,act,-220); s=await st();
  ok(s.screen==='daylog-trends','→ Trends',s);
  await drag(p,act,-220); s=await st();
  ok(s.screen==='daylog-trends'&&s.scope==='daylog','last Daily log tab: stays in Daily log',s);
  await drag(p,act,220); s=await st();
  ok(s.screen==='daylog-sleep','swipe right → Sleep',s);

  // Meals: week → prep; an open sheet owns the gesture
  await p.evaluate(()=>Scopes.go('meals')); await p.clock.runFor(300); await W(150);
  s=await st(); ok(s.screen==='meals-week','Meals opens on Week',s);
  await drag(p,act,-220); s=await st();
  ok(s.screen==='meals-prep','Meals: swipe left → Prep',s);
  await drag(p,act,220); s=await st();
  ok(s.screen==='meals-week','swipe right → Week',s);
  if(await p.locator('[data-ml="generate"]').count()){ await p.click('[data-ml="generate"]'); await p.clock.runFor(300); await W(150); }
  if(await p.locator('.ml-slot').count()){
    await p.click('.ml-slot >> nth=0'); await p.clock.runFor(300); await W(150);
    const open=await p.evaluate(()=>Scopes._overlayOpen());
    await drag(p,act,-220); s=await st();
    ok(open&&s.screen==='meals-week','open sheet: swipe does nothing',{open,s});
    await p.keyboard.press('Escape'); await p.clock.runFor(500); await W(150);
  } else ok(true,'(no meal slots — sheet case skipped)');

  // bar swipe still changes app, and screen swipe then works in that app
  await p.evaluate(()=>navTo('home')); await p.clock.runFor(300); await W(100);
  await p.evaluate(()=>{const nav=document.getElementById('nav'), r=nav.getBoundingClientRect(), y=r.top+r.height/2, x0=r.left+r.width/2, T0=performance.now();
    const mk=(t,x,i)=>{const e=new Event(t,{bubbles:true}); e.touches=t==='touchend'?[]:[{clientX:x,clientY:y}]; Object.defineProperty(e,'timeStamp',{value:T0+i*30}); return e;};
    nav.dispatchEvent(mk('touchstart',x0,0)); for(let i=1;i<=6;i++) nav.dispatchEvent(mk('touchmove',x0-200*i/6,i)); nav.dispatchEvent(mk('touchend',0,7));});
  await p.clock.runFor(500); await W(150); s=await st();
  ok(s.scope==='daylog','bar swipe still changes app',s);

  // real touch through CDP (hit-testing, cancelable touchmove)
  await p.evaluate(()=>navTo('today')); await p.clock.runFor(300); await W(100);
  const cdp=await A.ctx.newCDPSession(p);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const y=400, x0=260;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y}]});
  for(let i=1;i<=8;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0-200*i/8,y}]}); await W(16); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.clock.runFor(500); await W(200); s=await st();
  ok(s.screen==='progress','real touch swipe: Today → Progress',s);
  ok(await p.evaluate(()=>scrollY)===0,'new tab opens at the top');

  // laptop: no screen swipe
  await p.setViewportSize({width:1280,height:900}); await W(200);
  await drag(p,act,-300); s=await st();
  ok(s.screen==='progress','laptop width: swipe does nothing',s);

  const errs=[...(p._errors||[])];
  ok(errs.length===0,'no page errors',errs);
  await browser.close();
  console.log(fails?`${fails} failed`:'all passed'); process.exit(fails?1:0);
})();
