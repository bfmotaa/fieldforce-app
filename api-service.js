/**
 * =============================================================================
 * FIELDFORCE — API SERVICE (Capa de Abstracción)
 * =============================================================================
 *
 * Módulo central de comunicación entre FieldForce y el Google Apps Script.
 *
 * REGLAS CRÍTICAS:
 * - El frontend NUNCA llama directamente a Google Sheets o Drive.
 * - Toda comunicación pasa por este módulo → Apps Script → Google.
 * - Las credenciales y IDs de Google viven en el servidor (PropertiesService).
 * - Este módulo maneja: sesiones, reintentos, idempotencia, cola offline.
 *
 * FLUJO DE UNA SOLICITUD:
 *   UI → ApiService.método() → fetch(appsScriptUrl) → Apps Script → Sheets/Drive
 *
 * IDEMPOTENCIA:
 *   Cada solicitud de escritura incluye un client_request_id único.
 *   Si la misma solicitud llega dos veces, Apps Script retorna el registro
 *   existente sin crear un duplicado.
 */

'use strict';

const ApiService = (() => {

  // ─── Estado interno ────────────────────────────────────────────────────────

  /** Cola de solicitudes pendientes de sincronización */
  const _syncQueue = [];

  /** Flag que indica si hay una sincronización en proceso */
  let _isSyncing = false;

  // ─── Utilidades privadas ──────────────────────────────────────────────────

  /**
   * Genera un ID único de solicitud del cliente (UUID v4 simplificado).
   * Se usa para garantizar idempotencia en operaciones de escritura.
   * @returns {string}
   */
  function _generateClientRequestId() {
    return 'cr-' + ([1e7]+-1e3+-4e3+-8e3+-1e11)
      .replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
  }

  /**
   * Genera un Device ID persistente en localStorage.
   * @returns {string}
   */
  function _getDeviceId() {
    let deviceId = localStorage.getItem('fieldforce_device_id');
    if (!deviceId) {
      deviceId = 'dev-' + _generateClientRequestId();
      localStorage.setItem('fieldforce_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Obtiene el token de sesión activo desde localStorage.
   * @returns {string|null}
   */
  function _getSessionToken() {
    try {
      const session = JSON.parse(localStorage.getItem(FIELDFORCE_CONFIG.sessionKey) || 'null');
      return session && session.token ? session.token : null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el Apps Script está configurado (URL no es placeholder).
   * @returns {boolean}
   */
  function _isConfigured() {
    return isApiConfigured();
  }

  /**
   * Realiza una solicitud POST al Apps Script.
   *
   * CORS — Por qué usamos Content-Type: text/plain;charset=utf-8
   * ─────────────────────────────────────────────────────────────
   * Apps Script Web App NO envía Access-Control-Allow-Headers, por lo que
   * cualquier solicitud con 'Content-Type: application/json' dispara un
   * preflight OPTIONS que el navegador bloquea (CORS error).
   *
   * Al usar 'text/plain;charset=utf-8' la solicitud es "simple" según el
   * estándar CORS (https://fetch.spec.whatwg.org/#simple-header) y NO
   * dispara preflight. Apps Script puede leer el body con:
   *   JSON.parse(e.postData.contents)
   *
   * El sessionToken viaja en el body JSON (nunca en Authorization).
   *
   * @param {string} action - Nombre de la acción/endpoint
   * @param {Object} payload - Datos a enviar
   * @param {Object} [options] - Opciones adicionales
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async function _post(action, payload = {}, options = {}) {
    if (!_isConfigured()) {
      // NOT marked _offline:true — this is a config error, not a network error
      return {
        success: false,
        error: {
          code: 'API_NOT_CONFIGURED',
          message: 'El servicio no está configurado. Proporciona la URL de Apps Script en config.js.'
        },
        timestamp: new Date().toISOString(),
        _offline: false
      };
    }

    // Build payload — sessionToken goes in body, never in a header
    const body = {
      action,
      deviceId: _getDeviceId(),
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // Inject session token from localStorage if not already in payload
    if (!body.sessionToken) {
      const token = _getSessionToken();
      if (token) body.sessionToken = token;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      FIELDFORCE_CONFIG.sync.requestTimeoutMs
    );

    try {
      const response = await fetch(FIELDFORCE_CONFIG.appsScriptUrl, {
        method: 'POST',
        signal: controller.signal,
        // 'text/plain;charset=utf-8' is a CORS simple request — no preflight OPTIONS.
        // Apps Script reads the body with JSON.parse(e.postData.contents).
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(body),
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: { code: 'REQUEST_TIMEOUT', message: 'La solicitud tardó demasiado. Verifica tu conexión.' },
          timestamp: new Date().toISOString(),
          _offline: false
        };
      }

      // Genuine network failure (device offline, DNS error, etc.)
      // NOT triggered by CORS or config issues — those are caught above or rejected differently
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Sin conexión o error de red. Los datos se guardarán localmente.' },
        timestamp: new Date().toISOString(),
        _offline: true
      };
    }
  }

  // ─── API PÚBLICA ─────────────────────────────────────────────────────────


  // ── Sistema ────────────────────────────────────────────────────────────────

  /**
   * Verifica que el Apps Script esté funcionando correctamente.
   *
   * Usa GET con ?action=health para evitar completamente CORS preflight:
   * - No body → no Content-Type → solicitud simple → sin OPTIONS.
   * - Code.gs lo maneja en doGet(e) leyendo e.parameter.action.
   *
   * Respuesta esperada:
   * {
   *   success: true,
   *   data: { service: "FieldForce Apps Script API", environment: "pilot",
   *           spreadsheetConfigured: true },
   *   message: "Conexión correcta",
   *   timestamp: "ISO_DATE"
   * }
   *
   * Respuesta cuando NO está configurado:
   * {
   *   success: false,
   *   error: { code: "API_NOT_CONFIGURED", ... },
   *   _offline: false
   * }
   *
   * @returns {Promise<Object>}
   */
  async function health() {
    if (!_isConfigured()) {
      return {
        success: false,
        error: {
          code: 'API_NOT_CONFIGURED',
          message: 'Apps Script URL no configurada. Actualiza config.js con la URL /exec real.'
        },
        timestamp: new Date().toISOString(),
        _offline: false
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      FIELDFORCE_CONFIG.sync.requestTimeoutMs
    );

    try {
      // GET request — no headers, no body → CORS simple request, no OPTIONS preflight
      const response = await fetch(
        `${FIELDFORCE_CONFIG.appsScriptUrl}?action=health`,
        {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: { code: 'REQUEST_TIMEOUT', message: 'Health check tardó demasiado.' },
          timestamp: new Date().toISOString(),
          _offline: false
        };
      }

      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'No se pudo contactar el servidor.' },
        timestamp: new Date().toISOString(),
        _offline: true
      };
    }
  }

  /**
   * Obtiene la configuración del servidor (timeouts, límites de foto, etc.)
   * @returns {Promise<Object>}
   */
  async function getConfig() {
    return await _post('getConfig');
  }


  // ── Autenticación ──────────────────────────────────────────────────────────

  /**
   * Inicia sesión con usuario y contraseña administrados por FieldForce.
   * NO usa cuentas de Google. NO requiere correo personal.
   *
   * @param {string} username - Nombre de usuario (ej: promotor01, bmota)
   * @param {string} password - Contraseña (nunca se almacena, solo se envía)
   * @returns {Promise<Object>} - Token de sesión + datos del usuario + mustChangePassword
   */
  async function login(username, password) {
    if (!navigator.onLine) {
      return {
        success: false,
        error: { code: 'OFFLINE', message: 'Se requiere conexión a internet para iniciar sesión por primera vez.' },
        timestamp: new Date().toISOString()
      };
    }

    if (!username || !password) {
      return {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Usuario y contraseña son requeridos.' },
        timestamp: new Date().toISOString()
      };
    }

    const result = await _post('login', { username: username.trim().toLowerCase(), password });

    if (result.success && result.data && result.data.sessionToken) {
      // Almacenar SOLO el token y datos básicos del usuario (nunca la contraseña)
      const sessionData = {
        token: result.data.sessionToken,
        user: result.data.user,
        mustChangePassword: result.data.mustChangePassword || false,
        expiresAt: result.data.expiresAt,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(FIELDFORCE_CONFIG.sessionKey, JSON.stringify(sessionData));

      if (window.IndexedDB && window.STORES) {
        await window.IndexedDB.put(window.STORES.LOCAL_SESSION, {
          session_id: result.data.sessionToken,
          user_id: result.data.user.id || '',
          role: result.data.user.role || '',
          client_id: result.data.user.clientId || '',
          device_id: _getDeviceId(),
          validated_at: new Date().toISOString(),
          expires_at: result.data.expiresAt || ''
        });
      }
    }

    return result;
  }

  /**
   * Valida que la sesión activa sea todavía válida.
   * En modo offline, valida el tiempo de expiración local.
   * @returns {Promise<Object>}
   */
  async function validateSession() {
    const sessionStr = localStorage.getItem(FIELDFORCE_CONFIG.sessionKey);
    if (!sessionStr) {
      return {
        success: false,
        error: { code: 'NO_SESSION', message: 'No hay sesión activa.' },
        timestamp: new Date().toISOString()
      };
    }

    const sessionData = JSON.parse(sessionStr);

    // Validación local básica de caducidad si está offline
    if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
      localStorage.removeItem(FIELDFORCE_CONFIG.sessionKey);
      return { 
        success: false, 
        error: { code: 'SESSION_EXPIRED', message: 'La sesión local ha caducado.' },
        timestamp: new Date().toISOString()
      };
    }

    if (!navigator.onLine) {
      // Permitir operar offline si la sesión parece válida
      return { 
        success: true,
        data: {
          user: sessionData.user,
          mustChangePassword: sessionData.mustChangePassword
        },
        message: 'Sesión validada offline.' 
      };
    }

    const token = _getSessionToken();
    const result = await _post('validateSession', { sessionToken: token, device_id: _getDeviceId() });
    
    // Si la sesión fue revocada o expiró en el servidor, limpiar almacenamiento de sesión
    // Nota: Las operaciones pendientes en la cola (VISITS, PENDING_PHOTOS, etc.) NO SE BORRAN.
    // Esto asegura que al volver a iniciar sesión se intente sincronizar lo pendiente.
    if (!result.success && result.error && (result.error.code === 'SESSION_EXPIRED' || result.error.code === 'INVALID_SESSION')) {
      localStorage.removeItem(FIELDFORCE_CONFIG.sessionKey);
      if (window.IndexedDB && window.STORES) {
        await window.IndexedDB.clear(window.STORES.LOCAL_SESSION);
      }
    }
    
    return result;
  }

  /**
   * Cierra la sesión actual. Invalida el token en el servidor y limpia localStorage.
   * @returns {Promise<Object>}
   */
  async function logout() {
    const result = await _post('logout');
    // Siempre limpiar localmente, independientemente de la respuesta del servidor
    localStorage.removeItem(FIELDFORCE_CONFIG.sessionKey);
    if (window.IndexedDB && window.STORES) {
      await window.IndexedDB.clear(window.STORES.LOCAL_SESSION);
    }
    return result;
  }

  /**
   * Cambia la contraseña del usuario autenticado.
   * Se usa en el primer acceso (mustChangePassword = true) y cuando el usuario lo solicita.
   *
   * @param {string} currentPassword - Contraseña actual (para verificar identidad)
   * @param {string} newPassword - Nueva contraseña
   * @param {string} newPasswordConfirm - Confirmación de la nueva contraseña
   * @returns {Promise<Object>}
   */
  async function changePassword(currentPassword, newPassword, newPasswordConfirm) {
    if (newPassword !== newPasswordConfirm) {
      return {
        success: false,
        error: { code: 'PASSWORD_MISMATCH', message: 'Las contraseñas no coinciden.' },
        timestamp: new Date().toISOString()
      };
    }
    return await _post('changePassword', { currentPassword, newPassword });
  }

  /**
   * Asigna una ruta a un promotor.
   * @param {string} routeId
   * @param {string} promoterId
   * @param {string} supervisorId
   * @returns {Promise<Object>}
   */
  async function assignRoute(routeId, promoterId, supervisorId) {
    return await _post('assignRoute', { routeId, promoterId, supervisorId });
  }

  /**
   * Sube masivamente las rutas al servidor desde el CSV
   * @param {Array} routes - Arreglo de rutas parseadas
   */
  async function uploadRoutes(routes) {
    return await _post('bulkUploadRoutes', { routes });
  }

  // ── Gestor de Sincronización (Etapa 2E) ──────────────────────────────────────────────


  // ── Administración de usuarios ──────────────────────────────────────────────

  /**
   * Crea un nuevo usuario (solo administradores).
   * La contraseña temporal se entrega al empleado manualmente.
   *
   * @param {Object} userData
   * @param {string} userData.username
   * @param {string} userData.fullName
   * @param {string} userData.role
   * @param {string} [userData.email]
   * @param {string} [userData.clientId]
   * @param {string} [userData.supervisorId]
   * @param {string} userData.temporaryPassword - Se hashea en el servidor
   * @returns {Promise<Object>}
   */
  async function adminCreateUser(userData) {
    const requestId = _generateClientRequestId();
    return await _post('adminCreateUser', {
      client_request_id: requestId,
      ...userData
    });
  }

  /**
   * Restablece la contraseña de un usuario (solo administradores).
   * Activa mustChangePassword = true.
   *
   * @param {string} userId - ID del usuario a restablecer
   * @param {string} newTemporaryPassword - Nueva contraseña temporal
   * @returns {Promise<Object>}
   */
  async function adminResetPassword(userId, newTemporaryPassword) {
    return await _post('adminResetPassword', { userId, newTemporaryPassword });
  }

  /**
   * Lista todos los usuarios (solo administradores). Nunca incluye contraseñas.
   * @returns {Promise<Object>}
   */
  async function getUsers() {
    return await _post('getUsers');
  }

  /**
   * Activa un usuario bloqueado o inactivo.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async function adminActivateUser(userId) {
    return await _post('adminActivateUser', { userId });
  }

  /**
   * Desactiva un usuario (no puede iniciar sesión).
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async function adminDeactivateUser(userId) {
    return await _post('adminDeactivateUser', { userId });
  }

  /**
   * Desbloquea manualmente un usuario bloqueado por intentos fallidos.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async function adminUnlockUser(userId) {
    return await _post('adminUnlockUser', { userId });
  }


  // ── Utilidad compartida para validaciones locales ────────────────────────────

  /**
   * Construye una respuesta de error local (sin fetch).
   * Usado por métodos que detectan parámetros inválidos antes de llamar al servidor.
   * @param {string} code
   * @param {string} message
   * @returns {Object}
   */
  function _localError(code, message) {
    return {
      success: false,
      error: { code, message },
      timestamp: new Date().toISOString()
    };
  }

  // ── Catálogos — Tiendas ────────────────────────────────────────────────

  /**
   * Retorna tiendas activas filtradas por cliente.
   * Promotores solo ven las de su propio client_id.
   * @param {string} [clientId]
   * @returns {Promise<Object>}
   */
  async function getStores(clientId) {
    return await _post('getStores', clientId ? { clientId } : {});
  }

  /**
   * Retorna una tienda por su ID.
   * @param {string} storeId
   * @returns {Promise<Object>}
   */
  async function getStoreById(storeId) {
    if (!storeId) return _localError('INVALID_INPUT', 'Se requiere storeId.');
    return await _post('getStoreById', { storeId });
  }

  /**
   * Crea una tienda nueva.
   * Idempotente: usa client_request_id generado automáticamente.
   *
   * @param {Object} storeData
   * @param {string} storeData.clientId
   * @param {string} storeData.chain
   * @param {string} storeData.storeCode
   * @param {string} storeData.storeName
   * @param {string} [storeData.address]
   * @param {string} [storeData.city]
   * @param {string} [storeData.state]
   * @param {number} [storeData.latitude]
   * @param {number} [storeData.longitude]
   * @param {number} [storeData.geofenceRadius]
   * @returns {Promise<Object>}
   */
  async function createStore(storeData) {
    const requestId = _generateClientRequestId();
    return await _post('createStore', {
      client_request_id: requestId,
      ...storeData
    });
  }

  /**
   * Actualiza campos de una tienda existente.
   * @param {string} storeId
   * @param {Object} updates - Campos a modificar
   * @returns {Promise<Object>}
   */
  async function updateStore(storeId, updates) {
    if (!storeId) return _localError('INVALID_INPUT', 'Se requiere storeId.');
    return await _post('updateStore', { storeId, ...updates });
  }

  /**
   * Desactiva una tienda (soft delete).
   * @param {string} storeId
   * @returns {Promise<Object>}
   */
  async function deactivateStore(storeId) {
    if (!storeId) return _localError('INVALID_INPUT', 'Se requiere storeId.');
    return await _post('deactivateStore', { storeId });
  }


  // ── Catálogos — Productos ────────────────────────────────────────────

  /**
   * Retorna productos activos filtrados por cliente.
   * Promotores solo ven los de su propio client_id.
   * @param {string} [clientId]
   * @returns {Promise<Object>}
   */
  async function getProducts(clientId) {
    return await _post('getProducts', clientId ? { clientId } : {});
  }

  /**
   * Alias explícito para obtener productos de un cliente específico.
   * @param {string} clientId
   * @returns {Promise<Object>}
   */
  async function getProductsByClient(clientId) {
    if (!clientId) return _localError('INVALID_INPUT', 'Se requiere clientId.');
    return await _post('getProductsByClient', { clientId });
  }

  /**
   * Retorna un producto por su ID.
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async function getProductById(productId) {
    if (!productId) return _localError('INVALID_INPUT', 'Se requiere productId.');
    return await _post('getProductById', { productId });
  }

  /**
   * Crea un producto nuevo.
   * Idempotente: usa client_request_id generado automáticamente.
   *
   * @param {Object} productData
   * @param {string} productData.clientId
   * @param {string} productData.sku
   * @param {string} productData.brand
   * @param {string} productData.category
   * @param {string} productData.productName
   * @param {string} productData.presentation
   * @param {string} [productData.barcode]
   * @param {number} [productData.srp]
   * @param {number} [productData.minPrice]
   * @param {number} [productData.maxPrice]
   * @param {number} [productData.avgDailySales]
   * @returns {Promise<Object>}
   */
  async function createProduct(productData) {
    const requestId = _generateClientRequestId();
    return await _post('createProduct', {
      client_request_id: requestId,
      ...productData
    });
  }

  /**
   * Actualiza campos de un producto existente.
   * @param {string} productId
   * @param {Object} updates - Campos a modificar
   * @returns {Promise<Object>}
   */
  async function updateProduct(productId, updates) {
    if (!productId) return _localError('INVALID_INPUT', 'Se requiere productId.');
    return await _post('updateProduct', { productId, ...updates });
  }

  /**
   * Desactiva un producto (soft delete).
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async function deactivateProduct(productId) {
    if (!productId) return _localError('INVALID_INPUT', 'Se requiere productId.');
    return await _post('deactivateProduct', { productId });
  }


  // ── Rutas ──────────────────────────────────────────────────────────────────

  /**
   * Obtiene las rutas de un promotor para una fecha específica.
   * @param {string} promoterId
   * @param {string} date - Formato YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  async function getTodayRoute(promoterId, date) {
    return await _post('getTodayRoute', { promoterId, date });
  }

  async function getRoutes(clientId, promoterId) {
    return await _post('getRoutes', { clientId, promoterId });
  }

  async function getRouteById(routeId) {
    if (!routeId) return _localError('INVALID_INPUT', 'Se requiere routeId.');
    return await _post('getRouteById', { routeId });
  }

  async function createRoute(routeData, clientRequestId) {
    return await _post('createRoute', {
      ...routeData,
      client_request_id: clientRequestId
    });
  }

  async function updateRoute(routeId, updates) {
    if (!routeId) return _localError('INVALID_INPUT', 'Se requiere routeId.');
    return await _post('updateRoute', { routeId, ...updates });
  }

  async function assignRoute(routeId, promoterId) {
    if (!routeId) return _localError('INVALID_INPUT', 'Se requiere routeId.');
    if (!promoterId) return _localError('INVALID_INPUT', 'Se requiere promoterId.');
    return await _post('assignRoute', { routeId, promoterId });
  }

  async function addStoreToRoute(routeId, storeId, visitOrder, scheduledStart, scheduledEnd, clientRequestId) {
    if (!routeId) return _localError('INVALID_INPUT', 'Se requiere routeId.');
    if (!storeId) return _localError('INVALID_INPUT', 'Se requiere storeId.');
    return await _post('addStoreToRoute', {
      routeId, storeId, visitOrder, scheduledStart, scheduledEnd, client_request_id: clientRequestId
    });
  }

  async function removeStoreFromRoute(routeStoreId) {
    if (!routeStoreId) return _localError('INVALID_INPUT', 'Se requiere routeStoreId.');
    return await _post('removeStoreFromRoute', { routeStoreId });
  }

  async function adminUnlockUser(userId) {
    if (!userId) return _localError('INVALID_INPUT', 'Se requiere userId.');
    return await _post('adminUnlockUser', { userId });
  }

  // ── Catálogos — Clientes ───────────────────────────────────────────────────

  /**
   * Obtiene el catálogo de clientes activos.
   * Solo para uso de administrador global.
   * @returns {Promise<Object>}
   */
  async function getClients() {
    return await _post('getClients');
  }

  // ── Catálogos — Tiendas ────────────────────────────────────────────────────────────────

  async function completeRoute(routeId) {
    if (!routeId) return _localError('INVALID_INPUT', 'Se requiere routeId.');
    return await _post('completeRoute', { routeId });
  }

  // ── Formularios ────────────────────────────────────────────────────────────────

  async function getForms() {
    return await _post('getForms');
  }

  async function createForm(formName, questions) {
    const requestId = _generateClientRequestId();
    return await _post('createForm', {
      client_request_id: requestId,
      formName,
      questions
    });
  }

  async function updateForm(formId, formName, questions, status) {
    const requestId = _generateClientRequestId();
    return await _post('updateForm', {
      client_request_id: requestId,
      formId,
      formName,
      questions,
      status
    });
  }

  async function deleteForm(formId) {
    return await _post('deleteForm', { formId });
  }

  // ── Visitas ────────────────────────────────────────────────────────────────

  /**
   * Registra el check-in de una visita. Se llama DESPUÉS de confirmar el
   * check-in localmente y superar la validación de geocerca.
   *
   * Incluye client_request_id para garantizar idempotencia.
   *
   * @param {Object} visitData
   * @param {string} visitData.routeId
   * @param {string} visitData.routeStoreId
   * @param {string} visitData.storeId
   * @param {string} visitData.promoterId
   * @param {string} visitData.clientId
   * @param {number} visitData.latitude
   * @param {number} visitData.longitude
   * @param {number} visitData.accuracy
   * @param {number} visitData.distanceToStore
   * @param {boolean} visitData.geofenceValid
   * @param {string} visitData.locationSource - 'device_gps' | 'simulator' | 'manual'
   * @param {string} visitData.createdOfflineAt - ISO timestamp local
   * @returns {Promise<Object>}
   */
  async function checkIn(visitData) {
    const requestId = _generateClientRequestId();
    const payload = {
      client_request_id: requestId,
      device_id: _getDeviceId(),
      ...visitData
    };

    if (window.IndexedDB && window.STORES) {
      await window.IndexedDB.put(window.STORES.VISITS, {
        visit_id: visitData.visitId,
        sync_status: 'pending',
        ...payload
      });
    }

    if (window.SyncQueue) {
      return await window.SyncQueue.enqueue({
        endpoint: 'checkIn',
        entityType: 'VISIT',
        entityLocalId: visitData.visitId,
        visitLocalId: visitData.visitId,
        operationStage: 10,
        payload: payload,
        clientRequestId: requestId
      });
    }
    return await _post('checkIn', payload);
  }

  /**
   * Guarda los datos de un producto capturado durante una visita.
   * Se llama SOLO cuando el usuario confirma con acción explícita.
   *
   * @param {Object} productData
   * @param {string} productData.visitId
   * @param {string} productData.productId
   * @param {number} [productData.initialInventory]
   * @param {number} [productData.shelfInventory]
   * @param {number} [productData.backroomInventory]
   * @param {number} [productData.finalInventory]
   * @param {number} [productData.gapQuantity]
   * @param {boolean} [productData.outOfStock]
   * @param {number} [productData.replenishmentQuantity]
   * @param {number} [productData.regularPrice]
   * @param {number} [productData.promotionPrice]
   * @param {string} [productData.promotionType]
   * @param {number} [productData.facings]
   * @param {number} [productData.visibleShare]
   * @param {string} [productData.comments]
   * @returns {Promise<Object>}
   */
  async function saveVisitProduct(productData) {
    const requestId = _generateClientRequestId();
    const payload = {
      client_request_id: requestId,
      device_id: _getDeviceId(),
      ...productData
    };

    if (window.IndexedDB && window.STORES) {
      await window.IndexedDB.put(window.STORES.VISIT_PRODUCTS, {
        visit_product_id: productData.visitProductId || requestId,
        visit_id: productData.visitId,
        sync_status: 'pending',
        ...payload
      });
    }

    if (window.SyncQueue) {
      return await window.SyncQueue.enqueue({
        endpoint: 'saveVisitProduct',
        entityType: 'VISIT_PRODUCT',
        entityLocalId: productData.visitProductId || requestId,
        visitLocalId: productData.visitId,
        operationStage: 20,
        payload: payload,
        clientRequestId: requestId
      });
    }
    return await _post('saveVisitProduct', payload);
  }

  async function saveFormResponse(responseData) {
    const requestId = _generateClientRequestId();
    const payload = { client_request_id: requestId, device_id: _getDeviceId(), ...responseData };
    if (window.SyncQueue) {
      return await window.SyncQueue.enqueue({ endpoint: 'saveFormResponse', entityType: 'FORM_RESPONSE', entityLocalId: requestId, visitLocalId: responseData.visitId, operationStage: 20, payload, clientRequestId: requestId });
    }
    return await _post('saveFormResponse', payload);
  }

  /**
   * Guarda un precio de competencia durante una visita.
   * Se llama SOLO con acción explícita del usuario.
   *
   * @param {Object} competitorData
   * @returns {Promise<Object>}
   */
  async function saveCompetitorPrice(competitorData) {
    const requestId = _generateClientRequestId();
    const payload = {
      client_request_id: requestId,
      device_id: _getDeviceId(),
      ...competitorData
    };

    if (window.IndexedDB && window.STORES) {
      await window.IndexedDB.put(window.STORES.COMPETITOR_PRICES, {
        competitor_price_id: competitorData.competitorPriceId || requestId,
        visit_id: competitorData.visitId,
        sync_status: 'pending',
        ...payload
      });
    }

    if (window.SyncQueue) {
      return await window.SyncQueue.enqueue({
        endpoint: 'saveCompetitorPrice',
        entityType: 'COMPETITOR_PRICE',
        entityLocalId: competitorData.competitorPriceId || requestId,
        visitLocalId: competitorData.visitId,
        operationStage: 30,
        payload: payload,
        clientRequestId: requestId
      });
    }
    return await _post('saveCompetitorPrice', payload);
  }

  /**
   * Registra el check-out y marca la visita como completada.
   * Se llama SOLO cuando el usuario confirma con acción explícita.
   *
   * @param {Object} checkoutData
   * @param {string} checkoutData.visitId
   * @param {number} checkoutData.latitude
   * @param {number} checkoutData.longitude
   * @param {string} checkoutData.locationSource
   * @param {string} [checkoutData.comments]
   * @returns {Promise<Object>}
   */
  async function checkOut(checkoutData) {
    const requestId = _generateClientRequestId();
    const payload = {
      client_request_id: requestId,
      device_id: _getDeviceId(),
      ...checkoutData
    };

    if (window.IndexedDB && window.STORES) {
      const visit = await window.IndexedDB.get(window.STORES.VISITS, checkoutData.visitId);
      if (visit) {
        visit.checkout_at = new Date().toISOString();
        visit.status = 'completed';
        await window.IndexedDB.put(window.STORES.VISITS, visit);
      }
    }

    if (window.SyncQueue) {
      return await window.SyncQueue.enqueue({
        endpoint: 'checkOut',
        entityType: 'VISIT_CHECKOUT',
        entityLocalId: checkoutData.visitId,
        visitLocalId: checkoutData.visitId,
        operationStage: 50,
        payload: payload,
        clientRequestId: requestId
      });
    }
    return await _post('checkOut', payload);
  }


  // ── Fotografías ────────────────────────────────────────────────────────────

  /**
   * Sube una fotografía a Google Drive.
   * La foto se comprime y redimensiona ANTES de llamar esta función.
   * Nunca guarda Base64 en Google Sheets — solo en Drive.
   *
   * @param {Object} photoData
   * @param {string} photoData.visitId
   * @param {string} [photoData.visitProductId]
   * @param {string} photoData.photoType - 'checkin' | 'initial_shelf' | etc.
   * @param {string} photoData.fileName - Nombre sanitizado
   * @param {string} photoData.base64Data - Datos de la imagen en Base64
   * @param {string} photoData.mimeType - 'image/jpeg' | 'image/png'
   * @param {string} [photoData.comments]
   * @returns {Promise<Object>} - photo_id, drive_file_id, status
   */
  async function uploadPhoto(photoData) {
    const requestId = _generateClientRequestId();
    let normalizedBase64 = photoData.base64Data || '';
    let normalizedMimeType = photoData.mimeType || 'image/jpeg';
    if (normalizedBase64.startsWith('data:')) {
      const match = normalizedBase64.match(/^data:([^;,]+);base64,(.*)$/s);
      if (match) {
        normalizedMimeType = match[1];
        normalizedBase64 = match[2];
      }
    }
    const payload = {
      client_request_id: requestId,
      device_id: _getDeviceId(),
      ...photoData,
      base64Data: normalizedBase64,
      mimeType: normalizedMimeType
    };

    if (window.IndexedDB && window.STORES) {
      await window.IndexedDB.put(window.STORES.PENDING_PHOTOS, {
        photo_id: photoData.photoId || requestId,
        visit_id: photoData.visitId,
        sync_status: 'pending',
        photoBlob: photoData.photoBlob,
        fileName: photoData.fileName,
        ...payload
      });
    }

    if (window.SyncQueue) {
      return await window.SyncQueue.enqueue({
        endpoint: 'uploadPhoto',
        entityType: 'PHOTO',
        entityLocalId: photoData.photoId || requestId,
        visitLocalId: photoData.visitId,
        operationStage: 40,
        payload: payload,
        clientRequestId: requestId
      });
    }
    return await _post('uploadPhoto', payload);
  }


  // ── Exportaciones ──────────────────────────────────────────────────────────

  /**
   * Solicita la creación de un reporte Excel.
   * @param {Object} filters - clientId, dateFrom, dateTo, promoterId, storeId, etc.
   * @returns {Promise<Object>} - URL de descarga del archivo generado
   */
  async function createExcelExport(filters) {
    return await _post('createExcelExport', { filters });
  }

  /**
   * Solicita la creación de un reporte CSV.
   * @param {Object} filters
   * @param {string} dataset - 'visits' | 'products' | 'prices' | 'competitor' | 'analytics'
   * @returns {Promise<Object>}
   */
  async function createCsvExport(filters, dataset) {
    return await _post('createCsvExport', { filters, dataset });
  }

  /**
   * Solicita la creación de un Google Sheet de reporte filtrado.
   * No da acceso directo a la BD maestra.
   * @param {Object} filters
   * @returns {Promise<Object>} - URL del Google Sheet generado
   */
  async function createGoogleSheetExport(filters) {
    return await _post('createGoogleSheetExport', { filters });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRUEBAS DE INTEGRACIÓN (temporales — Etapas 2A / 2B)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * [TEMPORAL — Etapa 2B] Crea una visita de prueba en Google Sheets.
   * Diseñado exclusivamente para validar la escritura idempotente end-to-end.
   *
   * IDEMPOTENCIA:
   *   Llamar dos veces con el mismo clientRequestId NO crea dos filas.
   *   La segunda llamada retorna { duplicate: true } con el mismo visitId.
   *
   * USO EN CONSOLA:
   *   ApiService.createDemoVisit('test-cr-001').then(r => console.log(r))
   *   ApiService.createDemoVisit('test-cr-001').then(r => console.log(r))  // debe retornar duplicate:true
   *
   * @param {string} clientRequestId - ID fijo para probar idempotencia (ej: 'test-cr-001')
   * @returns {Promise<Object>}
   */
  async function createDemoVisit(clientRequestId) {
    if (!clientRequestId) {
      return {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Se requiere clientRequestId para garantizar idempotencia.' },
        timestamp: new Date().toISOString()
      };
    }
    return await _post('createDemoVisit', {
      client_request_id: clientRequestId,
      // deviceId se inyecta automáticamente por _post()
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API PÚBLICA EXPUESTA
  // ─────────────────────────────────────────────────────────────────────────

  return Object.freeze({
    // Sistema
    health,
    getConfig,
    // Auth
    login,
    validateSession,
    logout,
    changePassword,
    // Admin usuarios
    adminCreateUser,
    adminResetPassword,
    getUsers,
    adminActivateUser,
    adminDeactivateUser,
    adminUnlockUser,
    // Catálogos — Clientes
    getClients,
    // Catálogos — Tiendas
    getStores,
    getStoreById,
    createStore,
    updateStore,
    deactivateStore,
    // Catálogos — Productos
    getProducts,
    getProductsByClient,
    getProductById,
    createProduct,
    updateProduct,
    deactivateProduct,
    // Formularios
    getForms,
    createForm,
    updateForm,
    deleteForm,
    // Rutas
    getRoutes,
    getRouteById,
    getTodayRoute,
    createRoute,
    updateRoute,
    assignRoute,
    uploadRoutes,
    addStoreToRoute,
    removeStoreFromRoute,
    completeRoute,
    // Visitas
    checkIn,
    saveVisitProduct,
    saveFormResponse,
    saveCompetitorPrice,
    checkOut,
    createDemoVisit,       // TEMPORAL — Etapa 2B (prueba de escritura idempotente)
    // Fotografías
    uploadPhoto,
    // Exportaciones
    createExcelExport,
    createCsvExport,
    createGoogleSheetExport,
    // Utilidades expuestas
    isConfigured: _isConfigured,
  });

})();

window.ApiService = ApiService;
