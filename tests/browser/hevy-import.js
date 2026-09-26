// Friday logged after, then Hevy "Copy as text" pasted into Import.
// Needs playwright. node tests/browser/hevy-import.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
const TEXT=`Strength B\nFriday, Oct 2, 2026 at 9:05am\n\nDeadlift (Barbell)\nSet 1: 80 kg x 5 @ 8 rpe\nSet 2: 80 kg x 5 @ 8 rpe\nSet 3: 80 kg x 5 @ 8,5 rpe\n\nOverhead Press (Barbell)\nSet 1: 32,5 kg x 5\nSet 2: 32,5 kg x 5\nSet 3: 32,5 kg x 4\n\nAb Scissors\nSet 1: 20 reps\n\nhttps://hevy.com/workout/xyz`;
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); sb.fakeNowMs=new Date('2026-10-02T12:30:00+01:00').getTime();
  const A=await newDevice(browser,sb,{time:'2026-10-02T12:30:00+01:00'});
  const errs=[]; A.page.on('pageerror',e=>errs.push(e.message));
  await A.page.goto('http://app.local/index.html'); await A.page.clock.runFor(3000); await W(800);
  await A.page.evaluate(()=>navTo('today')); await W(200);
  await A.page.click('text=Already done — log it'); await W(300);
  await A.page.click('#session-blocks button:has-text("Import")'); await W(200);
  await A.page.fill('#hevy-text',TEXT); await A.page.click('text=Read Hevy text'); await W(200);
  console.log('REVIEW', await A.page.evaluate(()=>[...document.querySelectorAll('#watch-body .mv-card')].map(c=>c.textContent.replace(/\s+/g,' ').trim()).join(' || ')));
  await A.page.screenshot({path:'/tmp/hevy-sheet.png'});
  await A.page.click('#watch-body .mv-cta'); await W(300);
  console.log('CARD', await A.page.evaluate(()=>document.querySelector('#session-blocks .card').textContent.replace(/\s+/g,' ')));
  const s=await A.page.evaluate(()=>LiveSession.getSession());
  const mf=s.blocks.find(b=>b.mainFocus);
  console.log('MF', mf.exercises.map(e=>`${e.id}:${e.skipped?'skip':''}${(e.sets||[]).map(x=>x.weight+'x'+x.reps+(x.rpe?'@'+x.rpe:'')).join(',')}`).join(' | '));
  // import again → blocked
  await A.page.click('#session-blocks button:has-text("Import")'); await W(200);
  await A.page.fill('#hevy-text',TEXT); await A.page.click('text=Read Hevy text'); await W(200);
  console.log('AGAIN', await A.page.evaluate(()=>document.querySelector('#watch-body .mv-note')?.textContent));
  console.log('ERRORS', errs);
  await browser.close();
})();
