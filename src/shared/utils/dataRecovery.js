// ============================================================================
// UTILIDAD: Herramientas de diagnóstico y recuperación de datos
// ============================================================================

/**
 * Verificar integridad de datos en localStorage
 * @param {string} key - Clave de localStorage a verificar
 * @returns {Object} Información sobre los datos
 */
export const checkDataIntegrity = (key) => {
    try {
        const data = localStorage.getItem(key)
        if (!data) {
            return { exists: false, valid: false, count: 0 }
        }

        const parsed = JSON.parse(data)
        const isArray = Array.isArray(parsed)
        const count = isArray ? parsed.length : Object.keys(parsed).length

        return {
            exists: true,
            valid: true,
            isArray,
            count,
            sample: isArray ? parsed[0] : Object.values(parsed)[0]
        }
    } catch (error) {
        return { exists: true, valid: false, error: error.message }
    }
}

/**
 * Crear snapshot de todos los datos locales
 * @returns {Object} Snapshot completo
 */
export const createDataSnapshot = () => {
    const snapshot = {
        timestamp: new Date().toISOString(),
        data: {}
    }

    const keys = [
        'finanzas_transactions',
        'finanzas_accounts',
        'finanzas_budgets',
        'finanzas_vehicles',
        'finanzas_investments'
    ]

    keys.forEach(key => {
        const item = localStorage.getItem(key)
        if (item) {
            try {
                snapshot.data[key] = JSON.parse(item)
            } catch (e) {
                snapshot.data[key] = { error: 'Invalid JSON', raw: item }
            }
        }
    })

    return snapshot
}

/**
 * Exportar snapshot a archivo JSON
 */
export const exportDataSnapshot = () => {
    const snapshot = createDataSnapshot()
    const dataStr = JSON.stringify(snapshot, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `data_snapshot_${snapshot.timestamp.split('T')[0]}_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('✅ Snapshot exportado exitosamente')
}

/**
 * Restaurar datos desde un snapshot
 * @param {Object} snapshot - Snapshot a restaurar
 */
export const restoreFromSnapshot = (snapshot) => {
    if (!snapshot || !snapshot.data) {
        alert('Snapshot inválido')
        return false
    }

    try {
        Object.keys(snapshot.data).forEach(key => {
            const value = snapshot.data[key]
            if (value && !value.error) {
                localStorage.setItem(key, JSON.stringify(value))
            }
        })

        console.log('✅ Datos restaurados desde snapshot')
        alert('Datos restaurados correctamente. Recarga la página.')
        return true
    } catch (error) {
        console.error('Error al restaurar snapshot:', error)
        alert('Error al restaurar datos')
        return false
    }
}


// Exponer funciones globalmente para debugging en consola
if (typeof window !== 'undefined') {
    window.finanzasDebug = {
        checkIntegrity: checkDataIntegrity,
        createSnapshot: createDataSnapshot,
        exportSnapshot: exportDataSnapshot,
        restoreSnapshot: restoreFromSnapshot
    }
    console.log('🔧 Herramientas de debug disponibles en window.finanzasDebug')
    console.log('📋 Funciones disponibles:')
    console.log('  - checkIntegrity(key): Verificar integridad de datos')
    console.log('  - createSnapshot(): Crear snapshot de todos los datos')
    console.log('  - exportSnapshot(): Exportar snapshot a archivo JSON')
    console.log('  - restoreSnapshot(snapshot): Restaurar desde snapshot')
}
