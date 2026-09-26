// Today as done on 26 Sep: log after, then import two watch files at once
// (an "Other" for keepie-uppies, the ride), link, complete.
// Needs playwright. node tests/browser/watch-import.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
function ruttio({id,sport,start,minutes,hr}){const t0=Date.parse(start),n=minutes*12,iso=i=>new Date(t0+i*5000).toISOString();
  return JSON.stringify({id,activityTypeName:sport,startTime:new Date(t0).toISOString(),endTime:new Date(t0+minutes*60000).toISOString(),durationSeconds:minutes*60,totalDistanceMeters:0,averageHeartRateBPM:hr,maxHeartRateBPM:hr+12,heartRateSamples:Array.from({length:n},(_,i)=>({timestamp:iso(i),bpm:hr+(i%7)-3})),route:[]});}
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-09-26T12:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-09-26T12:30:00+01:00'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message));
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>{navTo('today');dayEdit({action:'swap_modality',modality:'bike'});dayEdit({action:'remove_block',blockKey:'accessory'});dayEdit({action:'remove_block',blockKey:'close'});});
  await A.page.click('text=Already done — log it'); await W(300);
  await A.page.click('#session-blocks button:has-text("Import")'); await W(200);
  await A.page.setInputFiles('#watch-files',[
    {name:'workout_1_other.json',mimeType:'application/json',buffer:Buffer.from(ruttio({id:'W-OTHER',sport:'Other',start:'2026-09-26T09:12:00+01:00',minutes:21,hr:128}))},
    {name:'workout_2_ride.json',mimeType:'application/json',buffer:Buffer.from(ruttio({id:'W-RIDE',sport:'Cycling',start:'2026-09-26T09:55:00+01:00',minutes:45,hr:141}))},
    {name:'workout_2_ride.gpx',mimeType:'application/gpx+xml',buffer:Buffer.from('<gpx/>')},
  ]); await W(500);
  console.log('SHEET', await A.page.evaluate(()=>[...document.querySelectorAll('#watch-body select')].map(s=>s.options[s.selectedIndex].text).join(' | ')));
  await A.page.fill('#watch-body input[list="lib-datalist"]','Football keepie-uppies'); await A.page.press('#watch-body input[list="lib-datalist"]','Tab'); await W(200);
  await A.page.screenshot({path:'/tmp/watch-sheet.png'});
  await A.page.click('#watch-body .mv-cta'); await W(300);
  console.log('CARD', await A.page.evaluate(()=>document.querySelector('#session-blocks .card').textContent.replace(/\s+/g,' ')));
  console.log('HEADERS', await A.page.evaluate(()=>[...document.querySelectorAll('.bh-dur')].map(x=>x.textContent).join(' | ')));
  await A.page.evaluate(()=>finishSession(true)); await W(300);
  const s=await A.page.evaluate(()=>DB.get('daily_instance_2026-09-26'));
  const comp=s.blocks.find(b=>b.key==='complementary');
  console.log('SAVED', s.status, comp.exercises.map(e=>e.id+(e.skipped?'(skipped)':'')+(e.completed?'✓':'')).join(', '), 'ride', s.blocks.find(b=>b.mainFocus).exercises[0].cardioLog.avgHR);
  console.log('ERRORS', errs);
  await browser.close();
})();
