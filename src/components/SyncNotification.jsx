// ============================================================================
// COMPONENTE: SyncNotification
// PROPÓSITO: Mostrar notificaciones de sincronización de manera elegante
// ============================================================================
import React, { useState, useEffect, createContext, useContext } from 'react'
import { X, AlertTriangle, CheckCircle, Info, CloudOff } from 'lucide-react'

// Crear el contexto para las notificaciones
const SyncNotificationContext = createContext()

/**
 * Componente Visual de la Notificación (Interno)
 */
const SyncNotificationItem = ({ message, type = 'info', duration = 5000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [duration])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(() => { if (onClose) onClose() }, 300)
    }

    const config = (() => {
        switch (type) {
            case 'success': return { icon: CheckCircle, bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', textColor: 'text-emerald-800', iconColor: 'text-emerald-600' }
            case 'warning': return { icon: AlertTriangle, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-800', iconColor: 'text-amber-600' }
            case 'error': return { icon: CloudOff, bgColor: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-800', iconColor: 'text-rose-600' }
            default: return { icon: Info, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800', iconColor: 'text-blue-600' }
        }
    })()

    const Icon = config.icon

    return (
        <div className={`fixed bottom-6 right-6 z-[100] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 ${!isVisible ? 'animate-out slide-out-to-bottom-4 fade-out' : ''}`}>
            <div className={`${config.bgColor} ${config.borderColor} border rounded-xl shadow-lg p-4 flex items-start gap-3`}>
                <Icon size={20} className={`${config.iconColor} shrink-0 mt-0.5`} />
                <div className="flex-1">
                    <p className={`${config.textColor} text-sm font-medium leading-relaxed`}>{message}</p>
                </div>
                <button onClick={handleClose} className={`${config.textColor} hover:opacity-70 transition-opacity shrink-0`}>
                    <X size={18} />
                </button>
            </div>
        </div>
    )
}

/**
 * Proveedor de Notificaciones Global
 */
export const SyncNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([])

    const addNotification = (message, type = 'info', duration = 5000) => {
        const id = Date.now()
        setNotifications(prev => [...prev, { id, message, type, duration }])
    }

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    return (
        <SyncNotificationContext.Provider value={{ addNotification, showNotification: addNotification }}>
            {children}
            {notifications.map((n) => (
                <SyncNotificationItem
                    key={n.id}
                    message={n.message}
                    type={n.type}
                    duration={n.duration}
                    onClose={() => removeNotification(n.id)}
                />
            ))}
        </SyncNotificationContext.Provider>
    )
}

/**
 * Hook para usar el sistema de notificaciones
 */
export const useSyncNotifications = () => {
    const context = useContext(SyncNotificationContext)
    if (!context) {
        throw new Error('useSyncNotifications must be used within a SyncNotificationProvider')
    }
    return context
}
