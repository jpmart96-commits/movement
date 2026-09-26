// Keep-awake + motion (js/motion.js, css/motion.css).
// node tests/browser/motion.js   (needs playwright)
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0; const ok=(c,n,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d!==undefined?' :: '+JSON.stringify(d):'')); };
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-26T08:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-26T08:30:00+01:00'});
  const p=A.page;
  // Stand-in wake lock: records request/release so the test can see them.
  await p.addInitScript(()=>{
    window.__wl={requests:0,releases:0,active:false};
    const wl={request:async()=>{ window.__wl.requests++; window.__wl.active=true;
      const ls={}; const s={released:false,type:'screen',addEventListener:(t,f)=>{(ls[t]=ls[t]||[]).push(f);},
        release:async()=>{ if(s.released) return; s.released=true; window.__wl.releases++; window.__wl.active=false; (ls.release||[]).forEach(f=>f()); }};
      return s; }};
    Object.defineProperty(navigator,'wakeLock',{value:wl,configurable:true});
  });
  await p.goto('http://app.local/index.html'); await p.clock.runFor(3000); await W(800);
  const wl=()=>p.evaluate(()=>({...window.__wl, held:KeepAwake.held()}));

  ok(!(await wl()).active, 'no lock before a session', await wl());
  await p.evaluate(()=>navTo('today')); await W(200);
  await p.evaluate(()=>startTodayFromPlan()); await W(200);
  await p.clock.runFor(4500); await W(200);
  ok((await wl()).active && (await wl()).held, 'lock held once a session is live', await wl());

  // leaving the page drops it; coming back re-requests
  await p.evaluate(()=>{ Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await W(100);
  ok(!(await wl()).active, 'released while hidden', await wl());
  await p.evaluate(()=>{ Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await W(100);
  ok((await wl()).active, 're-acquired on return', await wl());

  // log a set on a weight+reps row
  const at=await p.evaluate(()=>{ const s=LiveSession.getSession(); for(let b=0;b<s.blocks.length;b++) for(let e=0;e<s.blocks[b].exercises.length;e++){ const x=s.blocks[b].exercises[e]; if(x.logType==='weight+reps'||x.logType==='reps') return {b,e,t:x.logType}; } return null; });
  ok(!!at, 'found a loggable row', at);
  if(at){
    await p.evaluate(({b})=>{ if(typeof toggleBlock==='function' && document.querySelector(`#ex-list-${b}`)?.offsetParent===null) toggleBlock(b); },at); await W(100);
    await p.evaluate(({b,e,t})=>{ const r=document.getElementById(`r-${b}-${e}`); if(r) r.value=5; const w=document.getElementById(`w-${b}-${e}`); if(w) w.value=20; t==='reps'?logReps(b,e):logSet(b,e); hideRest(); },at);
    await W(60);
    const n=await p.evaluate(({b,e})=>document.querySelectorAll(`#ex-${b}-${e} .set-row.mv-set-new`).length,at);
    ok(n===1, 'new set row is tagged to animate', n);
    await p.screenshot({path:'/tmp/motion-set.png'});
    await p.evaluate(({b,e})=>{ const x=LiveSession.getSession().blocks[b].exercises[e]; if(!x.completed) toggleExerciseDone(b,e); },at); await W(60);
    ok(await p.evaluate(({b,e})=>!!document.querySelector(`#ex-${b}-${e} .ex-check.mv-check-pop`),at), 'check pops when the exercise completes');
  }

  // sheet exit + re-open mid-exit
  const exId=await p.evaluate(()=>LiveSession.getSession().blocks[0].exercises[0].id);
  await p.evaluate(id=>openExSheetFromSession(id,0),exId); await W(400);
  await p.screenshot({path:'/tmp/motion-sheet.png'});
  await p.evaluate(()=>closeExSheet()); await W(40);
  const mid=await p.evaluate(()=>{const b=document.getElementById('ex-sheet-back');return {cls:b.className,disp:b.style.display};});
  ok(mid.cls.includes('mv-leaving') && mid.disp==='flex', 'sheet animates out instead of vanishing', mid);
  await W(450);
  ok(!(await p.isVisible('#ex-sheet')), 'then hides for real');
  await p.evaluate(id=>openExSheetFromSession(id,0),exId); await W(400);
  await p.evaluate(()=>closeExSheet()); await W(30);
  await p.evaluate(id=>openExSheetFromSession(id,0),exId); await W(500);
  const re=await p.evaluate(()=>{const b=document.getElementById('ex-sheet-back');return {cls:b.className,disp:b.style.display};});
  ok(re.disp==='flex' && !re.cls.includes('mv-leaving') && await p.isVisible('#ex-sheet'), 're-open during exit keeps it open', re);
  await p.evaluate(()=>closeExSheet()); await W(450);

  // finish: lock released
  await p.evaluate(()=>finishSession(true)); await W(200);
  await p.clock.runFor(4500); await W(200);
  ok(!(await wl()).active && !(await wl()).held, 'lock released after finishing', await wl());

  const errs=[...(p._errors||[]),...(p._cerrors||[]).filter(m=>!/ERR_TUNNEL|Failed to load resource/.test(m))];
  ok(errs.length===0,'no page errors',errs);
  console.log(fails?fails+' FAILED':'ALL PASS');
  await browser.close(); process.exit(fails?1:0);
})();
