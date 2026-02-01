// ============================================================================
// IMPORTS: React, iconos y utilidades de fecha
// ============================================================================
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Car, Settings, Calendar, Gauge, AlertTriangle, CheckCircle2, ChevronRight, X, DollarSign, Clock, Pencil } from 'lucide-react'
import { format } from 'date-fns'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: Vehicles
// PROPÓSITO: Gestionar vehículos y control de mantenimientos
// CONECTADO A: Supabase tabla 'vehicles'
// ============================================================================
const Vehicles = ({ vehicles, setVehicles }) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
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
    // FUNCIÓN: handleAddVehicle
    // PROPÓSITO: Agregar nuevo vehículo con sus parámetros de mantenimiento
    // SINCRONIZA: Con Supabase
    // ============================================================================
    const handleAddVehicle = async (e) => {
        e.preventDefault()

        const vehicleData = {
            ...newVehicle,
            currentMileage: parseInt(newVehicle.currentMileage),
            maintenanceItems: newVehicle.maintenanceItems.map(item => ({
                ...item,
                lastMileage: parseInt(item.lastMileage),
                interval: parseInt(item.interval),
                estimatedCost: parseFloat(item.estimatedCost) || 0
            }))
        }

        let updatedVehicles;
        if (editingId) {
            // Modo Edición
            updatedVehicles = vehicles.map(v => v.id === editingId ? { ...vehicleData, id: editingId } : v)
            setVehicles(updatedVehicles)
            const updatedVehicle = updatedVehicles.find(v => v.id === editingId)
            await saveToSupabase('vehicles', 'finanzas_vehicles', updatedVehicle, updatedVehicles)
        } else {
            // Modo Creación
            const vehicle = {
                id: crypto.randomUUID(),
                ...vehicleData
            }
            updatedVehicles = [...vehicles, vehicle]
            setVehicles(updatedVehicles)
            await saveToSupabase('vehicles', 'finanzas_vehicles', vehicle, updatedVehicles)
        }

        // Cerrar modal y resetear formulario
        setIsModalOpen(false)
        setEditingId(null)
        setNewVehicle({
            name: '', plate: '', type: 'Carro', currentMileage: '',
            maintenanceItems: [
                { id: 1, label: 'Cambio de Aceite', lastMileage: '', interval: 5000, estimatedCost: 0 },
                { id: 2, label: 'Pastillas de Freno', lastMileage: '', interval: 20000, estimatedCost: 0 }
            ]
        })
    }

    // ============================================================================
    // FUNCIÓN: openEditModal
    // PROPÓSITO: Abrir modal con datos de un vehículo existente para editar
    // ============================================================================
    const openEditModal = (vehicle) => {
        setEditingId(vehicle.id)
        setNewVehicle({
            ...vehicle,
            maintenanceItems: vehicle.maintenanceItems.map(item => ({
                ...item,
                // Asegurar que los valores sean números o strings vacíos para el input
                lastMileage: item.lastMileage ?? '',
                interval: item.interval ?? '',
                estimatedCost: item.estimatedCost ?? 0
            }))
        })
        setIsModalOpen(true)
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
        const target = (parseInt(last) || 0) + (parseInt(interval) || 0)
        const remaining = target - current
        const traveled = current - last

        // Caso de error: kilometraje actual menor al último mantenimiento
        if (traveled < 0) return { label: 'REVISAR DATOS', color: 'text-slate-400 bg-slate-100', icon: AlertTriangle, remaining: 0, target, overdue: false }

        if (remaining <= 0) return { label: 'VENCIDO', color: 'text-rose-600 bg-rose-50', icon: AlertTriangle, remaining: Math.abs(remaining), target, overdue: true }
        if (remaining < 500) return { label: 'PRÓXIMO', color: 'text-amber-600 bg-amber-50', icon: Calendar, remaining, target, overdue: false }
        return { label: 'AL DÍA', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2, remaining, target, overdue: false }
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
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEditModal(v)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar Vehículo">
                                            <Pencil size={18} />
                                        </button>
                                        <button onClick={() => deleteVehicle(v.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Eliminar Vehículo">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
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
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {v.currentMileage < item.lastMileage ? 'Estado de KM' : s.overdue ? 'Aviso de Mantenimiento' : 'Próximo cambio'}
                                                    </span>
                                                    <span className={`text-[10px] font-black border-b-2 pb-0.5 ${s.overdue ? 'text-rose-600 border-rose-100' : 'text-slate-900 border-slate-100'}`}>
                                                        {v.currentMileage < item.lastMileage
                                                            ? 'Actual < Último'
                                                            : s.overdue
                                                                ? `Vencido hace: ${s.remaining.toLocaleString()} KM`
                                                                : `Faltan: ${s.remaining.toLocaleString()} KM`}
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden text-[0px] shadow-inner">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${s.overdue ? 'bg-rose-500' : progress > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-[8px] font-black text-slate-400 bg-slate-50/50 px-2 py-1 rounded-md mt-1 italic">
                                                    <span>Objetivo: {s.target.toLocaleString()} KM</span>
                                                    <span>Frecuencia: {item.interval.toLocaleString()} KM</span>
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
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setIsModalOpen(false); setEditingId(null); }} />
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 italic uppercase">
                                    {editingId ? 'Editar Vehículo' : 'Registrar Vehículo'}
                                </h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                    {editingId ? 'Actualización de activos' : 'Configuración inicial de activos'}
                                </p>
                            </div>
                            <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddVehicle} className="p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-10">
                                {/* Section 1: Basic Info */}
                                <div className="lg:col-span-4 space-y-8">
                                    <h5 className="font-black text-slate-900 border-b pb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-blue-600 italic">
                                        <Car size={16} /> Identificación
                                    </h5>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block flex items-center gap-1.5">Nombre del Vehículo</label>
                                            <div className="relative group">
                                                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                                                <input
                                                    type="text" required placeholder="Ej: Toyota Hilux"
                                                    className="input-field !py-5 !pl-12 !bg-slate-50/50 !border-slate-100 focus:!bg-white focus:!border-blue-500 font-bold"
                                                    value={newVehicle.name} onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Número de Placa</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 font-black text-xs">ID</div>
                                                <input
                                                    type="text" required placeholder="P-000XXX"
                                                    className="input-field !py-5 !pl-12 !bg-slate-50/50 !border-slate-100 focus:!bg-white focus:!border-blue-500 font-black uppercase"
                                                    value={newVehicle.plate} onChange={e => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block">Kilometraje Actual del Tablero</label>
                                            <div className="relative group">
                                                <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                                                <input
                                                    type="number" required placeholder="Ingresa lo que marca tu moto/carro"
                                                    className="input-field !py-5 !pl-12 !bg-slate-50/50 !border-slate-100 focus:!bg-white focus:!border-blue-500 font-black"
                                                    value={newVehicle.currentMileage} onChange={e => setNewVehicle({ ...newVehicle, currentMileage: e.target.value })}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">KM</span>
                                            </div>
                                            <p className="text-[9px] text-slate-400 mt-2 italic px-2">Este valor se compara con el último mantenimiento para avisarte cuando toca el próximo.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Maintenance Parameters */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h5 className="font-black text-slate-900 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-600 italic">
                                            <Settings size={16} /> Parámetros de Mantenimiento
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={() => setNewVehicle({ ...newVehicle, maintenanceItems: [...newVehicle.maintenanceItems, { id: Date.now(), label: '', lastMileage: '', interval: '', estimatedCost: 0 }] })}
                                            className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2 shadow-sm"
                                        >
                                            <Plus size={14} /> Nuevo Parámetro
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar p-2">
                                        {newVehicle.maintenanceItems.map((item, index) => (
                                            <div key={item.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-5 relative group hover:border-emerald-200 hover:bg-white transition-all hover:shadow-xl hover:shadow-emerald-50/50">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewVehicle({ ...newVehicle, maintenanceItems: newVehicle.maintenanceItems.filter(i => i.id !== item.id) })}
                                                    className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-all p-2 hover:bg-rose-50 rounded-full"
                                                >
                                                    <X size={16} />
                                                </button>

                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descripción</label>
                                                    <div className="relative">
                                                        <Settings className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                        <input
                                                            type="text" required className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-xs font-bold focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all"
                                                            placeholder="Nombre mantenimiento..."
                                                            value={item.label}
                                                            onChange={e => {
                                                                const newItems = [...newVehicle.maintenanceItems];
                                                                newItems[index].label = e.target.value;
                                                                setNewVehicle({ ...newVehicle, maintenanceItems: newItems });
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Kilometraje de Alerta</label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                            <input
                                                                type="number" required className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-xs font-black focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all"
                                                                value={item.interval}
                                                                onChange={e => {
                                                                    const newItems = [...newVehicle.maintenanceItems];
                                                                    newItems[index].interval = e.target.value;
                                                                    setNewVehicle({ ...newVehicle, maintenanceItems: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Presupuesto Est.</label>
                                                        <div className="relative">
                                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
                                                            <input
                                                                type="number" step="0.01" required className="w-full bg-white border border-emerald-100 rounded-xl py-3 pl-9 pr-4 text-xs font-black text-emerald-700 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all"
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
                                                <div className="pt-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block italic opacity-80">KM del ÚLTIMO mantenimiento realizado</label>
                                                    <input
                                                        type="number" required className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-[10px] font-black focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                                        placeholder="Ej: Si lo cambiaste a los 230000..."
                                                        value={item.lastMileage}
                                                        onChange={e => {
                                                            const newItems = [...newVehicle.maintenanceItems];
                                                            newItems[index].lastMileage = e.target.value;
                                                            setNewVehicle({ ...newVehicle, maintenanceItems: newItems });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 border-t border-slate-100 pt-10">
                                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="flex-1 py-5 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 rounded-[1.5rem] transition-all italic">Cancelar Registro</button>
                                <button type="submit" className="flex-[2] bg-slate-900 text-white py-5 text-sm font-black rounded-[2rem] shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] italic">
                                    {editingId ? 'Guardar Cambios' : 'Guardar Activo Vehicular'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vehicles
