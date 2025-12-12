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

(Alternative) Run a local static server with Python:
- Open PowerShell in the project folder:
  - python -m http.server 5500
- Open http://localhost:5500 in your browser.

Configuration
- Mapbox token: The app uses a Mapbox access token in `app.js`:
  - Replace `mapboxgl.accessToken` with your own Mapbox token if needed.
- Data source: The DATA_URL constant is set to `https://disease.sh/v3/covid-19/countries?allowNull=false`.
  - Replace `DATA_URL` in `app.js` to change the source. See "Using a different data source" below.

Using a different data source
1. Find a data source that provides per-country stats and lat/lon coordinates.
2. Replace DATA_URL in `app.js` with your endpoint.
3. Ensure the JSON structure is compatible. The app expects one array of objects per country with fields such as:
   - country or name
   - cases, active, recovered, deaths
   - casesPerOneMillion
   - updated timestamp
   - countryInfo: { lat, long, flag }
4. If the API returns a different structure, modify `loadData()` mapping:
   - Update the `geojson.features` build to set `geometry.coordinates` and `properties` fields used by the app.

Troubleshooting
- Map doesn't appear or shows a blank page:
  - Ensure `<div id="map"></div>` exists and has CSS width/height. `index.html` already provides inline style.
  - Confirm Mapbox CSS/JS are loaded in the `<head>` and your `app.js` is loaded at the bottom of the body.
- Dev console shows `Uncaught SyntaxError: Unexpected token '<'`:
  - This means the browser requested a JS file but received HTML (often a 404 page). Confirm `app.js` path and use Live Server. Opening files directly (file://) sometimes causes issues.
- Numbers look incorrect:
  - The app displays what the API provides. Inspect API raw JSON in the browser:
    - Open devtools, check the `console.log(rawData)` placed in `loadData()`.
  - The data source might be outdated or incorrect; consider switching to a more authoritative source.
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

