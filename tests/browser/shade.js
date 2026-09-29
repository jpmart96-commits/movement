// Top shade (js/shade.js): pulled down from just below the top edge, never
// opened by a tap; follows the finger; short pulls spring back; closes by
// pushing it up / tapping the page / Escape. Apps on/off: the bar, dots,
// swipes and navTo follow; the last app can't be switched off; the choice
// syncs to a second device. Laptop: mouse drag.
// node tests/browser/shade.js   (SHOTS=1 → /tmp/shade-*.png)
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,m,d)=>{console.log((c?'ok   ':'FAIL ')+m+(d!==undefined&&!c?' :: '+JSON.stringify(d):'')); if(!c) fails++;};
const SHOTS=!!process.env.SHOTS;

// Vertical touch drag starting at (x,y): n moves, gap ms apart; the target is
// whatever sits under the finger.
async function pull(p,y,dy,{x=210,n=8,gap=30,dx=0,mid=false}={}){
  const r=await p.evaluate(({x,y,dy,dx,n,gap,mid})=>{
    const t=document.elementFromPoint(x,y)||document.body; const T0=performance.now();
    const mk=(type,xx,yy,i)=>{const e=new Event(type,{bubbles:true,cancelable:true}); e.touches=type==='touchend'?[]:[{clientX:xx,clientY:yy}]; Object.defineProperty(e,'timeStamp',{value:T0+i*gap}); return e;};
    t.dispatchEvent(mk('touchstart',x,y,0));
    let prevented=false;
    for(let i=1;i<=n;i++){ const e=mk('touchmove',x+dx*i/n,y+dy*i/n,i); t.dispatchEvent(e); if(e.defaultPrevented) prevented=true; }
    const midT=document.getElementById('shade').style.transform;
    if(!mid) t.dispatchEvent(mk('touchend',0,0,n+1));
    return {prevented, midT};
  },{x,y,dy,dx,n,gap,mid});
  if(!mid){ await p.clock.runFor(600); await W(450); }
  return r;
}
const st=p=>p.evaluate(()=>{const el=document.getElementById('shade'); const r=el.getBoundingClientRect();
  return {open:Shade.isOpen(), bottom:Math.round(r.bottom), h:Math.round(r.height), vis:getComputedStyle(el).visibility, inert:el.hasAttribute('inert'),
    scope:document.body.dataset.scope, screen:App.screen};});

