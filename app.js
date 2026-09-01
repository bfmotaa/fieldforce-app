/* ==========================================================================
   FIELDFLOW APPLICATION LOGIC (app.js)
   ========================================================================== */

// ==========================================================================
// DATE UTILITIES — Must be defined first (used in state variable declarations)
// ==========================================================================

/**
 * Returns the current date as a YYYY-MM-DD string using the LOCAL calendar
 * of the user's device — NOT UTC.
 *
 * Why NOT new Date().toISOString().split('T')[0]:
 *   toISOString() always returns UTC. In Mexico (UTC-6), a device showing
 *   23:30 local time would report the *next day* in UTC, making the route
 *   date incorrect for the entire last 6 hours of each day.
 *
 * @param {Date} [date] - Optional date object. Defaults to now.
 * @returns {string} Date in YYYY-MM-DD format (local calendar)
 */
function getLocalDateString(date) {
  const d = date || new Date();
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a store object from the backend into the format expected by the frontend UI.
 */
function normalizeStore(s) {
  return {
    id: s.storeId || s.store_id || s.id,
    code: s.storeCode || s.store_code || s.code,
    name: s.storeName || s.store_name || s.name,
    chain: s.chain,
    address: s.address,
    city: s.city,
    state: s.state,
    latitude: s.latitude,
    longitude: s.longitude,
    geofenceRadius: s.geofenceRadius || s.geofence_radius,
    clientId: s.clientId || s.client_id,
    status: s.status
  };
}

async function loadStoresForClient(clientId) {
  if (!clientId) return false;

  try {
    const storesRes = await window.ApiService.getStores(clientId);

    if (!storesRes || !storesRes.success || !Array.isArray(storesRes.data)) {
      console.error("Error al cargar tiendas para cliente:", clientId);
      alert("Error al obtener el catálogo de tiendas. Conservando los datos actuales.");
      return false;
    }

    const realStores = {};

    storesRes.data.forEach(s => {
      const norm = normalizeStore(s);
      if (norm.id) {
        realStores[norm.id] = norm;
      }
    });

    db.stores = realStores;
    return true;
  } catch(e) {
    console.error("Excepción al cargar tiendas:", e);
    alert("Error de conexión al cargar tiendas. Conservando datos actuales.");
    return false;
  }
}

async function loadFormsFromBackend() {
  try {
    const formsRes = await window.ApiService.getForms();
    if (formsRes && formsRes.success && Array.isArray(formsRes.data)) {
      const realForms = {};
      formsRes.data.forEach(f => {
        realForms[f.id] = f;
      });
      if (Object.keys(realForms).length > 0) {
        db.forms = realForms;
      }
      return true;
    }
  } catch (e) {
    console.error("Excepción al cargar formularios:", e);
  }
  return false;
}

// 1. Initial Mock Database State
const INITIAL_DATABASE = {
  products: {
    'prod-coca': {
      id: 'prod-coca',
      name: 'Coca-Cola 600ml',
      srp: 18.50,
      minPrice: 16.00,
      maxPrice: 22.00,
      avgDailySales: 11.4, // ~80 per week
    },
    'prod-sprite': {
      id: 'prod-sprite',
      name: 'Sprite 600ml',
      srp: 17.00,
      minPrice: 15.00,
      maxPrice: 20.00,
      avgDailySales: 5.7,  // ~40 per week
    },
    'prod-ciel': {
      id: 'prod-ciel',
      name: 'Agua Ciel 1L',
      srp: 13.00,
      minPrice: 11.00,
      maxPrice: 16.00,
      avgDailySales: 17.1, // ~120 per week
    }
  },
  stores: {
    'store-1': {
      id: 'store-1',
      name: 'Walmart Express Satélite',
      address: 'Av. Lomas Verdes 120, Naucalpan',
      lat: 19.5089,
      lng: -99.2425
    },
    'store-2': {
      id: 'store-2',
      name: 'Bodega Aurrera Lomas',
      address: 'Vía Adolfo López Mateos 45, Tlalnepantla',
      lat: 19.5372,
      lng: -99.2201
    },
    'store-3': {
      id: 'store-3',
      name: 'Oxxo Satélite',
      address: 'Circuito Historiadores 14, Naucalpan',
      lat: 19.5015,
      lng: -99.2312
    }
  },
  promoters: {
    'promoter-1': { id: 'promoter-1', name: 'Pedro Gómez', avatar: 'PG' },
    'promoter-2': { id: 'promoter-2', name: 'Sofía Rodríguez', avatar: 'SR' },
    'promoter-3': { id: 'promoter-3', name: 'Carlos Mendoza', avatar: 'CM' }
  },
  routes: [
    {
      id: 'route-1',
      promoterId: 'promoter-1',
      storeId: 'store-1',
      date: '2026-05-21',
      status: 'pendiente',
      checkIn: null,
      checkOut: null,
      data: null
    },
    {
      id: 'route-2',
      promoterId: 'promoter-1',
      storeId: 'store-2',
      date: '2026-05-21',
      status: 'pendiente',
      checkIn: null,
      checkOut: null,
      data: null
    },
    {
      id: 'route-3',
      promoterId: 'promoter-1',
      storeId: 'store-3',
      date: '2026-05-21',
      status: 'pendiente',
      checkIn: null,
      checkOut: null,
      data: null
    },
    {
      id: 'route-4',
      promoterId: 'promoter-1',
      storeId: 'store-2',
      date: '2026-05-22',
      status: 'pendiente',
      checkIn: null,
      checkOut: null,
      data: null
    },
    {
      id: 'route-5',
      promoterId: 'promoter-2',
      storeId: 'store-2',
      date: '2026-05-21',
      status: 'pendiente',
      checkIn: null,
      checkOut: null,
      data: null
    },
    {
      id: 'route-6',
      promoterId: 'promoter-3',
      storeId: 'store-3',
      date: '2026-05-21',
      status: 'pendiente',
      checkIn: null,
      checkOut: null,
      data: null
    }
  ],
  alerts: [],
  visits: [],
  users: {
    'pedro': { username: 'pedro', password: '123', name: 'Pedro Gómez', role: 'promoter', promoterId: 'promoter-1' },
    'sofia': { username: 'sofia', password: '123', name: 'Sofía Rodríguez', role: 'promoter', promoterId: 'promoter-2' },
    'carlos': { username: 'carlos', password: '123', name: 'Carlos Mendoza', role: 'promoter', promoterId: 'promoter-3' },
    'admin': { username: 'admin', password: '123', name: 'Supervisor Central', role: 'supervisor' }
  },
  config: {
    checkInRangeMeters: 50
  },
  forms: {
    'form-exhibidor-demo': {
      id: 'form-exhibidor-demo', name: 'Ejecución en Exhibidor — Demostración de Campo',
      questions: [
        { id: 'demo-q1', number: '1', section: 'CONTROL', type: 'yes_no', title: 'Check in confirmado', required: true, options: [] },
        { id: 'demo-q2', number: '2', section: 'CONTROL', type: 'yes_no', title: 'Foto de tienda al inicio de jornada', required: true, options: [] },
        { id: 'demo-q3', number: '3', section: 'MERCADEO', type: 'numeric', title: '¿Cuántos ganchos vacíos tiene el exhibidor al entrar?', required: true, options: [] },
        { id: 'demo-q4', number: '4', section: 'MERCADEO', type: 'photo', title: 'Foto de exhibidor antes de mercadeo', required: true, options: [] },
        { id: 'demo-q5', number: '5', section: 'EXHIBIDOR', type: 'yes_no', title: '¿La tienda cuenta con exhibidor?', required: true, options: [] },
        { id: 'demo-q6', number: '6', section: 'EXHIBIDOR', type: 'yes_no', title: '¿El exhibidor está en mal estado?', required: true, options: [] },
        { id: 'demo-q7', number: '7', section: 'EXHIBIDOR', type: 'text', title: '¿Qué parte está dañada? Explica brevemente', required: true, dependency: { parentId: 'demo-q6', value: 'SI' }, options: [] },
        { id: 'demo-q8', number: '8', section: 'MERCADEO', type: 'numeric', title: '¿Cuántos ganchos vacíos quedan después de surtir?', required: true, options: [] },
        { id: 'demo-q9', number: '9', section: 'MERCADEO', type: 'yes_no', title: 'Después de surtir, ¿quedan marcas o denominaciones agotadas?', required: true, options: [] },
        { id: 'demo-q9-1', number: '9.1', section: 'MERCADEO', type: 'multiple', title: 'Selecciona la marca o denominación sin inventario', required: true, dependency: { parentId: 'demo-q9', value: 'SI' }, options: ['Coca-Cola', 'Sprite', 'Ciel'] },
        { id: 'demo-q10', number: '10', section: 'SISTEMA', type: 'yes_no', title: '¿La tienda presenta errores de activación?', required: true, options: [] },
        { id: 'demo-q10-1', number: '10.1', section: 'SISTEMA', type: 'multiple', title: 'Selecciona la marca con errores de activación', required: true, dependency: { parentId: 'demo-q10', value: 'SI' }, options: ['Coca-Cola', 'Sprite', 'Ciel'] },
        { id: 'demo-q11', number: '11', section: 'CONTROL', type: 'photo', title: 'Foto de salida', required: true, options: [] }
      ]
    },
    'form-incidencias': {
      id: 'form-incidencias',
      name: 'Reporte de Incidencias',
      questions: [
        {
          id: 'q1',
          type: 'yes_no',
          title: '¿Tienes producto sin inventario?',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'photo',
          title: 'Toma foto de la etiqueta del producto',
          required: false,
          dependency: {
            parentId: 'q1',
            value: 'SI'
          },
          options: []
        },
        {
          id: 'q3',
          type: 'text',
          title: 'Reporte de Competencia',
          required: false,
          options: []
        },
        {
          id: 'q4',
          type: 'barcode',
          title: 'Código de barras del producto con incidencia',
          required: true,
          options: []
        },
        {
          id: 'q5',
          type: 'numeric',
          title: 'Cantidad observada en exhibición',
          required: false,
          options: []
        },
        {
          id: 'q6',
          type: 'multiple',
          title: 'Área de exhibición principal',
          required: false,
          options: ['Anaquel', 'Isla', 'Cabecera']
        }
      ]
    }
  }
};

// Preset high-quality stock photo simulation URLs (SVGs that look like retail shelves to keep it lightweight and self-contained)
const SAMPLE_PHOTOS = {
  'shelf-clean': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><rect x="10" y="80" width="380" height="15" fill="%2364748b"/><rect x="10" y="180" width="380" height="15" fill="%2364748b"/><rect x="10" y="270" width="380" height="15" fill="%2364748b"/><rect x="40" y="25" width="30" height="55" fill="%23ef4444"/><rect x="80" y="25" width="30" height="55" fill="%23ef4444"/><rect x="120" y="25" width="30" height="55" fill="%23ef4444"/><rect x="200" y="35" width="25" height="45" fill="%2322c55e"/><rect x="235" y="35" width="25" height="45" fill="%2322c55e"/><rect x="300" y="15" width="40" height="65" fill="%233b82f6"/><rect x="50" y="115" width="30" height="65" fill="%23ef4444"/><rect x="90" y="115" width="30" height="65" fill="%23ef4444"/><rect x="150" y="135" width="25" height="45" fill="%2322c55e"/><rect x="250" y="105" width="40" height="75" fill="%233b82f6"/><rect x="300" y="105" width="40" height="75" fill="%233b82f6"/><text x="20" y="295" font-family="Outfit" font-size="12" fill="%23334155" font-weight="bold">Anaquel Exhibición Ordenado (Piloto)</text></svg>',
  'shelf-messy': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23fca5a5" opacity="0.3"/><rect x="10" y="80" width="380" height="15" fill="%2364748b"/><rect x="10" y="180" width="380" height="15" fill="%2364748b"/><rect x="10" y="270" width="380" height="15" fill="%2364748b"/><rect x="40" y="45" width="30" height="35" transform="rotate(15 40 45)" fill="%23ef4444"/><rect x="200" y="55" width="25" height="25" transform="rotate(-30 200 55)" fill="%2322c55e"/><rect x="90" y="150" width="30" height="30" transform="rotate(75 90 150)" fill="%23ef4444"/><rect x="250" y="130" width="30" height="50" transform="rotate(-15 250 130)" fill="%233b82f6"/><circle cx="340" cy="60" r="15" fill="%23ef4444" opacity="0.2"/><text x="340" y="64" font-family="Outfit" font-size="10" text-anchor="middle" fill="%23ef4444" font-weight="bold">OOS</text><text x="20" y="295" font-family="Outfit" font-size="12" fill="%23991b1b" font-weight="bold">Alerta: Quiebre de Stock Detectado</text></svg>'
};

// State variables
let db = null;
let currentActiveRouteId = null;
let selectedPromoterId = 'promoter-1';
// Use local device date — NOT UTC (UTC would roll to the next day before midnight in Mexico)
let selectedDate = getLocalDateString();
let selectedPhotoBase64 = null;
let dynamicPhotos = {};
let activeAlertFilter = 'all';
let pendingImportRoutes = [];
let gpsSimulationMode = 'in-range';
let activeFormId = 'form-incidencias';

// ---- Multi-form helpers ----
// Normalize legacy formId (string) OR new formIds (array) to always return an array of dynamic form IDs.
function getRouteFormIds(route) {
  if (!route) return [];
  if (Array.isArray(route.formIds)) return route.formIds;
  if (route.formId && route.formId !== 'default') return [route.formId];
  return [];
}
function routeHasDynamicForms(route) {
  return getRouteFormIds(route).length > 0;
}


// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.ApiService) {
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h2>Error Crítico de Inicialización</h2>
        <p>No se pudo cargar el módulo ApiService.</p>
        <p>Por favor, recarga la página o contacta a soporte.</p>
      </div>
    `;
    console.error("CRITICAL ERROR: window.ApiService is undefined. Execution stopped.");
    return;
  }
  
  initStorage();
  initNavigation();
  initPromoterEvents();
  initSupervisorEvents();
  initAuthAndConsole();
  initFormBuilderEvents();
  initStoreHistoryDialog();
  
  // Dropdown & selector initializations
  renderMobilePromoterDropdown();
  populateManualAssignmentDropdowns();
  initRouteUploader();
  
  // Mobile date select event binding
  const mobileDateSelect = document.getElementById('mobile-date-select');
  if (mobileDateSelect) {
    mobileDateSelect.value = selectedDate;
    mobileDateSelect.addEventListener('change', () => {
      selectedDate = mobileDateSelect.value;
      renderRouteList();
    });
  }
  
  // Supervisor planning date filter binding
  const plannerDateFilter = document.getElementById('planner-date-filter');
  if (plannerDateFilter) {
    plannerDateFilter.value = selectedDate;
    plannerDateFilter.addEventListener('change', () => {
      renderRoutePlanner();
    });
  }
  
  // Promoter dropdown trigger binding
  const trigger = document.getElementById('promoter-profile-trigger');
  const dropdown = document.getElementById('promoter-dropdown-menu');
  if (trigger && dropdown) {
    trigger.addEventListener('click', (e) => {
      const currentUserStr = localStorage.getItem('fieldflow_current_user');
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        if (user.role === 'promoter') {
          return; // locked
        }
      }
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });
  }
  
  renderRouteList();
  updateSupervisorDashboard();
  
  // Run session check
  await checkAuth();
  
  // Initialize lucide icons
  lucide.createIcons();
});

// 2. Storage & State Management
function initStorage() {
  const storedData = localStorage.getItem('fieldflow_db');
  if (storedData) {
    try {
      db = JSON.parse(storedData);
      migrateDBIfNeeded();
    } catch (e) {
      console.error("Error parsing localstorage db. Resetting...", e);
      db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
      localStorage.setItem('fieldflow_db', JSON.stringify(db));
    }
  } else {
    db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    localStorage.setItem('fieldflow_db', JSON.stringify(db));
  }
}

function migrateDBIfNeeded() {
  let needsSave = false;
  if (!db.promoters) {
    db.promoters = JSON.parse(JSON.stringify(INITIAL_DATABASE.promoters));
    needsSave = true;
  }
  if (!db.routes) {
    db.routes = [];
    // Migrate old stores state if present
    Object.keys(db.stores).forEach(id => {
      const store = db.stores[id];
      db.routes.push({
        id: `route-${id}-2026-05-21`,
        promoterId: 'promoter-1',
        storeId: id,
        date: '2026-05-21',
        status: store.status || 'pendiente',
        checkIn: store.checkIn || null,
        checkOut: store.checkOut || null,
        data: store.data || null
      });
      // Clear dynamic state from stores catalog
      delete store.status;
      delete store.checkIn;
      delete store.checkOut;
      delete store.data;
    });
    needsSave = true;
  }
  if (!db.users) {
    db.users = JSON.parse(JSON.stringify(INITIAL_DATABASE.users));
    needsSave = true;
  }
  if (!db.config) {
    db.config = JSON.parse(JSON.stringify(INITIAL_DATABASE.config));
    needsSave = true;
  }
  if (!db.forms) {
    db.forms = JSON.parse(JSON.stringify(INITIAL_DATABASE.forms || {}));
    needsSave = true;
  }
  if (!db.forms['form-exhibidor-demo']) {
    db.forms['form-exhibidor-demo'] = JSON.parse(JSON.stringify(INITIAL_DATABASE.forms['form-exhibidor-demo']));
    needsSave = true;
  }
  db.routes.forEach(route => {
    // Migrate legacy single formId → formIds array
    if (!Array.isArray(route.formIds)) {
      const legacy = route.formId;
      route.formIds = (legacy && legacy !== 'default') ? [legacy] : [];
      delete route.formId;
      needsSave = true;
    }
  });
  // Migrate stores to ensure they have lat/lng coordinates
  Object.keys(db.stores).forEach(id => {
    const store = db.stores[id];
    if (store.lat === undefined || store.lng === undefined) {
      const initialStore = INITIAL_DATABASE.stores[id];
      if (initialStore) {
        store.lat = initialStore.lat;
        store.lng = initialStore.lng;
      } else {
        // Fallback random coords near Mexico City
        store.lat = 19.4326 + (Math.random() - 0.5) * 0.1;
        store.lng = -99.1332 + (Math.random() - 0.5) * 0.1;
      }
      needsSave = true;
    }
  });
  if (needsSave) {
    saveDB();
  }
}

function saveDB() {
  localStorage.setItem('fieldflow_db', JSON.stringify(db));
}

function resetDB() {
  db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
  saveDB();
  selectedPhotoBase64 = null;
  currentActiveRouteId = null;
  selectedPromoterId = 'promoter-1';
  selectedDate = getLocalDateString(); // reset to local device date, not UTC
  
  // Go back to route list screen inside promoter simulator
  const activeScreen = document.querySelector('.mobile-screen.active');
  if (activeScreen && activeScreen.id !== 'screen-route-list') {
    changeMobileScreen('screen-route-list');
  }
  
  // Reset mobile header promoter trigger info
  const defaultPromoter = db.promoters['promoter-1'];
  document.getElementById('mobile-promoter-name').textContent = defaultPromoter.name;
  document.getElementById('mobile-promoter-avatar').textContent = defaultPromoter.avatar;
  
  const mobileDateSelect = document.getElementById('mobile-date-select');
  if (mobileDateSelect) mobileDateSelect.value = selectedDate;
  
  const plannerDateFilter = document.getElementById('planner-date-filter');
  if (plannerDateFilter) plannerDateFilter.value = selectedDate;
  
  renderMobilePromoterDropdown();
  populateManualAssignmentDropdowns();
  renderRoutePlanner();
  renderRouteList();
  updateSupervisorDashboard();
  
  // Reset form inputs
  document.getElementById('field-capture-form').reset();
  disableFormInputs(true);
  
  // Hide photo preview
  document.getElementById('photo-preview-container').classList.add('hidden');
  document.getElementById('photo-dropzone').classList.remove('hidden');
  
  // Remove photo selection chips
  document.querySelectorAll('.sample-chip').forEach(c => c.classList.remove('selected'));
  
  // Reset attendance card
  document.getElementById('attendance-status-text').innerHTML = `
    <i data-lucide="clock" class="text-warning"></i>
    <span>Requiere Check-In para iniciar tareas</span>
  `;
  document.getElementById('btn-check-in').classList.remove('hidden');
  document.getElementById('check-in-details').classList.add('hidden');
  
  lucide.createIcons();
  setActiveView('promotor');
  
  alert("Datos restablecidos. Se ha iniciado el simulador en su estado original.");
}

// 3. Navigation Setup (Role Switching)
function setActiveView(viewName) {
  const btnPromotor = document.getElementById('btn-promotor');
  const btnSupervisor = document.getElementById('btn-supervisor');
  const btnPlanner = document.getElementById('btn-planner');
  const btnForms = document.getElementById('btn-forms');
  const btnConsole = document.getElementById('btn-console');
  
  const viewPromotor = document.getElementById('view-promotor');
  const viewSupervisor = document.getElementById('view-supervisor');
  const viewPlanner = document.getElementById('view-planner');
  const viewForms = document.getElementById('view-forms');
  const viewConsole = document.getElementById('view-console');
  const viewLogin = document.getElementById('view-login');
  
  // Protect views: if not logged in, force 'login'
  const sessionStr = localStorage.getItem('fieldforce_session');
  let isValidSession = false;
  if (sessionStr) {
    try {
      const s = JSON.parse(sessionStr);
      if (s && s.token) isValidSession = true;
    } catch(e) {}
  }
  
  if (!isValidSession && viewName !== 'login') {
    viewName = 'login';
  }
  
  // Reset active classes
  if (btnPromotor) { btnPromotor.classList.remove('active'); btnPromotor.setAttribute('aria-selected', 'false'); }
  if (btnSupervisor) { btnSupervisor.classList.remove('active'); btnSupervisor.setAttribute('aria-selected', 'false'); }
  if (btnPlanner) { btnPlanner.classList.remove('active'); btnPlanner.setAttribute('aria-selected', 'false'); }
  if (btnForms) { btnForms.classList.remove('active'); btnForms.setAttribute('aria-selected', 'false'); }
  if (btnConsole) { btnConsole.classList.remove('active'); btnConsole.setAttribute('aria-selected', 'false'); }
  
  if (viewPromotor) viewPromotor.classList.remove('active');
  if (viewSupervisor) viewSupervisor.classList.remove('active');
  if (viewPlanner) viewPlanner.classList.remove('active');
  if (viewForms) viewForms.classList.remove('active');
  if (viewConsole) viewConsole.classList.remove('active');
  if (viewLogin) viewLogin.classList.remove('active');
  
  if (viewName === 'promotor') {
    if (btnPromotor) { btnPromotor.classList.add('active'); btnPromotor.setAttribute('aria-selected', 'true'); }
    if (viewPromotor) viewPromotor.classList.add('active');
    renderRouteList();
  } else if (viewName === 'supervisor') {
    if (btnSupervisor) { btnSupervisor.classList.add('active'); btnSupervisor.setAttribute('aria-selected', 'true'); }
    if (viewSupervisor) viewSupervisor.classList.add('active');
    updateSupervisorDashboard();
  } else if (viewName === 'planner') {
    if (btnPlanner) { btnPlanner.classList.add('active'); btnPlanner.setAttribute('aria-selected', 'true'); }
    if (viewPlanner) viewPlanner.classList.add('active');
    renderRoutePlanner();
  } else if (viewName === 'forms') {
    if (btnForms) { btnForms.classList.add('active'); btnForms.setAttribute('aria-selected', 'true'); }
    if (viewForms) viewForms.classList.add('active');
    renderFormBuilder();
  } else if (viewName === 'console') {
    if (btnConsole) { btnConsole.classList.add('active'); btnConsole.setAttribute('aria-selected', 'true'); }
    if (viewConsole) viewConsole.classList.add('active');
    renderCentralConsole();
  } else if (viewName === 'login') {
    if (viewLogin) viewLogin.classList.add('active');
  }
  
  lucide.createIcons();
}

function initNavigation() {
  const btnPromotor = document.getElementById('btn-promotor');
  const btnSupervisor = document.getElementById('btn-supervisor');
  const btnPlanner = document.getElementById('btn-planner');
  const btnForms = document.getElementById('btn-forms');
  const btnConsole = document.getElementById('btn-console');
  const btnReset = document.getElementById('btn-reset');
  
  if (btnPromotor) {
    btnPromotor.addEventListener('click', () => {
      setActiveView('promotor');
    });
  }
  if (btnSupervisor) {
    btnSupervisor.addEventListener('click', () => {
      setActiveView('supervisor');
    });
  }
  if (btnPlanner) {
    btnPlanner.addEventListener('click', () => {
      setActiveView('planner');
    });
  }
  if (btnForms) {
    btnForms.addEventListener('click', () => {
      setActiveView('forms');
    });
  }
  if (btnConsole) {
    btnConsole.addEventListener('click', () => {
      setActiveView('console');
    });
  }
  
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm("¿Estás seguro de que deseas borrar el historial y reiniciar el piloto?")) {
        resetDB();
      }
    });
  }
}

// 4. Promoter Simulator Logic
function changeMobileScreen(screenId) {
  document.querySelectorAll('.mobile-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }
}

function renderMobilePromoterDropdown() {
  const dropdown = document.getElementById('promoter-dropdown-menu');
  if (!dropdown) return;
  
  dropdown.innerHTML = '';
  
  Object.keys(db.promoters).forEach(pId => {
    const promoter = db.promoters[pId];
    const item = document.createElement('div');
    item.className = 'promoter-dropdown-item';
    item.textContent = promoter.name;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedPromoterId = promoter.id;
      
      // Update Header trigger fields
      document.getElementById('mobile-promoter-name').textContent = promoter.name;
      document.getElementById('mobile-promoter-avatar').textContent = promoter.avatar || promoter.name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
      
      dropdown.classList.add('hidden');
      renderRouteList();
    });
    dropdown.appendChild(item);
  });
}

function renderRouteList() {
  const container = document.getElementById('stores-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  let completedCount = 0;
  
  // Filter routes assigned to this promoter on this date
  const routesForDay = db.routes.filter(r => r.promoterId === selectedPromoterId && r.date === selectedDate);
  
  if (routesForDay.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i data-lucide="info" style="width:24px; height:24px; margin-bottom:0.5rem; color:var(--neutral-muted);"></i>
        <p>No tienes visitas programadas para este día.</p>
      </div>
    `;
    // Reset progress bar
    document.getElementById('route-progress-text').textContent = `0 / 0 Tiendas`;
    document.getElementById('route-progress-fill').style.width = `0%`;
    lucide.createIcons();
    return;
  }
  
  // Sort routes by visitOrder
  routesForDay.sort((a, b) => a.visitOrder - b.visitOrder);
  
  routesForDay.forEach(route => {
    const store = db.stores[route.storeId] || {
      name: "Tienda Desconocida",
      chain: "N/A",
      code: route.storeId,
      address: "Sin asociar en el catálogo. ID: " + route.storeId
    };
    
    const isCompleted = route.status === 'completado';
    if (isCompleted) completedCount++;
    
    const card = document.createElement('div');
    card.className = `store-route-card ${isCompleted ? 'completed' : ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    
    const routeFormIds = getRouteFormIds(route);
    const formBadgeHTML = routeFormIds.map(fId => db.forms[fId]
      ? `<span class="badge-form" style="font-size: 0.7rem; background: var(--primary-light); color: var(--primary-color); padding: 2px 6px; border-radius: 4px; margin-left: 4px; font-weight: 600; display: inline-block; vertical-align: middle;">${db.forms[fId].name}</span>`
      : '').join('');
      
    card.innerHTML = `
      <div class="store-route-info">
        <h4>${store.name} ${formBadgeHTML}</h4>
        <p style="font-size: 0.75rem; color: var(--neutral-muted); margin-bottom: 2px;">
          <strong>${store.chain}</strong> | ${store.code} | <i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-top:-2px;"></i> ${route.scheduledStart} - ${route.scheduledEnd}
        </p>
        <p><i data-lucide="map-pin"></i> ${store.address}</p>
      </div>
      <div class="store-status-icon" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 4px;">
        <span style="font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: ${isCompleted ? 'var(--success-color)' : 'var(--primary-color)'};">${route.status}</span>
        <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.75rem; border-radius: 12px; min-height: unset;">
          ${isCompleted ? 'Ver' : 'Iniciar'} <i data-lucide="${isCompleted ? 'check' : 'chevron-right'}" style="width:12px;height:12px;"></i>
        </button>
      </div>
    `;
    
    card.addEventListener('click', () => {
      if (isCompleted || route.status === 'en_visita') {
        openRouteCapture(route.id);
      } else {
        openCheckinModal(route.id);
      }
    });
    
    // Accessibility enter/space key
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isCompleted || route.status === 'en_visita') {
          openRouteCapture(route.id);
        } else {
          openCheckinModal(route.id);
        }
      }
    });
    
    container.appendChild(card);
  });
  
  // Update progress bar
  const progressText = document.getElementById('route-progress-text');
  const progressBar = document.getElementById('route-progress-fill');
  
  progressText.textContent = `${completedCount} / ${routesForDay.length} Tiendas`;
  const percentage = (completedCount / routesForDay.length) * 100;
  progressBar.style.width = `${percentage}%`;
  
  lucide.createIcons();
}

function openRouteCapture(routeId) {
  currentActiveRouteId = routeId;
  const route = db.routes.find(r => r.id === routeId);
  if (!route) return;
  
  const store = db.stores[route.storeId];
  if (!store) return;
  
  // Set store headers
  document.getElementById('capture-store-name').textContent = store.name;
  document.getElementById('capture-store-address').innerHTML = `<i data-lucide="map-pin"></i> ${store.address}`;
  
  // Reset Form
  document.getElementById('field-capture-form').reset();
  selectedPhotoBase64 = null;
  
  // Reset Price Alerts
  document.getElementById('coca-price-alert').textContent = '';
  document.getElementById('sprite-price-alert').textContent = '';
  document.getElementById('ciel-price-alert').textContent = '';
  
  // Hide photo preview
  document.getElementById('photo-preview-container').classList.add('hidden');
  document.getElementById('photo-dropzone').classList.remove('hidden');
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.classList.remove('selected');
  });
  
  // Handle already completed stores vs en_visita vs pending stores
  if (route.status === 'completado') {
    // Fill form with submitted data
    if (routeHasDynamicForms(route)) {
      const classicCards = document.querySelectorAll('#field-capture-form .task-card');
      classicCards.forEach(card => card.classList.add('hidden'));
      const dynamicContainer = document.getElementById('dynamic-form-container');
      if (dynamicContainer) {
        dynamicContainer.classList.remove('hidden');
        renderDynamicForm(route, true);
        prepopulateDynamicForm(route, route.data);
      }
    } else {
      const classicCards = document.querySelectorAll('#field-capture-form .task-card');
      classicCards.forEach(card => card.classList.remove('hidden'));
      const dynamicContainer = document.getElementById('dynamic-form-container');
      if (dynamicContainer) dynamicContainer.classList.add('hidden');
      prepopulateCompletedStore(route.data);
    }
    disableFormInputs(true);
    
    // Hide check-in button, show details, hide GPS simulator
    document.getElementById('btn-check-in').classList.add('hidden');
    document.getElementById('gps-simulator-container').classList.add('hidden');
    const checkInDetails = document.getElementById('check-in-details');
    checkInDetails.classList.remove('hidden');
    document.getElementById('check-in-time').textContent = route.checkIn;
    
    const coords = route.checkInCoords || { lat: store.lat || 19.5089, lng: store.lng || -99.2425 };
    document.getElementById('check-in-gps').textContent = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
    
    document.getElementById('attendance-status-text').innerHTML = `
      <i data-lucide="check-circle" class="text-success"></i>
      <span>Visita ya completada y enviada</span>
    `;
    
    document.getElementById('btn-submit-visit').disabled = true;
    document.getElementById('submit-warning').textContent = "Esta visita ya fue enviada y no puede modificarse.";
    
    // Enable task panel but keep elements disabled (view only)
    const taskContainer = document.getElementById('store-tasks-container');
    taskContainer.classList.remove('store-tasks-disabled');
  } else if (route.status === 'en_visita') {
    // Resume visit in progress
    if (routeHasDynamicForms(route)) {
      const classicCards = document.querySelectorAll('#field-capture-form .task-card');
      classicCards.forEach(card => card.classList.add('hidden'));
      const dynamicContainer = document.getElementById('dynamic-form-container');
      if (dynamicContainer) {
        dynamicContainer.classList.remove('hidden');
        renderDynamicForm(route, false);
        if (route.data) prepopulateDynamicForm(route, route.data);
      }
    } else {
      const classicCards = document.querySelectorAll('#field-capture-form .task-card');
      classicCards.forEach(card => card.classList.remove('hidden'));
      const dynamicContainer = document.getElementById('dynamic-form-container');
      if (dynamicContainer) dynamicContainer.classList.add('hidden');
    }
    disableFormInputs(false);
    
    // Hide check-in button, show details, hide GPS simulator
    document.getElementById('btn-check-in').classList.add('hidden');
    document.getElementById('gps-simulator-container').classList.add('hidden');
    const checkInDetails = document.getElementById('check-in-details');
    checkInDetails.classList.remove('hidden');
    document.getElementById('check-in-time').textContent = route.checkIn;
    
    const coords = route.checkInCoords || { lat: store.lat || 19.5089, lng: store.lng || -99.2425 };
    document.getElementById('check-in-gps').textContent = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
    
    document.getElementById('attendance-status-text').innerHTML = `
      <i data-lucide="check-circle" class="text-success"></i>
      <span>Check-In Activo. Completa las tareas.</span>
    `;
    
    document.getElementById('btn-submit-visit').disabled = true;
    validateFieldForm(); // run validation to see if they completed everything
    
    const taskContainer = document.getElementById('store-tasks-container');
    taskContainer.classList.remove('store-tasks-disabled');
  } else {
    // Reset simulation mode to in-range by default
    gpsSimulationMode = 'in-range';
    const btnGPSInRange = document.getElementById('btn-gps-in-range');
    const btnGPSOutOfRange = document.getElementById('btn-gps-out-of-range');
    if (btnGPSInRange) btnGPSInRange.classList.add('active');
    if (btnGPSOutOfRange) btnGPSOutOfRange.classList.remove('active');
    
    // Show GPS widget
    document.getElementById('gps-simulator-container').classList.remove('hidden');
    updateGPSSimulatorDisplay(store);
    
    // Reset to check-in required state
    if (routeHasDynamicForms(route)) {
      const classicCards = document.querySelectorAll('#field-capture-form .task-card');
      classicCards.forEach(card => card.classList.add('hidden'));
      const dynamicContainer = document.getElementById('dynamic-form-container');
      if (dynamicContainer) {
        dynamicContainer.classList.remove('hidden');
        renderDynamicForm(route, true);
      }
    } else {
      const classicCards = document.querySelectorAll('#field-capture-form .task-card');
      classicCards.forEach(card => card.classList.remove('hidden'));
      const dynamicContainer = document.getElementById('dynamic-form-container');
      if (dynamicContainer) dynamicContainer.classList.add('hidden');
    }
    disableFormInputs(true);
    document.getElementById('btn-check-in').classList.remove('hidden');
    document.getElementById('check-in-details').classList.add('hidden');
    
    document.getElementById('attendance-status-text').innerHTML = `
      <i data-lucide="clock" class="text-warning"></i>
      <span>Requiere Check-In para iniciar tareas</span>
    `;
    
    document.getElementById('btn-submit-visit').disabled = true;
    document.getElementById('submit-warning').textContent = "Debes completar los campos obligatorios del check-in.";
    
    const taskContainer = document.getElementById('store-tasks-container');
    taskContainer.classList.add('store-tasks-disabled');
  }
  
  changeMobileScreen('screen-store-capture');
  lucide.createIcons();
}

function prepopulateCompletedStore(data) {
  if (!data) return;
  
  // Products
  document.getElementById('coca-stock').value = data.kpis.prod_coca.stock;
  document.getElementById('coca-price').value = data.kpis.prod_coca.price;
  document.getElementById('coca-oos').checked = data.kpis.prod_coca.oos;
  
  document.getElementById('sprite-stock').value = data.kpis.prod_sprite.stock;
  document.getElementById('sprite-price').value = data.kpis.prod_sprite.price;
  document.getElementById('sprite-oos').checked = data.kpis.prod_sprite.oos;
  
  document.getElementById('ciel-stock').value = data.kpis.prod_ciel.stock;
  document.getElementById('ciel-price').value = data.kpis.prod_ciel.price;
  document.getElementById('ciel-oos').checked = data.kpis.prod_ciel.oos;
  
  // Exhibition
  document.getElementById('exh-additional').checked = data.exhibition.additional;
  document.getElementById('pop-compliance').checked = data.exhibition.pop;
  
  if (data.exhibition.photo) {
    selectedPhotoBase64 = data.exhibition.photo;
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview-img');
    const dropzone = document.getElementById('photo-dropzone');
    
    previewImg.src = selectedPhotoBase64;
    previewContainer.classList.remove('hidden');
    dropzone.classList.add('hidden');
    
    // Hide remove photo button since it's disabled view
    document.getElementById('btn-remove-photo').classList.add('hidden');
  }
  
  // Competitor & Notes
  document.getElementById('competitor-price').value = data.competitor.price;
  document.getElementById('competitor-notes').value = data.competitor.notes;
}

function disableFormInputs(disabled) {
  const inputs = document.querySelectorAll('#field-capture-form input, #field-capture-form textarea, #field-capture-form button:not([type="submit"]):not(#btn-remove-photo)');
  inputs.forEach(input => {
    input.disabled = disabled;
  });
}

function initPromoterEvents() {
  const btnBack = document.getElementById('btn-back-to-route');
  const btnCheckIn = document.getElementById('btn-check-in');
  const form = document.getElementById('field-capture-form');
  const fileInput = document.getElementById('photo-file');
  const dropzone = document.getElementById('photo-dropzone');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  const samplePhotoContainer = document.getElementById('sample-photo-container');
  
  btnBack.addEventListener('click', () => {
    changeMobileScreen('screen-route-list');
    renderRouteList();
  });
  
  btnCheckIn.addEventListener('click', () => {
    performCheckIn();
  });
  
  // Form input validation listeners for real-time alerts
  const inputs = ['coca', 'sprite', 'ciel'];
  inputs.forEach(prefix => {
    const stockInput = document.getElementById(`${prefix}-stock`);
    const priceInput = document.getElementById(`${prefix}-price`);
    const oosCheckbox = document.getElementById(`${prefix}-oos`);
    
    // Checkbox OOS logic: if checked, stock = 0 and disabled
    oosCheckbox.addEventListener('change', () => {
      if (oosCheckbox.checked) {
        stockInput.value = 0;
        stockInput.disabled = true;
        priceInput.value = 0;
        priceInput.disabled = true;
        validateFieldForm();
      } else {
        stockInput.disabled = false;
        priceInput.disabled = false;
        stockInput.value = '';
        priceInput.value = '';
        validateFieldForm();
      }
    });
    
    stockInput.addEventListener('input', validateFieldForm);
    priceInput.addEventListener('input', () => {
      validatePrice(prefix);
      validateFieldForm();
    });
  });
  
  // Drag and drop events
  dropzone.addEventListener('click', () => {
    if (!fileInput.disabled) {
      fileInput.click();
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    handlePhotoUpload(e.target.files[0]);
  });
  
  // Sample Photo simulation click
  samplePhotoContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.sample-chip');
    if (!chip) return;
    
    // Deselect other chips
    document.querySelectorAll('.sample-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    
    const key = chip.getAttribute('data-img');
    const base64Img = SAMPLE_PHOTOS[key];
    
    if (base64Img) {
      selectedPhotoBase64 = base64Img;
      displayPhotoPreview(selectedPhotoBase64);
      validateFieldForm();
    }
  });
  
  btnRemovePhoto.addEventListener('click', () => {
    selectedPhotoBase64 = null;
    document.getElementById('photo-preview-container').classList.add('hidden');
    document.getElementById('photo-dropzone').classList.remove('hidden');
    document.querySelectorAll('.sample-chip').forEach(c => c.classList.remove('selected'));
    fileInput.value = '';
    validateFieldForm();
  });
  
  // Submit Form event
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitVisitData();
  });
}

function performCheckIn() {
  const route = db.routes.find(r => r.id === currentActiveRouteId);
  if (!route) return;
  
  const store = db.stores[route.storeId];
  if (!store) return;
  
  const coords = getSimulatedCoords(store);
  const distance = calculateDistance(coords.lat, coords.lng, store.lat, store.lng);
  const maxRange = db.config.checkInRangeMeters;
  
  if (distance > maxRange) {
    // Access denied! Create critical alert for supervisor
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    
    // Add alert to db
    const alertId = `alert-${Date.now()}`;
    const promoter = db.promoters[route.promoterId] || { name: 'Desconocido' };
    
    db.alerts.unshift({
      id: alertId,
      severity: 'critical',
      store: store.name,
      time: timeStr,
      date: dateStr,
      title: 'Intento de Check-in Fuera de Rango GPS',
      desc: `${promoter.name} intentó realizar Check-In en ${store.name} a una distancia de ${Math.round(distance)} metros (Rango permitido: ${maxRange}m). Coordenadas del promotor: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}. Coordenadas de la tienda: ${store.lat.toFixed(5)}, ${store.lng.toFixed(5)}.`,
      actionGuide: `Contactar al promotor ${promoter.name} para verificar su ubicación y justificar el desvío.`,
      read: false
    });
    saveDB();
    updateSupervisorDashboard();
    
    alert(`ACCESO DENEGADO (GPS Fuera de Rango)\n\nEstás a ${Math.round(distance)}m de la tienda. El rango máximo de tolerancia configurado en la consola central es de ${maxRange}m.\n\nSe ha enviado una alerta crítica al supervisor.`);
    return;
  }
  
  // Successful check-in
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  route.checkIn = timeStr;
  route.checkInCoords = coords; // Save actual coords
  route.status = 'en_visita';
  saveDB();
  
  // UI Updates
  document.getElementById('btn-check-in').classList.add('hidden');
  document.getElementById('gps-simulator-container').classList.add('hidden');
  const details = document.getElementById('check-in-details');
  details.classList.remove('hidden');
  document.getElementById('check-in-time').textContent = timeStr;
  document.getElementById('check-in-gps').textContent = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
  
  document.getElementById('attendance-status-text').innerHTML = `
    <i data-lucide="check-circle" class="text-success"></i>
    <span>Check-In Activo. Completa las tareas.</span>
  `;
  
  // Unlock form fields
  disableFormInputs(false);
  
  if (routeHasDynamicForms(route)) {
    getRouteFormIds(route).forEach(fId => {
      const form = db.forms[fId];
      if (form) evaluateDynamicFormDependencies(form);
    });
  }
  
  // Remove task container locking overlay
  const taskContainer = document.getElementById('store-tasks-container');
  taskContainer.classList.remove('store-tasks-disabled');
  
  validateFieldForm();
  lucide.createIcons();
}

function validatePrice(prefix) {
  const priceInput = document.getElementById(`${prefix}-price`);
  const alertSpan = document.getElementById(`${prefix}-price-alert`);
  const val = parseFloat(priceInput.value);
  const prod = db.products[`prod-${prefix}`];
  
  if (!priceInput.value || isNaN(val)) {
    alertSpan.textContent = '';
    priceInput.setCustomValidity('');
    return;
  }
  
  if (val < prod.minPrice) {
    alertSpan.textContent = `Bajo ($${val.toFixed(2)} < sugerido min $${prod.minPrice.toFixed(2)})`;
    priceInput.setCustomValidity('Bajo');
  } else if (val > prod.maxPrice) {
    alertSpan.textContent = `Inusual ($${val.toFixed(2)} > sugerido max $${prod.maxPrice.toFixed(2)})`;
    priceInput.setCustomValidity('Inusual');
  } else {
    alertSpan.textContent = '';
    priceInput.setCustomValidity('');
  }
}

function validateFieldForm() {
  const form = document.getElementById('field-capture-form');
  const btnSubmit = document.getElementById('btn-submit-visit');
  const warningText = document.getElementById('submit-warning');
  
  // Basic validation checks
  const route = db.routes.find(r => r.id === currentActiveRouteId);
  if (!route || route.status !== 'en_visita') {
    btnSubmit.disabled = true;
    return;
  }
  
  if (routeHasDynamicForms(route)) {
    // Dynamic form validation
    const visibleRequiredInputs = Array.from(document.querySelectorAll('#dynamic-form-container [required]')).filter(input => {
      const group = input.closest('.dynamic-form-group');
      return group && !group.classList.contains('hidden');
    });
    
    let allFilled = true;
    for (let input of visibleRequiredInputs) {
      if (input.type === 'radio') {
        const name = input.name;
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          allFilled = false;
          break;
        }
      } else {
        if (!input.value.trim()) {
          allFilled = false;
          break;
        }
      }
    }
    
    if (allFilled) {
      btnSubmit.disabled = false;
      warningText.textContent = '';
    } else {
      btnSubmit.disabled = true;
      warningText.textContent = "Debes completar todas las preguntas obligatorias visibles.";
    }
    return;
  }
  
  // Check products inputs
  const inputs = ['coca', 'sprite', 'ciel'];
  let allProductsFilled = true;
  
  for (let prefix of inputs) {
    const oos = document.getElementById(`${prefix}-oos`).checked;
    const stock = document.getElementById(`${prefix}-stock`).value;
    const price = document.getElementById(`${prefix}-price`).value;
    
    if (!oos) {
      if (stock === '' || price === '') {
        allProductsFilled = false;
        break;
      }
    }
  }
  
  if (allProductsFilled) {
    btnSubmit.disabled = false;
    warningText.textContent = '';
  } else {
    btnSubmit.disabled = true;
    warningText.textContent = "Debes completar los campos obligatorios de inventario y precio para todos los productos.";
  }
}

function handlePhotoUpload(file) {
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    alert("Por favor selecciona una imagen válida.");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedPhotoBase64 = e.target.result;
    displayPhotoPreview(selectedPhotoBase64);
    validateFieldForm();
  };
  reader.readAsDataURL(file);
}

// 5. BUSINESS RULES ENGINE & SUBMIT
async function submitVisitData() {
  const route = db.routes.find(r => r.id === currentActiveRouteId);
  if (!route) return;
  
  const store = db.stores[route.storeId];
  if (!store) return;
  
  if (!route.visitId) {
    alert("Error: No hay un Check-In activo (falta visitId).");
    return;
  }
  
  const visitId = route.visitId;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Disable button while processing
  const btn = document.getElementById('btn-submit-visit');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Procesando...';
    lucide.createIcons();
  }

  try {
    if (routeHasDynamicForms(route)) {
      const answers = [];
      for (const formId of getRouteFormIds(route)) {
        const form = db.forms[formId];
        if (!form) continue;
        for (const q of form.questions) {
          const group = document.querySelector(`.dynamic-form-group[data-q-id="${q.id}"]`);
          if (group && group.classList.contains('hidden')) continue;
          let value = '';
          if (q.type === 'yes_no' || q.type === 'multiple') {
            const selected = document.querySelector(`input[name="dynamic-q-${q.id}"]:checked`);
            value = selected ? selected.value : '';
          } else if (q.type === 'photo') {
            value = dynamicPhotos[q.id] ? 'FOTO_ENVIADA_A_DRIVE' : '';
          } else {
            const input = document.getElementById(`dynamic-q-${q.id}`);
            value = input ? input.value.trim() : '';
          }
          answers.push({ id: q.id, value });
          await window.ApiService.saveFormResponse({ visitId, formId, formName: form.name, questionId: q.id, questionNumber: q.number || '', section: q.section || '', questionText: q.title, answerType: q.type, answerValue: value });
          if (q.type === 'photo' && dynamicPhotos[q.id]) {
            await window.ApiService.uploadPhoto({ visitId, photoType: `form_${q.id}`, fileName: `${q.id}_${Date.now()}.jpg`, base64Data: dynamicPhotos[q.id], mimeType: 'image/jpeg', comments: `${q.number || ''} ${q.title}`.trim() });
          }
        }
      }
      route.data = { formIds: getRouteFormIds(route), answers };
    } else {
      // 1. Guardar cada producto capturado (operation_stage: 20)
      const pKeys = [
        { ui: 'coca', id: 'prod-coca' },
        { ui: 'sprite', id: 'prod-sprite' },
        { ui: 'ciel', id: 'prod-ciel' }
      ];
      
      for (const p of pKeys) {
        const stockInput = document.getElementById(`${p.ui}-stock`);
        const priceInput = document.getElementById(`${p.ui}-price`);
        const oosCheck = document.getElementById(`${p.ui}-oos`);
        
        if (stockInput && priceInput && oosCheck) {
          const stock = parseInt(stockInput.value) || 0;
          const price = parseFloat(priceInput.value) || 0;
          const outOfStock = oosCheck.checked;
          
          if (stock > 0 || price > 0 || outOfStock) {
            await window.ApiService.saveVisitProduct({
              visitId: visitId,
              productId: p.id,
              shelfInventory: stock,
              regularPrice: price,
              outOfStock: outOfStock
            });
          }
        }
      }

      // 2. Guardar datos de competencia, si existen (operation_stage: 30)
      const compPrice = parseFloat(document.getElementById('competitor-price').value) || 0;
      const compNotes = document.getElementById('competitor-notes').value || '';
      if (compPrice > 0 || compNotes) {
        await window.ApiService.saveCompetitorPrice({
          visitId: visitId,
          competitorBrand: 'Competencia',
          regularPrice: compPrice,
          comments: compNotes
        });
      }
    }

    // 3. Subir evidencia antes de cerrar la visita (operation_stage: 40)
    if (selectedPhotoBase64) {
      await window.ApiService.uploadPhoto({
        visitId: visitId,
        photoType: 'exhibicion',
        fileName: `foto_${Date.now()}.jpg`,
        base64Data: selectedPhotoBase64,
        mimeType: 'image/jpeg'
      });
    }

    // 4. Ejecutar check-out sobre la misma fila VISITS (operation_stage: 50)
    await window.ApiService.checkOut({
      visitId: visitId,
      latitude: route.checkInCoords ? route.checkInCoords.lat : 0,
      longitude: route.checkInCoords ? route.checkInCoords.lng : 0,
      locationSource: 'device_gps'
    });

    if (window.SyncQueue) {
      await window.SyncQueue.waitForVisitSync(visitId, 50);
    }

    // Update local route state
    route.checkOut = timeStr;
    route.status = 'completado';
    saveDB();
    
    alert(`¡Visita a ${store.name} finalizada con éxito!`);
    
    // Navigate back to routes list
    changeMobileScreen('screen-route-list');
    renderRouteList();
    updateSupervisorDashboard();

  } catch (error) {
    console.error("Error al enviar datos de la visita:", error);
    alert("Hubo un error al guardar la visita. Revisa tu conexión.");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check-square"></i><span>Finalizar Visita y Enviar Datos</span>';
      lucide.createIcons();
    }
  }
}

function displayPhotoPreview(base64) {
  const container = document.getElementById('photo-preview-container');
  const img = document.getElementById('photo-preview-img');
  const dropzone = document.getElementById('photo-dropzone');
  
  img.src = base64;
  container.classList.remove('hidden');
  dropzone.classList.add('hidden');
  document.getElementById('btn-remove-photo').classList.remove('hidden');
}

function runBusinessRules(storeName, data) {
  const alertsTriggered = [];
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // RULE 1: OUT OF STOCK CHECK (Critical alert & Lost Sales estimation)
  const pKeys = ['prod_coca', 'prod_sprite', 'prod_ciel'];
  pKeys.forEach(pk => {
    const pData = data.kpis[pk];
    const originalProd = db.products[pk.replace('_', '-')];
    
    if (pData.oos || pData.stock === 0) {
      // Calculate Lost Sales Opportunity for 1 day
      // 1 day sales = avgDailySales * SRP
      const lostSalesValue = originalProd.avgDailySales * originalProd.srp;
      
      alertsTriggered.push({
        id: `alert-${Date.now()}-${Math.random()}`,
        severity: 'critical', // 'critical', 'warning', 'insight'
        store: storeName,
        time: timestamp,
        title: `Desabasto Total: ${originalProd.name}`,
        desc: `${originalProd.name} se reporta AGOTADO en anaquel. Pérdida estimada del día: $${lostSalesValue.toFixed(2)} MXN.`,
        actionGuide: `Notificar a Backoffice para enviar pedido sugerido de reposición inmediata.`,
        lostSales: lostSalesValue
      });
    } else {
      // RULE 2: UNDERPRICED CHECK (Warning alert)
      if (pData.price < originalProd.minPrice) {
        alertsTriggered.push({
          id: `alert-${Date.now()}-${Math.random()}`,
          severity: 'warning',
          store: storeName,
          time: timestamp,
          title: `Precio Fuera de Rango (Bajo): ${originalProd.name}`,
          desc: `Precio capturado de $${pData.price.toFixed(2)} MXN está por debajo del sugerido mínimo ($${originalProd.minPrice.toFixed(2)} MXN).`,
          actionGuide: `Solicitar al promotor corregir etiqueta de precio en anaquel inmediatamente.`,
          lostSales: 0
        });
      }
      
      // RULE 3: WEEKS OF INVENTORY COVERAGE CHECK (Insight alert)
      // Weeks = stock / (avgDailySales) / 7 days
      const daysOfInventory = pData.stock / originalProd.avgDailySales;
      const weeksOfInventory = daysOfInventory / 7;
      
      if (weeksOfInventory < 1.0) {
        alertsTriggered.push({
          id: `alert-${Date.now()}-${Math.random()}`,
          severity: 'insight',
          store: storeName,
          time: timestamp,
          title: `Inventario Crítico: Cobertura Baja`,
          desc: `${originalProd.name} cuenta con ${pData.stock} unidades (${weeksOfInventory.toFixed(1)} semanas de cobertura). Se agotará en menos de ${Math.round(daysOfInventory)} días.`,
          actionGuide: `Sugerir reordenar producto antes del próximo ciclo de ruta de distribución.`,
          lostSales: 0
        });
      }
    }
  });
  
  // RULE 4: EXHIBITION PHOTO AUDIT CHECK (Critical / Warning alert)
  if (data.exhibition.additional) {
    // If they claimed additional display but did NOT upload a photo
    if (!data.exhibition.photo) {
      alertsTriggered.push({
        id: `alert-${Date.now()}-${Math.random()}`,
        severity: 'critical',
        store: storeName,
        time: timestamp,
        title: `Falta Evidencia Fotográfica`,
        desc: `Se declaró presencia de Exhibición Adicional pero no se adjuntó evidencia fotográfica obligatoria.`,
        actionGuide: `Requerir al promotor subir foto de anaquel o isla del piloto.`,
        lostSales: 0
      });
    }
    
    // If POP compliance is not met
    if (!data.exhibition.pop) {
      alertsTriggered.push({
        id: `alert-${Date.now()}-${Math.random()}`,
        severity: 'warning',
        store: storeName,
        time: timestamp,
        title: `Material POP Faltante / Dañado`,
        desc: `Exhibición adicional detectada pero el material POP de temporada no está colocado correctamente.`,
        actionGuide: `Enviar paquete de material POP de reemplazo con el supervisor.`,
        lostSales: 0
      });
    }
  }
  
  return alertsTriggered;
}

// 6. SUPERVISOR DASHBOARD LOGIC
function updateSupervisorDashboard() {
  calculateAndRenderKPIs();
  renderAlertsList();
  renderVisitsTable();
  renderProductCoverage();
  renderCompetitorStats();
  renderStoreSummaryList();
}

function calculateAndRenderKPIs() {
  const visits = db.visits;
  
  const statInstock = document.getElementById('stat-instock');
  const statLostSales = document.getElementById('stat-lost-sales');
  const statPriceCompliance = document.getElementById('stat-price-compliance');
  const statExhCompliance = document.getElementById('stat-exh-compliance');
  
  if (visits.length === 0) {
    statInstock.textContent = '--%';
    statLostSales.textContent = '$0.00 MXN';
    statPriceCompliance.textContent = '--%';
    statExhCompliance.textContent = '--%';
    return;
  }
  
  // Calculate Metrics
  let totalProductChecks = 0;
  let oosCount = 0;
  let totalLostSales = 0;
  
  let totalPricesChecked = 0;
  let priceCompliantCount = 0;
  
  let totalExhibitionsChecked = 0;
  let exhibitionCompliantCount = 0;
  
  visits.forEach(v => {
    const kpis = v.details.kpis;
    if (!kpis) return;
    
    // Product checks (coca, sprite, ciel)
    Object.keys(kpis).forEach(pk => {
      const prodData = kpis[pk];
      const prodOriginal = db.products[pk.replace('_', '-')];
      totalProductChecks++;
      
      if (prodData.oos || prodData.stock === 0) {
        oosCount++;
        // Estimate Lost Sales
        totalLostSales += prodOriginal.avgDailySales * prodOriginal.srp;
      } else {
        // Price check
        totalPricesChecked++;
        if (prodData.price >= prodOriginal.minPrice && prodData.price <= prodOriginal.maxPrice) {
          priceCompliantCount++;
        }
      }
    });
    
    // Exhibition check
    const exh = v.details.exhibition;
    if (exh) {
      totalExhibitionsChecked++;
      if (exh.additional) {
        // Compliant if pop is active and photo exists
        if (exh.pop && exh.photo) {
          exhibitionCompliantCount++;
        }
      } else {
        // If no additional display, it's considered compliant in basic layout
        exhibitionCompliantCount++;
      }
    }
  });
  
  // Render
  const instockVal = totalProductChecks > 0 ? ((totalProductChecks - oosCount) / totalProductChecks) * 100 : 100;
  statInstock.textContent = `${instockVal.toFixed(0)}%`;
  
  statLostSales.textContent = `$${totalLostSales.toFixed(2)} MXN`;
  
  const priceVal = totalPricesChecked > 0 ? (priceCompliantCount / totalPricesChecked) * 100 : 100;
  statPriceCompliance.textContent = `${priceVal.toFixed(0)}%`;
  
  const exhVal = totalExhibitionsChecked > 0 ? ((exhibitionCompliantCount / totalExhibitionsChecked) * 100) : 100;
  statExhCompliance.textContent = `${exhVal.toFixed(0)}%`;
}

function renderAlertsList() {
  const container = document.getElementById('dashboard-alerts-container');
  const countBadge = document.getElementById('alerts-count');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Filter alerts based on active selection
  const filteredAlerts = db.alerts.filter(alert => {
    if (activeAlertFilter === 'all') return true;
    return alert.severity === activeAlertFilter;
  });
  
  countBadge.textContent = `${filteredAlerts.length} Alertas`;
  
  if (filteredAlerts.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i data-lucide="info" style="width:24px; height:24px; margin-bottom:0.5rem; color:var(--neutral-muted);"></i>
        <p>No se encontraron alertas para este filtro.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  filteredAlerts.forEach(alert => {
    const card = document.createElement('div');
    card.className = `alert-item-card severity-${alert.severity}`;
    
    let iconName = 'alert-triangle';
    if (alert.severity === 'critical') iconName = 'alert-octagon';
    if (alert.severity === 'insight') iconName = 'lightbulb';
    
    card.innerHTML = `
      <div class="alert-icon-box">
        <i data-lucide="${iconName}"></i>
      </div>
      <div class="alert-info-content">
        <div class="alert-meta">
          <span class="alert-store">${alert.store}</span>
          <span class="alert-time">${alert.time}</span>
        </div>
        <h4 class="alert-title">${alert.title}</h4>
        <p class="alert-desc">${alert.desc}</p>
        <div class="alert-action-guide">
          <i data-lucide="arrow-right"></i>
          <span><strong>Acción:</strong> ${alert.actionGuide}</span>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

function initSupervisorEvents() {
  const alertFilters = document.querySelectorAll('[data-alert-filter]');
  
  alertFilters.forEach(btn => {
    btn.addEventListener('click', (e) => {
      alertFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeAlertFilter = btn.getAttribute('data-alert-filter');
      renderAlertsList();
    });
  });
  
  // Close dialog buttons
  const dialog = document.getElementById('visit-detail-dialog');
  const btnClose = document.getElementById('btn-close-visit-modal');
  
  btnClose.addEventListener('click', () => {
    dialog.close();
  });
  
  // Light dismiss fallback
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (e) => {
      if (e.target !== dialog) return;
      
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      
      if (!isInside) dialog.close();
    });
  }

  // Dropdown manual selection logic
  const promoterSelect = document.getElementById('route-promoter-select');
  const storeSelect = document.getElementById('route-store-select');
  const newPromoterGroup = document.getElementById('new-promoter-input-group');
  const newStoreInputs = document.getElementById('new-store-inputs');
  const manualForm = document.getElementById('manual-route-form');
  
  if (promoterSelect && newPromoterGroup) {
    promoterSelect.addEventListener('change', () => {
      if (promoterSelect.value === 'new') {
        newPromoterGroup.classList.remove('hidden');
        const input = document.getElementById('new-promoter-name');
        if (input) input.required = true;
      } else {
        newPromoterGroup.classList.add('hidden');
        const input = document.getElementById('new-promoter-name');
        if (input) input.required = false;
      }
    });
  }
  
  if (storeSelect && newStoreInputs) {
    storeSelect.addEventListener('change', () => {
      const newStoreName = document.getElementById('new-store-name');
      const newStoreAddress = document.getElementById('new-store-address');
      const newStoreLat = document.getElementById('new-store-lat');
      const newStoreLng = document.getElementById('new-store-lng');
      
      if (storeSelect.value === 'new') {
        newStoreInputs.classList.remove('hidden');
        if (newStoreName) newStoreName.required = true;
        if (newStoreAddress) newStoreAddress.required = true;
        if (newStoreLat) newStoreLat.required = true;
        if (newStoreLng) newStoreLng.required = true;
      } else {
        newStoreInputs.classList.add('hidden');
        if (newStoreName) newStoreName.required = false;
        if (newStoreAddress) newStoreAddress.required = false;
        if (newStoreLat) newStoreLat.required = false;
        if (newStoreLng) newStoreLng.required = false;
      }
    });
  }
  
  if (manualForm) {
    manualForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const pSel = document.getElementById('route-promoter-select');
      const sSel = document.getElementById('route-store-select');
      if (!pSel || !sSel) return;
      
      let promoterId = pSel.value;
      if (promoterId === 'new') {
        const newNameInput = document.getElementById('new-promoter-name');
        const newName = newNameInput ? newNameInput.value.trim() : '';
        if (!newName) return;
        promoterId = `promoter-${Date.now()}`;
        const initials = newName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
        db.promoters[promoterId] = {
          id: promoterId,
          name: newName,
          avatar: initials
        };
      }
      
      let storeId = sSel.value;
      if (storeId === 'new') {
        const newNameInput = document.getElementById('new-store-name');
        const newAddrInput = document.getElementById('new-store-address');
        const newLatInput = document.getElementById('new-store-lat');
        const newLngInput = document.getElementById('new-store-lng');
        
        const newName = newNameInput ? newNameInput.value.trim() : '';
        const newAddr = newAddrInput ? newAddrInput.value.trim() : '';
        const newLat = newLatInput ? parseFloat(newLatInput.value) : NaN;
        const newLng = newLngInput ? parseFloat(newLngInput.value) : NaN;
        
        if (!newName || !newAddr) return;
        if (isNaN(newLat) || isNaN(newLng)) {
          alert("Debes proporcionar Latitud y Longitud válidas para crear una nueva tienda.");
          return;
        }
        
        const btnSubmit = manualForm.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.disabled = true;
        
        try {
          const res = await window.ApiService.createStore({
            clientId: window.selectedClientId || 'demo-client',
            storeCode: `TMP-${Date.now()}`, // Temporary code for quick creation
            chain: 'Independiente',
            storeName: newName,
            address: newAddr,
            city: '',
            state: '',
            latitude: newLat,
            longitude: newLng,
            geofenceRadius: 100,
            status: 'active'
          });
          
          if (res && res.success && res.data && res.data.storeId) {
            storeId = res.data.storeId;
            db.stores[storeId] = {
              id: storeId,
              name: newName,
              address: newAddr,
              lat: newLat,
              lng: newLng
            };
          } else {
            alert('Error al crear tienda en la nube: ' + (res?.error?.message || 'Error desconocido'));
            if (btnSubmit) btnSubmit.disabled = false;
            return;
          }
        } catch (err) {
          alert('Error de conexión al crear tienda rápida: ' + err.message);
          if (btnSubmit) btnSubmit.disabled = false;
          return;
        } finally {
          if (btnSubmit) btnSubmit.disabled = false;
        }
      }
      
      const dateInput = document.getElementById('route-date-input');
      const date = dateInput ? dateInput.value : '';
      if (!date) return;
      
      // Check if assignment exists
      const exists = db.routes.some(r => r.promoterId === promoterId && r.storeId === storeId && r.date === date);
      if (exists) {
        alert("Esta tienda ya está asignada a este promotor en esa fecha.");
        return;
      }
      
      const formSelectEl = document.getElementById('route-form-select');
      const selectedFormIds = formSelectEl
        ? Array.from(formSelectEl.selectedOptions)
            .map(o => o.value)
            .filter(v => v !== 'default')
        : [];
      db.routes.push({
        id: `route-${Date.now()}`,
        promoterId: promoterId,
        storeId: storeId,
        date: date,
        status: 'pendiente',
        checkIn: null,
        checkOut: null,
        data: null,
        formIds: selectedFormIds
      });
      
      saveDB();
      
      // Reset form layout
      if (newPromoterGroup) newPromoterGroup.classList.add('hidden');
      if (newStoreInputs) newStoreInputs.classList.add('hidden');
      
      const newPromoterName = document.getElementById('new-promoter-name');
      const newStoreName = document.getElementById('new-store-name');
      const newStoreAddress = document.getElementById('new-store-address');
      const newStoreLat = document.getElementById('new-store-lat');
      const newStoreLng = document.getElementById('new-store-lng');
      
      if (newPromoterName) newPromoterName.required = false;
      if (newStoreName) newStoreName.required = false;
      if (newStoreAddress) newStoreAddress.required = false;
      if (newStoreLat) newStoreLat.required = false;
      if (newStoreLng) newStoreLng.required = false;
      
      manualForm.reset();
      
      populateManualAssignmentDropdowns();
      renderMobilePromoterDropdown();
      renderRoutePlanner();
      renderRouteList();
      updateSupervisorDashboard();
      
      alert("Asignación de ruta manual guardada con éxito.");
    });
  }
}

