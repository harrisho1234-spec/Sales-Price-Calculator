# Sales Price Calculator — GitHub App

This folder is ready for GitHub Pages and can also be installed on a phone/PC like an app.

## Upload to GitHub

Upload all files and folders in this package to the root of your GitHub repository:

- `index.html`
- `manifest.json`
- `service-worker.js`
- `favicon.png`
- `app-icon.png`
- `.nojekyll`
- `icons/`
- `Code.gs` (reference only; this goes in Google Apps Script, not required by GitHub)

## Publish with GitHub Pages

1. Open the repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select branch **main**.
5. Select folder **/(root)**.
6. Save.
7. GitHub will give you your public app URL.

## Install as an App

After opening the GitHub Pages URL:

- Chrome/Edge on desktop: use the **Install App** button when it appears.
- Android: Chrome can install it to the Home Screen.
- iPhone/iPad: Safari → Share → **Add to Home Screen**.

## Google Sheet Saving

The visible Google Apps Script URL has been removed from the calculator screen.

On a browser/device that has never used the app before, the first time you press **Save to Google Sheet**, the calculator will ask for the Apps Script `/exec` URL once and save it in that browser.

For a company-wide/public deployment where nobody should ever be asked for the Apps Script URL, put the backend URL directly into the app before publishing. The current package intentionally does not expose your private backend URL because the full URL was not available when this package was created.

## Google Apps Script

If `Code.gs` is included, paste it into the Apps Script project attached to the Google Sheet, run `setupCalculator()` once, then deploy it as a Web App.
