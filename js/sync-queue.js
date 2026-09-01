/**
 * js/sync-queue.js
 * Motor de sincronización offline-first con soporte para dependencias.
 */

const SyncQueue = {
  isProcessing: false,

  /**
   * Encola una operación en IndexedDB.
   */
  async enqueue({
    endpoint,
    entityType,
    entityLocalId,
    payload,
    visitLocalId = null,
    operationStage = 50,
    dependsOn = null,
    clientRequestId = null
  }) {
    const now = new Date();
    const record = {
      client_request_id: clientRequestId || this._generateUUID(),
      device_id: window.localStorage.getItem('ff_device_id') || 'unknown',
      endpoint,
      entity_type: entityType,
      entity_local_id: entityLocalId,
      visit_local_id: visitLocalId,
      operation_stage: operationStage,
      payload,
      depends_on: dependsOn,
      event_at_utc: now.toISOString(),
      timezone_offset_minutes: now.getTimezoneOffset(),
      sync_status: 'pending',
      sync_attempts: 0,
      next_retry_at: now.toISOString(),
      last_sync_at: null,
      sync_error: null
    };

    await IndexedDB.put(STORES.SYNC_QUEUE, record);
    
    // Intentar sincronizar de inmediato de forma asíncrona
    setTimeout(() => this.processQueue(), 100);

    return {
      success: true,
      localSaved: true,
      syncStatus: 'pending',
      clientRequestId: record.client_request_id
    };
  },

  /**
   * Procesa la cola de sincronización respetando el orden, prioridad y dependencias.
   */
  async processQueue() {
    if (this.isProcessing) return;
    if (!navigator.onLine) return; // No intentar si explícitamente estamos offline

    this.isProcessing = true;

    try {
      let queue = await IndexedDB.getAll(STORES.SYNC_QUEUE);
      
      // Filtrar pendientes o bloqueados que ya pueden reintentarse, y errores que deban reintentarse
      const now = new Date().toISOString();
      let pending = queue.filter(q => 
        (q.sync_status === 'pending' || q.sync_status === 'error' || q.sync_status === 'blocked') &&
        q.next_retry_at <= now
      );

      // Ordenar por: 1) Fecha de creación (FIFO base) 2) operation_stage (10 primero, 50 después)
      pending.sort((a, b) => {
        // Orden estricto por operation_stage dentro de la misma visita.
        // Pero primero ordenemos cronológicamente para mantener visitas en orden.
        const timeDiff = new Date(a.event_at_utc) - new Date(b.event_at_utc);
        if (Math.abs(timeDiff) > 86400000) return timeDiff; // Diferencia mayor a un día, gana cronología estricta.
        
        // Si es de la misma visita (o visitas cercanas), el operation_stage dicta el orden
        if (a.visit_local_id === b.visit_local_id && a.visit_local_id != null) {
           return a.operation_stage - b.operation_stage;
        }
        
        // Por defecto, FIFO
        return timeDiff;
      });

      for (const item of pending) {
        // Romper si se pierde la conexión a mitad del proceso
        if (!navigator.onLine) break;

        // Validar dependencias jerárquicas (bloqueo por errores de hermanos mayores en la misma visita)
        if (item.visit_local_id) {
           const failedSiblings = queue.find(q => 
              q.visit_local_id === item.visit_local_id && 
              q.operation_stage < item.operation_stage && 
              (q.sync_status === 'error' || q.sync_status === 'blocked' || q.sync_status === 'pending' || q.sync_status === 'syncing')
           );
           
           if (failedSiblings) {
              if (failedSiblings.sync_status === 'error' || failedSiblings.sync_status === 'blocked') {
                item.sync_status = 'blocked';
                item.sync_error = `Bloqueado por fallo en operación previa (stage: ${failedSiblings.operation_stage}) de la visita.`;
                await IndexedDB.put(STORES.SYNC_QUEUE, item);
              }
              // Si está pending/syncing, saltamos este ítem para respetarlo, pero no lo bloqueamos permanentemente.
              continue;
           }
        }

        // Además, validar depends_on explícito si lo hubiera
        if (item.depends_on) {
          const parent = queue.find(q => q.client_request_id === item.depends_on);
          if (parent) {
            if (parent.sync_status === 'error' || parent.sync_status === 'blocked') {
              item.sync_status = 'blocked';
              item.sync_error = 'Dependencia explícita fallida o bloqueada.';
              await IndexedDB.put(STORES.SYNC_QUEUE, item);
              continue;
            } else if (parent.sync_status !== 'synced') {
              continue; 
            }
          }
        }

        // Marcar como syncing
        item.sync_status = 'syncing';
        await IndexedDB.put(STORES.SYNC_QUEUE, item);

        // Intentar enviar al backend
        try {
          // El ApiService debe proveer una forma cruda de enviar el request para que no llame recursivamente a enqueue
          const response = await this._sendToBackend(item);
          
          if (response && response.success) {
            item.sync_status = 'synced';
            item.last_sync_at = new Date().toISOString();
            item.sync_error = null;
            await IndexedDB.put(STORES.SYNC_QUEUE, item);
            
            // Si hay UI callback, notificar que se sincronizó un elemento
            if (window.appUI && typeof window.appUI.updateSyncStatus === 'function') {
               window.appUI.updateSyncStatus();
            }
          } else {
            throw new Error(response ? response.message : 'Error desconocido del backend');
          }

        } catch (error) {
          item.sync_attempts += 1;
          item.last_sync_at = new Date().toISOString();
          item.sync_error = error.message;
          
          // Calcular backoff (retry)
          if (item.sync_attempts >= 5) {
            item.sync_status = 'error'; // Requiere intervención o reintento manual
          } else {
            item.sync_status = 'pending';
            // Backoff: 10s, 30s, 90s...
            const delayMs = Math.pow(3, item.sync_attempts) * 10000;
            item.next_retry_at = new Date(Date.now() + delayMs).toISOString();
          }
          await IndexedDB.put(STORES.SYNC_QUEUE, item);
        }
      }

    } catch (err) {
      console.error('Error procesando sync queue:', err);
    } finally {
      this.isProcessing = false;
    }
  },

  /**
   * Espera confirmación real del backend para las operaciones de una visita.
   */
  async waitForVisitSync(visitLocalId, maxStage = 50, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await this.processQueue();
      const queue = await IndexedDB.getAll(STORES.SYNC_QUEUE);
      const operations = queue.filter(item =>
        item.visit_local_id === visitLocalId && item.operation_stage <= maxStage
      );
      const failed = operations.find(item => item.sync_status === 'error' || item.sync_status === 'blocked');
      if (failed) {
        throw new Error(failed.sync_error || `Falló la sincronización de ${failed.endpoint}.`);
      }
      if (operations.length && operations.every(item => item.sync_status === 'synced')) {
        return operations;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('La sincronización no fue confirmada dentro del tiempo esperado.');
  },

  /**
   * Envía el payload directamente a Apps Script, omitiendo interceptores de cola.
   */
  async _sendToBackend(item) {
    // Cuando enviamos fotos o datos pesados, el endpoint y la lógica exacta pueden variar.
    // Usaremos el mismo mecanismo de fetch que en api-service.js
    
    // Inyectamos el token de sesión
    let sessionToken = '';
    try {
      const session = JSON.parse(
        window.localStorage.getItem('fieldforce_session') || '{}'
      );
      sessionToken = session.token || '';
    } catch (e) {
      sessionToken = '';
    }

    if (!sessionToken) {
      throw new Error('Sesión no disponible para sincronización.');
    }
    const payload = {
      action: item.endpoint,
      sessionToken,
      client_request_id: item.client_request_id,
      event_at_utc: item.event_at_utc,
      timezone_offset_minutes: item.timezone_offset_minutes,
      ...item.payload
    };

    // Si la carga contiene un Blob (ej. foto), convertir a Base64 antes de enviar
    if (payload.photoBlob && payload.photoBlob instanceof Blob) {
      const base64Data = await this._blobToBase64(payload.photoBlob);
      // Extraemos solo la parte de datos sin el prefijo "data:image/jpeg;base64,"
      payload.base64Data = base64Data.split(',')[1] || base64Data; 
      delete payload.photoBlob; // No enviar el objeto Blob crudo a JSON.stringify
    }

    const response = await fetch(FIELDFORCE_CONFIG.appsScriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.error?.message ||
        data.message ||
        'Error de sincronización.'
      );
    }

    return data;
  },

  /**
   * Convierte un Blob a DataURL (Base64)
   */
  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  _generateUUID() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
};

window.SyncQueue = SyncQueue;

// ─── ACTIVADORES DE SINCRONIZACIÓN ──────────────────────────────────────────

// 1. Al iniciar la aplicación
window.addEventListener('load', () => {
  console.log("Aplicación iniciada. Procesando cola...");
  SyncQueue.processQueue();
});

// 2. Cuando recupera conexión a red
window.addEventListener('online', () => {
  console.log("Conexión recuperada. Procesando cola...");
  SyncQueue.processQueue();
});

// 3. Cuando el documento vuelve a ser visible (e.g., cambia de pestaña y regresa)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    SyncQueue.processQueue();
  }
});

// 4. Activador manual expuesto globalmente (para el botón "Sincronizar ahora")
window.forceSyncQueue = () => {
  console.log("Sincronización manual forzada.");
  SyncQueue.processQueue();
};
