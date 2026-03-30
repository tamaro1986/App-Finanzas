// ============================================================================
// COMPONENTE: SyncStatusIndicator
// PROPÓSITO: Mostrar el estado de sincronización con Supabase
// ============================================================================
import React, { useState, useEffect } from 'react'
import { Cloud, CloudOff, AlertCircle, Wifi, WifiOff } from 'lucide-react'

const SyncStatusIndicator = ({ syncStatus }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Si no hay estado de sincronización, no mostrar nada
    if (!syncStatus) return null

    const getStatusConfig = () => {
        if (!isOnline) {
            return {
                icon: WifiOff,
                text: 'Sin conexión',
                bgColor: 'bg-slate-100',
                textColor: 'text-slate-600',
                iconColor: 'text-slate-500'
            }
        }

        if (syncStatus.savedToCloud && syncStatus.savedLocally) {
            return {
                icon: Cloud,
                text: 'Sincronizado',
                bgColor: 'bg-emerald-50',
                textColor: 'text-emerald-700',
                iconColor: 'text-emerald-600'
            }
        }

        if (syncStatus.savedLocally && !syncStatus.savedToCloud) {
            return {
                icon: CloudOff,
                text: 'Solo local',
                bgColor: 'bg-amber-50',
                textColor: 'text-amber-700',
                iconColor: 'text-amber-600'
            }
        }

        return {
            icon: AlertCircle,
            text: 'Error',
            bgColor: 'bg-rose-50',
            textColor: 'text-rose-700',
            iconColor: 'text-rose-600'
        }
    }

    const config = getStatusConfig()
    const Icon = config.icon

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor} text-xs font-semibold transition-all`}>
            <Icon size={14} className={config.iconColor} />
            <span>{config.text}</span>
        </div>
    )
}

export default SyncStatusIndicator