(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-30T08:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-30T08:30:00+01:00',storage:{pb_profile:{settings:{theme:process.env.THEME||'light'}}}});
  const p=A.page;
  await p.goto('http://app.local/index.html'); await p.clock.runFor(3000); await W(400);
  let s=await st(p);
  ok(!s.open&&s.vis==='hidden'&&s.inert&&s.bottom<=0,'closed at boot: hidden above the screen, inert',s);

  // a tap in the band does nothing; a pull starting lower down does nothing
  await p.mouse.click(210,20); await p.clock.runFor(300); s=await st(p);
  ok(!s.open,'a tap never opens it',s);
  await pull(p,300,220); s=await st(p);
  ok(!s.open&&s.vis==='hidden','a pull from mid-screen is just a scroll',s);
  // sideways in the band: not a pull
  await pull(p,20,15,{dx:-200}); s=await st(p);
  ok(!s.open,'sideways drag in the band does not open it',s);

  // short pull springs back, following the finger meanwhile
  const H=await p.evaluate(()=>document.getElementById('shade').offsetHeight);
  ok(H>250&&H<900*0.8+1,'panel covers the top part only',{H});
  let r=await pull(p,20,70,{mid:true});
  ok(r.prevented,'the pull stops the page from scrolling');
  const m=/translate3d\(0px, (-?\d+)px/.exec(r.midT); const off=m?+m[1]:null;
  ok(off!=null&&Math.abs(off-(62-H))<=2,'panel follows the finger (1:1 after the lock)',{off,expect:62-H});
  await p.evaluate(()=>{const e=new Event('touchend',{bubbles:true}); e.touches=[]; document.body.dispatchEvent(e);});
  await p.clock.runFor(600); await W(150); s=await st(p);
  ok(!s.open&&s.vis==='hidden','short slow pull springs back',s);

  // pull far enough → opens
  await pull(p,20,H*0.6); s=await st(p);
  ok(s.open&&s.bottom>=H-2&&!s.inert&&s.vis==='visible','pull past a third → opens',s);
  if(SHOTS) await p.screenshot({path:'/tmp/shade-1-open.png'});
  const rows=await p.evaluate(()=>[...document.querySelectorAll('[data-shade-mod]')].map(b=>b.dataset.shadeMod+':'+b.getAttribute('aria-checked')));
  ok(JSON.stringify(rows)==='["train:true","daylog:true","meals:true"]','three apps, all on',rows);

  // push it back up → closes
  await pull(p,H-40,-(H*0.5)); s=await st(p);
  ok(!s.open,'push up → closes',s);
  // flick opens even when short
  await pull(p,20,90,{n:4,gap:12}); s=await st(p);
  ok(s.open,'quick flick down → opens',s);
  await p.mouse.click(210,860); await p.clock.runFor(600); await W(150); s=await st(p);
  ok(!s.open,'tap on the dimmed page closes',s);
  await pull(p,20,H*0.6); await p.keyboard.press('Escape'); await p.clock.runFor(600); await W(150); s=await st(p);
  ok(!s.open,'Escape closes',s);

  // switch Meals off
  await pull(p,20,H*0.6);
  await p.click('[data-shade-mod="meals"]'); await W(100);
  const bar=await p.evaluate(()=>({dots:[...document.querySelectorAll('[data-scope-dot]')].map(b=>b.dataset.scopeDot),
    hidden:[...document.querySelectorAll('.nav-group')].filter(g=>g.hidden).map(g=>g.dataset.scope),
    scopes:document.getElementById('nav-track').style.getPropertyValue('--scopes'),
    saved:JSON.parse(localStorage.getItem('pb_profile')).settings.modules,
    aria:document.querySelector('[data-shade-mod="meals"]').getAttribute('aria-checked')}));
  ok(bar.aria==='false'&&JSON.stringify(bar.dots)==='["train","daylog"]'&&JSON.stringify(bar.hidden)==='["meals"]'&&bar.scopes==='2','Meals off: gone from the bar and dots',bar);
  ok(bar.saved&&bar.saved.meals===false,'saved in the profile',bar.saved);
  if(SHOTS) await p.screenshot({path:'/tmp/shade-2-meals-off.png'});
  await p.keyboard.press('Escape'); await p.clock.runFor(600); await W(150);
  // navTo to a Meals screen now lands elsewhere
  await p.evaluate(()=>navTo('meals-week')); s=await st(p);
  ok(s.scope==='train','navTo a switched-off app goes to the first app on',s);
  // the bar only swipes Training ↔ Daily log
  await p.evaluate(()=>Scopes.go('daylog')); await p.clock.runFor(400); await W(100);
  await p.evaluate(()=>{const nav=document.getElementById('nav'), rc=nav.getBoundingClientRect(), y=rc.top+rc.height/2, x0=rc.left+rc.width/2, T0=performance.now();
    const mk=(t,x,i)=>{const e=new Event(t,{bubbles:true}); e.touches=t==='touchend'?[]:[{clientX:x,clientY:y}]; Object.defineProperty(e,'timeStamp',{value:T0+i*30}); return e;};
    nav.dispatchEvent(mk('touchstart',x0,0)); for(let i=1;i<=6;i++) nav.dispatchEvent(mk('touchmove',x0-200*i/6,i)); nav.dispatchEvent(mk('touchend',0,7));});
  await p.clock.runFor(500); await W(150); s=await st(p);
  ok(s.scope==='daylog','bar swipe past Daily log: no Meals to go to',s);

  // switching off the app on screen moves you out of it
  await pull(p,20,H*0.6);
  await p.click('[data-shade-mod="daylog"]'); await p.clock.runFor(500); await W(150); s=await st(p);
  ok(s.scope==='train','switching off the app on screen → Training',s);
  const one=await p.evaluate(()=>({one:document.body.classList.contains('one-scope'), dis:document.querySelector('[data-shade-mod="train"]').getAttribute('aria-disabled'),
    bar:getComputedStyle(document.getElementById('nav-scopebar')).display}));
  ok(one.one&&one.dis==='true'&&one.bar==='none','only Training on: no dots, its switch locked',one);
  await p.click('[data-shade-mod="train"]',{force:true}); await W(100);
  const still=await p.evaluate(()=>({on:Scopes.on().map(x=>x.id), note:!document.getElementById('shade-note').hidden}));
  ok(JSON.stringify(still.on)==='["train"]'&&still.note,'the last app stays on, with a note',still);
  if(SHOTS) await p.screenshot({path:'/tmp/shade-3-one.png'});
  // turn Meals back on
  await p.click('[data-shade-mod="meals"]'); await W(100);
  ok(JSON.stringify(await p.evaluate(()=>Scopes.on().map(x=>x.id)))==='["train","meals"]','Meals back on');

  // theme from the shade
  await p.click('#shade [data-theme-opt="dark"]'); await W(100);
  ok(await p.evaluate(()=>document.documentElement.dataset.theme)==='dark','theme from the shade');
  if(SHOTS) await p.screenshot({path:'/tmp/shade-4-dark.png'});
  await p.click('#shade [data-theme-opt="light"]'); await W(100);

  // training settings link
  await p.click('#shade [data-shade="settings"]'); await p.clock.runFor(500); await W(150); s=await st(p);
  ok(!s.open&&s.screen==='settings','Training settings link opens Settings and closes the shade',s);

  // sync: the profile goes up, a second device picks it up at boot
  await p.evaluate(()=>DB._flush()); await p.clock.runFor(2000); await W(300);
  const row=(sb.tables.profiles||sb.tables.profile||[]).map(x=>x.data).find(Boolean) || Object.values(sb.tables).flat().map(x=>x&&x.data).find(d=>d&&d.settings&&d.settings.modules);
  ok(row&&row.settings&&row.settings.modules&&row.settings.modules.daylog===false,'the choice reached the server',row&&row.settings&&row.settings.modules);
  const B=await newDevice(browser,sb,{time:'2026-09-30T09:00:00+01:00'});
  await B.page.goto('http://app.local/index.html'); await B.page.clock.runFor(3000); await W(500);
  const b=await B.page.evaluate(()=>({on:Scopes.on().map(x=>x.id), hidden:[...document.querySelectorAll('.nav-group')].filter(g=>g.hidden).map(g=>g.dataset.scope)}));
  ok(JSON.stringify(b.on)==='["train","meals"]'&&JSON.stringify(b.hidden)==='["daylog"]','second device: Daily log hidden after sign-in',b);

  // laptop: mouse drag from the top
  await p.setViewportSize({width:1280,height:820}); await W(200);
  await p.mouse.move(700,20); await p.mouse.down();
  for(let i=1;i<=10;i++){ await p.mouse.move(700,20+40*i); }
  await p.mouse.up(); await p.clock.runFor(600); await W(150); s=await st(p);
  ok(s.open,'laptop: mouse drag down from the top opens it',s);
  if(SHOTS) await p.screenshot({path:'/tmp/shade-5-laptop.png'});
  await p.keyboard.press('Escape'); await p.clock.runFor(600); await W(100);
  const vis=await p.evaluate(()=>[...document.querySelectorAll('.nav-scopes button')].filter(b=>!b.hidden).map(b=>b.dataset.scopeGo));
  ok(JSON.stringify(vis)==='["train","meals"]','laptop sidebar switch lists only the apps on',vis);

  const errs=[...(p._errors||[]),...(B.page._errors||[])];
  ok(errs.length===0,'no page errors',errs);
  await browser.close();
  console.log(fails?`${fails} failed`:'all passed'); process.exit(fails?1:0);
})();
