// ============================================================================
// ARCHIVO: supabaseSync.js
// PROPÓSITO: Funciones de utilidad para sincronizar datos con Supabase
// DESCRIPCIÓN: Este archivo proporciona funciones helper para realizar
//              operaciones CRUD (Create, Read, Update, Delete) con Supabase,
//              con fallback automático a localStorage si Supabase no está
//              configurado o falla la conexión.
// ============================================================================

import { supabase } from './supabase'

// ============================================================================
// FUNCIÓN: getUserId
// PROPÓSITO: Obtener el ID del usuario autenticado en Supabase
// RETORNA: String con el user_id o null si no hay usuario autenticado
// ============================================================================
export const getUserId = async () => {
    // Si supabase no está configurado, retornar null
    if (!supabase) return null

    try {
        // Obtener la sesión actual del usuario desde Supabase
        const { data: { user } } = await supabase.auth.getUser()
        // Retornar el ID del usuario si existe, null si no
        return user?.id || null
    } catch (error) {
        // Si hay error al obtener el usuario, loguear y retornar null
        console.error('Error getting user:', error)
        return null
    }
}

// ============================================================================
// FUNCIÓN: syncToSupabase
// PROPÓSITO: Sincronizar datos desde localStorage hacia Supabase
// PARÁMETROS:
//   - tableName: Nombre de la tabla en Supabase (ej: 'transactions')
//   - localStorageKey: Key del localStorage (ej: 'finanzas_transactions')
//   - data: Array de objetos a sincronizar (opcional, si no se pasa lee de localStorage)
// RETORNA: Boolean indicando si la sincronización fue exitosa
// ============================================================================
export const syncToSupabase = async (tableName, localStorageKey, data = null) => {
    // Si supabase no está configurado, no hacer nada y retornar false
    if (!supabase) {
        console.warn('Supabase not configured - skipping sync')
        return false
    }

    try {
        // Obtener el ID del usuario autenticado
        const userId = await getUserId()
        // Si no hay usuario autenticado, no se puede sincronizar
        if (!userId) {
            console.warn('No user authenticated - cannot sync to Supabase')
            return false
        }

        // Si no se pasó data, leer desde localStorage
        const dataToSync = data || JSON.parse(localStorage.getItem(localStorageKey) || '[]')

        // Si no hay datos para sincronizar, retornar true (éxito vacío)
        if (!dataToSync || (Array.isArray(dataToSync) && dataToSync.length === 0)) {
            console.log(`No data to sync for ${tableName}`)
            return true
        }

        // Agregar user_id a cada elemento del array para asociarlo al usuario
        const dataWithUserId = Array.isArray(dataToSync)
            ? dataToSync.map(item => ({ ...item, user_id: userId }))
            : { ...dataToSync, user_id: userId }

        console.log(`Syncing ${Array.isArray(dataWithUserId) ? dataWithUserId.length : 1} items to ${tableName}...`)

        // Insertar o actualizar datos en Supabase usando upsert
        // upsert = insert si no existe, update si ya existe
        const { data: result, error } = await supabase
            .from(tableName)
            .upsert(dataWithUserId, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select()

        // Si hubo error, lanzar excepción
        if (error) {
            console.error(`Supabase sync error (${tableName}):`, error)
            throw error
        }

        // Sincronización exitosa
        console.log(`✓ Successfully synced to ${tableName}`)
        return true
    } catch (error) {
        // Loguear error detallado y retornar false
        console.error(`⚠️ Error syncing to Supabase (${tableName}):`, {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return false
    }
}

// ============================================================================
// FUNCIÓN: fetchFromSupabase
// PROPÓSITO: Obtener datos desde Supabase y guardarlos en localStorage
// PARÁMETROS:
//   - tableName: Nombre de la tabla en Supabase
//   - localStorageKey: Key del localStorage donde guardar los datos
// RETORNA: Array con los datos obtenidos, o array vacío si falla
// ============================================================================
export const fetchFromSupabase = async (tableName, localStorageKey) => {
    // Si supabase no está configurado, leer desde localStorage
    if (!supabase) {
        return JSON.parse(localStorage.getItem(localStorageKey) || '[]')
    }

    try {
        // Obtener el ID del usuario autenticado
        const userId = await getUserId()
        // Si no hay usuario, leer desde localStorage
        if (!userId) {
            return JSON.parse(localStorage.getItem(localStorageKey) || '[]')
        }

        // Consultar datos de Supabase filtrando por user_id
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', userId)

        // Si hubo error, lanzar excepción
        if (error) throw error

        // Guardar datos en localStorage como backup
        localStorage.setItem(localStorageKey, JSON.stringify(data || []))

        // Retornar los datos obtenidos
        return data || []
    } catch (error) {
        // Si falla, loguear error y leer desde localStorage como fallback
        console.error(`Error fetching from Supabase (${tableName}):`, error)
        return JSON.parse(localStorage.getItem(localStorageKey) || '[]')
    }
}

// ============================================================================
// FUNCIÓN: saveToSupabase
// PROPÓSITO: Guardar un item individual en Supabase y localStorage
// PARÁMETROS:
//   - tableName: Nombre de la tabla en Supabase
//   - localStorageKey: Key del localStorage
//   - item: Objeto a guardar
//   - allItems: Array completo de items (para actualizar localStorage)
// RETORNA: Boolean indicando si el guardado fue exitoso
// ============================================================================
export const saveToSupabase = async (tableName, localStorageKey, item, allItems) => {
    // Primero guardar en localStorage (siempre funciona como backup)
    try {
        localStorage.setItem(localStorageKey, JSON.stringify(allItems))
    } catch (localError) {
        console.error('Error saving to localStorage:', localError)
        // Si falla localStorage, es un problema crítico
        return { success: false, savedToCloud: false, savedLocally: false, error: localError }
    }

    // Si supabase no está configurado, retornar éxito local
    if (!supabase) {
        return { success: true, savedToCloud: false, savedLocally: true, message: 'Guardado solo localmente (Supabase no configurado)' }
    }

    try {
        // Obtener el ID del usuario autenticado
        const userId = await getUserId()

        // Si no hay usuario autenticado, solo guardar local
        if (!userId) {
            console.warn('No user authenticated - data saved locally only')
            return { success: true, savedToCloud: false, savedLocally: true, message: 'Guardado solo localmente (sin sesión)' }
        }

        // Agregar user_id al item
        const itemWithUserId = { ...item, user_id: userId }

        // Insertar o actualizar en Supabase con upsert
        const { data, error } = await supabase
            .from(tableName)
            .upsert(itemWithUserId, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select()

        // Si hubo error en Supabase, lanzar excepción
        if (error) {
            console.error(`Supabase error (${tableName}):`, error)
            throw error
        }

        // Guardado exitoso en ambos lugares
        console.log(`✓ Data saved successfully to ${tableName}`)
        return { success: true, savedToCloud: true, savedLocally: true, data }

    } catch (error) {
        // Error al guardar en Supabase, pero localStorage funcionó
        console.error(`⚠️ Error syncing to Supabase (${tableName}):`, error.message || error)

        // Mostrar advertencia al usuario
        const errorMsg = error.message || 'Error desconocido'
        console.warn(`⚠️ ADVERTENCIA: Los datos se guardaron SOLO LOCALMENTE. Error de sincronización: ${errorMsg}`)

        return {
            success: true, // true porque localStorage funcionó
            savedToCloud: false,
            savedLocally: true,
            error: errorMsg,
            message: 'Guardado solo localmente - Error de sincronización con la nube'
        }
    }
}

// ============================================================================
// FUNCIÓN: deleteFromSupabase
// PROPÓSITO: Eliminar un item de Supabase y localStorage
// PARÁMETROS:
//   - tableName: Nombre de la tabla en Supabase
//   - localStorageKey: Key del localStorage
//   - itemId: ID del item a eliminar
//   - updatedItems: Array actualizado sin el item eliminado
// RETORNA: Boolean indicando si la eliminación fue exitosa
// ============================================================================
export const deleteFromSupabase = async (tableName, localStorageKey, itemId, updatedItems) => {
    // Primero eliminar de localStorage
    localStorage.setItem(localStorageKey, JSON.stringify(updatedItems))

    // Si supabase no está configurado, retornar true
    if (!supabase) return true

    try {
        // Obtener el ID del usuario autenticado
        const userId = await getUserId()
        // Si no hay usuario, solo eliminar local
        if (!userId) return true

        // Eliminar de Supabase filtrando por id y user_id (seguridad)
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', itemId)
            .eq('user_id', userId)

        // Si hubo error, lanzar excepción
        if (error) throw error

        // Eliminación exitosa
        return true
    } catch (error) {
        // Loguear error pero retornar true porque localStorage sí funcionó
        console.error(`Error deleting from Supabase (${tableName}):`, error)
        return true
    }
}

// ============================================================================
// FUNCIÓN: initializeData
// PROPÓSITO: Inicializar datos al cargar un componente
//            Intenta cargar desde Supabase, si falla usa localStorage
// PARÁMETROS:
//   - tableName: Nombre de la tabla en Supabase
//   - localStorageKey: Key del localStorage
// RETORNA: Array con los datos inicializados
// ============================================================================
export const initializeData = async (tableName, localStorageKey) => {
    // Si supabase está configurado, intentar cargar desde allí
    if (supabase) {
        const data = await fetchFromSupabase(tableName, localStorageKey)
        return data
    }

    // Si no hay supabase, cargar desde localStorage
    return JSON.parse(localStorage.getItem(localStorageKey) || '[]')
}
