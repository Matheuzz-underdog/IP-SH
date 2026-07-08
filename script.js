const IPIFY_API_KEY = 'at_BWfHw9xHmCLwSsAmEj3sU7RfMOQQu';
const IPIFY_BASE_URL = 'https://geo.ipify.org/api/v2/country,city';

//estado global y referencias (DOM)
const map = L.map('map', { zoomControl: false }).setView([10.0, -69.3], 5);
L.control.zoom({ position: 'bottomright' }).addTo(map);

const loaderEl = document.getElementById('loader');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleLabel = document.getElementById('theme-toggle-label');
const locateBtn = document.getElementById('locate-btn');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchError = document.getElementById('search-error');

let currentMarker = null;

//theme claro/oscuro
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeToggleBtn.setAttribute('aria-pressed', theme === 'dark');
  themeToggleLabel.textContent = theme === 'dark' ? 'Modo oscuro' : 'Modo claro';
  localStorage.setItem('ip-tracker-theme', theme);
  updateTileLayer(theme);
}

function getInitialTheme() {
  const saved = localStorage.getItem('ip-tracker-theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.body.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

//estilos del mapa segun tema
let tileLayer = null;

function updateTileLayer(theme) {
  if (tileLayer) map.removeLayer(tileLayer);

  const url = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  tileLayer = L.tileLayer(url, {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  }).addTo(map);
}

//loader es muy rapido
function showLoader() {
  loaderEl.classList.add('is-active');
}

function hideLoader() {
  loaderEl.classList.remove('is-active');
}

//hellpers
function countryNameFromCode(code) {
  try {
    const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}

//tajeta pin - divicon
function buildPinCardHTML(data) {
  return `
    <div class="pin-card">
      <div class="pin-card__body">
        <span class="pin-card__ip">${data.ip}</span>
        <span class="pin-card__row"><strong>Ciudad:</strong> ${data.city}</span>
        <span class="pin-card__row"><strong>Region:</strong> ${data.region}</span>
        <span class="pin-card__row"><strong>Pais:</strong> ${data.country}</span>
        <span class="pin-card__row"><strong>C.P.:</strong> ${data.postalCode}</span>
        <span class="pin-card__row"><strong>Zona horaria:</strong> ${data.timezone}</span>
        <span class="pin-card__row"><strong>ISP:</strong> ${data.isp}</span>
      </div>
      <div class="pin-card__tail"></div>
    </div>
  `;
}

function renderPin(lat, lng, data) {
  if (currentMarker) map.removeLayer(currentMarker);

  const icon = L.divIcon({
    className: '',
    html: buildPinCardHTML(data),
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });

  currentMarker = L.marker([lat, lng], { icon }).addTo(map);
  map.setView([lat, lng], 12);
}

// validaciones simples
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const DOMAIN_REGEX = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})+$/;

function isValidQuery(value) {
  return IPV4_REGEX.test(value) || DOMAIN_REGEX.test(value);
}

//peticion IPIFY
async function fetchIPData(query) {
  
  showLoader();
  searchError.textContent = '';

  const params = new URLSearchParams({ apiKey: IPIFY_API_KEY });

  if (query) {
    if (IPV4_REGEX.test(query)) {
      params.set('ipAddress', query);
    } else if (DOMAIN_REGEX.test(query)) {
      params.set('domain', query);
    }
  }

  try {
    const response = await fetch(`${IPIFY_BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('API key invalida o sin permisos.');
      }
      if (response.status === 422) {
        throw new Error('IP o dominio no encontrado.');
      }
      throw new Error('No se pudo obtener la informacion. Intenta de nuevo.');
    }

    const data = await response.json();

    renderPin(data.location.lat, data.location.lng, {
      ip: data.ip,
      city: data.location.city || 'Desconocido',
      region: data.location.region || 'Desconocido',
      country: countryNameFromCode(data.location.country),
      postalCode: data.location.postalCode || 'N/A',
      timezone: data.location.timezone || 'N/A',
      isp: data.isp || 'Desconocido'
    });
  } catch (err) {
    searchError.textContent = err.message || 'Error de red. Verifica tu conexion.';
  } finally {
    hideLoader();
    locateBtn.classList.remove('is-loading');
  }
}

//agregado boton volver a la ubicacion
locateBtn.addEventListener('click', () => {
  locateBtn.classList.add('is-loading');
  searchInput.value = '';
  fetchIPData();
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = searchInput.value.trim();

  if (!value) {
    searchError.textContent = 'Escribe una IP o dominio.';
    return;
  }

  if (!isValidQuery(value)) {
    searchError.textContent = 'Formato invalido. Ingresa una IP o dominio valido.';
    return;
  }

  fetchIPData(value);
});

//boton de arranqu (no lo mires)
applyTheme(getInitialTheme());
fetchIPData();