/**
 * =============================================================================
 * FIELDFORCE — CONFIGURACIÓN PÚBLICA DEL FRONTEND
 * =============================================================================
 *
 * IMPORTANTE: Este archivo contiene ÚNICAMENTE configuración pública y segura.
 *
 * ❌ NUNCA incluir aquí:
 *    - GOOGLE_SPREADSHEET_ID
 *    - GOOGLE_ROOT_FOLDER_ID
 *    - GOOGLE_PHOTOS_FOLDER_ID
 *    - GOOGLE_EXPORTS_FOLDER_ID
 *    - Credenciales de Google
 *    - Contraseñas o tokens de servicio
 *
 * ✅ Los IDs y credenciales de Google se configuran exclusivamente en:
 *    Apps Script > PropertiesService.getScriptProperties()
 *    Ver: docs/FASE_1_CONFIGURACION_GOOGLE.md
 *
 * Para cambiar la URL del Apps Script, modifica solamente:
 *    FIELDFORCE_CONFIG.appsScriptUrl
 */

'use strict';

const FIELDFORCE_CONFIG = Object.freeze({

  /** Entorno de ejecución: 'pilot' | 'staging' | 'production' */
  env: 'pilot',

  /**
   * URL del Web App de Google Apps Script.
   * Reemplazar con la URL real generada en el deploy del script.
   * Ver: docs/FASE_1_CONFIGURACION_GOOGLE.md — Paso 4: Deploy del script
   */
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzizhCOuT5fcK6GyDHRhAG8_sRxJBK01m_d0ywc350z6dQDc71SuRpvGK_oCQwHF9LHEw/exec',

  /** Versión de la aplicación */
  version: '1.0.0-phase1',

  /** Nombre de la aplicación */
  appName: 'FieldForce',

  /**
   * Configuración de fotografías (valores por defecto, pueden ser sobreescritos
   * por la configuración que regresa el servidor en /health o /getConfig).
   */
  photos: {
    /** Tamaño máximo en bytes (5MB por defecto) */
    maxSizeBytes: 5 * 1024 * 1024,
    /** Calidad de compresión JPEG (0.0 – 1.0) */
    compressionQuality: 0.75,
    /** Dimensión máxima en píxeles (ancho o alto) */
    maxDimensionPx: 1920,
    /** Formatos aceptados */
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  /**
   * Configuración de sincronización offline
   */
  sync: {
    /** Reintentos máximos de sincronización por registro */
    maxRetries: 3,
    /** Tiempo base entre reintentos en milisegundos */
    retryBaseMs: 2000,
    /** Tiempo de espera para considerar una solicitud como timeout */
    requestTimeoutMs: 30000,
  },

  /**
   * Clave de localStorage para datos locales de la app.
   * Cambiar para separar ambientes si se usan en el mismo browser.
   */
  localStorageKey: 'fieldforce_db',

  /** Clave de localStorage para la sesión activa */
  sessionKey: 'fieldforce_session',

});

/**
 * Indica si la app está en modo piloto
 * @returns {boolean}
 */
function isFieldForcePilot() {
  return FIELDFORCE_CONFIG.env === 'pilot';
}

/**
 * Indica si el Apps Script está configurado correctamente (no es placeholder)
 * @returns {boolean}
 */
function isApiConfigured() {
  return FIELDFORCE_CONFIG.appsScriptUrl !== 'PLACEHOLDER_APPS_SCRIPT_URL' &&
         FIELDFORCE_CONFIG.appsScriptUrl.startsWith('https://');
}
