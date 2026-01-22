// ============================================================================
// IMPORTS: React, iconos, animaciones y servicios de mercado
// ============================================================================
import React, { useState, useEffect, useMemo } from 'react'
import { Plus, TrendingUp, TrendingDown, RefreshCw, Search, Settings, Trash2, Calendar, DollarSign, Target, Award, AlertCircle, Check, X, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchAssetPrice, batchUpdatePrices, calculateROI, calculatePL, getDataFreshness } from '../services/marketData'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: InvestmentPortfolio
// PROPÓSITO: Gestionar portafolio de inversiones con precios en tiempo real
// CONECTADO A: Supabase tabla 'investments'
// ============================================================================
const InvestmentPortfolio = () => {
    // Estado para inversiones - se carga desde Supabase
    const [investments, setInvestments] = useState([])

    // Estado para brokers - se carga desde Supabase
    const [brokers, setBrokers] = useState(['GBM', 'Bitso', 'Interactive Brokers', 'Binance'])

    // Estado para API keys - se guarda en localStorage (sensible)
    const [apiKeys, setApiKeys] = useState(() => {
        const saved = localStorage.getItem('finanzas_api_keys')
        return saved ? JSON.parse(saved) : { finnhub: '', alphaVantage: '' }
    })

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateProgress, setUpdateProgress] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState({ field: 'roi', direction: 'desc' })

    const [newInvestment, setNewInvestment] = useState({
        broker: '',
        assetType: 'stock',
        symbol: '',
        name: '',
        quantity: '',
        buyPrice: '',
        buyCurrency: 'USD',
        buyDate: format(new Date(), 'yyyy-MM-dd')
    })

    // ============================================================================
    // EFFECT: Cargar inversiones desde Supabase al montar componente
    // ============================================================================
    useEffect(() => {
        const loadInvestments = async () => {
            // Cargar inversiones desde Supabase
            const data = await initializeData('investments', 'finanzas_investments')
            setInvestments(data)
        }
        loadInvestments()
    }, [])

    // ============================================================================
    // EFFECT: Sincronizar inversiones con localStorage (fallback)
    // ============================================================================
    useEffect(() => {
        if (investments.length > 0) {
            localStorage.setItem('finanzas_investments', JSON.stringify(investments))
        }
    }, [investments])

    // ============================================================================
    // EFFECT: Guardar API keys en localStorage (datos sensibles, solo local)
    // ============================================================================
    useEffect(() => {
        localStorage.setItem('finanzas_api_keys', JSON.stringify(apiKeys))
    }, [apiKeys])

    // Auto-update prices on mount if stale
    useEffect(() => {
        const shouldAutoUpdate = investments.some(inv => {
            const freshness = getDataFreshness(inv.lastUpdate)
            return freshness === 'stale'
        })

        if (shouldAutoUpdate && investments.length > 0) {
            handleUpdateAllPrices()
        }
    }, [])

    // ============================================================================
    // FUNCIÓN: handleAddInvestment
    // PROPÓSITO: Agregar nueva inversión y obtener precio actual del mercado
    // SINCRONIZA: Con Supabase después de obtener el precio
    // ============================================================================
    const handleAddInvestment = async (e) => {
        e.preventDefault()

        // Crear objeto de inversión con datos del formulario
        const investment = {
            id: crypto.randomUUID(), // ID único
            ...newInvestment,
            quantity: parseFloat(newInvestment.quantity),
            buyPrice: parseFloat(newInvestment.buyPrice),
            currentPrice: parseFloat(newInvestment.buyPrice), // Inicialmente = precio de compra
            lastUpdate: Date.now() // Timestamp de última actualización
        }

        // Intentar obtener precio actual del mercado inmediatamente
        try {
            const price = await fetchAssetPrice(investment, apiKeys)
            if (price) {
                investment.currentPrice = price
                investment.lastUpdate = Date.now()
            }
        } catch (error) {
            console.warn('No se pudo obtener precio inicial:', error)
        }

        // Agregar inversión al estado
        const updatedInvestments = [investment, ...investments]
        setInvestments(updatedInvestments)

        // Sincronizar con Supabase
        await saveToSupabase('investments', 'finanzas_investments', investment, updatedInvestments)

        // Cerrar modal y resetear formulario
        setIsModalOpen(false)
        setNewInvestment({
            broker: '',
            assetType: 'stock',
            symbol: '',
            name: '',
            quantity: '',
            buyPrice: '',
            buyCurrency: 'USD',
            buyDate: format(new Date(), 'yyyy-MM-dd')
        })
    }

    // ============================================================================
    // FUNCIÓN: handleUpdateAllPrices
    // PROPÓSITO: Actualizar precios de todas las inversiones desde APIs de mercado
    // SINCRONIZA: Inversiones actualizadas con Supabase
    // ============================================================================
    const handleUpdateAllPrices = async () => {
        if (investments.length === 0) return

        setIsUpdating(true)
        setUpdateProgress(0)

        // Actualizar precios en lote usando el servicio de mercado
        const results = await batchUpdatePrices(
            investments,
            apiKeys,
            (progress) => setUpdateProgress(progress * 100)
        )

        // Actualizar inversiones con los nuevos precios obtenidos
        const updatedInvestments = investments.map(inv => {
            const result = results.find(r => r.id === inv.id)
            if (result && result.success && result.price) {
                return {
                    ...inv,
                    currentPrice: result.price,
                    lastUpdate: result.timestamp
                }
            }
            return inv
        })

        // Actualizar estado
        setInvestments(updatedInvestments)

        // Sincronizar todas las inversiones actualizadas con Supabase
        for (const inv of updatedInvestments) {
            await saveToSupabase('investments', 'finanzas_investments', inv, updatedInvestments)
        }

        setIsUpdating(false)
        setUpdateProgress(0)
    }

    // ============================================================================
    // FUNCIÓN: deleteInvestment
    // PROPÓSITO: Eliminar una inversión del portafolio
    // SINCRONIZA: Eliminación con Supabase
    // ============================================================================
    const deleteInvestment = async (id) => {
        if (confirm('¿Eliminar esta inversión?')) {
            // Filtrar inversión a eliminar
            const updatedInvestments = investments.filter(inv => inv.id !== id)

            // Actualizar estado
            setInvestments(updatedInvestments)

            // Sincronizar eliminación con Supabase
            await deleteFromSupabase('investments', 'finanzas_investments', id, updatedInvestments)
        }
    }

    // Calculate portfolio metrics
    const metrics = useMemo(() => {
        if (investments.length === 0) {
            return { totalValue: 0, totalCost: 0, totalPL: 0, totalROI: 0, best: null, worst: null }
        }

        let totalValue = 0
        let totalCost = 0
        let best = investments[0]
        let worst = investments[0]

        investments.forEach(inv => {
            const cost = inv.buyPrice * inv.quantity
            const value = inv.currentPrice * inv.quantity
            totalCost += cost
            totalValue += value

            const roi = calculateROI(inv.buyPrice, inv.currentPrice)
            const bestROI = calculateROI(best.buyPrice, best.currentPrice)
            const worstROI = calculateROI(worst.buyPrice, worst.currentPrice)

            if (roi > bestROI) best = inv
            if (roi < worstROI) worst = inv
        })

        const totalPL = totalValue - totalCost
        const totalROI = totalCost > 0 ? (totalPL / totalCost) * 100 : 0

        return { totalValue, totalCost, totalPL, totalROI, best, worst }
    }, [investments])

    // Asset distribution
    const assetDistribution = useMemo(() => {
        const dist = {}
        investments.forEach(inv => {
            const value = inv.currentPrice * inv.quantity
            dist[inv.assetType] = (dist[inv.assetType] || 0) + value
        })
        return Object.entries(dist).map(([type, value]) => ({
            type,
            value,
            percentage: (value / metrics.totalValue) * 100
        }))
    }, [investments, metrics.totalValue])

    // Filtered and sorted investments
    const filteredInvestments = useMemo(() => {
        let filtered = investments.filter(inv =>
            inv.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.broker.toLowerCase().includes(searchQuery.toLowerCase())
        )

        filtered.sort((a, b) => {
            let aVal, bVal

            switch (sortBy.field) {
                case 'roi':
                    aVal = calculateROI(a.buyPrice, a.currentPrice)
                    bVal = calculateROI(b.buyPrice, b.currentPrice)
                    break
                case 'pl':
                    aVal = calculatePL(a.buyPrice, a.currentPrice, a.quantity)
                    bVal = calculatePL(b.buyPrice, b.currentPrice, b.quantity)
                    break
                case 'value':
                    aVal = a.currentPrice * a.quantity
                    bVal = b.currentPrice * b.quantity
                    break
                default:
                    return 0
            }

            return sortBy.direction === 'asc' ? aVal - bVal : bVal - aVal
        })

        return filtered
    }, [investments, searchQuery, sortBy])

    const ASSET_TYPES = [
        { value: 'stock', label: 'Acción', icon: '📈' },
        { value: 'crypto', label: 'Criptomoneda', icon: '₿' },
        { value: 'etf', label: 'ETF', icon: '📊' },
        { value: 'bond', label: 'Bono', icon: '🏦' },
        { value: 'other', label: 'Otro', icon: '💼' }
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Portafolio de Inversiones <TrendingUp className="text-emerald-500" />
                    </h2>
                    <p className="text-slate-500 font-medium italic">Control total de tus inversiones con datos en tiempo real.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleUpdateAllPrices}
                        disabled={isUpdating || investments.length === 0}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className={isUpdating ? 'animate-spin' : ''} size={20} />
                        <span className="hidden sm:inline">{isUpdating ? `${Math.round(updateProgress)}%` : 'Actualizar Precios'}</span>
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="btn-secondary !p-3"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center gap-2 shadow-xl shadow-blue-200"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Nueva Inversión</span>
                    </button>
                </div>
            </header>

            {/* Dashboard Metrics */}
            {investments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total ROI */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-2xl border-none"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Target size={32} className="opacity-80" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">ROI Total</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black">{metrics.totalROI >= 0 ? '+' : ''}{metrics.totalROI.toFixed(2)}%</span>
                            {metrics.totalROI >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        </div>
                    </motion.div>

                    {/* Total P&L */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`card shadow-2xl border-none ${metrics.totalPL >= 0 ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-rose-500 to-red-600'} text-white`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <DollarSign size={32} className="opacity-80" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Ganancia/Pérdida</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black">${metrics.totalPL >= 0 ? '+' : ''}{metrics.totalPL.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <p className="text-xs opacity-80 mt-2">Valor: ${metrics.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </motion.div>

                    {/* Best Investment */}
                    {metrics.best && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card bg-white shadow-xl border-2 border-emerald-100"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <Award size={24} className="text-emerald-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Mejor</span>
                            </div>
                            <h4 className="font-black text-slate-900 text-lg mb-1">{metrics.best.symbol}</h4>
                            <p className="text-2xl font-black text-emerald-600">+{calculateROI(metrics.best.buyPrice, metrics.best.currentPrice).toFixed(2)}%</p>
                            <p className="text-xs text-slate-500 mt-2 italic">{metrics.best.name || metrics.best.broker}</p>
                        </motion.div>
                    )}

                    {/* Worst Investment */}
                    {metrics.worst && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card bg-white shadow-xl border-2 border-rose-100"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <AlertCircle size={24} className="text-rose-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Peor</span>
                            </div>
                            <h4 className="font-black text-slate-900 text-lg mb-1">{metrics.worst.symbol}</h4>
                            <p className="text-2xl font-black text-rose-600">{calculateROI(metrics.worst.buyPrice, metrics.worst.currentPrice).toFixed(2)}%</p>
                            <p className="text-xs text-slate-500 mt-2 italic">{metrics.worst.name || metrics.worst.broker}</p>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Search Bar */}
            {investments.length > 0 && (
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por símbolo, nombre o broker..."
                        className="input-field pl-16 py-5 bg-white border-slate-100 shadow-sm text-lg font-bold"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            {/* Investments Table */}
            {filteredInvestments.length > 0 ? (
                <div className="card !p-0 overflow-hidden shadow-xl border-none bg-white rounded-[2.5rem]">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                <tr>
                                    <th className="px-8 py-6 border-r border-white/10">Broker</th>
                                    <th className="px-8 py-6 border-r border-white/10">Tipo</th>
                                    <th className="px-8 py-6 border-r border-white/10">Activo</th>
                                    <th className="px-6 py-6 border-r border-white/10 text-right">Cantidad</th>
                                    <th className="px-6 py-6 border-r border-white/10 text-right">Precio Compra</th>
                                    <th className="px-6 py-6 border-r border-white/10 text-right">Precio Actual</th>
                                    <th className="px-6 py-6 border-r border-white/10 text-right cursor-pointer hover:bg-white/10" onClick={() => setSortBy({ field: 'pl', direction: sortBy.field === 'pl' && sortBy.direction === 'desc' ? 'asc' : 'desc' })}>P&L</th>
                                    <th className="px-6 py-6 border-r border-white/10 text-right cursor-pointer hover:bg-white/10" onClick={() => setSortBy({ field: 'roi', direction: sortBy.field === 'roi' && sortBy.direction === 'desc' ? 'asc' : 'desc' })}>ROI</th>
                                    <th className="px-6 py-6 border-r border-white/10 text-center">Estado</th>
                                    <th className="px-4 py-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvestments.map(inv => {
                                    const roi = calculateROI(inv.buyPrice, inv.currentPrice)
                                    const pl = calculatePL(inv.buyPrice, inv.currentPrice, inv.quantity)
                                    const freshness = getDataFreshness(inv.lastUpdate)

                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-800">
                                            <td className="px-8 py-5 border-r border-slate-100"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black">{inv.broker}</span></td>
                                            <td className="px-8 py-5 border-r border-slate-100 capitalize">{ASSET_TYPES.find(t => t.value === inv.assetType)?.icon} {ASSET_TYPES.find(t => t.value === inv.assetType)?.label}</td>
                                            <td className="px-8 py-5 border-r border-slate-100">
                                                <div>
                                                    <p className="font-black text-lg">{inv.symbol}</p>
                                                    {inv.name && <p className="text-[10px] text-slate-400 italic">{inv.name}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 border-r border-slate-100 text-right font-mono">{inv.quantity.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                                            <td className="px-6 py-5 border-r border-slate-100 text-right font-mono">${inv.buyPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-5 border-r border-slate-100 text-right font-mono">${inv.currentPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            <td className={`px-6 py-5 border-r border-slate-100 text-right font-mono font-black ${pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ${pl >= 0 ? '+' : ''}{pl.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className={`px-6 py-5 border-r border-slate-100 text-right font-mono font-black text-lg ${roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-5 border-r border-slate-100 text-center">
                                                <div className={`inline-block w-3 h-3 rounded-full ${freshness === 'fresh' ? 'bg-emerald-500' : freshness === 'moderate' ? 'bg-amber-500' : 'bg-slate-300'}`} title={freshness === 'fresh' ? 'Actualizado' : freshness === 'moderate' ? 'Algo antiguo' : 'Desactualizado'} />
                                            </td>
                                            <td className="px-4 py-5 text-center">
                                                <button onClick={() => deleteInvestment(inv.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-50">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <TrendingUp className="mx-auto text-slate-100 mb-4" size={64} />
                    <p className="text-slate-400 font-bold text-lg">
                        {investments.length === 0 ? 'No hay inversiones registradas aún.' : 'No se encontraron resultados.'}
                    </p>
                </div>
            )}

            {/* Add Investment Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="px-12 py-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <h3 className="text-2xl font-black text-slate-900">Nueva Inversión</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:bg-white rounded-full transition-all shadow-sm"><X size={32} /></button>
                            </div>

                            <form onSubmit={handleAddInvestment} className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Broker</label>
                                        <select required className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem]" value={newInvestment.broker} onChange={e => setNewInvestment({ ...newInvestment, broker: e.target.value })}>
                                            <option value="">Selecciona broker...</option>
                                            {brokers.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Tipo de Activo</label>
                                        <select required className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem]" value={newInvestment.assetType} onChange={e => setNewInvestment({ ...newInvestment, assetType: e.target.value })}>
                                            {ASSET_TYPES.map(type => <option key={type.value} value={type.value}>{type.icon} {type.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Símbolo</label>
                                        <input type="text" required placeholder="Ej: AAPL, BTC, TSLA" className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem] uppercase" value={newInvestment.symbol} onChange={e => setNewInvestment({ ...newInvestment, symbol: e.target.value.toUpperCase() })} />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Nombre (Opcional)</label>
                                        <input type="text" placeholder="Ej: Apple Inc." className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem]" value={newInvestment.name} onChange={e => setNewInvestment({ ...newInvestment, name: e.target.value })} />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Cantidad</label>
                                        <input type="number" required step="any" min="0" placeholder="0.00" className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem]" value={newInvestment.quantity} onChange={e => setNewInvestment({ ...newInvestment, quantity: e.target.value })} />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Precio de Compra</label>
                                        <input type="number" required step="any" min="0" placeholder="0.00" className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem]" value={newInvestment.buyPrice} onChange={e => setNewInvestment({ ...newInvestment, buyPrice: e.target.value })} />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Moneda</label>
                                        <select className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem]" value={newInvestment.buyCurrency} onChange={e => setNewInvestment({ ...newInvestment, buyCurrency: e.target.value })}>
                                            <option value="USD">USD</option>
                                            <option value="MXN">MXN</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Fecha de Compra</label>
                                        <input type="date" required className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-6 !rounded-[2rem]" value={newInvestment.buyDate} onChange={e => setNewInvestment({ ...newInvestment, buyDate: e.target.value })} />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-emerald-600 text-white py-8 text-2xl font-black rounded-[4rem] shadow-2xl hover:scale-[1.02] transition-all duration-700">
                                    Añadir Inversión
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setIsSettingsOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="px-12 py-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <h3 className="text-2xl font-black text-slate-900">Configuración de APIs</h3>
                                <button onClick={() => setIsSettingsOpen(false)} className="p-4 text-slate-400 hover:bg-white rounded-full transition-all shadow-sm"><X size={32} /></button>
                            </div>

                            <div className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic flex items-center gap-2">
                                        Finnhub API Key <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"><ExternalLink size={12} /></a>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Tu API key gratuita de Finnhub"
                                        className="input-field !bg-slate-50 !border-none !font-mono !py-5 !px-6 !rounded-[2rem]"
                                        value={apiKeys.finnhub}
                                        onChange={e => setApiKeys({ ...apiKeys, finnhub: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 italic px-2">Requerida para obtener precios de acciones y ETFs. 60 llamadas/minuto gratis.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic flex items-center gap-2">
                                        Alpha Vantage API Key (Opcional) <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"><ExternalLink size={12} /></a>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Fallback para acciones"
                                        className="input-field !bg-slate-50 !border-none !font-mono !py-5 !px-6 !rounded-[2rem]"
                                        value={apiKeys.alphaVantage}
                                        onChange={e => setApiKeys({ ...apiKeys, alphaVantage: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 italic px-2">Usada como respaldo si Finnhub falla. 25 llamadas/día gratis.</p>
                                </div>

                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                                    <p className="text-xs text-blue-900 font-bold"><strong>Nota:</strong> Las criptomonedas usan CoinGecko (sin API key requerida). Tus claves se almacenan solo en tu navegador.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default InvestmentPortfolio