function renderVisitsTable() {
  const tbody = document.getElementById('visits-table-body');
  const countSpan = document.getElementById('visit-count');
  if (!tbody) return;
  
  const visits = db.visits;
  countSpan.textContent = `${visits.length} visitas hoy`;
  
  if (visits.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">No se han registrado visitas en el piloto de hoy. Completa una en la Vista Promotor.</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = '';
  
  visits.forEach(v => {
    const tr = document.createElement('tr');
    
    let hasPhoto = false;
    if (v.details && v.details.isDynamic && v.details.answers) {
      hasPhoto = Object.values(v.details.answers).some(val => typeof val === 'string' && val.startsWith('data:image'));
    } else if (v.details && v.details.exhibition) {
      hasPhoto = !!v.details.exhibition.photo;
    }
    
    const photoBadge = hasPhoto 
      ? `<span class="visit-badge-photo"><i data-lucide="image"></i> Sí</span>` 
      : `<span class="text-muted">No</span>`;
      
    const pName = v.promoterName || (db.promoters[v.promoterId] ? db.promoters[v.promoterId].name : 'Pedro Gómez');
      
    tr.innerHTML = `
      <td class="visit-store-td">${v.storeName}</td>
      <td>${pName}</td>
      <td>${v.checkIn}</td>
      <td>${v.checkOut}</td>
      <td>
        <span class="text-muted">${v.rulesTriggered.length} alertas</span>
      </td>
      <td>${photoBadge}</td>
      <td>
        <button class="btn-icon" data-visit-id="${v.id}">
          <i data-lucide="eye"></i> Ver Reporte
        </button>
      </td>
      <td>
        <button class="btn-store-history" data-store-id="${v.storeId}">
          <i data-lucide="history"></i> Tienda
        </button>
      </td>
    `;
    
    // Add event click to eye
    const btnReport = tr.querySelector('.btn-icon');
    btnReport.addEventListener('click', () => {
      showVisitModalDetails(v);
    });

    // Histórico button
    const btnHistory = tr.querySelector('.btn-store-history');
    if (btnHistory) {
      btnHistory.addEventListener('click', () => {
        openStoreHistory(v.storeId);
      });
    }
    
    tbody.appendChild(tr);
  });
  
  lucide.createIcons();
}

// Render store summary sidebar panel
function renderStoreSummaryList() {
  const container = document.getElementById('stores-summary-list');
  if (!container) return;

  const stores = Object.values(db.stores);
  container.innerHTML = '';

  stores.forEach(store => {
    const visitCount = db.visits.filter(v => v.storeId === store.id).length;
    const badge = visitCount > 0
      ? `<span class="store-summary-badge">${visitCount} ${visitCount === 1 ? 'visita' : 'visitas'}</span>`
      : `<span class="store-summary-badge zero">Sin visitas</span>`;

    const item = document.createElement('div');
    item.className = 'store-summary-item';
    item.setAttribute('data-store-id', store.id);
    item.innerHTML = `
      <div class="store-summary-icon"><i data-lucide="store"></i></div>
      <div class="store-summary-info">
        <strong>${store.name}</strong>
        <span>${store.address}</span>
      </div>
      ${badge}
    `;
    item.addEventListener('click', () => openStoreHistory(store.id));
    container.appendChild(item);
  });

  lucide.createIcons();
}

// ==========================================================================
// STORE HISTORY MODULE
// ==========================================================================

function openStoreHistory(storeId) {
  const store = db.stores[storeId];
  if (!store) return;

  const dialog = document.getElementById('store-history-dialog');
  if (!dialog) return;

  const storeVisits = db.visits
    .filter(v => v.storeId === storeId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Update header stats
  document.getElementById('sh-dialog-title').textContent = store.name;
  document.getElementById('sh-store-address').textContent = store.address;
  document.getElementById('sh-stat-visits').textContent = storeVisits.length;

  const uniquePromoters = new Set(storeVisits.map(v => v.promoterId || v.promoterName));
  document.getElementById('sh-stat-promoters').textContent = uniquePromoters.size;

  if (storeVisits.length > 0) {
    const lastVisit = storeVisits[0];
    const dateStr = lastVisit.timestamp
      ? new Date(lastVisit.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      : lastVisit.checkIn || '--';
    document.getElementById('sh-stat-last').textContent = dateStr;
  } else {
    document.getElementById('sh-stat-last').textContent = '--';
  }

  // Render body
  renderStoreHistory(store, storeVisits);

  dialog.showModal();
  lucide.createIcons();
}

function renderStoreHistory(store, visits) {
  const body = document.getElementById('store-history-body');
  if (!body) return;

  // ---- Section 1: KPIs Históricos ----
  const kpiHTML = renderStoreHistoryKPIs(visits);

  // ---- Section 2: Timeline de Visitas ----
  let timelineHTML = '';
  if (visits.length === 0) {
    timelineHTML = `
      <div class="sh-empty-state">
        <i data-lucide="calendar-x"></i>
        <p>Esta tienda aún no tiene visitas registradas.</p>
      </div>`;
  } else {
    const rows = visits.map(v => {
      const dateStr = v.timestamp
        ? new Date(v.timestamp).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
        : '--';
      const promoterName = v.promoterName || (db.promoters[v.promoterId] ? db.promoters[v.promoterId].name : 'Promotor');

      const alertsBadge = v.rulesTriggered && v.rulesTriggered.length > 0
        ? `<span class="sh-badge-alerts">${v.rulesTriggered.length} alerta${v.rulesTriggered.length > 1 ? 's' : ''}</span>`
        : `<span style="color:var(--neutral-muted);font-size:0.8rem">—</span>`;

      const formBadge = v.details && v.details.isDynamic
        ? `<span class="sh-badge-form">${v.details.formName || 'Formulario'}</span>`
        : `<span style="color:var(--neutral-muted);font-size:0.8rem">Clásico</span>`;

      return `
        <tr>
          <td>${dateStr}</td>
          <td>${promoterName}</td>
          <td>${v.checkIn || '--'}</td>
          <td>${v.checkOut || '--'}</td>
          <td>${formBadge}</td>
          <td>${alertsBadge}</td>
          <td>
            <button class="sh-btn-see-report" data-visit-id="${v.id}">
              <i data-lucide="eye"></i> Ver
            </button>
          </td>
        </tr>`;
    }).join('');

    timelineHTML = `
      <div class="table-responsive" style="border-radius:10px; overflow:hidden;">
        <table class="sh-timeline-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Promotor</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Tipo</th>
              <th>Alertas</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ---- Section 3: Photos + Promoters ----
  const photosHTML = renderStorePhotoGallery(visits);
  const promotersHTML = renderStorePromoterFrequency(visits);

  body.innerHTML = `
    <!-- KPIs -->
    <div>
      <p class="sh-section-title"><i data-lucide="bar-chart-2"></i> KPIs Históricos de la Tienda</p>
      ${kpiHTML}
    </div>

    <!-- Timeline -->
    <div>
      <p class="sh-section-title"><i data-lucide="clock"></i> Línea de Tiempo de Visitas (${visits.length})</p>
      ${timelineHTML}
    </div>

    <!-- Photos + Promoters -->
    <div class="sh-two-col">
      <div>
        <p class="sh-section-title"><i data-lucide="image"></i> Galería de Fotos</p>
        ${photosHTML}
      </div>
      <div>
        <p class="sh-section-title"><i data-lucide="users"></i> Promotores Frecuentes</p>
        ${promotersHTML}
      </div>
    </div>
  `;

  // Bind report buttons inside history
  body.querySelectorAll('.sh-btn-see-report').forEach(btn => {
    const visitId = btn.getAttribute('data-visit-id');
    btn.addEventListener('click', () => {
      const visit = db.visits.find(v => v.id === visitId);
      if (visit) showVisitModalDetails(visit);
    });
  });

  lucide.createIcons();
}

function renderStoreHistoryKPIs(visits) {
  const classicVisits = visits.filter(v => v.details && v.details.kpis);

  if (classicVisits.length === 0) {
    const dynCount = visits.filter(v => v.details && v.details.isDynamic).length;
    if (dynCount > 0) {
      return `
        <div class="store-kpi-pills">
          <div class="store-kpi-pill">
            <div class="kpi-pill-icon" style="background:var(--indigo-light);color:var(--indigo);"><i data-lucide="clipboard-list"></i></div>
            <div class="kpi-pill-info">
              <span class="kpi-pill-value">${dynCount}</span>
              <span class="kpi-pill-label">Formularios completados</span>
            </div>
          </div>
          <div class="store-kpi-pill">
            <div class="kpi-pill-icon" style="background:var(--emerald-light);color:var(--emerald);"><i data-lucide="check-circle"></i></div>
            <div class="kpi-pill-info">
              <span class="kpi-pill-value">${visits.length}</span>
              <span class="kpi-pill-label">Total de visitas</span>
            </div>
          </div>
        </div>`;
    }
    return `<div class="sh-empty-state"><i data-lucide="bar-chart-2"></i><p>Sin datos KPI para esta tienda todavía.</p></div>`;
  }

  // Compute averages from classic visits
  let totalChecks = 0, oosCount = 0;
  let pricesMap = {};
  let popCompliant = 0;

  classicVisits.forEach(v => {
    Object.keys(v.details.kpis).forEach(pk => {
      const d = v.details.kpis[pk];
      totalChecks++;
      if (d.oos || d.stock === 0) oosCount++;
      if (!pricesMap[pk]) pricesMap[pk] = [];
      if (d.price > 0) pricesMap[pk].push(d.price);
    });
    if (v.details.exhibition && v.details.exhibition.pop) popCompliant++;
  });

  const instockPct = totalChecks > 0 ? Math.round(((totalChecks - oosCount) / totalChecks) * 100) : 100;
  const popPct = classicVisits.length > 0 ? Math.round((popCompliant / classicVisits.length) * 100) : 0;

  const avgCoca = pricesMap['prod_coca'] && pricesMap['prod_coca'].length
    ? (pricesMap['prod_coca'].reduce((a,b) => a+b, 0) / pricesMap['prod_coca'].length).toFixed(2) : '--';

  return `
    <div class="store-kpi-pills">
      <div class="store-kpi-pill">
        <div class="kpi-pill-icon" style="background:var(--emerald-light);color:var(--emerald);"><i data-lucide="package-check"></i></div>
        <div class="kpi-pill-info">
          <span class="kpi-pill-value">${instockPct}%</span>
          <span class="kpi-pill-label">Disponibilidad histórica</span>
        </div>
      </div>
      <div class="store-kpi-pill">
        <div class="kpi-pill-icon" style="background:var(--primary-light);color:var(--primary);"><i data-lucide="dollar-sign"></i></div>
        <div class="kpi-pill-info">
          <span class="kpi-pill-value">${avgCoca !== '--' ? '$' + avgCoca : '--'}</span>
          <span class="kpi-pill-label">Precio prom. Coca-Cola</span>
        </div>
      </div>
      <div class="store-kpi-pill">
        <div class="kpi-pill-icon" style="background:var(--purple-light);color:var(--purple);"><i data-lucide="image"></i></div>
        <div class="kpi-pill-info">
          <span class="kpi-pill-value">${popPct}%</span>
          <span class="kpi-pill-label">Cumplimiento POP</span>
        </div>
      </div>
      <div class="store-kpi-pill">
        <div class="kpi-pill-icon" style="background:var(--warning-light);color:hsl(var(--warning-h),80%,38%);"><i data-lucide="calendar"></i></div>
        <div class="kpi-pill-info">
          <span class="kpi-pill-value">${classicVisits.length}</span>
          <span class="kpi-pill-label">Visitas clásicas</span>
        </div>
      </div>
    </div>`;
}

function renderStorePhotoGallery(visits) {
  const photos = [];

  visits.forEach(v => {
    // Dynamic forms
    if (v.details && v.details.isDynamic && v.details.answers) {
      v.details.answers.forEach(ans => {
        if (ans.value && typeof ans.value === 'string' && ans.value.startsWith('data:image')) {
          photos.push({ src: ans.value, caption: ans.title || 'Foto' });
        }
      });
    }
    // Classic forms
    if (v.details && v.details.exhibition && v.details.exhibition.photo) {
      photos.push({ src: v.details.exhibition.photo, caption: 'Exhibición' });
    }
  });

  if (photos.length === 0) {
    return `<div class="sh-empty-state"><i data-lucide="image-off"></i><p>No hay fotos registradas para esta tienda.</p></div>`;
  }

  const items = photos.map(p => `
    <div class="store-photo-item">
      <img src="${p.src}" alt="${p.caption}" loading="lazy">
      <div class="store-photo-caption">${p.caption}</div>
    </div>`).join('');

  return `<div class="store-photo-grid">${items}</div>`;
}

function renderStorePromoterFrequency(visits) {
  if (visits.length === 0) {
    return `<div class="sh-empty-state"><i data-lucide="users"></i><p>Sin datos de promotores todavía.</p></div>`;
  }

  // Tally visits per promoter
  const tally = {};
  visits.forEach(v => {
    const key = v.promoterId || 'unknown';
    const name = v.promoterName || (db.promoters[key] ? db.promoters[key].name : 'Promotor');
    const avatar = db.promoters[key] ? db.promoters[key].avatar : name.substring(0, 2).toUpperCase();
    if (!tally[key]) tally[key] = { name, avatar, count: 0 };
    tally[key].count++;
  });

  const sorted = Object.values(tally).sort((a, b) => b.count - a.count);
  const maxCount = sorted[0].count;

  const items = sorted.map(p => `
    <div class="promoter-freq-item">
      <div class="promoter-freq-avatar">${p.avatar}</div>
      <div class="promoter-freq-name">${p.name}</div>
      <div class="promoter-freq-bar-wrap">
        <div class="promoter-freq-bar" style="width:${Math.round((p.count / maxCount) * 100)}%"></div>
      </div>
      <div class="promoter-freq-count">${p.count}</div>
    </div>`).join('');

  return `<div class="promoter-freq-list">${items}</div>`;
}

function initStoreHistoryDialog() {
  const dialog = document.getElementById('store-history-dialog');
  const btnClose = document.getElementById('btn-close-store-history');
  if (!dialog) return;

  btnClose.addEventListener('click', () => dialog.close());

  // Light dismiss on backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInside = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInside) dialog.close();
  });
}

function showVisitModalDetails(visit) {
  const dialog = document.getElementById('visit-detail-dialog');
  const body = document.getElementById('visit-modal-body');
  if (!dialog || !body) return;
  
  const details = visit.details;
  const pName = visit.promoterName || (db.promoters[visit.promoterId] ? db.promoters[visit.promoterId].name : 'Pedro Gómez');
  
  let rulesHTML = '';
  if (visit.rulesTriggered.length === 0) {
    rulesHTML = '<p class="text-success text-center">✓ Cumplimiento completo de políticas comerciales. No se dispararon alertas.</p>';
  } else {
    rulesHTML = '<div class="rules-triggered-list">';
    visit.rulesTriggered.forEach(rule => {
      let cssClass = 'ins';
      let icon = 'info';
      if (rule.severity === 'critical') { cssClass = 'crit'; icon = 'alert-octagon'; }
      if (rule.severity === 'warning') { cssClass = 'warn'; icon = 'alert-triangle'; }
      
      rulesHTML += `
        <div class="rule-triggered-item ${cssClass}">
          <i data-lucide="${icon}"></i>
          <div>
            <strong>${rule.title}</strong>: ${rule.desc}
          </div>
        </div>
      `;
    });
    rulesHTML += '</div>';
  }
  
  const gpsCoordsStr = visit.checkInCoords 
    ? `${visit.checkInCoords.lat.toFixed(5)}, ${visit.checkInCoords.lng.toFixed(5)}` 
    : '19.4326, -99.1332';
    
  if (details.isDynamic) {
    let answersHTML = '<div class="dynamic-answers-list" style="display: flex; flex-direction: column; gap: 16px;">';
    const answers = details.answers || [];
    
    answers.forEach(ans => {
      if (ans.visible === false) return;
      
      let answerRender = '';
      if (ans.type === 'yes_no') {
        const isYes = ans.value === 'SI' || ans.value === 'Sí' || ans.value === 'yes';
        const badgeColor = isYes ? 'var(--success-primary)' : 'var(--danger-primary)';
        const badgeBg = isYes ? 'var(--success-muted)' : 'var(--danger-muted)';
        const badgeText = isYes ? 'SÍ' : 'NO';
        answerRender = `<span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">${badgeText}</span>`;
      } else if (ans.type === 'photo') {
        if (ans.value) {
          answerRender = `<div style="margin-top: 8px;"><img class="modal-photo-img" src="${ans.value}" alt="${ans.title}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 1px solid var(--neutral-border);"></div>`;
        } else {
          answerRender = `<span class="text-muted" style="font-style: italic;">No se adjuntó fotografía</span>`;
        }
      } else if (ans.type === 'barcode') {
        if (ans.value) {
          answerRender = `
            <div style="display: inline-flex; align-items: center; gap: 8px; background: #eef2ff; border: 1px solid #c7d2fe; color: #4f46e5; padding: 6px 12px; border-radius: 6px; font-family: monospace; font-size: 1.1rem; font-weight: bold;">
              <i data-lucide="scan" style="width: 16px; height: 16px;"></i>
              <span>${ans.value}</span>
            </div>
          `;
        } else {
          answerRender = `<span class="text-muted" style="font-style: italic;">No escaneado</span>`;
        }
      } else if (ans.type === 'multiple') {
        answerRender = ans.value ? `<span class="badge" style="background: var(--neutral-muted); color: var(--neutral-dark); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--neutral-border);">${ans.value}</span>` : `<span class="text-muted" style="font-style: italic;">Sin selección</span>`;
      } else if (ans.type === 'numeric') {
        answerRender = ans.value !== '' ? `<strong style="font-size: 1.1rem; color: var(--neutral-dark);">${ans.value}</strong>` : `<span class="text-muted" style="font-style: italic;">Sin valor</span>`;
      } else {
        answerRender = ans.value ? `<span style="color: var(--neutral-dark);">${ans.value}</span>` : `<span class="text-muted" style="font-style: italic;">Sin respuesta</span>`;
      }
      
      answersHTML += `
        <div class="dynamic-answer-item card" style="padding: 16px; border: 1px solid var(--neutral-border); border-radius: 8px; background: var(--neutral-light);">
          <div style="font-weight: 600; margin-bottom: 8px; color: var(--neutral-dark); font-size: 0.95rem;">${ans.title}</div>
          <div>${answerRender}</div>
        </div>
      `;
    });
    answersHTML += '</div>';
    
    body.innerHTML = `
      <div class="modal-store-title">
        <h3>${visit.storeName}</h3>
        <p>Reportado por ${pName} (Promotor Piloto) - Formulario: <strong>${details.formName}</strong></p>
      </div>
      
      <div class="modal-visit-section">
        <h4>Asistencia y Tiempos</h4>
        <div class="modal-grid-stats">
          <p>Entrada (Check-In): <strong>${visit.checkIn}</strong></p>
          <p>Salida (Check-Out): <strong>${visit.checkOut}</strong></p>
          <p>GPS Validado: <strong>${gpsCoordsStr}</strong></p>
        </div>
      </div>
      
      <div class="modal-visit-section">
        <h4>Respuestas del Formulario Dinámico</h4>
        ${answersHTML}
      </div>
      
      <div class="modal-visit-section">
        <h4>Reglas de Negocio Disparadas</h4>
        ${rulesHTML}
      </div>
    `;
    
    dialog.showModal();
    lucide.createIcons();
    return;
  }
  
  // Construct Modal HTML (Classic)
  let productsRows = '';
  const pKeys = ['prod_coca', 'prod_sprite', 'prod_ciel'];
  pKeys.forEach(pk => {
    const original = db.products[pk.replace('_', '-')];
    const capt = details.kpis[pk];
    const statusText = capt.oos ? '<span class="text-danger">AGOTADO</span>' : 'Disponible';
    
    productsRows += `
      <tr>
        <td><strong>${original.name}</strong></td>
        <td>${capt.stock} pzs</td>
        <td>$${capt.price.toFixed(2)} MXN</td>
        <td>${statusText}</td>
      </tr>
    `;
  });
  
  body.innerHTML = `
    <div class="modal-store-title">
      <h3>${visit.storeName}</h3>
      <p>Reportado por ${pName} (Promotor Piloto)</p>
    </div>
    
    <div class="modal-visit-section">
      <h4>Asistencia y Tiempos</h4>
      <div class="modal-grid-stats">
        <p>Entrada (Check-In): <strong>${visit.checkIn}</strong></p>
        <p>Salida (Check-Out): <strong>${visit.checkOut}</strong></p>
        <p>GPS Validado: <strong>${gpsCoordsStr}</strong></p>
      </div>
    </div>
    
    <div class="modal-visit-section">
      <h4>Métricas de Inventario y Precios</h4>
      <table class="modal-table-data">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${productsRows}
        </tbody>
      </table>
    </div>
    
    <div class="modal-visit-section">
      <h4>Evidencia Fotográfica de Exhibición</h4>
      ${details.exhibition.photo 
        ? `<img class="modal-photo-img" src="${details.exhibition.photo}" alt="Evidencia de tienda">`
        : `<p class="text-muted text-center py-4">No se adjuntó evidencia fotográfica en esta visita.</p>`
      }
      <div class="modal-grid-stats" style="margin-top: 1rem;">
        <p>Exhibición Adicional: <strong>${details.exhibition.additional ? 'SÍ' : 'NO'}</strong></p>
        <p>POP Cumplido: <strong>${details.exhibition.pop ? 'SÍ' : 'NO'}</strong></p>
      </div>
    </div>
 
    <div class="modal-visit-section">
      <h4>Iniciativas Competidor y Comentarios</h4>
      <p>Precio Pepsi 600ml: <strong>$${details.competitor.price.toFixed(2)} MXN</strong></p>
      <p style="margin-top: 0.5rem;"><strong>Comentarios de Campo:</strong></p>
      <p class="text-muted">${details.competitor.notes || 'Sin comentarios.'}</p>
    </div>
    
    <div class="modal-visit-section">
      <h4>Reglas de Negocio Disparadas</h4>
      ${rulesHTML}
    </div>
  `;
  
  dialog.showModal();
  lucide.createIcons();
}

