# Viisi Marketing Site

You've reached the home of Viisi - the puzzle game currently on iOS.

## What's inside?

```
.
├── assets
│   ├── css/styles.css     # Shared design language + responsive layout
│   ├── js/main.js         # Simple mobile menu toggle
│   ├── js/daily-letters.js # Scheduled daily letters and UTC reset
│   ├── puzzle-schedule.json # Date-keyed puzzle letters
│   ├── css/demo.css       # Styles for the playable browser demo
│   └── js/demo.js         # One-puzzle Viisi demo logic (no backend)
│   └── images/            # Optional marketing screenshots
├── index.html             # Landing page (features, hero, stats, footer)
├── how-to-play.html       # Standalone guide
├── demo.html              # Playable one-game web demo
└── README.md
```

Fonts are loaded from Google Fonts, so there is no build process or dependency installation required.

## Develop locally

Any static file server will work (or just open the files directly in a browser). Examples:

- VS Code: use the Live Server extension on `index.html`.
- Python: `python -m http.server 4173` and open http://localhost:4173.

## Deploy to GitHub Pages

1. Commit these files to your repository.
2. Push to GitHub and open **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch** and select your main branch + `/ (root)` folder.
4. Save. GitHub will publish the static files at `https://<username>.github.io/<repo>/`.

Because no Node services or API routes are required, the published site works anywhere that can serve static files.

## Daily Letters

The homepage loads `assets/puzzle-schedule.json` through `assets/js/daily-letters.js`.
The script uses `puzzleDayOffsetSeconds` to match the app's puzzle date: the current
schedule resets at **06:00 UTC**, regardless of the visitor's timezone or daylight
saving time. Letter order and repeated letters are preserved exactly as supplied.

Letters refresh at the daily reset, when the tab becomes visible or focused, when
the browser restores the page, and when connectivity returns. A minute check also
catches device clock changes and delayed timers. Schedule requests bypass the
browser cache; failed requests retry automatically. Missing or invalid entries
hide the tiles and display an unavailable message instead of yesterday's letters.

The supplied schedule runs through **October 12, 2027**. Extend or replace it before
then to keep daily letters available. Use an HTTP server for local development;
fetching the JSON is not supported when opening `index.html` directly as a file.

Run the focused daily-letter checks with `node --test tests/daily-letters.test.js`.
