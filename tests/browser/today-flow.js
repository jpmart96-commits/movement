// Headless run of the 26 Sep case: Today → run to bike → remove Accessory →
// reload → start → one-tap log + RPE → finish with rows left open.
// Needs playwright (npm i -D playwright). node tests/browser/today-flow.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-26T08:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-26T08:30:00+01:00'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message)); A.page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>navTo('today')); await W(300);
  const hdr=()=>A.page.evaluate(()=>document.querySelector('#today-body .mv-eyebrow').textContent);
  console.log('HEADER', await hdr());
  // open main focus (default open) and click Run → bike
  await A.page.click('text=Run → bike'); await W(200);
  // open accessory then Remove
  await A.page.click('.mv-blk-head:has-text("Accessory")'); await W(200);
  await A.page.click('.mv-blk.open >> text=Remove'); await W(200);
  console.log('HEADER', await hdr());
  console.log('EDITS', await A.page.evaluate(()=>document.querySelector('.mv-edits')?.textContent.replace(/\s+/g,' ')));
  console.log('REMOVED', await A.page.evaluate(()=>document.querySelector('.mv-removed')?.textContent.replace(/\s+/g,' ')));
  console.log('TIMELINE', await A.page.evaluate(()=>[...document.querySelectorAll('.mv-blk-head')].map(b=>b.querySelector('.mv-blk-time').textContent+' '+b.querySelector('.mv-blk-label').textContent+' '+b.querySelector('.mv-blk-meta').textContent).join(' | ')));
  await A.page.screenshot({path:'/tmp/today.png',fullPage:true});
  // reload: persists
  await A.page.reload(); await A.page.clock.runFor(3000); await W(800); await A.page.evaluate(()=>navTo('today')); await W(300);
  console.log('AFTER RELOAD', await hdr());
  // start session, tap as prescribed on main focus, RPE, finish
  await A.page.evaluate(()=>startTodayFromPlan()); await W(300);
  const bi=await A.page.evaluate(()=>LiveSession.getSession().blocks.findIndex(b=>b.mainFocus));
  await A.page.evaluate(b=>toggleBlock(b),bi); await W(200);
  await A.page.click(`#ex-${bi}-0 .ex-quick-btn`); await W(200);
  await A.page.click(`#ex-${bi}-0 .rpe-chip:has-text("7")`); await W(200);
  console.log('MAIN', await A.page.evaluate(b=>JSON.stringify(LiveSession.getSession().blocks[b].exercises[0].cardioLog),bi));
  await A.page.evaluate(()=>toggleBlock(0)); await W(100);
  await A.page.click('#block-0 .block-done-btn'); await W(200);
  await A.page.evaluate(()=>finishSession(true)); await W(300);
  console.log('DIALOGS', A.page._dialogs);
  console.log('LIVE AFTER', await A.page.evaluate(()=>!!LiveSession.getSession()), 'instance', await A.page.evaluate(()=>DB.get('daily_instance_2026-09-26').status));
  await A.page.clock.runFor(5000); await W(800);
  console.log('SERVER sessions', sb.rows('sessions').length, 'instance', sb.rows('daily_instances').map(r=>r.data.status));
  await A.page.evaluate(()=>navTo('progress')); await W(300);
  await A.page.screenshot({path:'/tmp/progress.png',fullPage:true});
  console.log('ERRORS', errs);
  await browser.close();
})();