function renderProductCoverage() {
  const container = document.getElementById('product-coverage-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Aggregate stock for each product across all visits
  const pKeys = ['prod_coca', 'prod_sprite', 'prod_ciel'];
  
  pKeys.forEach(pk => {
    const original = db.products[pk.replace('_', '-')];
    let totalStock = 0;
    let visitsCount = 0;
    
    db.visits.forEach(v => {
      if (v.details.kpis && v.details.kpis[pk]) {
        totalStock += v.details.kpis[pk].stock;
        visitsCount++;
      }
    });
    
    // Default to a simulation if no visits are registered yet to show a placeholder
    const displayStock = visitsCount > 0 ? totalStock : 0;
    const daysOfInventory = displayStock / original.avgDailySales;
    const weeksOfInventory = displayStock > 0 ? (daysOfInventory / 7) : 0;
    
    // Coverage color rules
    let colorClass = 'bg-danger';
    let labelClass = 'alert-weeks';
    if (weeksOfInventory >= 1.0 && weeksOfInventory < 2.0) {
      colorClass = 'bg-warning';
      labelClass = 'warning-weeks';
    } else if (weeksOfInventory >= 2.0) {
      colorClass = 'bg-success';
      labelClass = 'good-weeks';
    }
    
    // Calculate progress percentage for chart (cap at 4 weeks / 100%)
    const pct = Math.min((weeksOfInventory / 4.0) * 100, 100);
    
    const row = document.createElement('div');
    row.className = 'inventory-status-row';
    
    row.innerHTML = `
      <div class="inv-meta">
        <span class="inv-name">${original.name}</span>
        <span class="inv-stats">${displayStock} unidades en canal</span>
        <span class="inv-weeks ${labelClass}">${visitsCount > 0 ? weeksOfInventory.toFixed(1) : '--'} sem</span>
      </div>
      <div class="progress-track-inv">
        <div class="progress-fill-inv ${colorClass}" style="width: ${pct}%"></div>
      </div>
    `;
    
    container.appendChild(row);
  });
}

function renderCompetitorStats() {
  const avgCocaEl = document.getElementById('avg-price-coca');
  const avgPepsiEl = document.getElementById('avg-price-pepsi');
  const priceGapEl = document.getElementById('price-gap-container');
  
  let cocaPriceSum = 0;
  let cocaPriceCount = 0;
  
  let pepsiPriceSum = 0;
  let pepsiPriceCount = 0;
  
  db.visits.forEach(v => {
    const cocaData = v.details.kpis ? v.details.kpis.prod_coca : null;
    const pepsiPrice = v.details.competitor ? v.details.competitor.price : 0;
    
    if (cocaData && !cocaData.oos && cocaData.price > 0) {
      cocaPriceSum += cocaData.price;
      cocaPriceCount++;
    }
    
    if (pepsiPrice > 0) {
      pepsiPriceSum += pepsiPrice;
      pepsiPriceCount++;
    }
  });
  
  const avgCoca = cocaPriceCount > 0 ? (cocaPriceSum / cocaPriceCount) : 0;
  const avgPepsi = pepsiPriceCount > 0 ? (pepsiPriceSum / pepsiPriceCount) : 0;
  
  avgCocaEl.textContent = avgCoca > 0 ? `$${avgCoca.toFixed(2)} MXN` : '$0.00 MXN';
  avgPepsiEl.textContent = avgPepsi > 0 ? `$${avgPepsi.toFixed(2)} MXN` : '$0.00 MXN';
  
  if (avgCoca > 0 && avgPepsi > 0) {
    const gap = ((avgPepsi - avgCoca) / avgCoca) * 100;
    
    if (gap > 0) {
      priceGapEl.className = 'price-gap-badge positive';
      priceGapEl.textContent = `Brecha de precio: +${gap.toFixed(1)}% (Pepsi es más caro)`;
    } else {
      priceGapEl.className = 'price-gap-badge negative';
      priceGapEl.textContent = `Brecha de precio: ${gap.toFixed(1)}% (Pepsi es más barato)`;
    }
  } else {
    priceGapEl.className = 'price-gap-badge';
    priceGapEl.textContent = 'Brecha de precio: --%';
  }
}

// 7. ROUTE PLANNER LOGIC (Supervisor View)
function renderRoutePlanner() {
  const dateFilter = document.getElementById('planner-date-filter').value;
  const container = document.getElementById('active-routes-monitor-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Group routes by promoter for this date
  const routesForDate = db.routes.filter(r => r.date === dateFilter);
  
  if (routesForDate.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <i data-lucide="route" class="empty-state-icon"></i>
        <h3>No hay rutas programadas</h3>
        <p>No se han asignado visitas para el día <strong>${formatDateString(dateFilter)}</strong>. Usa el cargador masivo o la asignación manual para programar.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  const promoterIds = Object.keys(db.promoters);
  
  promoterIds.forEach(pId => {
    const promoter = db.promoters[pId];
    const promoterRoutes = routesForDate.filter(r => r.promoterId === pId);
    
    if (promoterRoutes.length === 0) return;
    
    const completedCount = promoterRoutes.filter(r => r.status === 'completado').length;
    
    const groupCard = document.createElement('div');
    groupCard.className = 'promoter-route-group';
    
    let storesListHTML = '';
    promoterRoutes.forEach(route => {
      const store = db.stores[route.storeId];
      if (!store) return;
      
      let statusClass = 'pending';
      let statusText = 'Pendiente';
      let statusIcon = 'clock';
      
      if (route.status === 'en_visita') {
        statusClass = 'in-progress';
        statusText = 'En visita';
        statusIcon = 'play';
      } else if (route.status === 'completado') {
        statusClass = 'completed';
        statusText = 'Completado';
        statusIcon = 'check';
      }
      
      const plannerFormBadgeHTML = getRouteFormIds(route).map(fId => db.forms[fId]
        ? `<span class="badge-form-planner" style="font-size: 0.7rem; background: rgba(79, 70, 229, 0.1); color: #4f46e5; padding: 2px 6px; border-radius: 4px; margin-left: 4px; font-weight: 500; display: inline-block; vertical-align: middle;">${db.forms[fId].name}</span>`
        : '').join('');

      storesListHTML += `
        <div class="route-store-item">
          <div class="route-store-details">
            <span class="route-store-name">${store.name} ${plannerFormBadgeHTML}</span>
            <span class="route-store-address"><i data-lucide="map-pin"></i> ${store.address}</span>
          </div>
          <div class="route-store-status">
            <span class="status-indicator-pill ${statusClass}">
              <i data-lucide="${statusIcon}"></i> ${statusText}
            </span>
            <button type="button" class="btn-delete-route" title="Eliminar asignación" data-route-id="${route.id}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    groupCard.innerHTML = `
      <div class="route-group-header">
        <div class="promoter-info">
          <div class="avatar-mini">${promoter.avatar || promoter.name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2)}</div>
          <h3>${promoter.name}</h3>
        </div>
        <span class="route-stats">${completedCount} / ${promoterRoutes.length} completadas</span>
      </div>
      <div class="route-stores-list">
        ${storesListHTML}
      </div>
    `;
    
    // Bind delete route buttons
    groupCard.querySelectorAll('.btn-delete-route').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const routeId = btn.getAttribute('data-route-id');
        if (confirm("¿Estás seguro de eliminar esta asignación de ruta?")) {
          deleteRouteAssignment(routeId);
        }
      });
    });
    
    container.appendChild(groupCard);
  });
  
  lucide.createIcons();
}

function formatDateString(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function deleteRouteAssignment(routeId) {
  db.routes = db.routes.filter(r => r.id !== routeId);
  saveDB();
  renderRoutePlanner();
  renderRouteList();
  updateSupervisorDashboard();
}

function populateManualAssignmentDropdowns() {
  const promoterSelect = document.getElementById('route-promoter-select');
  const storeSelect = document.getElementById('route-store-select');
  const formSelect = document.getElementById('route-form-select');
  if (!promoterSelect || !storeSelect) return;
  
  // Populate promoters
  promoterSelect.innerHTML = '<option value="" disabled selected>-- Selecciona Promotor --</option>';
  Object.keys(db.promoters).forEach(pId => {
    const promoter = db.promoters[pId];
    promoterSelect.innerHTML += `<option value="${promoter.id}">${promoter.name}</option>`;
  });
  promoterSelect.innerHTML += '<option value="new">+ Agregar Nuevo Promotor...</option>';
  
  // Populate stores
  storeSelect.innerHTML = '<option value="" disabled selected>-- Selecciona Tienda --</option>';
  Object.keys(db.stores).forEach(sId => {
    const store = db.stores[sId];
    storeSelect.innerHTML += `<option value="${store.id}">${store.name}</option>`;
  });
  storeSelect.innerHTML += '<option value="new">+ Agregar Nueva Tienda...</option>';

  // Populate forms
  if (formSelect) {
    formSelect.innerHTML = '<option value="default">Reporte Clásico (KPIs e Inventario)</option>';
    Object.keys(db.forms || {}).forEach(fId => {
      const form = db.forms[fId];
      formSelect.innerHTML += `<option value="${form.id}">${form.name}</option>`;
    });
  }
}

// 8. FILE IMPORT AND TEXT COPY-PASTE PROCESSING
function initRouteUploader() {
  const fileZone = document.getElementById('routes-file-zone');
  const fileInput = document.getElementById('routes-file-input');
  
  if (fileZone && fileInput) {
    fileZone.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileZone.classList.add('dragover');
    });
    
    fileZone.addEventListener('dragleave', () => {
      fileZone.classList.remove('dragover');
    });
    
    fileZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) {
        processUploadedFile(file);
      }
    });
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processUploadedFile(file);
      }
    });
  }
  
  const processBtn = document.getElementById('btn-process-routes');
  if (processBtn) {
    processBtn.addEventListener('click', () => {
      const pasteText = document.getElementById('routes-copy-paste').value.trim();
      if (pasteText) {
        processPasteData(pasteText);
      } else {
        alert("Por favor arrastra un archivo Excel/CSV o pega filas de datos.");
      }
    });
  }
  
  const confirmBtn = document.getElementById('btn-confirm-import');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      confirmImportedRoutes();
    });
  }
  
  const showExampleBtn = document.getElementById('btn-show-example');
  const exampleDataBox = document.getElementById('routes-example-data');
  if (showExampleBtn && exampleDataBox) {
    showExampleBtn.addEventListener('click', () => {
      exampleDataBox.classList.toggle('hidden');
    });
  }
}

function processUploadedFile(file) {
  const reader = new FileReader();
  
  if (file.name.endsWith('.csv')) {
    reader.onload = (e) => {
      const text = e.target.result;
      processPasteData(text);
    };
    reader.readAsText(file);
  } else {
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to row array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        parseArrayOfArrays(jsonData);
      } catch (err) {
        console.error(err);
        alert("Error al leer el archivo Excel. Asegúrate de subir un archivo XLSX o XLS válido.");
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function processPasteData(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  
  lines.forEach(line => {
    if (!line.trim()) return;
    
    // Split by tab (standard Excel copy-paste format)
    let cells = line.split('\t');
    
    // Fallback to comma if tab separator was not present
    if (cells.length <= 1) {
      cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    }
    
    cells = cells.map(cell => cell.replace(/^["']|["']$/g, '').trim());
    rows.push(cells);
  });
  
  parseArrayOfArrays(rows);
}

function parseArrayOfArrays(rows) {
  if (rows.length === 0) {
    alert("No se encontraron datos en las filas.");
    return;
  }
  
  let startIndex = 0;
  
  // Detect header row (skip if matching names)
  const firstRowStr = rows[0].join(' ').toLowerCase();
  if (firstRowStr.includes('promotor') || firstRowStr.includes('tienda') || firstRowStr.includes('direc') || firstRowStr.includes('fecha')) {
    startIndex = 1;
  }
  
  pendingImportRoutes = [];
  const previewBody = document.getElementById('import-preview-body');
  if (!previewBody) return;
  previewBody.innerHTML = '';
  
  let skippedRowsCount = 0;
  
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;
    
    const promoterName = row[0] !== undefined && row[0] !== null ? String(row[0]).trim() : '';
    const storeName = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : '';
    const storeAddress = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : '';
    let dateStr = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : '';
    
    const latVal = row[4] !== undefined && row[4] !== null ? parseFloat(String(row[4]).trim()) : NaN;
    const lngVal = row[5] !== undefined && row[5] !== null ? parseFloat(String(row[5]).trim()) : NaN;
    
    if (!promoterName || !storeName) continue;
    
    // GPS coordinates are mandatory
    if (isNaN(latVal) || isNaN(lngVal)) {
      skippedRowsCount++;
      continue;
    }
    
    // Handle SheetJS Excel date serialization
    if (!isNaN(dateStr) && dateStr !== '') {
      const serial = parseFloat(dateStr);
      const utcDays = Math.floor(serial - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      
      const yyyy = dateInfo.getFullYear();
      const mm = String(dateInfo.getMonth() + 1).padStart(2, '0');
      const dd = String(dateInfo.getDate() + 1).padStart(2, '0');
      dateStr = `${yyyy}-${mm}-${dd}`;
    } else {
      dateStr = cleanDateString(dateStr);
    }
    
    // Fallback date
    if (!dateStr || dateStr === 'Invalid Date') {
      dateStr = selectedDate;
    }
    
    pendingImportRoutes.push({
      promoterName,
      storeName,
      storeAddress: storeAddress || 'Dirección de importación',
      date: dateStr,
      lat: latVal,
      lng: lngVal
    });
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${promoterName}</strong></td>
      <td>${storeName}</td>
      <td>${storeAddress || '<span class="text-muted">N/A</span>'}</td>
      <td>${dateStr}</td>
      <td><code>${latVal.toFixed(5)}</code></td>
      <td><code>${lngVal.toFixed(5)}</code></td>
    `;
    previewBody.appendChild(tr);
  }
  
  if (pendingImportRoutes.length === 0) {
    if (skippedRowsCount > 0) {
      alert(`No se importó ninguna fila. Se omitieron ${skippedRowsCount} filas por no tener coordenadas de Latitud/Longitud válidas.`);
    } else {
      alert("No se pudieron procesar filas de ruta válidas. Revisa el formato.");
    }
    return;
  }
  
  if (skippedRowsCount > 0) {
    alert(`Aviso: Se omitieron ${skippedRowsCount} filas de la importación por carecer de coordenadas Latitud y Longitud obligatorias.`);
  }
  
  // Show preview container
  document.getElementById('import-preview-container').classList.remove('hidden');
}

function cleanDateString(dateStr) {
  dateStr = dateStr.trim();
  if (!dateStr) return '';
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // DD/MM/YYYY
  const partsDMY = dateStr.split('/');
  if (partsDMY.length === 3) {
    const d = partsDMY[0].padStart(2, '0');
    const m = partsDMY[1].padStart(2, '0');
    const y = partsDMY[2];
    const fullY = y.length === 2 ? `20${y}` : y;
    return `${fullY}-${m}-${d}`;
  }
  
  // DD-MM-YYYY
  const partsDMYDash = dateStr.split('-');
  if (partsDMYDash.length === 3 && partsDMYDash[2].length === 4) {
    const d = partsDMYDash[0].padStart(2, '0');
    const m = partsDMYDash[1].padStart(2, '0');
    const y = partsDMYDash[2];
    return `${y}-${m}-${d}`;
  }
  
  return dateStr;
}

function confirmImportedRoutes() {
  if (pendingImportRoutes.length === 0) return;
  
  let addedCount = 0;
  let skippedCount = 0;
  
  pendingImportRoutes.forEach(imp => {
    // 1. Resolve promoter
    let promoterId = null;
    const existingPromoter = Object.values(db.promoters).find(p => p.name.toLowerCase() === imp.promoterName.toLowerCase());
    if (existingPromoter) {
      promoterId = existingPromoter.id;
    } else {
      promoterId = `promoter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const initials = imp.promoterName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
      db.promoters[promoterId] = {
        id: promoterId,
        name: imp.promoterName,
        avatar: initials
      };
    }
    
    // 2. Resolve store
    let storeId = null;
    const existingStore = Object.values(db.stores).find(s => s.name.toLowerCase() === imp.storeName.toLowerCase());
    if (existingStore) {
      storeId = existingStore.id;
      if (imp.lat !== undefined && imp.lng !== undefined) {
        existingStore.lat = imp.lat;
        existingStore.lng = imp.lng;
      }
    } else {
      storeId = `store-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      db.stores[storeId] = {
        id: storeId,
        name: imp.storeName,
        address: imp.storeAddress,
        lat: imp.lat,
        lng: imp.lng
      };
    }
    
    // 3. Register route assignment if it doesn't exist
    const exists = db.routes.some(r => r.promoterId === promoterId && r.storeId === storeId && r.date === imp.date);
    if (!exists) {
      db.routes.push({
        id: `route-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        promoterId: promoterId,
        storeId: storeId,
        date: imp.date,
        status: 'pendiente',
        checkIn: null,
        checkOut: null,
        data: null,
        formIds: []
      });
      addedCount++;
    } else {
      skippedCount++;
    }
  });
  
  saveDB();
  
  alert(`Carga finalizada. Se agregaron ${addedCount} asignaciones de ruta. (${skippedCount} duplicados ignorados).`);
  
  pendingImportRoutes = [];
  document.getElementById('import-preview-container').classList.add('hidden');
  document.getElementById('routes-copy-paste').value = '';
  document.getElementById('routes-file-input').value = '';
  
  populateManualAssignmentDropdowns();
  renderMobilePromoterDropdown();
  renderRoutePlanner();
  renderRouteList();
  updateSupervisorDashboard();
  renderCentralConsole();
}

/* ==========================================================================
   AUTHENTICATION, CENTRAL CONSOLE & GPS GEOFENCING UTILITIES
   ========================================================================== */

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in meters
}

function getSimulatedCoords(store) {
  if (!store) return { lat: 19.5089, lng: -99.2425 };
  if (gpsSimulationMode === 'in-range') {
    // Return coordinates very close to the store (e.g., within 5 meters)
    return {
      lat: store.lat + 0.00002,
      lng: store.lng + 0.00002
    };
  } else {
    // Return coordinates far from the store (~800 meters away)
    return {
      lat: store.lat + 0.005,
      lng: store.lng + 0.005
    };
  }
}

function updateGPSSimulatorDisplay(store) {
  if (!store) return;
  const coords = getSimulatedCoords(store);
  const distance = calculateDistance(coords.lat, coords.lng, store.lat, store.lng);
  const maxRange = db.config.checkInRangeMeters;
  
  const displayEl = document.getElementById('simulated-gps-coords');
  if (displayEl) {
    const isOk = distance <= maxRange;
    const color = isOk ? '#10b981' : '#ef4444';
    const statusText = isOk ? 'En Rango' : 'FUERA DE RANGO';
    
    displayEl.innerHTML = `
      ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} 
      <span style="color: ${color}; font-weight: bold; margin-left: 8px;">
        (${statusText} - ${Math.round(distance)}m / Máx: ${maxRange}m)
      </span>
    `;
  }
}

async function checkAuth() {
  const roleSelector = document.querySelector('.role-selector-container');
  const sessionIndicator = document.getElementById('user-session-indicator');
  const btnLogout = document.getElementById('btn-logout');
  
  let validationResult = { success: false };
  try {
    validationResult = await window.ApiService.validateSession();
  } catch(e) {
    console.error("Error validating session", e);
  }
  
  if (!validationResult.success) {
    // Hide headers session info
    if (roleSelector) roleSelector.classList.add('hidden');
    if (sessionIndicator) sessionIndicator.classList.add('hidden');
    if (btnLogout) btnLogout.classList.add('hidden');
    
    // Redirect to login screen
    setActiveView('login');
    return;
  }
  
  const user = validationResult.data.user;
  
  // Cargar formularios reales para todos (Administradores y Promotores)
  await loadFormsFromBackend();
  
  // Show header session info
  if (roleSelector) roleSelector.classList.remove('hidden');
  if (sessionIndicator) {
    sessionIndicator.classList.remove('hidden');
    document.getElementById('user-session-name').textContent = user.name || user.username;
  }
  if (btnLogout) btnLogout.classList.remove('hidden');
  
  const btnPromotor = document.getElementById('btn-promotor');
  const btnSupervisor = document.getElementById('btn-supervisor');
  const btnPlanner = document.getElementById('btn-planner');
  const btnForms = document.getElementById('btn-forms');
  const btnConsole = document.getElementById('btn-console');
  
  const chevron = document.querySelector('#promoter-profile-trigger .chevron-inline');
  const trigger = document.getElementById('promoter-profile-trigger');
  
  if (user.role === 'promoter') {
    // Restrict selector tabs
    if (btnPromotor) btnPromotor.classList.remove('hidden');
    if (btnSupervisor) btnSupervisor.classList.add('hidden');
    if (btnPlanner) btnPlanner.classList.add('hidden');
    if (btnForms) btnForms.classList.add('hidden');
    if (btnConsole) btnConsole.classList.add('hidden');
    
    // Lock mobile promoter switcher dropdown trigger click
    if (chevron) chevron.classList.add('hidden');
    if (trigger) trigger.style.cursor = 'default';
    
    // Promoter ID is fixed for this promoter session
    selectedPromoterId = user.id || user.promoterId;
    
    // Ensure mobile simulator header displays current promoter details
    document.getElementById('mobile-promoter-name').textContent = user.name || user.username;
    document.getElementById('mobile-promoter-avatar').textContent = (user.name || user.username || '').split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    try {
      // La cuenta promotora de demostración reutiliza una ruta estable para que
      // el recorrido completo siempre esté disponible, sin depender del día calendario.
      const routeLookupDate = selectedPromoterId === '694671f9-ded6-4bd9-8c1d-4b0b4bf62697'
        ? '2026-08-10'
        : selectedDate;
      const routeRes = await window.ApiService.getTodayRoute(selectedPromoterId, routeLookupDate);
      if (routeRes.success && routeRes.data && routeRes.data.hasRoute) {
        db.routes = db.routes.filter(r => !(r.promoterId === selectedPromoterId && r.date === selectedDate));
        
        routeRes.data.stores.forEach(storeObj => {
          db.routes.push({
            id: storeObj.routeStoreId,
            routeId: storeObj.routeId,
            promoterId: selectedPromoterId,
            storeId: storeObj.storeId,
            date: selectedDate,
            status: storeObj.status === 'completed' ? 'completado' : 'pendiente',
            formIds: (storeObj.routeId === '5f128eb3-f9bf-4d4d-8c4d-7538e1e868ac' || storeObj.routeStoreId === '3bb0e24e-2eb3-4b72-ad47-94bceef0dd49') ? ['form-exhibidor-demo'] : (storeObj.assignedForms || []),
            visitOrder: storeObj.visitOrder || 999,
            scheduledStart: storeObj.scheduledStart || '--:--',
            scheduledEnd: storeObj.scheduledEnd || '--:--'
          });
        });
      } else {
        db.routes = db.routes.filter(r => !(r.promoterId === selectedPromoterId && r.date === selectedDate));
      }
      
      // Fetch Real Stores Catalog
      try {
        const storesRes = await window.ApiService.getStores();
        if (storesRes.success && storesRes.data) {
          storesRes.data.forEach(s => {
            const normalized = normalizeStore(s);
            db.stores[normalized.id] = normalized;
          });
        }
      } catch(e) {
        console.warn("Error fetching catalog stores", e);
      }
      
    } catch(e) {
      console.warn("Error fetching today route", e);
    }
    
    // Force active screen check
    const currentActiveView = document.querySelector('.view-section.active');
    if (!currentActiveView || currentActiveView.id !== 'view-promotor') {
      setActiveView('promotor');
    } else {
      renderRouteList();
    }
  } else if (user.role === 'supervisor') {
    // Show all selector options
    if (btnPromotor) btnPromotor.classList.remove('hidden');
    if (btnSupervisor) btnSupervisor.classList.remove('hidden');
    if (btnPlanner) btnPlanner.classList.remove('hidden');
    if (btnForms) btnForms.classList.remove('hidden');
    if (btnConsole) btnConsole.classList.remove('hidden');
    
    // Unlock mobile promoter switcher dropdown trigger click
    if (chevron) chevron.classList.remove('hidden');
    if (trigger) trigger.style.cursor = 'pointer';
    
    // Redirect only if they were sitting on login screen
    const currentActiveView = document.querySelector('.view-section.active');
    if (!currentActiveView || currentActiveView.id === 'view-login') {
      setActiveView('supervisor');
    }
  } else if (user.role === 'admin') {
    // Show all selector options
    if (btnPromotor) btnPromotor.classList.remove('hidden');
    if (btnSupervisor) btnSupervisor.classList.remove('hidden');
    if (btnPlanner) btnPlanner.classList.remove('hidden');
    if (btnForms) btnForms.classList.remove('hidden');
    if (btnConsole) btnConsole.classList.remove('hidden');
    
    // Unlock mobile promoter switcher dropdown trigger click
    if (chevron) chevron.classList.remove('hidden');
    if (trigger) trigger.style.cursor = 'pointer';
    
    const currentActiveView = document.querySelector('.view-section.active');
    if (!currentActiveView || currentActiveView.id === 'view-login') {
      setActiveView('console');
    }
    
    // Fetch clients for global admin
    if (user.clientId == null) {
      const adminSelector = document.getElementById('admin-client-selector');
      const storeSelector = document.getElementById('store-client-id');
      try {
        const clientsRes = await window.ApiService.getClients();
        if (clientsRes.success && clientsRes.data && clientsRes.data.clients) {
          const clients = clientsRes.data.clients;
          let optionsHtml = '';
          let hasDemo = false;
          clients.forEach(c => {
            optionsHtml += `<option value="${c.clientId}">${c.clientName}</option>`;
            if (c.clientId === 'CLIENT_DEMO') hasDemo = true;
          });
          
          if (clients.length > 0) {
            adminSelector.innerHTML = optionsHtml;
            storeSelector.innerHTML = `<option value="">Selecciona el cliente al que pertenece la tienda</option>` + optionsHtml;
            
            // Set default selected
            window.selectedClientId = hasDemo ? 'CLIENT_DEMO' : clients[0].clientId;
            adminSelector.value = window.selectedClientId;
            
            // Show the selector
            adminSelector.classList.remove('hidden');
            const adminClientGroup = document.getElementById('admin-store-client-group');
            if(adminClientGroup) adminClientGroup.classList.remove('hidden');
          } else {
            adminSelector.innerHTML = `<option value="">No existen clientes activos disponibles.</option>`;
            window.selectedClientId = '';
          }
        }
      } catch(e) {
        console.warn('Error fetching clients for admin:', e);
      }
    } else {
      // Normal admin/supervisor has a fixed client
      window.selectedClientId = user.clientId;
    }
    
    if (window.selectedClientId) {
      let success = await loadStoresForClient(window.selectedClientId);
      if (success && typeof renderCentralConsole === 'function') {
        renderCentralConsole();
      }
    }
  }
  
  lucide.createIcons();
}

function initAuthAndConsole() {
  // Login Form Submission
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('login-error-msg');
  const errorText = document.getElementById('login-error-text');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById('login-username').value.trim();
      const passwordVal = document.getElementById('login-password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader" class="spin"></i><span>Procesando...</span>';
        if (window.lucide) window.lucide.createIcons();
      }
      if (errorMsg) errorMsg.classList.add('hidden');
      
      try {
        console.log("Calling ApiService.login...");
        const result = await window.ApiService.login(usernameVal, passwordVal);
        console.log("Login result:", result);
        
        if (result.success) {
          // Success
          console.log("Login success, checking auth...");
          loginForm.reset();
          await checkAuth();
          console.log("checkAuth completed");
        } else {
          // Error
          let msg = "Error al iniciar sesión.";
          if (result.error && result.error.message) {
            msg = result.error.message;
          }
          if (errorText) errorText.textContent = msg;
          if (errorMsg) errorMsg.classList.remove('hidden');
        }
      } catch (err) {
        console.error("Login unexpected error:", err);
        if (errorText) errorText.textContent = "Error de conexión o problema interno. Inténtalo de nuevo.";
        if (errorMsg) errorMsg.classList.remove('hidden');
      } finally {
        console.log("Executing login finally block...");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="log-in"></i><span>Iniciar Sesión</span>';
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });
  }
  
  // Logout Button
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await window.ApiService.logout();
      await checkAuth();
    });
  }
  
  // Admin Client Selector Change
  const adminClientSelector = document.getElementById('admin-client-selector');
  if (adminClientSelector) {
    adminClientSelector.addEventListener('change', async (e) => {
      window.selectedClientId = e.target.value;
      
      await loadStoresForClient(window.selectedClientId);
      
      // Reload current active tab data if we are in console
      const currentActiveView = document.querySelector('.view-section.active');
      if (currentActiveView && currentActiveView.id === 'view-console') {
        const activeTab = document.querySelector('.console-tab-btn.active');
        if (activeTab && activeTab.dataset.tab === 'stores') {
          if (typeof renderCentralConsole === 'function') {
            renderCentralConsole();
          }
        }
      }
    });
  }
  
  // Console parameters form submission
  const consoleConfigForm = document.getElementById('console-config-form');
  if (consoleConfigForm) {
    consoleConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const radiusSelect = document.getElementById('console-geofence-range');
      if (radiusSelect) {
        db.config.checkInRangeMeters = parseInt(radiusSelect.value);
        saveDB();
        
        // Update simulation panel displays
        const route = db.routes.find(r => r.id === currentActiveRouteId);
        if (route) {
          const store = db.stores[route.storeId];
          if (store) updateGPSSimulatorDisplay(store);
        }
        
        alert("Configuración de geofencing guardada con éxito.");
      }
    });
  }
  
  // Console add user form submission
  const consoleUserForm = document.getElementById('console-user-form');
  if (consoleUserForm) {
    consoleUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('console-username-input');
      const passwordInput = document.getElementById('console-password-input');
      const nameInput = document.getElementById('console-name-input');
      const roleSelect = document.getElementById('console-role-select');
      
      if (!usernameInput || !passwordInput || !nameInput || !roleSelect) return;
      
      const username = usernameInput.value.trim().toLowerCase();
      const password = passwordInput.value;
      const name = nameInput.value.trim();
      const role = roleSelect.value;
      
      if (db.users[username]) {
        alert(`El usuario "${username}" ya existe.`);
        return;
      }
      
      const newUser = {
        username: username,
        password: password,
        name: name,
        role: role
      };
      
      if (role === 'promoter') {
        const promoterId = `promoter-${Date.now()}`;
        const initials = name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
        db.promoters[promoterId] = {
          id: promoterId,
          name: name,
          avatar: initials
        };
        newUser.promoterId = promoterId;
      }
      
      db.users[username] = newUser;
      saveDB();
      
      consoleUserForm.reset();
      
      // Refresh options and table renders
      renderCentralConsole();
      populateManualAssignmentDropdowns();
      renderMobilePromoterDropdown();
      renderRoutePlanner();
      renderRouteList();
      updateSupervisorDashboard();
      
      alert("Usuario guardado con éxito.");
    });
  }
  
  // Mobile checkin GPS toggle buttons clicks binding
  const btnGPSInRange = document.getElementById('btn-gps-in-range');
  const btnGPSOutOfRange = document.getElementById('btn-gps-out-of-range');
  
  if (btnGPSInRange) {
    btnGPSInRange.addEventListener('click', () => {
      gpsSimulationMode = 'in-range';
      btnGPSInRange.classList.add('active');
      if (btnGPSOutOfRange) btnGPSOutOfRange.classList.remove('active');
      
      const route = db.routes.find(r => r.id === currentActiveRouteId);
      if (route) {
        const store = db.stores[route.storeId];
        if (store) updateGPSSimulatorDisplay(store);
      }
    });
  }
  
  if (btnGPSOutOfRange) {
    btnGPSOutOfRange.addEventListener('click', () => {
      gpsSimulationMode = 'out-of-range';
      btnGPSOutOfRange.classList.add('active');
      if (btnGPSInRange) btnGPSInRange.classList.remove('active');
      
      const route = db.routes.find(r => r.id === currentActiveRouteId);
      if (route) {
        const store = db.stores[route.storeId];
        if (store) updateGPSSimulatorDisplay(store);
      }
    });
  }
}

function renderCentralConsole() {
  // 1. Geofence range select
  const radiusSelect = document.getElementById('console-geofence-range');
  if (radiusSelect) {
    radiusSelect.value = db.config.checkInRangeMeters;
  }
  
  // 2. Render Users Table
  const usersTbody = document.getElementById('console-users-table-body');
  if (usersTbody) {
    usersTbody.innerHTML = '';
    
    // Sort users
    const userKeys = Object.keys(db.users);
    userKeys.forEach(uKey => {
      const u = db.users[uKey];
      const tr = document.createElement('tr');
      
      const roleLabel = u.role === 'supervisor' ? 'Supervisor' : 'Promotor';
      const promoterIdLabel = u.promoterId || '<span class="text-muted">N/A</span>';
      
      // Safety checks: do not allow deletion of demo bootstrap users
      const isDemoUser = ['admin', 'pedro', 'sofia', 'carlos'].includes(u.username);
      const isCurrentUser = u.username === JSON.parse(localStorage.getItem('fieldflow_current_user') || '{}').username;
      
      const deleteBtnHTML = (isDemoUser || isCurrentUser)
        ? `<span class="text-muted" style="font-size: 0.8rem;">Sistema</span>`
        : `<button class="btn-icon text-danger btn-delete-user" data-username="${u.username}">
             <i data-lucide="trash-2"></i> Eliminar
           </button>`;
      
      tr.innerHTML = `
        <td><strong>${u.username}</strong></td>
        <td>${u.name}</td>
        <td><span class="status-indicator-pill ${u.role === 'supervisor' ? 'completed' : 'in-progress'}">${roleLabel}</span></td>
        <td><code>${promoterIdLabel}</code></td>
        <td>${deleteBtnHTML}</td>
      `;
      
      const btnDel = tr.querySelector('.btn-delete-user');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          if (confirm(`¿Estás seguro de eliminar el usuario "${u.username}"?`)) {
            // Delete associated promoter too if they are promoter
            if (u.role === 'promoter' && u.promoterId) {
              delete db.promoters[u.promoterId];
              // clean routes assigned to deleted promoter
              db.routes = db.routes.filter(r => r.promoterId !== u.promoterId);
            }
            
            delete db.users[u.username];
            saveDB();
            
            renderCentralConsole();
            populateManualAssignmentDropdowns();
            renderMobilePromoterDropdown();
            renderRoutePlanner();
            renderRouteList();
            updateSupervisorDashboard();
            
            alert(`Usuario "${u.username}" eliminado con éxito.`);
          }
        });
      }
      
      usersTbody.appendChild(tr);
    });
  }
  
  // 3. Render Stores Coordinate Catalog Table
  const storesTbody = document.getElementById('console-stores-table-body');
  if (storesTbody) {
    storesTbody.innerHTML = '';
    
    Object.keys(db.stores).forEach(sId => {
      const store = db.stores[sId];
      const tr = document.createElement('tr');
      
      // Let's protect demo system stores
      const isDemoStore = ['store-1', 'store-2', 'store-3'].includes(store.id);
      
      const actionsHTML = isDemoStore
        ? `<span class="text-muted" style="font-size: 0.8rem;">Fija</span>`
        : `<button class="btn-icon text-primary btn-edit-store" data-store-id="${store.id}" style="margin-right: 8px;">
             <i data-lucide="edit"></i> Editar
           </button>
           <button class="btn-icon text-danger btn-delete-store" data-store-id="${store.id}">
             <i data-lucide="trash-2"></i> Eliminar
           </button>`;
      
      tr.innerHTML = `
        <td class="visit-store-td"><strong>${store.name}</strong></td>
        <td>${store.address || 'N/A'}</td>
        <td><code>${store.latitude !== undefined ? parseFloat(store.latitude).toFixed(5) : 'N/A'}</code></td>
        <td><code>${store.longitude !== undefined ? parseFloat(store.longitude).toFixed(5) : 'N/A'}</code></td>
        <td>${actionsHTML}</td>
      `;
      
      const btnDel = tr.querySelector('.btn-delete-store');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          if (confirm(`¿Estás seguro de eliminar la tienda "${store.name}"?`)) {
            // Clean routes assigned to deleted store
            db.routes = db.routes.filter(r => r.storeId !== store.id);
            
            delete db.stores[store.id];
            saveDB();
            
            renderCentralConsole();
            populateManualAssignmentDropdowns();
            renderRoutePlanner();
            renderRouteList();
            updateSupervisorDashboard();
            
            alert(`Tienda "${store.name}" eliminada con éxito.`);
          }
        });
      }
      
      const btnEdit = tr.querySelector('.btn-edit-store');
      if (btnEdit) {
        btnEdit.addEventListener('click', () => {
          document.getElementById('store-id-input').value = store.id || '';
          document.getElementById('store-code-input').value = store.code || '';
          document.getElementById('store-chain-input').value = store.chain || '';
          document.getElementById('store-name-input').value = store.name || '';
          document.getElementById('store-address-input').value = store.address || '';
          document.getElementById('store-city-input').value = store.city || '';
          document.getElementById('store-state-input').value = store.state || '';
          document.getElementById('store-lat-input').value = store.latitude !== undefined ? store.latitude : '';
          document.getElementById('store-lng-input').value = store.longitude !== undefined ? store.longitude : '';
          document.getElementById('store-radius-input').value = store.geofenceRadius || '100';
          document.getElementById('store-modal').showModal();
        });
      }
      
      storesTbody.appendChild(tr);
    });
  }
  
  lucide.createIcons();
}

// ==========================================================================
// FORM BUILDER LOGIC
// ==========================================================================

function initFormBuilderEvents() {
  const formSelect = document.getElementById('form-active-select');
  if (formSelect) {
    formSelect.addEventListener('change', () => {
      activeFormId = formSelect.value;
      const form = db.forms[activeFormId];
      const renameInput = document.getElementById('form-rename-input');
      if (renameInput && form) {
        renameInput.value = form.name;
      }
      renderFormBuilder();
    });
  }

  const btnSaveFormName = document.getElementById('btn-save-form-name');
  if (btnSaveFormName) {
    btnSaveFormName.addEventListener('click', async () => {
      const renameInput = document.getElementById('form-rename-input');
      if (!renameInput) return;
      const newName = renameInput.value.trim();
      if (!newName) {
        alert('Por favor ingresa un nombre para el formulario.');
        return;
      }
      if (db.forms[activeFormId]) {
        try {
          btnSaveFormName.disabled = true;
          const form = db.forms[activeFormId];
          form.name = newName;
          
          if (activeFormId.startsWith('form-')) {
            // Ya es un formulario real (probablemente), intentamos actualizar
            await window.ApiService.updateForm(activeFormId, newName, form.questions);
          } else {
            // Formulario temporal
            const res = await window.ApiService.createForm(newName, form.questions);
            if (res && res.success) {
              const oldId = activeFormId;
              activeFormId = res.data.formId;
              db.forms[activeFormId] = { ...form, id: activeFormId, name: newName };
              delete db.forms[oldId];
            }
          }
          saveDB();
          renderFormBuilder();
          populateManualAssignmentDropdowns();
          renderRoutePlanner();
          alert('Nombre del formulario actualizado en la nube.');
        } catch (e) {
          alert('Error al guardar nombre: ' + e.message);
        } finally {
          btnSaveFormName.disabled = false;
        }
      }
    });
  }

  const btnDeleteForm = document.getElementById('btn-delete-form');
  if (btnDeleteForm) {
    btnDeleteForm.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de eliminar este formulario de la base de datos? Se desvinculará de todas las rutas asignadas.')) {
        try {
          btnDeleteForm.disabled = true;
          
          await window.ApiService.deleteForm(activeFormId);
          
          // Clean up routes using this form
          db.routes.forEach(r => {
            if (Array.isArray(r.formIds)) {
              r.formIds = r.formIds.filter(fId => fId !== activeFormId);
            } else if (r.formId === activeFormId) {
              r.formId = 'default';
            }
          });
          
          delete db.forms[activeFormId];
          
          // Choose another form or create a default one if empty
          const keys = Object.keys(db.forms);
          if (keys.length > 0) {
            activeFormId = keys[0];
          } else {
            // Re-initialize demo form si no hay nada (fallback temporal)
            db.forms['form-incidencias'] = {
              id: 'form-incidencias',
              name: 'Reporte de Incidencias',
              questions: []
            };
            activeFormId = 'form-incidencias';
          }
          
          saveDB();
          renderFormBuilder();
          populateManualAssignmentDropdowns();
          renderRoutePlanner();
          alert('Formulario eliminado de la nube con éxito.');
        } catch (e) {
          alert('Error al eliminar formulario: ' + e.message);
        } finally {
          btnDeleteForm.disabled = false;
        }
      }
    });
  }

  const btnCreateNewForm = document.getElementById('btn-create-new-form');
  if (btnCreateNewForm) {
    btnCreateNewForm.addEventListener('click', async () => {
      try {
        btnCreateNewForm.disabled = true;
        const res = await window.ApiService.createForm('Nuevo Formulario', []);
        
        if (res && res.success && res.data && res.data.formId) {
          const newId = res.data.formId;
          db.forms[newId] = {
            id: newId,
            name: 'Nuevo Formulario',
            questions: []
          };
          activeFormId = newId;
          saveDB();
          renderFormBuilder();
          populateManualAssignmentDropdowns();
          renderRoutePlanner();
          
          const renameInput = document.getElementById('form-rename-input');
          if (renameInput) {
            renameInput.value = 'Nuevo Formulario';
            renameInput.focus();
          }
        } else {
          alert('Error al crear el formulario en la nube.');
        }
      } catch (e) {
        alert('Error de red al crear el formulario: ' + e.message);
      } finally {
        btnCreateNewForm.disabled = false;
      }
    });
  }

  const btnAddQuestionTrigger = document.getElementById('btn-add-question-trigger');
  if (btnAddQuestionTrigger) {
    btnAddQuestionTrigger.addEventListener('click', () => {
      const dialog = document.getElementById('question-dialog');
      const formEl = document.getElementById('question-editor-form');
      if (!dialog || !formEl) return;

      formEl.reset();
      document.getElementById('edit-question-id').value = '';
      document.getElementById('question-modal-title').textContent = 'Crear Pregunta';
      document.getElementById('btn-save-question-text').textContent = 'Guardar pregunta';
      
      // Reset type select to yes_no
      document.getElementById('selected-question-type').value = 'yes_no';
      document.querySelectorAll('.qtype-btn').forEach(btn => {
        if (btn.getAttribute('data-type') === 'yes_no') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      document.getElementById('question-options-group').classList.add('hidden');
      
      // Populate dependency dropdowns
      populateDependencyParentSelect('');
      document.getElementById('question-dependency-value-group').classList.add('hidden');
      
      dialog.showModal();
    });
  }

  const btnCloseQuestionModal = document.getElementById('btn-close-question-modal');
  if (btnCloseQuestionModal) {
    btnCloseQuestionModal.addEventListener('click', () => {
      const dialog = document.getElementById('question-dialog');
      if (dialog) dialog.close();
    });
  }

  // Type buttons in modal
  document.querySelectorAll('.qtype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.qtype-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type');
      document.getElementById('selected-question-type').value = type;
      
      const optionsGroup = document.getElementById('question-options-group');
      if (type === 'multiple') {
        optionsGroup.classList.remove('hidden');
        const optionsInput = document.getElementById('question-options-input');
        if (optionsInput) optionsInput.required = true;
      } else {
        optionsGroup.classList.add('hidden');
        const optionsInput = document.getElementById('question-options-input');
        if (optionsInput) optionsInput.required = false;
      }
    });
  });

  // Dependency parent change
  const depParent = document.getElementById('question-dependency-parent');
  if (depParent) {
    depParent.addEventListener('change', () => {
      populateDependencyValueDropdown(depParent.value);
    });
  }

  // Editor form submit
  const editorForm = document.getElementById('question-editor-form');
  if (editorForm) {
    editorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSave = document.getElementById('btn-save-question');
      if (btnSave) btnSave.disabled = true;
      try {
        await saveQuestionFromForm();
        const dialog = document.getElementById('question-dialog');
        if (dialog) dialog.close();
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        if (btnSave) btnSave.disabled = false;
      }
    });
  }
}

function renderFormBuilder() {
  const form = db.forms[activeFormId];
  if (!form) return;

  // Active form select dropdown population
  const formActiveSelect = document.getElementById('form-active-select');
  if (formActiveSelect) {
    formActiveSelect.innerHTML = '';
    Object.keys(db.forms).forEach(fId => {
      const f = db.forms[fId];
      const selected = fId === activeFormId ? 'selected' : '';
      formActiveSelect.innerHTML += `<option value="${f.id}" ${selected}>${f.name}</option>`;
    });
  }

  const renameInput = document.getElementById('form-rename-input');
  if (renameInput) {
    renameInput.value = form.name;
  }

  const canvasTitle = document.getElementById('form-canvas-title');
  if (canvasTitle) {
    canvasTitle.textContent = `Preguntas de: ${form.name}`;
  }

  const tbody = document.getElementById('form-questions-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';

  if (!form.questions || form.questions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding: 2rem;">
          <i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 8px; color: var(--neutral-muted);"></i>
          <p>No hay preguntas en este formulario. Haz clic en "Nueva Pregunta" para comenzar.</p>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  form.questions.forEach((q, idx) => {
    const tr = document.createElement('tr');
    
    // Type Label and Icon
    let typeLabel = q.type;
    let typeIcon = 'help-circle';
    if (q.type === 'yes_no') { typeLabel = 'Sí / No'; typeIcon = 'toggle-left'; }
    else if (q.type === 'text') { typeLabel = 'Abierta (Texto)'; typeIcon = 'file-text'; }
    else if (q.type === 'multiple') { typeLabel = 'Op. Múltiple'; typeIcon = 'list-checks'; }
    else if (q.type === 'numeric') { typeLabel = 'Numérica'; typeIcon = 'hash'; }
    else if (q.type === 'barcode') { typeLabel = 'Scanner / QR'; typeIcon = 'qr-code'; }
    else if (q.type === 'photo') { typeLabel = 'Fotografía'; typeIcon = 'camera'; }

    const typeBadge = `
      <span class="status-indicator-pill in-progress" style="display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--neutral-border);">
        <i data-lucide="${typeIcon}" style="width: 12px; height: 12px;"></i>
        <span>${typeLabel}</span>
      </span>
    `;

    // Dependency details
    let depLabel = 'Ninguna';
    if (q.dependency && q.dependency.parentId) {
      const parentQ = form.questions.find(pq => pq.id === q.dependency.parentId);
      const parentTitle = parentQ ? (parentQ.title.length > 20 ? parentQ.title.substring(0, 18) + '...' : parentQ.title) : 'Pregunta Eliminada';
      depLabel = `<span style="font-size: 0.8rem; color: #4f46e5; background: rgba(79, 70, 229, 0.08); padding: 2px 6px; border-radius: 4px; font-weight: 500;">
        ${parentTitle} = ${q.dependency.value}
      </span>`;
    }

    // Required Badge
    const reqBadge = q.required 
      ? '<span class="text-danger" style="font-weight: 700; font-size: 0.8rem;">OBLIGATORIA</span>' 
      : '<span class="text-muted" style="font-size: 0.8rem;">Opcional</span>';

    // Actions
    const isFirst = idx === 0;
    const isLast = idx === form.questions.length - 1;

    tr.innerHTML = `
      <td><strong>${idx + 1}</strong></td>
      <td>${typeBadge}</td>
      <td><strong>${q.title}</strong>${q.options && q.options.length > 0 ? `<div style="font-size: 0.75rem; color: var(--neutral-muted); margin-top: 4px;">Opciones: ${q.options.join(', ')}</div>` : ''}</td>
      <td>${depLabel}</td>
      <td>${reqBadge}</td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn-icon btn-edit-question" data-q-id="${q.id}" title="Editar">
            <i data-lucide="edit-3"></i>
          </button>
          <button type="button" class="btn-icon btn-move-up" data-q-id="${q.id}" ${isFirst ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} title="Subir">
            <i data-lucide="arrow-up"></i>
          </button>
          <button type="button" class="btn-icon btn-move-down" data-q-id="${q.id}" ${isLast ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} title="Bajar">
            <i data-lucide="arrow-down"></i>
          </button>
          <button type="button" class="btn-icon text-danger btn-delete-question" data-q-id="${q.id}" title="Eliminar">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;

    // Event Listeners for actions
    tr.querySelector('.btn-edit-question').addEventListener('click', () => openQuestionEditor(q.id));
    tr.querySelector('.btn-delete-question').addEventListener('click', () => deleteQuestion(q.id));
    
    const moveUpBtn = tr.querySelector('.btn-move-up');
    if (!isFirst && moveUpBtn) {
      moveUpBtn.addEventListener('click', () => moveQuestion(q.id, 'up'));
    }

    const moveDownBtn = tr.querySelector('.btn-move-down');
    if (!isLast && moveDownBtn) {
      moveDownBtn.addEventListener('click', () => moveQuestion(q.id, 'down'));
    }

    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function openQuestionEditor(qId) {
  const form = db.forms[activeFormId];
  if (!form) return;

  const q = form.questions.find(question => question.id === qId);
  if (!q) return;

  const dialog = document.getElementById('question-dialog');
  const formEl = document.getElementById('question-editor-form');
  if (!dialog || !formEl) return;

  formEl.reset();

  document.getElementById('edit-question-id').value = qId;
  document.getElementById('question-modal-title').textContent = 'Editar Pregunta';
  document.getElementById('btn-save-question-text').textContent = 'Guardar cambios';

  document.getElementById('question-title-input').value = q.title;
  document.getElementById('question-required-checkbox').checked = !!q.required;

  document.getElementById('selected-question-type').value = q.type;
  document.querySelectorAll('.qtype-btn').forEach(btn => {
    if (btn.getAttribute('data-type') === q.type) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const optionsGroup = document.getElementById('question-options-group');
  const optionsInput = document.getElementById('question-options-input');
  if (q.type === 'multiple') {
    optionsGroup.classList.remove('hidden');
    optionsInput.value = (q.options || []).join(', ');
    optionsInput.required = true;
  } else {
    optionsGroup.classList.add('hidden');
    optionsInput.value = '';
    optionsInput.required = false;
  }

  // Populate dependency selectors
  populateDependencyParentSelect(qId);

  const depParent = document.getElementById('question-dependency-parent');
  if (q.dependency && q.dependency.parentId) {
    depParent.value = q.dependency.parentId;
    populateDependencyValueDropdown(q.dependency.parentId, q.dependency.value);
  } else {
    depParent.value = '';
    document.getElementById('question-dependency-value-group').classList.add('hidden');
  }

  dialog.showModal();
}

function populateDependencyParentSelect(currentQId) {
  const form = db.forms[activeFormId];
  const depParent = document.getElementById('question-dependency-parent');
  if (!form || !depParent) return;

  depParent.innerHTML = '<option value="">-- Sin dependencia --</option>';

  // We can only depend on questions of type yes_no or multiple that precede this question
  let eligibleQuestions = [];
  const currentIndex = currentQId ? form.questions.findIndex(q => q.id === currentQId) : form.questions.length;

  for (let i = 0; i < currentIndex; i++) {
    const q = form.questions[i];
    if (q.type === 'yes_no' || q.type === 'multiple') {
      eligibleQuestions.push(q);
    }
  }

  eligibleQuestions.forEach(q => {
    depParent.innerHTML += `<option value="${q.id}">${q.title}</option>`;
  });
}

function populateDependencyValueDropdown(parentId, selectVal) {
  const depValueGroup = document.getElementById('question-dependency-value-group');
  const depValueSelect = document.getElementById('question-dependency-value');
  if (!depValueGroup || !depValueSelect) return;

  if (!parentId) {
    depValueGroup.classList.add('hidden');
    depValueSelect.innerHTML = '';
    depValueSelect.required = false;
    return;
  }

  const form = db.forms[activeFormId];
  if (!form) return;

  const parentQ = form.questions.find(q => q.id === parentId);
  if (!parentQ) {
    depValueGroup.classList.add('hidden');
    return;
  }

  depValueSelect.innerHTML = '';
  depValueSelect.required = true;

  if (parentQ.type === 'yes_no') {
    depValueSelect.innerHTML = `
      <option value="SI">SI</option>
      <option value="NO">NO</option>
    `;
  } else if (parentQ.type === 'multiple') {
    const options = parentQ.options || [];
    options.forEach(opt => {
      depValueSelect.innerHTML += `<option value="${opt}">${opt}</option>`;
    });
  }

  if (selectVal) {
    depValueSelect.value = selectVal;
  }
  
  depValueGroup.classList.remove('hidden');
}

async function saveQuestionFromForm() {
  const form = db.forms[activeFormId];
  if (!form) return;

  const qId = document.getElementById('edit-question-id').value;
  const title = document.getElementById('question-title-input').value.trim();
  const type = document.getElementById('selected-question-type').value;
  const required = document.getElementById('question-required-checkbox').checked;
  
  let options = [];
  if (type === 'multiple') {
    const optStr = document.getElementById('question-options-input').value;
    options = optStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  const parentId = document.getElementById('question-dependency-parent').value;
  let dependency = null;
  if (parentId) {
    const depVal = document.getElementById('question-dependency-value').value;
    dependency = {
      parentId: parentId,
      value: depVal
    };
  }

  const newQ = {
    id: qId || `q-${Date.now()}`,
    type: type,
    title: title,
    required: required,
    options: options
  };
  if (dependency) {
    newQ.dependency = dependency;
  }

  if (!form.questions) form.questions = [];

  const originalQuestions = JSON.parse(JSON.stringify(form.questions));

  if (qId) {
    const idx = form.questions.findIndex(q => q.id === qId);
    if (idx !== -1) {
      form.questions[idx] = newQ;
    }
  } else {
    form.questions.push(newQ);
  }

  try {
    if (activeFormId.startsWith('form-')) {
      await window.ApiService.updateForm(activeFormId, form.name, form.questions);
    }
    saveDB();
    renderFormBuilder();
  } catch (e) {
    form.questions = originalQuestions; // revert
    throw new Error('No se pudo guardar la pregunta en la nube: ' + e.message);
  }
}

async function deleteQuestion(qId) {
  const form = db.forms[activeFormId];
  if (!form) return;

  if (confirm('¿Estás seguro de eliminar esta pregunta de la base de datos?')) {
    const originalQuestions = JSON.parse(JSON.stringify(form.questions));
    
    form.questions = form.questions.filter(q => q.id !== qId);
    
    // Clear dependencies that relied on this deleted question
    form.questions.forEach(q => {
      if (q.dependency && q.dependency.parentId === qId) {
        delete q.dependency;
        alert(`Se removió la dependencia de la pregunta "${q.title}" porque la pregunta padre fue eliminada.`);
      }
    });

    try {
      if (activeFormId.startsWith('form-')) {
        await window.ApiService.updateForm(activeFormId, form.name, form.questions);
      }
      saveDB();
      renderFormBuilder();
    } catch (e) {
      form.questions = originalQuestions; // revert
      alert('Error al eliminar pregunta en la nube: ' + e.message);
    }
  }
}

async function moveQuestion(qId, direction) {
  const form = db.forms[activeFormId];
  if (!form || !form.questions) return;

  const idx = form.questions.findIndex(q => q.id === qId);
  if (idx === -1) return;

  if (direction === 'up' && idx > 0) {
    const temp = form.questions[idx - 1];
    form.questions[idx - 1] = form.questions[idx];
    form.questions[idx] = temp;
  } else if (direction === 'down' && idx < form.questions.length - 1) {
    const temp = form.questions[idx + 1];
    form.questions[idx + 1] = form.questions[idx];
    form.questions[idx] = temp;
  } else {
    return;
  }

  // Validate dependencies order
  validateFormDependenciesAfterReorder(form);

  try {
    if (activeFormId.startsWith('form-')) {
      await window.ApiService.updateForm(activeFormId, form.name, form.questions);
    }
    saveDB();
    renderFormBuilder();
  } catch (e) {
    // Revert to avoid out of sync UI
    alert('Error de conexión al mover pregunta: ' + e.message);
    window.location.reload();
  }
}

function validateFormDependenciesAfterReorder(form) {
  const visitedIds = new Set();
  let dependencyBroken = false;

  form.questions.forEach(q => {
    if (q.dependency && q.dependency.parentId) {
      if (!visitedIds.has(q.dependency.parentId)) {
        delete q.dependency;
        dependencyBroken = true;
      }
    }
    visitedIds.add(q.id);
  });

  if (dependencyBroken) {
    alert('Nota: Se eliminaron una o más dependencias condicionales debido a que el orden de las preguntas cambió.');
  }
}

// ==========================================================================
// MOBILE DYNAMIC FORM SIMULATOR ENGINE
// ==========================================================================

function playBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Could not play scanner beep sound:", e);
  }
}

function renderDynamicForm(route, isReadOnly) {
  const container = document.getElementById('dynamic-form-container');
  if (!container) return;

  const formIds = getRouteFormIds(route);
  if (formIds.length === 0) return;

  container.innerHTML = '';
  dynamicPhotos = {};

  let globalQIdx = 0;
  formIds.forEach(fId => {
    const form = db.forms[fId];
    if (!form) return;

    // Section header when multiple forms are assigned
    if (formIds.length > 1) {
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'dynamic-form-section-header';
      sectionHeader.style.cssText = 'padding: 10px 16px; background: var(--primary-light, #eef2ff); border-left: 3px solid var(--primary-color, #4f46e5); border-radius: 4px; margin-bottom: 12px; margin-top: 8px; font-weight: 700; font-size: 0.9rem; color: var(--primary-color, #4f46e5);';
      sectionHeader.textContent = form.name;
      container.appendChild(sectionHeader);
    }

    form.questions.forEach((q, idx) => {
      globalQIdx++;
    const group = document.createElement('div');
    group.className = 'dynamic-form-group';
    group.setAttribute('data-q-id', q.id);
    
    const labelHTML = `
      <label>
        ${globalQIdx}. ${q.title}
        ${q.required ? '<span class="required-asterisk">*</span>' : ''}
      </label>
    `;
    
    let controlHTML = '';
    
    if (q.type === 'yes_no') {
      controlHTML = `
        <div class="pill-radio-group">
          <div style="position: relative;">
            <input type="radio" id="dynamic-q-${q.id}-si" name="dynamic-q-${q.id}" value="SI" class="mobile-radio-input" ${isReadOnly ? 'disabled' : ''} ${q.required ? 'required' : ''}>
            <label for="dynamic-q-${q.id}-si" class="mobile-radio-label">Sí</label>
          </div>
          <div style="position: relative;">
            <input type="radio" id="dynamic-q-${q.id}-no" name="dynamic-q-${q.id}" value="NO" class="mobile-radio-input" ${isReadOnly ? 'disabled' : ''} ${q.required ? 'required' : ''}>
            <label for="dynamic-q-${q.id}-no" class="mobile-radio-label">No</label>
          </div>
        </div>
      `;
    } else if (q.type === 'multiple') {
      controlHTML = `
        <div class="multiple-radio-group">
          ${q.options.map((opt, oIdx) => `
            <div style="position: relative;">
              <input type="radio" id="dynamic-q-${q.id}-${oIdx}" name="dynamic-q-${q.id}" value="${opt}" class="mobile-radio-input" ${isReadOnly ? 'disabled' : ''} ${q.required ? 'required' : ''}>
              <label for="dynamic-q-${q.id}-${oIdx}" class="mobile-radio-label">${opt}</label>
            </div>
          `).join('')}
        </div>
      `;
    } else if (q.type === 'text') {
      controlHTML = `
        <input type="text" id="dynamic-q-${q.id}" name="dynamic-q-${q.id}" class="form-control" placeholder="Escribe tu respuesta..." ${isReadOnly ? 'disabled' : ''} ${q.required ? 'required' : ''}>
      `;
    } else if (q.type === 'numeric') {
      controlHTML = `
        <input type="number" id="dynamic-q-${q.id}" name="dynamic-q-${q.id}" class="form-control" placeholder="Ingresa un número..." step="any" ${isReadOnly ? 'disabled' : ''} ${q.required ? 'required' : ''}>
      `;
    } else if (q.type === 'barcode') {
      controlHTML = `
        <div class="scanner-input-wrapper">
          <input type="text" id="dynamic-q-${q.id}" name="dynamic-q-${q.id}" class="form-control" placeholder="Escanea o escribe código..." ${isReadOnly ? 'disabled' : ''} ${q.required ? 'required' : ''}>
          <button type="button" class="btn-scanner-sim" data-target-q-id="${q.id}" ${isReadOnly ? 'disabled' : ''}>
            <i data-lucide="qr-code"></i>
          </button>
        </div>
      `;
    } else if (q.type === 'photo') {
      controlHTML = `
        <div class="photo-upload-group">
          <div class="photo-dropzone" id="dynamic-photo-dropzone-${q.id}" ${isReadOnly ? 'style="pointer-events: none; opacity: 0.7;"' : ''}>
            <i data-lucide="camera" class="dropzone-icon"></i>
            <p>Arrastra o selecciona foto</p>
            <span>Formatos JPG, PNG (Max 5MB)</span>
            <input type="file" id="dynamic-photo-input-${q.id}" accept="image/*" class="visually-hidden" ${isReadOnly ? 'disabled' : ''}>
          </div>
          
          ${!isReadOnly ? `
          <div class="sample-photo-selector" style="margin-top: 8px;">
            <p class="sample-label" style="font-size: 0.75rem; margin-bottom: 4px;">O usa foto de muestra:</p>
            <div class="sample-chips">
              <button type="button" class="sample-chip" data-img="shelf-clean" data-target-q-id="${q.id}">
                <i data-lucide="image"></i> Limpio
              </button>
              <button type="button" class="sample-chip" data-img="shelf-messy" data-target-q-id="${q.id}">
                <i data-lucide="alert-circle"></i> Desordenado
              </button>
            </div>
          </div>
          ` : ''}

          <div class="photo-preview-container hidden" id="dynamic-photo-preview-${q.id}">
            <img src="" alt="Previsualización" id="dynamic-photo-img-${q.id}">
            ${!isReadOnly ? `
            <button type="button" class="btn-remove-photo" data-target-q-id="${q.id}">
              <i data-lucide="trash-2"></i>
            </button>
            ` : ''}
          </div>
          
          <input type="text" id="dynamic-q-${q.id}" name="dynamic-q-${q.id}" style="opacity: 0; width: 0; height: 0; position: absolute; pointer-events: none;" ${q.required ? 'required' : ''} readonly>
        </div>
      `;
    }

    group.innerHTML = labelHTML + controlHTML;
    container.appendChild(group);
    }); // end form.questions.forEach
  }); // end formIds.forEach

  lucide.createIcons();

  // Register interactive events if not readOnly
  if (!isReadOnly) {
    // Standard dependency updates on change — evaluate all assigned forms
    const allFormsArr = formIds.map(fId => db.forms[fId]).filter(Boolean);
    container.addEventListener('change', () => allFormsArr.forEach(f => evaluateDynamicFormDependencies(f)));
    container.addEventListener('input', () => allFormsArr.forEach(f => evaluateDynamicFormDependencies(f)));

    // Scanner simulated actions
    container.querySelectorAll('.btn-scanner-sim').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetQId = btn.getAttribute('data-target-q-id');
        const overlay = document.getElementById('scanner-overlay');
        if (overlay) {
          overlay.classList.remove('hidden');
          setTimeout(() => {
            overlay.classList.add('hidden');
            playBeepSound();
            
            // Set random EAN-13 code
            const codes = ['7501055300075', '7501031301041', '7501000122110', '7501020512038'];
            const chosen = codes[Math.floor(Math.random() * codes.length)];
            
            const input = document.getElementById(`dynamic-q-${targetQId}`);
            if (input) {
              input.value = chosen;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, 1500);
        }
      });
    });

    // Photo file selection & chips & drag-and-drop (all assigned forms)
    formIds.forEach(fId => {
    const formForPhoto = db.forms[fId];
    if (!formForPhoto) return;
    formForPhoto.questions.forEach(q => {
      if (q.type !== 'photo') return;

      const dropzone = document.getElementById(`dynamic-photo-dropzone-${q.id}`);
      const fileInput = document.getElementById(`dynamic-photo-input-${q.id}`);
      
      const fileLoadHandler = (file) => {
        if (!file || !file.type.match('image.*')) {
          alert('Por favor selecciona una imagen válida.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          dynamicPhotos[q.id] = base64;
          
          const hiddenInput = document.getElementById(`dynamic-q-${q.id}`);
          if (hiddenInput) {
            hiddenInput.value = base64;
            hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const previewImg = document.getElementById(`dynamic-photo-img-${q.id}`);
          const previewContainer = document.getElementById(`dynamic-photo-preview-${q.id}`);
          if (previewImg && previewContainer && dropzone) {
            previewImg.src = base64;
            previewContainer.classList.remove('hidden');
            dropzone.classList.add('hidden');
          }
        };
        reader.readAsDataURL(file);
      };

      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            fileLoadHandler(e.target.files[0]);
          }
        });
      }

      if (dropzone) {
        // Drag Over
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.style.borderColor = 'var(--primary)';
          dropzone.style.background = 'var(--primary-light)';
        });
        
        // Drag Leave
        dropzone.addEventListener('dragleave', (e) => {
          e.preventDefault();
          dropzone.style.borderColor = 'var(--neutral-border)';
          dropzone.style.background = 'transparent';
        });

        // Drop
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.style.borderColor = 'var(--neutral-border)';
          dropzone.style.background = 'transparent';
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            fileLoadHandler(e.dataTransfer.files[0]);
          }
        });

        // Click to browse
        dropzone.addEventListener('click', () => {
          fileInput.click();
        });
      }

      // Sample photo chips
      container.querySelectorAll(`.sample-chip[data-target-q-id="${q.id}"]`).forEach(chip => {
        chip.addEventListener('click', () => {
          const imgKey = chip.getAttribute('data-img');
          const base64 = SAMPLE_PHOTOS[imgKey];
          if (base64) {
            dynamicPhotos[q.id] = base64;
            
            const hiddenInput = document.getElementById(`dynamic-q-${q.id}`);
            if (hiddenInput) {
              hiddenInput.value = base64;
              hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
              hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const previewImg = document.getElementById(`dynamic-photo-img-${q.id}`);
            const previewContainer = document.getElementById(`dynamic-photo-preview-${q.id}`);
            if (previewImg && previewContainer && dropzone) {
              previewImg.src = base64;
              previewContainer.classList.remove('hidden');
              dropzone.classList.add('hidden');
            }

            container.querySelectorAll(`.sample-chip[data-target-q-id="${q.id}"]`).forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
          }
        });
      });

      // Remove photo action
      const removeBtn = container.querySelector(`.btn-remove-photo[data-target-q-id="${q.id}"]`);
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          delete dynamicPhotos[q.id];
          
          const hiddenInput = document.getElementById(`dynamic-q-${q.id}`);
          if (hiddenInput) {
            hiddenInput.value = '';
            hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const previewImg = document.getElementById(`dynamic-photo-img-${q.id}`);
          const previewContainer = document.getElementById(`dynamic-photo-preview-${q.id}`);
          if (previewImg && previewContainer && dropzone) {
            previewImg.src = '';
            previewContainer.classList.add('hidden');
            dropzone.classList.remove('hidden');
          }

          container.querySelectorAll(`.sample-chip[data-target-q-id="${q.id}"]`).forEach(c => c.classList.remove('selected'));
          if (fileInput) fileInput.value = '';
        });
      }
    }); // end formForPhoto.questions.forEach
    }); // end formIds.forEach for photo handlers
  }

  // Set initial dependency states for all forms
  if (!isReadOnly) {
    formIds.forEach(fId => {
      const f = db.forms[fId];
      if (f) evaluateDynamicFormDependencies(f);
    });
  }
}

function prepopulateDynamicForm(route, data) {
  if (!data || !data.answers) return;
  const formIds = getRouteFormIds(route);
  if (formIds.length === 0) return;
  // Build a merged question map across all assigned forms
  const questionMap = {};
  formIds.forEach(fId => {
    const f = db.forms[fId];
    if (f) f.questions.forEach(q => { questionMap[q.id] = { q, fId }; });
  });

  dynamicPhotos = {};

  data.answers.forEach(ans => {
    const entry = questionMap[ans.id];
    if (!entry) return;
    const q = entry.q;

    if (q.type === 'yes_no' || q.type === 'multiple') {
      const radio = document.querySelector(`input[name="dynamic-q-${q.id}"][value="${ans.value}"]`);
      if (radio) radio.checked = true;
    } else if (q.type === 'photo') {
      if (ans.value) {
        dynamicPhotos[q.id] = ans.value;
        const hiddenInput = document.getElementById(`dynamic-q-${q.id}`);
        if (hiddenInput) hiddenInput.value = ans.value;

        const previewImg = document.getElementById(`dynamic-photo-img-${q.id}`);
        const previewContainer = document.getElementById(`dynamic-photo-preview-${q.id}`);
        const dropzone = document.getElementById(`dynamic-photo-dropzone-${q.id}`);
        
        if (previewImg && previewContainer && dropzone) {
          previewImg.src = ans.value;
          previewContainer.classList.remove('hidden');
          dropzone.classList.add('hidden');
        }
      }
    } else {
      const input = document.getElementById(`dynamic-q-${q.id}`);
      if (input) input.value = ans.value;
    }
  });

  evaluateDynamicFormDependencies(form);
}

function evaluateDynamicFormDependencies(form) {
  // We need to loop questions in order so that cascading dependencies work correctly
  const questionVisibility = {};

  form.questions.forEach(q => {
    let isVisible = true;

    if (q.dependency && q.dependency.parentId) {
      const parentId = q.dependency.parentId;
      const expectedVal = q.dependency.value;

      // The parent itself must be visible for this child to be visible
      const isParentVisible = questionVisibility[parentId] !== false;

      if (isParentVisible) {
        // Read parent value from DOM
        let parentVal = '';
        const parentQ = form.questions.find(pq => pq.id === parentId);
        
        if (parentQ) {
          if (parentQ.type === 'yes_no' || parentQ.type === 'multiple') {
            const checked = document.querySelector(`input[name="dynamic-q-${parentId}"]:checked`);
            parentVal = checked ? checked.value : '';
          } else {
            const input = document.getElementById(`dynamic-q-${parentId}`);
            parentVal = input ? input.value : '';
          }
        }

        isVisible = parentVal === expectedVal;
      } else {
        isVisible = false;
      }
    }

    questionVisibility[q.id] = isVisible;

    // Apply visibility and disabled/required state to DOM elements
    const group = document.querySelector(`.dynamic-form-group[data-q-id="${q.id}"]`);
    if (group) {
      const inputs = group.querySelectorAll('input, select, textarea, button:not(.btn-remove-photo)');
      if (isVisible) {
        group.classList.remove('hidden');
        inputs.forEach(input => {
          input.disabled = false;
          // Restore required if marked required
          if (q.required) {
            // For file inputs we don't set required directly, we set it on the hidden text input
            if (input.type === 'file') {
              input.required = false;
            } else if (input.id === `dynamic-q-${q.id}`) {
              input.required = true;
            } else if (input.type === 'radio') {
              input.required = true;
            } else {
              input.required = true;
            }
          } else {
            input.required = false;
          }
        });
      } else {
        group.classList.add('hidden');
        inputs.forEach(input => {
          input.disabled = true;
          input.required = false;
        });
      }
    }
  });

  validateFieldForm();
}

// --- NUEVAS FUNCIONES ETAPA 2D.3 (ADMIN TIENDAS Y CHECKIN) ---

let currentCheckinRouteId = null;

function openCheckinModal(routeId) {
  currentCheckinRouteId = routeId;
  const route = db.routes.find(r => r.id === routeId);
  const store = db.stores[route.storeId];
  
  if (!store || isNaN(parseFloat(store.latitude)) || isNaN(parseFloat(store.longitude)) || isNaN(parseFloat(store.geofenceRadius)) || parseFloat(store.geofenceRadius) <= 0) {
    alert("Error: La tienda no tiene configuración válida de geocerca (Lat, Lng o Radio faltante/inválido). No se puede realizar el check-in.");
    return; // User rule: Si falta radio o es inválido, bloquear check-in.
  }
  
  document.getElementById('checkin-store-name').textContent = store.name || store.storeName || "Tienda";
  document.getElementById('checkin-store-address').textContent = store.address || store.storeCode || store.code || "";
  
  document.getElementById('checkin-loading').classList.remove('hidden');
  document.getElementById('checkin-results').classList.add('hidden');
  document.getElementById('btn-confirm-checkin').classList.add('hidden');
  document.getElementById('btn-retry-checkin').classList.add('hidden');
  
  document.getElementById('checkin-modal').showModal();
  
  executeGPSCheckin();
}

async function executeGPSCheckin() {
  document.getElementById('checkin-loading').classList.remove('hidden');
  document.getElementById('checkin-results').classList.add('hidden');
  document.getElementById('btn-retry-checkin').classList.add('hidden');
  document.getElementById('btn-confirm-checkin').classList.add('hidden');
  
  const route = db.routes.find(r => r.id === currentCheckinRouteId);
  const store = db.stores[route.storeId];
  
  try {
    const position = await Geofence.getCurrentLocation();
    
    if (position.accuracy > window.GeofenceSettings.GPS_MAX_ACCURACY_METERS) {
      throw new Error(`Precisión insuficiente (${Math.round(position.accuracy)}m > límite ${window.GeofenceSettings.GPS_MAX_ACCURACY_METERS}m).`);
    }
    
    const distance = window.Geofence.calculateDistance(position.latitude, position.longitude, parseFloat(store.latitude), parseFloat(store.longitude));
    const radius = parseFloat(store.geofenceRadius);
    const isValid = distance <= radius;
    
    document.getElementById('checkin-accuracy').textContent = `${Math.round(position.accuracy)} m`;
    document.getElementById('checkin-distance').textContent = `${Math.round(distance)} m`;
    document.getElementById('checkin-radius').textContent = `${radius} m`;
    
    const banner = document.getElementById('checkin-status-banner');
    if (isValid) {
      banner.style.backgroundColor = 'var(--success-color)';
      banner.style.color = '#fff';
      banner.textContent = '¡Estás dentro de la tienda! ✅';
    } else {
      banner.style.backgroundColor = 'var(--danger-color)';
      banner.style.color = '#fff';
      banner.textContent = 'Estás fuera de la geocerca autorizada ❌';
    }
    
    document.getElementById('checkin-loading').classList.add('hidden');
    document.getElementById('checkin-results').classList.remove('hidden');
    
    let realPromoterId = null;
    const sessionStr = localStorage.getItem('fieldforce_session');
    if (sessionStr) {
      try {
        const s = JSON.parse(sessionStr);
        if (s && s.user && s.user.userId) {
          realPromoterId = s.user.userId;
        }
      } catch(e) {}
    }

    const finalRouteId = route.routeId;
    const finalRouteStoreId = route.id;
    const finalStoreId = store.storeId || store.id || route.storeId;

    if (!realPromoterId || !finalRouteId || !finalRouteStoreId || !finalStoreId) {
      throw new Error("Datos de ruta incompletos. Por favor sincroniza tus rutas e intenta nuevamente.");
    }
    
    // Attempt check-in with ApiService
    const visitData = {
      visitId: window.ApiService._generateUUID ? window.ApiService._generateUUID() : crypto.randomUUID(),
      routeId: finalRouteId,
      routeStoreId: finalRouteStoreId,
      storeId: finalStoreId,
      promoterId: realPromoterId,
      clientId: store.clientId || 'demo-client',
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      distanceToStore: distance,
      geofenceValid: isValid,
      locationSource: 'device_gps',
      createdOfflineAt: new Date().toISOString()
    };
    
    if (isValid) {
      const checkInResult = await window.ApiService.checkIn(visitData);
      if (checkInResult && checkInResult.success && window.SyncQueue) {
        await window.SyncQueue.waitForVisitSync(visitData.visitId, 10);
      }
      if (checkInResult && checkInResult.success) {
        route.status = 'en_visita'; 
        route.visitId = visitData.visitId; // Required for operations later
        localStorage.setItem('fieldflow_db', JSON.stringify(db));
        document.getElementById('btn-confirm-checkin').classList.remove('hidden');
      } else {
        throw new Error("Falla al guardar la visita. Intenta nuevamente.");
      }
    } else {
       document.getElementById('btn-retry-checkin').classList.remove('hidden');
    }
  } catch (err) {
     document.getElementById('checkin-loading').classList.add('hidden');
     document.getElementById('checkin-results').classList.remove('hidden');
     const banner = document.getElementById('checkin-status-banner');
     banner.textContent = `Error: ${err.message}`;
     banner.style.backgroundColor = 'var(--warning-color)';
     banner.style.color = '#333';
     document.getElementById('checkin-accuracy').textContent = '-- m';
     document.getElementById('checkin-distance').textContent = '-- m';
     document.getElementById('btn-retry-checkin').classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnCloseCheckinModal = document.getElementById('btn-close-checkin-modal');
  if(btnCloseCheckinModal) {
    btnCloseCheckinModal.addEventListener('click', () => document.getElementById('checkin-modal').close());
  }
  
  const btnRetryCheckin = document.getElementById('btn-retry-checkin');
  if(btnRetryCheckin) {
    btnRetryCheckin.addEventListener('click', executeGPSCheckin);
  }
  
  const btnConfirmCheckin = document.getElementById('btn-confirm-checkin');
  if(btnConfirmCheckin) {
    btnConfirmCheckin.addEventListener('click', () => {
      document.getElementById('checkin-modal').close();
      if(currentCheckinRouteId) {
        openRouteCapture(currentCheckinRouteId);
      }
    });
  }

  // Admin Stores Modals
  const storeModal = document.getElementById('store-modal');
  if (document.getElementById('btn-create-store')) {
    document.getElementById('btn-create-store').addEventListener('click', () => {
      document.getElementById('store-form').reset();
      document.getElementById('store-id-input').value = '';
      document.getElementById('store-radius-input').value = '100'; // Default per admin UI requirement
      storeModal.showModal();
    });
  }
  
  if (document.getElementById('btn-close-store-modal')) {
    document.getElementById('btn-close-store-modal').addEventListener('click', () => storeModal.close());
  }
  
  if (document.getElementById('btn-cancel-store-modal')) {
    document.getElementById('btn-cancel-store-modal').addEventListener('click', () => storeModal.close());
  }
  
  const btnUseLoc = document.getElementById('btn-use-my-location');
  if (btnUseLoc) {
    btnUseLoc.addEventListener('click', async () => {
      try {
        btnUseLoc.disabled = true;
        btnUseLoc.innerHTML = '<div class="loader-spinner" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:5px;"></div> Obteniendo...';
        const pos = await Geofence.getCurrentLocation();
        document.getElementById('store-lat-input').value = pos.latitude;
        document.getElementById('store-lng-input').value = pos.longitude;
      } catch(e) {
        alert("Error de ubicación: " + e.message);
      } finally {
        btnUseLoc.disabled = false;
        btnUseLoc.innerHTML = '<i data-lucide="crosshair"></i> Usar mi ubicación actual';
        lucide.createIcons();
      }
    });
  }
  
  const storeForm = document.getElementById('store-form');
  if (storeForm) {
    storeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lat = parseFloat(document.getElementById('store-lat-input').value);
      const lng = parseFloat(document.getElementById('store-lng-input').value);
      const radius = parseFloat(document.getElementById('store-radius-input').value);
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        alert("Coordenadas inválidas. Latitud [-90, 90], Longitud [-180, 180].");
        return;
      }
      if (radius <= 0) {
        alert("El radio de geocerca debe ser mayor a 0.");
        return;
      }
      
      const adminClientGroup = document.getElementById('admin-store-client-group');
      let finalClientId = window.selectedClientId;
      
      if (adminClientGroup && !adminClientGroup.classList.contains('hidden')) {
        const selectedVal = document.getElementById('store-client-id').value;
        if (!selectedVal) {
          alert("Selecciona el cliente al que pertenece la tienda.");
          return;
        }
        finalClientId = selectedVal;
      }
      
      if (!finalClientId) {
        alert("Selecciona el cliente al que pertenece la tienda.");
        return;
      }

      const storeData = {
        clientId: finalClientId,
        storeCode: document.getElementById('store-code-input').value.trim(),
        chain: document.getElementById('store-chain-input').value.trim(),
        storeName: document.getElementById('store-name-input').value.trim(),
        address: document.getElementById('store-address-input').value.trim(),
        city: document.getElementById('store-city-input').value.trim(),
        state: document.getElementById('store-state-input').value.trim(),
        latitude: lat,
        longitude: lng,
        geofenceRadius: radius,
        status: document.getElementById('store-status-input').value
      };
      
      const storeId = document.getElementById('store-id-input').value;
      const btnSave = document.getElementById('btn-save-store');
      
      try {
        btnSave.disabled = true;
        let res;
        if (storeId) {
          res = await window.ApiService.updateStore(storeId, storeData);
        } else {
          res = await window.ApiService.createStore(storeData);
        }
        
        if (res && res.success) {
          alert("Tienda guardada exitosamente.");
          storeModal.close();
          const storesRes = await ApiService.getStores(window.selectedClientId || 'demo-client');
          if(storesRes && storesRes.success) {
            storesRes.data.forEach(s => {
              const norm = normalizeStore(s);
              db.stores[norm.id] = norm;
            });
            renderCentralConsole();
          }
        } else {
          alert("Error al guardar: " + (res.error?.message || 'Desconocido'));
        }
      } catch(err) {
        alert("Error de red: " + err.message);
      } finally {
        btnSave.disabled = false;
      }
    });
  }
  
  const btnProcessStores = document.getElementById('btn-process-stores');
  if (btnProcessStores) {
    btnProcessStores.addEventListener('click', async () => {
      const pasteText = document.getElementById('stores-copy-paste').value.trim();
      if (!pasteText) return alert("Por favor pega filas de datos.");
      
      const lines = pasteText.split('\n');
      const rows = lines.map(l => l.split('\t'));
      if (rows.length < 2) return alert("Se requiere encabezados y datos.");
      
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1);
      let successCount = 0;
      let errorCount = 0;
      let errors = [];
      
      btnProcessStores.disabled = true;
      btnProcessStores.innerHTML = "Importando...";
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length < 2) continue; // skip empty rows
        
        const getVal = (col) => row[headers.indexOf(col)] || '';
        const storeCode = getVal('store_code');
        const storeName = getVal('store_name');
        const lat = parseFloat(getVal('latitude'));
        const lng = parseFloat(getVal('longitude'));
        const radius = parseFloat(getVal('geofence_radius'));
        
        if (!storeCode || !storeName || isNaN(lat) || isNaN(lng) || isNaN(radius) || lat < -90 || lat > 90 || lng < -180 || lng > 180 || radius <= 0) {
          errors.push(`Fila ${i+2}: Faltan datos o coords inválidas. Omitida.`);
          errorCount++;
          continue;
        }
        
        if (!window.selectedClientId) {
          alert("Selecciona el cliente activo en la barra superior antes de importar tiendas.");
          btnProcessStores.disabled = false;
          btnProcessStores.innerHTML = '<i data-lucide="upload"></i> Importar Tiendas';
          return;
        }

        try {
          const res = await window.ApiService.createStore({
            clientId: window.selectedClientId,
            storeCode, storeName, chain: getVal('chain'), address: getVal('address'), 
            city: getVal('city'), state: getVal('state'), 
            latitude: lat, longitude: lng, geofenceRadius: radius, status: 'active'
          });
          if (res && res.success) successCount++;
          else { errors.push(`Fila ${i+2}: Error - ${res.error?.message}`); errorCount++; }
        } catch(e) {
           errors.push(`Fila ${i+2}: Red - ${e.message}`); errorCount++;
        }
      }
      
      alert(`Creadas: ${successCount}. Errores: ${errorCount}.\n\n${errors.join('\n')}`);
      btnProcessStores.disabled = false;
      btnProcessStores.innerHTML = '<i data-lucide="upload"></i> Importar Tiendas';
      lucide.createIcons();
      
      const storesRes = await ApiService.getStores(window.selectedClientId || 'demo-client');
      if(storesRes && storesRes.success) {
        storesRes.data.forEach(s => {
          const norm = normalizeStore(s);
          db.stores[norm.id] = norm;
        });
        renderCentralConsole();
      }
    });
  }
});
