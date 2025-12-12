// ========== CONFIG ==========
mapboxgl.accessToken = 'pk.eyJ1IjoidmFuc2h1Z29lbCIsImEiOiJjbWVva3J4N3oxOHV2MmpzODFyczVjN3JzIn0.tUWACG3m_4Hofra3DNI7NA';

// API endpoint returns per-country COVID stats including lat/lon:
// Each item: { country, cases, active, recovered, deaths, updated, countryInfo:{lat,long,flag}, casesPerOneMillion, ... }
const DATA_URL = 'https://disease.sh/v3/covid-19/countries?allowNull=false';

// Severity buckets by cases per 1M people
function severityFromCPM(cpm){
  if (cpm < 1000) return "low";
  if (cpm < 10000) return "moderate";
  if (cpm < 50000) return "high";
  if (cpm < 100000) return "veryHigh";
  return "severe";
}

// Colors for severity
const severityColor = {
  low: "#2DC937",
  moderate: "#99C140",
  high: "#E7B416",
  veryHigh: "#DB7B2B",
  severe: "#CC3232"
};

// ========== MAP INIT ==========
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [20, 15],
  zoom: 1.2,
  attributionControl: false
});

map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
map.addControl(new mapboxgl.AttributionControl({ compact: true }));

// ========== STATE ==========
let rawData = [];
let geojson = { type: "FeatureCollection", features: [] };
let popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true });

const details = {
  name: document.getElementById('d-name'),
  lat: document.getElementById('d-lat'),
  lon: document.getElementById('d-lon'),
  cases: document.getElementById('d-cases'),
  cpm: document.getElementById('d-cpm'),
  active: document.getElementById('d-active'),
  recovered: document.getElementById('d-recovered'),
  deaths: document.getElementById('d-deaths'),
  updated: document.getElementById('d-updated'),
};

// ========== LOAD ==========
map.on('load', () => {
  loadData().catch(err => {
    console.error(err);
    alert("Failed to load COVID data.");
  });
});

async function loadData(){
  const res = await fetch(DATA_URL);
  if(!res.ok) throw new Error("Failed to load data");
  rawData = await res.json();
  console.log(rawData); // Add this in your loadData function after fetching

  // Build GeoJSON
  geojson = {
    type: "FeatureCollection",
    features: rawData
      .filter(d => d?.countryInfo?.lat != null && d?.countryInfo?.long != null)
      .map(d => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [d.countryInfo.long, d.countryInfo.lat]
        },
        properties: {
          id: d.countryInfo._id ?? d.country,
          name: d.country,
          lat: d.countryInfo.lat,
          lon: d.countryInfo.long,
          cases: d.cases,
          active: d.active,
          recovered: d.recovered,
          deaths: d.deaths,
          updated: d.updated,
          cpm: d.casesPerOneMillion || 0,
          severity: severityFromCPM(d.casesPerOneMillion || 0),
          flag: d.countryInfo.flag
        }
      }))
  };

  // NEW: Show last update time
  const lastUpdatedDiv = document.getElementById('last-updated');
  if (lastUpdatedDiv && rawData.length) {
    // Find the most recent update timestamp
    const maxUpdated = Math.max(...rawData.map(d => d.updated || 0));
    lastUpdatedDiv.textContent = "Last data update: " + (maxUpdated ? new Date(maxUpdated).toUTCString() : "—");
  }

  addLayers();
}

// ========== LAYERS ==========
function addLayers(){
  if (map.getSource('covid')) map.removeSource('covid');
  map.addSource('covid', { type: 'geojson', data: geojson });

  map.addLayer({
    id: 'covid-circles',
    type: 'circle',
    source: 'covid',
    paint: {
      'circle-color': [
        'match', ['get','severity'],
        'low', severityColor.low,
        'moderate', severityColor.moderate,
        'high', severityColor.high,
        'veryHigh', severityColor.veryHigh,
        'severe', severityColor.severe,
        '#888'
      ],
      'circle-radius': [
        'interpolate', ['linear'], ['get','cases'],
        0, 3, 50000, 8, 200000, 12, 1000000, 18, 5000000, 24, 20000000, 28
      ],
      'circle-opacity': 0.8,
      'circle-stroke-color': '#0b1220',
      'circle-stroke-width': 1.2
    }
  });

  map.addLayer({
    id: 'covid-labels',
    type: 'symbol',
    source: 'covid',
    minzoom: 3,
    layout: {
      'text-field': ['get','name'],
      'text-size': 10,
      'text-offset': [0, 1.1],
      'text-anchor': 'top'
    },
    paint: {
      'text-color': '#d1d5db',
      'text-halo-color': '#0b1220',
      'text-halo-width': 1
    }
  });

  bindMapInteractions();
  applyFilters();
}

