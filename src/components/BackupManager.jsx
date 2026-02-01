// ============================================================================
// COMPONENTE: BackupManager
// PROPÓSITO: Interfaz para gestionar respaldos automáticos
// ============================================================================
import React, { useState, useEffect } from 'react'
import { Download, Upload, Clock, AlertCircle, CheckCircle, X } from 'lucide-react'
import { getBackups, restoreFromBackup, exportBackupsToFile, getBackupInfo } from '../utils/backup'

const BackupManager = ({ dataType, onRestore, isOpen, onClose }) => {
    const [backups, setBackups] = useState([])
    const [backupInfo, setBackupInfo] = useState(null)

    useEffect(() => {
        if (isOpen) {
            loadBackups()
        }
    }, [isOpen, dataType])

    const loadBackups = () => {
        const allBackups = getBackups(dataType)
        setBackups(allBackups)
        setBackupInfo(getBackupInfo())
    }

    const handleRestore = (index) => {
        if (confirm(`¿Estás seguro de que deseas restaurar este respaldo?\n\nEsto reemplazará los datos actuales.`)) {
            const data = restoreFromBackup(dataType, index)
            if (data) {
                onRestore(data)
                alert('✅ Respaldo restaurado correctamente')
                onClose()
            } else {
                alert('❌ Error al restaurar el respaldo')
            }
        }
    }

    const handleExport = () => {
        exportBackupsToFile(dataType)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-violet-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">🔒 Respaldos Automáticos</h3>
                        <p className="text-sm text-slate-500 mt-1">Gestiona tus copias de seguridad locales</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle size={20} className="text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-blue-900">
                            <p className="font-bold mb-1">Sistema de Respaldo Automático</p>
                            <p>Se crean respaldos automáticamente cada vez que creas, editas o eliminas datos. Se mantienen las últimas 5 copias.</p>
                        </div>
                    </div>

                    {/* Export Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleExport}
                            className="btn-secondary w-full flex items-center justify-center gap-2"
                            disabled={backups.length === 0}
                        >
                            <Download size={18} />
                            Exportar Todos los Respaldos
                        </button>
                    </div>

                    {/* Backups List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            Respaldos Disponibles ({backups.length})
                        </h4>

                        {backups.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="font-medium">No hay respaldos disponibles</p>
                                <p className="text-sm mt-1">Los respaldos se crearán automáticamente</p>
                            </div>
                        ) : (
                            backups.map((backup, index) => (
                                <div
                                    key={index}
                                    className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle size={16} className="text-emerald-500" />
                                                <span className="font-bold text-slate-900">
                                                    Respaldo #{backups.length - index}
                                                </span>
                                                {index === 0 && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                                        MÁS RECIENTE
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    <span>
                                                        {new Date(backup.timestamp).toLocaleString('es-MX', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <span className="text-xs">
                                                    {Array.isArray(backup.data) ? `${backup.data.length} registros` : 'Datos completos'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRestore(index)}
                                            className="btn-primary !py-2 !px-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Upload size={16} />
                                            <span className="ml-2">Restaurar</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="btn-secondary">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BackupManager
