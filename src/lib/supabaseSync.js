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
// FUNCIÓN HELPER: camelToSnake
// PROPÓSITO: Convertir nombres de propiedades de camelCase a snake_case
// EJEMPLO: accountId -> account_id, categoryId -> category_id
// ============================================================================
const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// ============================================================================
// FUNCIÓN HELPER: snakeToCamel
// PROPÓSITO: Convertir nombres de propiedades de snake_case a camelCase
// EJEMPLO: account_id -> accountId, category_id -> categoryId
// ============================================================================
const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// ============================================================================
// FUNCIÓN HELPER: convertObjectToCamelCase
// PROPÓSITO: Convertir todas las keys de un objeto de snake_case a camelCase
// USADO AL: Leer datos desde Supabase para que el frontend los use correctamente
// ============================================================================
const convertObjectToCamelCase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(item => convertObjectToCamelCase(item))

    const newObj = {}

    // Lista de campos que NO deben convertirse (mantener tal cual)
    const fieldsToKeepAsIs = ['id', 'user_id']

    for (const key in obj) {
        // Campos que se mantienen tal cual (sin conversión)
        if (fieldsToKeepAsIs.includes(key)) {
            newObj[key] = obj[key]
            continue
        }

        const camelKey = snakeToCamel(key)
        let value = obj[key]

        // Si el valor es un array u objeto, convertirlo recursivamente
        if (value && typeof value === 'object') {
            value = convertObjectToCamelCase(value)
        }

        newObj[camelKey] = value
    }

    return newObj
}

