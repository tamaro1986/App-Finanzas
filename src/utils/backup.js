// ============================================================================
// UTILIDAD: Sistema de Respaldo Automático Local
// PROPÓSITO: Crear copias de seguridad automáticas de los datos en localStorage
// ============================================================================

const BACKUP_KEY_PREFIX = 'backup_'
const MAX_BACKUPS = 5

/**
 * Crear un respaldo de los datos actuales
 * @param {string} dataType - Tipo de datos ('transactions', 'accounts', 'budgets', etc.)
 * @param {any} data - Datos a respaldar
 */
export const createBackup = (dataType, data) => {
    try {
        const timestamp = new Date().toISOString()
        const backupKey = `${BACKUP_KEY_PREFIX}${dataType}`

        // Obtener respaldos existentes
        const existingBackups = getBackups(dataType)

        // Crear nuevo respaldo
        const newBackup = {
            timestamp,
            data,
            version: existingBackups.length + 1
        }

        // Agregar al inicio del array
        existingBackups.unshift(newBackup)

        // Mantener solo los últimos MAX_BACKUPS
        const trimmedBackups = existingBackups.slice(0, MAX_BACKUPS)

        // Guardar en localStorage
        localStorage.setItem(backupKey, JSON.stringify(trimmedBackups))

        console.log(`✅ Respaldo creado: ${dataType} - ${timestamp}`)
        return true
    } catch (error) {
        console.error('❌ Error al crear respaldo:', error)
        return false
    }
}

/**
 * Obtener todos los respaldos de un tipo de datos
 * @param {string} dataType - Tipo de datos
 * @returns {Array} Array de respaldos
 */
export const getBackups = (dataType) => {
    try {
        const backupKey = `${BACKUP_KEY_PREFIX}${dataType}`
        const backupsJson = localStorage.getItem(backupKey)
        return backupsJson ? JSON.parse(backupsJson) : []
    } catch (error) {
        console.error('❌ Error al obtener respaldos:', error)
        return []
    }
}

/**
 * Restaurar datos desde un respaldo específico
 * @param {string} dataType - Tipo de datos
 * @param {number} backupIndex - Índice del respaldo (0 = más reciente)
 * @returns {any} Datos restaurados o null si falla
 */
export const restoreFromBackup = (dataType, backupIndex = 0) => {
    try {
        const backups = getBackups(dataType)
        if (backups.length === 0) {
            console.warn('⚠️ No hay respaldos disponibles')
            return null
        }

        if (backupIndex >= backups.length) {
            console.warn('⚠️ Índice de respaldo inválido')
            return null
        }

        const backup = backups[backupIndex]
        console.log(`✅ Restaurando respaldo: ${dataType} - ${backup.timestamp}`)
        return backup.data
    } catch (error) {
        console.error('❌ Error al restaurar respaldo:', error)
        return null
    }
}

/**
 * Exportar todos los respaldos a un archivo JSON descargable
 * @param {string} dataType - Tipo de datos
 */
export const exportBackupsToFile = (dataType) => {
    try {
        const backups = getBackups(dataType)
        if (backups.length === 0) {
            alert('No hay respaldos disponibles para exportar')
            return
        }

        const dataStr = JSON.stringify(backups, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `backup_${dataType}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        console.log(`✅ Respaldos exportados: ${dataType}`)
    } catch (error) {
        console.error('❌ Error al exportar respaldos:', error)
        alert('Error al exportar respaldos')
    }
}

/**
 * Limpiar respaldos antiguos (mantener solo los últimos MAX_BACKUPS)
 * @param {string} dataType - Tipo de datos
 */
export const cleanOldBackups = (dataType) => {
    try {
        const backups = getBackups(dataType)
        if (backups.length <= MAX_BACKUPS) return

        const trimmedBackups = backups.slice(0, MAX_BACKUPS)
        const backupKey = `${BACKUP_KEY_PREFIX}${dataType}`
        localStorage.setItem(backupKey, JSON.stringify(trimmedBackups))

        console.log(`✅ Respaldos antiguos limpiados: ${dataType}`)
    } catch (error) {
        console.error('❌ Error al limpiar respaldos:', error)
    }
}

/**
 * Crear respaldo completo de todos los datos
 * @param {Object} allData - Objeto con todos los datos { transactions, accounts, budgets, etc. }
 */
export const createFullBackup = (allData) => {
    try {
        const timestamp = new Date().toISOString()
        const backupKey = `${BACKUP_KEY_PREFIX}full`

        const fullBackup = {
            timestamp,
            data: allData,
            version: Date.now()
        }

        // Obtener respaldos completos existentes
        const existingBackups = JSON.parse(localStorage.getItem(backupKey) || '[]')
        existingBackups.unshift(fullBackup)

        // Mantener solo los últimos 3 respaldos completos
        const trimmedBackups = existingBackups.slice(0, 3)
        localStorage.setItem(backupKey, JSON.stringify(trimmedBackups))

        console.log(`✅ Respaldo completo creado: ${timestamp}`)
        return true
    } catch (error) {
        console.error('❌ Error al crear respaldo completo:', error)
        return false
    }
}

/**
 * Obtener información de todos los respaldos disponibles
 * @returns {Object} Información de respaldos por tipo de datos
 */
export const getBackupInfo = () => {
    const dataTypes = ['transactions', 'accounts', 'budgets', 'vehicles', 'investments', 'full']
    const info = {}

    dataTypes.forEach(type => {
        const backups = getBackups(type)
        info[type] = {
            count: backups.length,
            latest: backups[0]?.timestamp || null,
            oldest: backups[backups.length - 1]?.timestamp || null
        }
    })

    return info
}
