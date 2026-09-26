// Session RPE at Complete, the Training load card, the weekly backup nudge,
// and a Settings weigh-in reaching the vitals. node tests/browser/load-backup.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-28T12:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-28T12:30:00+01:00'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message));
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>navTo('today')); await W(200);
  console.log('BACKUP NUDGE', await A.page.evaluate(()=>document.querySelector('.mv-backup')?.textContent.replace(/\s+/g,' ').trim()));
  await A.page.click('text=Already done — log it'); await W(300);
  await A.page.evaluate(()=>finishSession()); await W(300);
  console.log('RPE SHEET', await A.page.evaluate(()=>!!document.getElementById('srpe-backdrop')));
  await A.page.click('#srpe-backdrop .srpe-chip[data-v="7"]'); await W(300);
  console.log('AFTER CLICK', await A.page.evaluate(()=>JSON.stringify({live:!!LiveSession.getSession(),sheet:!!document.getElementById('srpe-backdrop'),screen:App.screen})), A.page._dialogs||[], errs);
  const s=await A.page.evaluate(()=>DB.get('daily_instance_2026-09-28'));
  console.log('SAVED', s.status, 'sessionRpe', s.sessionRpe, 'duration', s.duration);
  await A.page.evaluate(()=>navTo('progress')); await W(300);
  console.log('LOAD CARD', await A.page.evaluate(()=>[...document.querySelectorAll('.mv-card')].find(c=>/Training load/.test(c.textContent))?.textContent.replace(/\s+/g,' ').trim().slice(0,200)));
  await A.page.evaluate(()=>navTo('settings')); await W(300);
  await A.page.evaluate(()=>saveNumSetting('bodyweightKg','73.3')); await W(200);
  console.log('WEIGHT', await A.page.evaluate(()=>JSON.stringify({setting:App.profile.settings.bodyweightKg,vitals:(Vitals.load()||{days:{}}).days['2026-09-28']})));
  console.log('ERRORS', errs);
  await browser.close();
})();