// ============================================================================
// FUNCIÓN HELPER: convertObjectToSnakeCase
// PROPÓSITO: Convertir todas las keys de un objeto de camelCase a snake_case
// FILTRADO: Elimina campos problemáticos que no deben enviarse a Supabase
// ============================================================================
const convertObjectToSnakeCase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj

    const newObj = {}

    // Lista de campos que NO deben convertirse (mantener tal cual)
    // NO incluir 'id' aquí porque SÍ debe enviarse
    const fieldsToKeepAsIs = ['id', 'user_id']

    for (const key in obj) {
        // Campos que se mantienen tal cual (sin conversión)
        if (fieldsToKeepAsIs.includes(key)) {
            newObj[key] = obj[key]
            continue
        }

        const snakeKey = camelToSnake(key)
        let value = obj[key]

        // Filtrar valores problemáticos
        // 1. Arrays vacíos -> null
        if (Array.isArray(value) && value.length === 0) {
            value = null
        }

        // 2. Strings vacíos en campos numéricos -> null
        if (value === '' && (snakeKey.includes('installments') || snakeKey.includes('rate') || snakeKey.includes('amount') || snakeKey.includes('age') || snakeKey.includes('height') || snakeKey.includes('weight') || snakeKey.includes('anxiety') || snakeKey.includes('insomnia'))) {
            value = null
        }

        // 3. Strings vacíos en campos de fecha -> null (CRÍTICO para evitar error 'invalid input syntax for type date')
        if (value === '' && (snakeKey.includes('date') || snakeKey.includes('at'))) {
            value = null
        }

        // 4. Los Arrays/Objetos se mantienen como tales para que el cliente de Supabase 
        // los maneje automáticamente como JSONB. NO se deben stringificar aquí.
        // Si el valor es un objeto (y no es nulo o una fecha), lo dejamos pasar tal cual.

        newObj[snakeKey] = value
    }

    return newObj
}

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
        // Silenciar errores de AbortError (esperados cuando no hay sesión)
        if (error.name !== 'AbortError') {
            console.error('Error getting user:', error)
        }
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

        // Convertir a snake_case y agregar user_id
        const dataWithUserId = Array.isArray(dataToSync)
            ? dataToSync.map(item => ({ ...convertObjectToSnakeCase(item), user_id: userId }))
            : { ...convertObjectToSnakeCase(dataToSync), user_id: userId }

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
// PROPÓSITO: Obtener datos desde Supabase (solo recupera, no guarda en local)
// PARÁMETROS:
//   - tableName: Nombre de la tabla en Supabase
// RETORNA: Array con los datos obtenidos, o null si falla la conexión
// ============================================================================
export const fetchFromSupabase = async (tableName) => {
    // Si supabase no está configurado, retornar null para indicar que no se pudo intentar
    if (!supabase) return null

    try {
        // Obtener el ID del usuario autenticado
        const userId = await getUserId()
        // Si no hay usuario, retornar null
        if (!userId) return null

        // Consultar datos de Supabase filtrando por user_id
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', userId)

        // Si hubo error, lanzar excepción
        if (error) throw error

        // Convertir los datos de snake_case a camelCase antes de retornarlos
        const dataInCamelCase = data ? data.map(item => convertObjectToCamelCase(item)) : []

        // Retornar los datos convertidos
        return dataInCamelCase
    } catch (error) {
        // Silenciar errores de AbortError (esperados cuando no hay sesión)
        if (error.message && !error.message.includes('AbortError')) {
            console.error(`Error fetching from Supabase (${tableName}):`, error)
        }
        return null // Indica que la consulta falló
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

        // Convertir el objeto de camelCase a snake_case para Supabase
        let itemSnakeCase = convertObjectToSnakeCase(item)

        // Manejo especial para la tabla budgets
        let onConflictTarget = 'id'
        if (tableName === 'budgets') {
            // Budgets tiene una estructura especial: { month, categories }
            // Donde month es un string (ej: "2026-01") y categories es un objeto JSON
            const budgetData = {
                month: item.month || Object.keys(item).find(k => k.match(/^\d{4}-\d{2}$/)),
                categories: item.categories || item[Object.keys(item).find(k => k.match(/^\d{4}-\d{2}$/))]
            }
            itemSnakeCase = budgetData
            onConflictTarget = 'user_id,month' // Para presupuestos, el conflicto es por mes y usuario
        }

        // Agregar user_id al item
        const itemWithUserId = { ...itemSnakeCase, user_id: userId }

        // Insertar o actualizar en Supabase con upsert
        const { data, error } = await supabase
            .from(tableName)
            .upsert(itemWithUserId, {
                onConflict: onConflictTarget,
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
//            Combina inteligentemente datos de Supabase y localStorage
// PARÁMETROS:
//   - tableName: Nombre de la tabla en Supabase
//   - localStorageKey: Key del localStorage
// RETORNA: Array o Objeto con los datos inicializados
// ============================================================================
export const initializeData = async (tableName, localStorageKey) => {
    // 1. Cargar datos locales actuales
    const localRaw = localStorage.getItem(localStorageKey)
    let localData = []
    try {
        localData = localRaw ? JSON.parse(localRaw) : []
    } catch (e) {
        console.error(`Error parsing local storage for ${localStorageKey}:`, e)
        localData = []
    }

    // Si supabase no está configurado, retornar local de inmediato
    if (!supabase) return localData

    // 2. Intentar cargar datos de Supabase
    const remoteData = await fetchFromSupabase(tableName)

    // Caso A: Error al conectar con Supabase -> Usar local
    if (remoteData === null) {
        console.warn(`[SupabaseSync] No se pudo conectar para ${tableName}, usando datos locales.`)
        return localData
    }

    // Caso B: Remoto vacío pero local tiene datos -> Subir local a Supabase (Primer sync)
    if (remoteData.length === 0 && (Array.isArray(localData) ? localData.length > 0 : Object.keys(localData).length > 0)) {
        console.log(`[SupabaseSync] Nube vacía para ${tableName}, subiendo datos locales...`)
        // No esperamos al sync para devolver los datos y no bloquear la UI
        syncToSupabase(tableName, localStorageKey, localData)
        return localData
    }

    // Caso C: Mezclar y resolver conflictos
    // ----------------------------------------------------

    // Sub-caso: Budgets (Objeto en local, Array en remoto)
    if (tableName === 'budgets') {
        const mergedBudgets = { ...(typeof localData === 'object' && !Array.isArray(localData) ? localData : {}) }

        if (Array.isArray(remoteData)) {
            remoteData.forEach(row => {
                if (row.month && row.categories) {
                    // Remote tiene prioridad para el mismo mes
                    mergedBudgets[row.month] = row.categories
                }
            })
        }

        localStorage.setItem(localStorageKey, JSON.stringify(mergedBudgets))
        return mergedBudgets
    }

    // Sub-caso: Tablas normales (Arrays con IDs)
    if (Array.isArray(remoteData)) {
        const mergedMap = new Map()

        // Agregar locales primero si es array
        if (Array.isArray(localData)) {
            localData.forEach(item => {
                if (item && item.id) mergedMap.set(item.id, item)
            })
        }

        // Merge inteligente: comparar timestamps para decidir qué datos mantener
        remoteData.forEach(remoteItem => {
            if (!remoteItem || !remoteItem.id) return

            const localItem = mergedMap.get(remoteItem.id)

            // Si no existe en local, agregar el remoto
            if (!localItem) {
                mergedMap.set(remoteItem.id, remoteItem)
                return
            }

            // Si existe en ambos, comparar timestamps (si existen)
            const localTimestamp = localItem.updated_at || localItem.created_at || localItem.date || 0
            const remoteTimestamp = remoteItem.updated_at || remoteItem.created_at || remoteItem.date || 0

            // Mantener el más reciente (si hay timestamps), sino mantener el remoto
            if (remoteTimestamp && localTimestamp) {
                const remoteDate = new Date(remoteTimestamp).getTime()
                const localDate = new Date(localTimestamp).getTime()

                if (remoteDate > localDate) {
                    mergedMap.set(remoteItem.id, remoteItem)
                }
                // Si local es más reciente, no hacer nada (ya está en el Map)
            } else {
                // Sin timestamps, dar prioridad al remoto (comportamiento anterior)
                mergedMap.set(remoteItem.id, remoteItem)
            }
        })

        const mergedList = Array.from(mergedMap.values())

        // Solo actualizar localStorage si hay cambios
        const currentLocal = JSON.stringify(localData)
        const newLocal = JSON.stringify(mergedList)

        if (currentLocal !== newLocal) {
            localStorage.setItem(localStorageKey, newLocal)
            console.log(`[SupabaseSync] Datos actualizados para ${tableName}`)
        }

        return mergedList
    }

    // Caso por defecto (Ej: configuraciones simples)
    localStorage.setItem(localStorageKey, JSON.stringify(remoteData))
    return remoteData
}
