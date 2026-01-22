// ============================================================================
// IMPORTS: React, iconos y utilidades de fecha
// ============================================================================
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Car, Settings, Calendar, Gauge, AlertTriangle, CheckCircle2, ChevronRight, X, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: Vehicles
// PROPÓSITO: Gestionar vehículos y control de mantenimientos
// CONECTADO A: Supabase tabla 'vehicles'
// ============================================================================
const Vehicles = () => {
    // Estado para vehículos - se carga desde Supabase
    const [vehicles, setVehicles] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newVehicle, setNewVehicle] = useState({
        name: '',
        plate: '',
        type: 'Carro',
        currentMileage: '',
        maintenanceItems: [
            { id: 1, label: 'Cambio de Aceite', lastMileage: '', interval: 5000, estimatedCost: 0 },
            { id: 2, label: 'Pastillas de Freno', lastMileage: '', interval: 20000, estimatedCost: 0 }
        ]
    })

    // ============================================================================
    // EFFECT: Cargar vehículos desde Supabase al montar componente
    // ============================================================================
    useEffect(() => {
        const loadVehicles = async () => {
            const data = await initializeData('vehicles', 'finanzas_vehicles')
            setVehicles(data)
        }
        loadVehicles()
    }, [])

    // ============================================================================
    // EFFECT: Sincronizar con localStorage (fallback)
    // ============================================================================
    useEffect(() => {
        if (vehicles.length > 0) {
            localStorage.setItem('finanzas_vehicles', JSON.stringify(vehicles))
        }
    }, [vehicles])

    // ============================================================================
    // FUNCIÓN: handleAddVehicle
    // PROPÓSITO: Agregar nuevo vehículo con sus parámetros de mantenimiento
    // SINCRONIZA: Con Supabase
    // ============================================================================
    const handleAddVehicle = async (e) => {
        e.preventDefault()
        // Crear objeto de vehículo con datos procesados
        const vehicle = {
            id: crypto.randomUUID(),
            ...newVehicle,
            currentMileage: parseInt(newVehicle.currentMileage),
            maintenanceItems: newVehicle.maintenanceItems.map(item => ({
                ...item,
                lastMileage: parseInt(item.lastMileage),
                interval: parseInt(item.interval),
                estimatedCost: parseFloat(item.estimatedCost) || 0
            }))
        }

        // Agregar al estado
        const updatedVehicles = [...vehicles, vehicle]
        setVehicles(updatedVehicles)

        // Sincronizar con Supabase
        await saveToSupabase('vehicles', 'finanzas_vehicles', vehicle, updatedVehicles)

        // Cerrar modal y resetear formulario
        setIsModalOpen(false)
        setNewVehicle({
            name: '', plate: '', type: 'Carro', currentMileage: '',
            maintenanceItems: [
                { id: 1, label: 'Cambio de Aceite', lastMileage: '', interval: 5000, estimatedCost: 0 },
                { id: 2, label: 'Pastillas de Freno', lastMileage: '', interval: 20000, estimatedCost: 0 }
            ]
        })
    }

    // ============================================================================
    // FUNCIÓN: deleteVehicle
    // PROPÓSITO: Eliminar vehículo
    // SINCRONIZA: Con Supabase
    // ============================================================================
    const deleteVehicle = async (id) => {
        if (window.confirm('¿Eliminar este vehículo?')) {
            const updatedVehicles = vehicles.filter(v => v.id !== id)
            setVehicles(updatedVehicles)
            await deleteFromSupabase('vehicles', 'finanzas_vehicles', id, updatedVehicles)
        }
    }

    // ============================================================================
    // FUNCIÓN: updateMileage
    // PROPÓSITO: Actualizar kilometraje actual del vehículo
    // SINCRONIZA: Con Supabase
    // ============================================================================
    const updateMileage = async (vehicleId, newKm) => {
        const updatedVehicles = vehicles.map(v => v.id === vehicleId ? { ...v, currentMileage: parseInt(newKm) || 0 } : v)
        setVehicles(updatedVehicles)

        // Sincronizar vehículo actualizado
        const updatedVehicle = updatedVehicles.find(v => v.id === vehicleId)
        if (updatedVehicle) {
            await saveToSupabase('vehicles', 'finanzas_vehicles', updatedVehicle, updatedVehicles)
        }
    }

    // ============================================================================
    // FUNCIÓN: resetMaintenance
    // PROPÓSITO: Marcar mantenimiento como realizado (resetear contador)
    // SINCRONIZA: Con Supabase
    // ============================================================================
    const resetMaintenance = async (vehicleId, itemId) => {
        const updatedVehicles = vehicles.map(v => {
            if (v.id === vehicleId) {
                return {
                    ...v,
                    maintenanceItems: v.maintenanceItems.map(item =>
                        item.id === itemId ? { ...item, lastMileage: v.currentMileage } : item
                    )
                }
            }
            return v
        })

        setVehicles(updatedVehicles)

        // Sincronizar vehículo actualizado
        const updatedVehicle = updatedVehicles.find(v => v.id === vehicleId)
        if (updatedVehicle) {
            await saveToSupabase('vehicles', 'finanzas_vehicles', updatedVehicle, updatedVehicles)
        }
    }

    const getStatus = (current, last, interval) => {
        const remaining = (last + interval) - current
        if (remaining <= 0) return { label: 'VENCIDO', color: 'text-rose-600 bg-rose-50', icon: AlertTriangle }
        if (remaining < 500) return { label: 'PRÓXIMO', color: 'text-amber-600 bg-amber-50', icon: Calendar }
        return { label: 'AL DÍA', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Vehículos</h2>
                    <p className="text-slate-500 font-medium">Control de mantenimientos y costos de operación.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    <span>Agregar Vehículo</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {vehicles.length === 0 ? (
                    <div className="col-span-full card py-20 text-center border-dashed border-2">
                        <Car className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No has registrado vehículos.</p>
                    </div>
                ) : (
                    vehicles.map((v) => (
                        <div key={v.id} className="card overflow-hidden !p-0">
                            {/* Card Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-100/30">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                            <Car size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{v.name} <span className="text-slate-400 font-medium text-sm">[{v.plate}]</span></h4>
                                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{v.type}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteVehicle(v.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Kilometraje Actual</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={v.currentMileage}
                                                onChange={(e) => updateMileage(v.id, e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KM</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-200 min-w-[120px]">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Total Mantenimientos</label>
                                        <div className="text-sm font-bold text-emerald-600 flex items-center">
                                            <DollarSign size={14} />
                                            {v.maintenanceItems.reduce((sum, i) => sum + i.estimatedCost, 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Maintenance Grid */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {v.maintenanceItems.map((item) => {
                                    const s = getStatus(v.currentMileage, item.lastMileage, item.interval)
                                    const progress = Math.min(100, Math.max(0, ((v.currentMileage - item.lastMileage) / item.interval) * 100))

                                    return (
                                        <div key={item.id} className="p-4 rounded-2xl border border-slate-100 space-y-3 hover:border-blue-100 transition-colors group">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-bold text-slate-700 block">{item.label}</span>
                                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                                                        Est: ${item.estimatedCost.toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${s.color}`}>
                                                    <s.icon size={12} />{s.label}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-end justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Uso</span>
                                                    <span className="text-[10px] font-bold text-slate-500">{v.currentMileage - item.lastMileage} / {item.interval} KM</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden text-[0px]">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : 'bg-blue-600'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => resetMaintenance(v.id, item.id)}
                                                className="w-full py-1.5 text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-slate-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                MARCAR COMO REALIZADO
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">Agregar Vehículo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                        </div>
                        <form onSubmit={handleAddVehicle} className="p-8 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div className="space-y-4">
                                    <h5 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                                        <Car size={18} className="text-blue-600" /> Datos Generales
                                    </h5>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                                        <input type="text" required className="input-field" value={newVehicle.name} onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Placa</label>
                                        <input type="text" required className="input-field" value={newVehicle.plate} onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">KM Actual</label>
                                        <input type="number" required className="input-field" value={newVehicle.currentMileage} onChange={e => setNewVehicle({ ...newVehicle, currentMileage: e.target.value })} />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <h5 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <Settings size={18} className="text-blue-600" /> Mantenimientos y Costos
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNewVehicle({ ...newVehicle, maintenanceItems: [...newVehicle.maintenanceItems, { id: Date.now(), label: '', lastMileage: '', interval: '', estimatedCost: 0 }] })}
                                            className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 font-bold"
                                        >
                                            + AÑADIR PARÁMETRO
                                        </button>
                                    </h5>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                                        {newVehicle.maintenanceItems.map((item, index) => (
                                            <div key={item.id} className="p-4 bg-slate-50 rounded-xl space-y-3 relative group border border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewVehicle({ ...newVehicle, maintenanceItems: newVehicle.maintenanceItems.filter(i => i.id !== item.id) })}
                                                    className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                                                    <input
                                                        type="text" required className="input-field !py-1.5" placeholder="Ej. Llantas"
                                                        value={item.label}
                                                        onChange={e => {
                                                            const newItems = [...newVehicle.maintenanceItems];
                                                            newItems[index].label = e.target.value;
                                                            setNewVehicle({ ...newVehicle, maintenanceItems: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Último KM</label>
                                                        <input
                                                            type="number" required className="input-field !py-1.5"
                                                            value={item.lastMileage}
                                                            onChange={e => {
                                                                const newItems = [...newVehicle.maintenanceItems];
                                                                newItems[index].lastMileage = e.target.value;
                                                                setNewVehicle({ ...newVehicle, maintenanceItems: newItems });
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Frecuencia</label>
                                                        <input
                                                            type="number" required className="input-field !py-1.5"
                                                            value={item.interval}
                                                            onChange={e => {
                                                                const newItems = [...newVehicle.maintenanceItems];
                                                                newItems[index].interval = e.target.value;
                                                                setNewVehicle({ ...newVehicle, maintenanceItems: newItems });
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Costo Est.</label>
                                                        <input
                                                            type="number" step="0.01" required className="input-field !py-1.5 border-emerald-100 focus:border-emerald-500"
                                                            value={item.estimatedCost}
                                                            onChange={e => {
                                                                const newItems = [...newVehicle.maintenanceItems];
                                                                newItems[index].estimatedCost = e.target.value;
                                                                setNewVehicle({ ...newVehicle, maintenanceItems: newItems });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 border-t pt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary !py-3 shadow-lg shadow-blue-200">Guardar Vehículo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vehicles
