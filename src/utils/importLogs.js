// ============================================================================
// UTILIDAD: Funciones para gestionar logs de importación
// ============================================================================

/**
 * Crear un log de importación
 * @param {string} fileName - Nombre del archivo importado
 * @param {Array} transactions - Transacciones importadas
 * @param {Array} errors - Errores encontrados
 * @param {string} notes - Notas adicionales
 * @returns {Object} Log de importación
 */
export const createImportLog = (fileName, transactions = [], errors = [], notes = '') => {
    return {
        id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName,
        importDate: new Date().toISOString(),
        recordsImported: transactions.length,
        errors: errors.length,
        errorDetails: errors,
        status: errors.length > 0 ? 'partial' : 'success',
        transactions: transactions.map(t => ({
            date: t.date,
            amount: t.amount,
            type: t.type,
            note: t.note || '',
            categoryId: t.categoryId,
            accountId: t.accountId
        })),
        notes
    }
}

/**
 * Agregar un log de importación al historial
 * @param {Array} currentLogs - Logs actuales
 * @param {Object} newLog - Nuevo log a agregar
 * @returns {Array} Logs actualizados
 */
export const addImportLog = (currentLogs, newLog) => {
    const updatedLogs = [newLog, ...currentLogs]
    // Mantener solo los últimos 50 logs
    return updatedLogs.slice(0, 50)
}

/**
 * Obtener estadísticas de importaciones
 * @param {Array} logs - Logs de importación
 * @returns {Object} Estadísticas
 */
export const getImportStats = (logs) => {
    return {
        total: logs.length,
        successful: logs.filter(l => l.status === 'success').length,
        withErrors: logs.filter(l => l.status === 'partial').length,
        totalRecords: logs.reduce((sum, l) => sum + l.recordsImported, 0),
        totalErrors: logs.reduce((sum, l) => sum + l.errors, 0)
    }
}

/**
 * Exportar logs a JSON
 * @param {Array} logs - Logs a exportar
 */
export const exportLogsToJSON = (logs) => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `import_logs_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
