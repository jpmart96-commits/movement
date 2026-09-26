// Notes tab end to end: write from the tab, quick add from Today and the
// exercise sheet, sync to plan_notes, an off-device review marks one applied,
// a second device sees it all, and a delete reaches the server.
// Needs playwright. node tests/browser/notes.js
const {chromium}=require('playwright');
const {FakeSB,newDevice}=require('./fake');
const W=ms=>new Promise(r=>setTimeout(r,ms));
const out=process.env.SHOTS||'/tmp';
let fails=0; const ok=(c,m)=>{ console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++; };
(async()=>{
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
  const sb=new FakeSB(); const T='2026-09-30T19:30:00+01:00'; sb.fakeNowMs=new Date(T).getTime();
  const A=await newDevice(browser,sb,{time:T});
  const boot=async p=>{ await p.goto('http://app.local/index.html'); await p.clock.runFor(3000); await W(800); };
  const settle=async p=>{ await p.clock.runFor(5000); await W(800); };
  await boot(A.page);

  // 1. the tab
  await A.page.click('.nav-btn[data-screen="notes"]'); await W(200);
  ok(await A.page.isVisible('#screen-notes.active'), 'Notes tab opens');
  await A.page.screenshot({path:out+'/notes-empty.png',fullPage:true});
  await A.page.fill('#note-new-text','Plyo Wednesday straight after the bike day — legs flat on broad jumps.');
  await A.page.click('#notes-body .nt-kinds >> text=Plan');
  await A.page.click('text=Save'); await W(200);
  ok((await A.page.$$('.nt-card')).length===1, 'saved note shows');
  ok(/Plan/.test(await A.page.textContent('.nt-card .mv-chip')), 'kind kept after picking chip');

  // 2. quick add from Today
  await A.page.evaluate(()=>navTo('today')); await W(300);
  await A.page.click('#today-body >> text=+ Note'); await W(200);
  ok(await A.page.isVisible('#note-sheet'), 'Today + Note opens the sheet');
  await A.page.fill('#note-sheet-text','Slept 6h, HR drifted early.');
  await A.page.click('#note-sheet .mv-sheet-foot >> text=Save'); await W(450); // sheets animate out (~180ms)
  ok(!(await A.page.isVisible('#note-sheet')), 'sheet closes on save');

  // 3. from the exercise sheet
  await A.page.click('.mv-blk.open .mv-ex'); await W(200);
  await A.page.click('text=+ Note on this exercise'); await W(200);
  const exHead=await A.page.textContent('#note-sheet .mv-display');
  await A.page.fill('#note-sheet-text','Too easy at this dose.');
  await A.page.click('#note-sheet .mv-sheet-foot >> text=Save'); await W(200);
  const notes=await A.page.evaluate(()=>Notes.all());
  const exNote=notes.find(n=>n.source==='exercise');
  ok(exNote && exNote.kind==='exercise' && exNote.context.exerciseId && exHead.includes(exNote.context.exerciseName), 'exercise note carries the exercise: '+exHead);
  ok(notes.find(n=>n.source==='today').context.theme, 'today note carries the theme');

  // 4. sync
  await settle(A.page);
  ok(sb.rows('plan_notes').length===3, 'server has 3 plan_notes rows');
  ok(sb.rows('plan_notes').every(r=>r.note_id===r.data.id && r.user_id), 'rows keyed by note_id');

  // 5. a plan review marks one applied on the server
  const row=sb.rows('plan_notes').find(r=>r.data.kind==='plan');
  row.data={...row.data,status:'applied',resolution:'Plyo moved to Thursday from block 2',updatedAt:'2026-09-30T20:00:00.000Z'};

  // 6. second device sees everything, applied included
  const B=await newDevice(browser,sb,{time:T}); await boot(B.page);
  await B.page.evaluate(()=>navTo('notes')); await W(200);
  ok((await B.page.$$('.nt-card')).length===2, 'device B: 2 open');
  await B.page.click('.filter-tab:has-text("Applied")'); await W(150);
  ok(/Plyo moved to Thursday/.test(await B.page.textContent('#notes-body')), 'device B: applied note with resolution');

  // 7. device A picks up the review on its next pull, even with a pending edit
  await A.page.evaluate(()=>{ const n=Notes.all().find(x=>x.source==='today'); Notes.update(n.id,{text:'Slept 6h, HR drifted early. Legs fine.'}); });
  await A.page.evaluate(()=>DB.pull()); await W(300);
  const a=await A.page.evaluate(()=>Notes.all());
  ok(a.find(n=>n.kind==='plan').status==='applied', 'device A: review applied despite pending edit');
  ok(a.find(n=>n.source==='today').text.endsWith('Legs fine.'), 'device A: its own pending edit kept');
  await settle(A.page);
  ok(sb.rows('plan_notes').find(r=>r.data.source==='today').data.text.endsWith('Legs fine.'), 'server: edit uploaded');
  ok(sb.rows('plan_notes').find(r=>r.data.kind==='plan').data.status==='applied', 'server: review not overwritten');

  // 8. edit via sheet: status + delete
  await A.page.evaluate(()=>navTo('notes')); await W(200);
  await A.page.screenshot({path:out+'/notes-list.png',fullPage:true});
  await A.page.click('.nt-card:has-text("Too easy") >> text=Edit'); await W(200);
  await A.page.screenshot({path:out+'/notes-edit.png'});
  await A.page.click('#note-sheet >> text=Delete note'); await W(200);
  await settle(A.page);
  ok(sb.rows('plan_notes').length===2, 'delete reaches the server');
  await B.page.evaluate(()=>DB.pull()); await W(300);
  ok((await B.page.evaluate(()=>Notes.all().length))===2, 'device B drops the deleted note');

  // 9. copy for Claude (clipboard denied in headless → fallback sheet)
  await A.page.click('text=Copy open notes for Claude'); await W(300);
  const md=await A.page.evaluate(()=>document.getElementById('note-export')?.value || null);
  ok(md===null || /plan notes \(open, 1\)/.test(md), 'export: '+(md?md.split('\n')[0]:'clipboard'));

  // desktop width
  await A.page.setViewportSize({width:1280,height:900}); await A.page.evaluate(()=>{closeNoteSheet();navTo('notes')}); await W(200);
  await A.page.screenshot({path:out+'/notes-desktop.png'});

  const errs=[...(A.page._errors||[]),...(B.page._errors||[]),...(A.page._cerrors||[]).filter(e=>!/Supabase|404/.test(e))];
  ok(!errs.length, 'no page errors '+JSON.stringify(errs));
  console.log(fails?`${fails} FAILED`:'ALL PASS');
  await browser.close(); process.exit(fails?1:0);
})();