// ========== INTERACTIONS ==========
function bindMapInteractions(){
  map.on('mouseenter', 'covid-circles', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'covid-circles', () => map.getCanvas().style.cursor = '');

  map.on('click', 'covid-circles', (e) => {
    const f = e.features[0];
    showPopup(f);
    updateDetails(f.properties);
  });
}

function showPopup(feature){
  const p = feature.properties;
  const html = `
    <div style="display:flex; align-items:center; gap:8px;">
      ${p.flag ? `<img src="${p.flag}" width="18" height="12" style="border:1px solid #222">` : ""}
      <strong>${p.name}</strong>
    </div>
    <div style="margin-top:6px; font-size:12px; line-height:1.35">
      <div><b>Total cases:</b> ${num(p.cases)}</div>
      <div><b>Cases / 1M:</b> ${num(p.cpm)}</div>
      <div><b>Active:</b> ${num(p.active)} &nbsp; <b>Recovered:</b> ${num(p.recovered)}</div>
      <div><b>Deaths:</b> ${num(p.deaths)}</div>
      <div><b>Lat, Lon:</b> ${(+p.lat).toFixed(2)}, ${(+p.lon).toFixed(2)}</div>
      <div><b>Severity:</b> ${p.severity}</div>
    </div>`;
  popup.setLngLat(feature.geometry.coordinates).setHTML(html).addTo(map);
}

function updateDetails(p){
  details.name.textContent = p.name || '—';
  details.lat.textContent = p.lat ? (+p.lat).toFixed(4) : '—';
  details.lon.textContent = p.lon ? (+p.lon).toFixed(4) : '—';
  details.cases.textContent = num(p.cases);
  details.cpm.textContent = num(p.cpm);
  details.active.textContent = num(p.active);
  details.recovered.textContent = num(p.recovered);
  details.deaths.textContent = num(p.deaths);
  details.updated.textContent = p.updated ? new Date(+p.updated).toUTCString() : '—';
}

function num(x){
  if (x === null || x === undefined || isNaN(x)) return '—';
  return Number(x).toLocaleString();
}

// ========== FILTERING ==========
const activeRanges = new Set(["low","moderate","high","veryHigh","severe"]);
document.getElementById('filters').addEventListener('change', (e) => {
  const cb = e.target;
  if (cb && cb.dataset.range){
    if (cb.checked) activeRanges.add(cb.dataset.range);
    else activeRanges.delete(cb.dataset.range);
    applyFilters();
  }
});

function applyFilters(){
  const expr = ['in', ['get','severity'], ['literal', Array.from(activeRanges)]];
  if (map.getLayer('covid-circles')) map.setFilter('covid-circles', expr);
  if (map.getLayer('covid-labels')) map.setFilter('covid-labels', expr);
}

// ========== SEARCH ==========
document.getElementById('searchBtn').addEventListener('click', zoomToSearch);
document.getElementById('searchInput').addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') zoomToSearch();
});

function zoomToSearch(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) return;
  const f = geojson.features.find(f =>
    f.properties.name.toLowerCase() === q
  ) || geojson.features.find(f =>
    f.properties.name.toLowerCase().includes(q)
  );
  if (f){
    map.flyTo({ center: f.geometry.coordinates, zoom: 4.2, speed: 0.8, curve: 1.1 });
    showPopup(f);
    updateDetails(f.properties);
  } else {
    alert('Country not found. Try another name.');
  }
}

document.getElementById('refreshBtn').addEventListener('click', () => {
  loadData().catch(err => {
    console.error(err);
    alert("Failed to reload COVID data.");
  });
});
