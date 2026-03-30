// ============================================================================
// COMPONENTE: ImportHistoryManager
// PROPÓSITO: Gestionar historial de importaciones de Excel
// ============================================================================
import React, { useState, useEffect } from 'react'
import { FileSpreadsheet, Trash2, Edit2, Download, Clock, CheckCircle, AlertTriangle, X, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ImportHistoryManager = ({ importLogs, setImportLogs, onReimport, isOpen, onClose }) => {
    const [selectedLog, setSelectedLog] = useState(null)
    const [showDetails, setShowDetails] = useState(false)

    if (!isOpen) return null

    const handleDelete = async (logId) => {
        if (confirm('¿Estás seguro de que deseas eliminar este registro de importación?')) {
            const updatedLogs = importLogs.filter(log => log.id !== logId)
            setImportLogs(updatedLogs)
        }
    }

    const handleViewDetails = (log) => {
        setSelectedLog(log)
        setShowDetails(true)
    }

    const handleReimport = (log) => {
        if (confirm('¿Deseas volver a importar este archivo?\n\nEsto creará nuevas transacciones.')) {
            onReimport(log)
        }
    }

    const getTotalAmount = (log) => {
        if (!log.transactions) return 0
        return log.transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">📊 Historial de Importaciones</h3>
                        <p className="text-sm text-slate-500 mt-1">Gestiona tus archivos Excel importados</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {importLogs.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <FileSpreadsheet size={64} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-lg">No hay importaciones registradas</p>
                            <p className="text-sm mt-2">Los archivos Excel que importes aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {importLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="border border-slate-200 rounded-xl p-6 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FileSpreadsheet size={20} className="text-emerald-600" />
                                                <h4 className="font-bold text-slate-900">{log.fileName}</h4>
                                                {log.status === 'success' ? (
                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <CheckCircle size={12} />
                                                        EXITOSO
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                        <AlertTriangle size={12} />
                                                        CON ERRORES
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase">Fecha</p>
                                                    <p className="text-slate-700 font-medium flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {format(new Date(log.importDate), "d MMM yyyy, HH:mm", { locale: es })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase">Registros</p>
                                                    <p className="text-slate-700 font-bold">{log.recordsImported || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase">Errores</p>
                                                    <p className={`font-bold ${log.errors > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {log.errors || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 text-xs font-bold uppercase">Monto Total</p>
                                                    <p className="text-slate-700 font-bold">
                                                        ${getTotalAmount(log).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>

                                            {log.notes && (
                                                <div className="mt-3 text-sm text-slate-600 italic">
                                                    📝 {log.notes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            <button
                                                onClick={() => handleViewDetails(log)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Ver detalles"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Eliminar registro"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm text-slate-500">
                        Total: <span className="font-bold text-slate-700">{importLogs.length}</span> importaciones
                    </p>
                    <button onClick={onClose} className="btn-secondary">
                        Cerrar
                    </button>
                </div>
            </div>

            {/* Details Modal */}
            {showDetails && selectedLog && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">Detalles de Importación</h3>
                            <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase mb-1">Archivo</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedLog.fileName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-400 uppercase mb-1">Fecha de Importación</p>
                                        <p className="text-slate-700">
                                            {format(new Date(selectedLog.importDate), "d 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-400 uppercase mb-1">Estado</p>
                                        <p className={`font-bold ${selectedLog.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {selectedLog.status === 'success' ? '✅ Exitoso' : '⚠️ Con errores'}
                                        </p>
                                    </div>
                                </div>
                                {selectedLog.transactions && selectedLog.transactions.length > 0 && (
                                    <div>
                                        <p className="text-sm font-bold text-slate-400 uppercase mb-2">Transacciones Importadas</p>
                                        <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                                            {selectedLog.transactions.map((tx, idx) => (
                                                <div key={idx} className="text-sm py-2 border-b border-slate-200 last:border-0">
                                                    <span className="font-medium">{tx.date}</span> -
                                                    <span className={tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {' '}${tx.amount}
                                                    </span> -
                                                    <span className="text-slate-600"> {tx.note}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedLog.errorDetails && selectedLog.errorDetails.length > 0 && (
                                    <div>
                                        <p className="text-sm font-bold text-slate-400 uppercase mb-2">Errores Detectados</p>
                                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                                            {selectedLog.errorDetails.map((error, idx) => (
                                                <div key={idx} className="text-sm text-rose-700 py-1">
                                                    • {error}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowDetails(false)} className="btn-secondary">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ImportHistoryManager
