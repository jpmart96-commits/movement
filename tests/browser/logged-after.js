// "Already done — log it": trained first, logging after. Today (edited) →
// log everything as prescribed → change the ride → Complete.
// Needs playwright. node tests/browser/logged-after.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-26T12:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-26T12:30:00+01:00'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message));
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>navTo('today')); await W(200);
  await A.page.evaluate(()=>{dayEdit({action:'swap_modality',modality:'bike'});dayEdit({action:'remove_block',blockKey:'accessory'});dayEdit({action:'remove_block',blockKey:'close'});}); await W(200);
  console.log('HEADER', await A.page.evaluate(()=>document.querySelector('#today-body .mv-eyebrow').textContent));
  await A.page.click('text=Already done — log it'); await W(300);
  const p=await A.page.evaluate(()=>LiveSession.getProgress()); console.log('PROGRESS', p.done+'/'+p.total);
  const bi=await A.page.evaluate(()=>LiveSession.getSession().blocks.findIndex(b=>b.mainFocus));
  await A.page.evaluate(b=>toggleBlock(b),bi); await W(150);
  await A.page.click(`#ex-${bi}-0 .mv-linkbtn:has-text("change")`); await W(150);
  await A.page.fill(`#cd-km-${bi}-0`,'18.4'); await A.page.fill(`#cd-hr-${bi}-0`,'141');
  await A.page.click(`#ex-${bi}-0 .log-btn`); await W(150);
  await A.page.evaluate(()=>finishSession(true)); await W(300);
  console.log('DIALOGS', A.page._dialogs||[]);
  const s=await A.page.evaluate(()=>DB.get('daily_instance_2026-09-26'));
  console.log('SAVED', s.status, s.duration+'min', JSON.stringify(s.blocks.find(b=>b.mainFocus).exercises[0].cardioLog), 'planRef', JSON.stringify(s.planRef));
  console.log('ERRORS', errs);
  await browser.close();
})();
