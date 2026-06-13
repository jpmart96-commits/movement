# Practice Brain — GitHub Pages Setup

## File structure
```
practice-brain/
├── index.html          ← main app
├── manifest.json       ← PWA config
├── css/
│   └── style.css
├── js/
│   └── app.js
└── data/
    └── library.js      ← all exercises, goals, equipment
```

## Deploy to GitHub Pages (5 min)

### Step 1 — Create repository
1. Go to https://github.com/new
2. Name it `practice-brain`
3. Set to **Public** (required for free GitHub Pages)
4. Click **Create repository**

### Step 2 — Upload files
Option A — GitHub web interface (no git required):
1. Open your new repo
2. Click **Add file → Upload files**
3. Drag in all files, preserving the folder structure
4. Commit

Option B — Git CLI:
```bash
cd practice-brain
git init
git remote add origin https://github.com/YOURUSERNAME/practice-brain.git
git add .
git commit -m "initial"
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save

### Step 4 — Access the app
Your app will be live at:
`https://YOURUSERNAME.github.io/practice-brain`

Usually takes 1–2 minutes to deploy.

---

## Add to iPhone home screen (PWA)
1. Open the URL in Safari
2. Tap the Share icon
3. Tap **Add to Home Screen**
4. Name it "Practice Brain"
5. It will behave like a native app with no browser chrome

---

## Adding YouTube links to exercises
Open `data/library.js` and find the exercise by id.
Replace the `link` field with the specific YouTube URL:

```js
// Before
link: 'https://www.youtube.com/results?search_query=box+breathing+tutorial',

// After (specific video)
link: 'https://www.youtube.com/watch?v=XXXXXXXXXXX',
```

After editing, re-upload `data/library.js` to GitHub.
The link goes live immediately.

---

## Migrating to Supabase (multi-device sync)
When ready, this is a ~30 min addition.
All data operations go through `DB` in `app.js`.
We replace `localStorage` calls with Supabase client calls.
Data schema maps directly to the existing structure.

---

## Backup your data
In the app: Settings → Export backup JSON
This downloads a file you can re-import on any device.
Do this occasionally — localStorage clears if you clear browser data.
