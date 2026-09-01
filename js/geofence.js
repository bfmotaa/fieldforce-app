/**
 * js/geofence.js
 * Funcionalidades locales de GPS y validación de Geocerca (Fórmula de Haversine).
 */

let GeofenceSettings = {
  GEOFENCE_RADIUS_METERS: 200, // Radio permitido para check-in
  GPS_MAX_ACCURACY_METERS: 500, // Precisión mínima aceptable
  GPS_TIMEOUT_SECONDS: 15,
  GPS_MAX_AGE_SECONDS: 30
};

/**
 * Loads settings from IndexedDB, or saves defaults if none exist.
 */
async function loadGeofenceSettings() {
  if (!window.IndexedDB || !window.STORES) return GeofenceSettings;
  
  try {
    const radius = await window.IndexedDB.get(window.STORES.CONFIG, 'geofencing.DEFAULT_GEOFENCE_RADIUS');
    const accuracy = await window.IndexedDB.get(window.STORES.CONFIG, 'geofencing.GPS_MAX_ACCURACY_METERS');
    const timeout = await window.IndexedDB.get(window.STORES.CONFIG, 'geofencing.GPS_TIMEOUT_SECONDS');
    const maxAge = await window.IndexedDB.get(window.STORES.CONFIG, 'geofencing.GPS_MAX_AGE_SECONDS');
    
    let needsSave = false;
    
    if (radius) GeofenceSettings.GEOFENCE_RADIUS_METERS = parseInt(radius.value, 10);
    else { needsSave = true; await window.IndexedDB.put(window.STORES.CONFIG, { setting_id: 'geofencing.DEFAULT_GEOFENCE_RADIUS', value: GeofenceSettings.GEOFENCE_RADIUS_METERS }); }
    
    if (accuracy) GeofenceSettings.GPS_MAX_ACCURACY_METERS = parseInt(accuracy.value, 10);
    else { needsSave = true; await window.IndexedDB.put(window.STORES.CONFIG, { setting_id: 'geofencing.GPS_MAX_ACCURACY_METERS', value: GeofenceSettings.GPS_MAX_ACCURACY_METERS }); }
    
    if (timeout) GeofenceSettings.GPS_TIMEOUT_SECONDS = parseInt(timeout.value, 10);
    else { needsSave = true; await window.IndexedDB.put(window.STORES.CONFIG, { setting_id: 'geofencing.GPS_TIMEOUT_SECONDS', value: GeofenceSettings.GPS_TIMEOUT_SECONDS }); }
    
    if (maxAge) GeofenceSettings.GPS_MAX_AGE_SECONDS = parseInt(maxAge.value, 10);
    else { needsSave = true; await window.IndexedDB.put(window.STORES.CONFIG, { setting_id: 'geofencing.GPS_MAX_AGE_SECONDS', value: GeofenceSettings.GPS_MAX_AGE_SECONDS }); }
    
  } catch(e) {
    console.error("Error loading geofence settings from IndexedDB", e);
  }
  return GeofenceSettings;
}

const Geofence = {
  /**
   * Obtiene la ubicación actual del dispositivo usando la API del navegador.
   * @returns {Promise<Object>} { latitude, longitude, accuracy, timestamp }
   */
  async getCurrentLocation() {
    await loadGeofenceSettings();
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        return reject(new Error('Geolocalización no soportada por el navegador.'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (position.coords.accuracy > GeofenceSettings.GPS_MAX_ACCURACY_METERS) {
            console.warn(`Precisión GPS pobre: ${position.coords.accuracy}m (Max: ${GeofenceSettings.GPS_MAX_ACCURACY_METERS}m). Se registrará como válido pero de baja precisión.`);
          }
          
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            locationSource: 'device_gps'
          });
        },
        (error) => {
          let errorMessage = 'Error desconocido al obtener ubicación.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado por el usuario.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado al obtener ubicación.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: GeofenceSettings.GPS_TIMEOUT_SECONDS * 1000,
          maximumAge: GeofenceSettings.GPS_MAX_AGE_SECONDS * 1000
        }
      );
    });
  },

  /**
   * Calcula la distancia entre dos puntos (lat/lon) en metros usando la fórmula de Haversine.
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    
    const R = 6371e3; // Radio de la Tierra en metros
    const rad = Math.PI / 180;
    
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distancia en metros
  },

  /**
   * Valida si unas coordenadas están dentro del radio de una tienda.
   * @param {number} storeLat 
   * @param {number} storeLng 
   * @param {number} radiusMeters 
   * @returns {Object} { isValid, distanceMeters }
   */
  async isWithinGeofence(storeLat, storeLng, radiusMeters) {
    await loadGeofenceSettings();
    try {
      const position = await this.getCurrentLocation();
      const distance = this.calculateDistance(position.latitude, position.longitude, storeLat, storeLng);
      const radius = radiusMeters || GeofenceSettings.GEOFENCE_RADIUS_METERS;
      
      return {
        isValid: distance <= radius,
        distanceMeters: Math.round(distance)
      };
    } catch (e) {
      return { isValid: false, distanceMeters: -1, error: e.message };
    }
  },

  /**
   * Valida si unas coordenadas están dentro del radio de una tienda.
   * @param {number} deviceLat 
   * @param {number} deviceLon 
   * @param {number} storeLat 
   * @param {number} storeLon 
   * @returns {Object} { isValid, distanceMeters }
   */
  validateGeofence(deviceLat, deviceLon, storeLat, storeLon) {
    if (!deviceLat || !deviceLon || !storeLat || !storeLon) {
      return { isValid: false, distanceMeters: -1 };
    }

    const distance = this.calculateDistance(deviceLat, deviceLon, storeLat, storeLon);
    
    return {
      isValid: distance <= GeofenceSettings.GEOFENCE_RADIUS_METERS,
      distanceMeters: Math.round(distance)
    };
  }
};

window.GeofenceSettings = GeofenceSettings;
window.Geofence = Geofence;
