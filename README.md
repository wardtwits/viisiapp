# Viisi Site

Viisi word puzzle app. 

## What's inside?

```
.
├── assets
│   ├── css/styles.css     # Shared design language + responsive layout
│   ├── js/main.js         # Simple mobile menu toggle
│   └── images/            # Optional marketing screenshots
├── index.html             # Landing page (features, hero, stats, footer)
├── how-to-play.html       # Standalone guide
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
