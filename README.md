Small web app that visualizes country-level COVID-19 data as point circles on a Mapbox map.

Features
- Mapbox GL JS map with interactive points per country
- Circle color/size by cases / 1M (severity)
- Click a point to show popup and detailed sidebar data
- Search to fly to a country
- Last API update timestamp shown

Prerequisites
- A modern browser
- Internet access (Mapbox and data API)
- VS Code (recommended) + Live Server extension or a simple static server

Quick start (Windows)
1. Open the project folder in VS Code:
   - File > Open Folder > c:\Users\mevan\OneDrive\Desktop\Covid Track
2. Install Live Server (if not installed):
   - Extensions (Ctrl+Shift+X) → Search "Live Server" → Install
3. Open `index.html` in the editor and choose "Open with Live Server".
   - The app URL will open in your browser (e.g. `http://127.0.0.1:5500`).


outdated or incorrect; consider switching to a more authoritative source.
- Removed the UI "Refresh Data" button:
  - If you removed the button from `index.html`, also remove or update the JS event listener at the end of `app.js`:
    - Remove the `document.getElementById('refreshBtn').addEventListener(...);` block, or
    - Use a safe null-check: `document.getElementById('refreshBtn')?.addEventListener(...);`
- Refresh timestamp:
  - `index.html` contains `#last-updated`. The app sets the latest API `updated` timestamp after fetching.

Development tips
- Log the fetched data: `console.log(rawData)` (already present).
- If replacing the data API, add robust fallbacks and validations for null/undefined fields.
- For local testing, use Live Server to avoid CORS / file:// issues.

Contribute
- Open issues or PRs for bug fixes, API improvements, or feature ideas.

