// ============================================================================
// IMPORTS: React, iconos, animaciones y categorías
// ============================================================================
import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Copy, Trash2, PieChart, X, TrendingUp, Calendar, ChevronRight, LayoutGrid, BarChart3, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format, subMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { DEFAULT_CATEGORIES } from '../constants/categories'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase } from '../lib/supabaseSync'

const ExecutionChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.budgeted, d.executed)), 100)

    return (
        <div className="relative h-[250px] w-full pt-10 pb-8 px-4">
            <div className="flex items-end justify-between h-full gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
                {data.map((item, i) => (
                    <div key={item.label} className="flex-1 flex flex-col items-center min-w-[60px] group">
                        <div className="relative w-full flex justify-center gap-1 h-[200px] items-end">
                            {/* Budget Bar */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.budgeted / maxVal) * 100}%` }}
                                className="w-3 sm:w-4 bg-slate-200 rounded-t-sm relative group"
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                                    Pres: ${item.budgeted.toLocaleString()}
                                </div>
                            </motion.div>
                            {/* Executed Bar */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.executed / maxVal) * 100}%` }}
                                className={`w-3 sm:w-4 rounded-t-sm relative group ${item.executed > item.budgeted ? 'bg-rose-500' : 'bg-blue-600'}`}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                                    Ejec: ${item.executed.toLocaleString()}
                                </div>
                            </motion.div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-3 truncate w-full text-center uppercase tracking-tighter">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
            {/* Guide Lines */}
            <div className="absolute left-0 right-0 top-10 h-[200px] border-b border-slate-100 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-50 w-full" />
                <div className="border-t border-slate-50 w-full" />
                <div className="border-t border-slate-50 w-full" />
            </div>
        </div>
    )
}

// ============================================================================
// COMPONENTE: BudgetModule
// PROPÓSITO: Gestionar presupuestos mensuales y análisis de gastos
// CONECTADO A: Supabase tabla 'budgets'
// ============================================================================
const BudgetModule = () => {
    const [activeTab, setActiveTab] = useState('config') // 'config' or 'analysis'
    const [currentPeriod, setCurrentPeriod] = useState(format(new Date(), 'yyyy-MM'))
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All')

    // Estado para presupuestos - se carga desde Supabase
    const [budgets, setBudgets] = useState({})
    // Estado para transacciones - se carga desde Supabase
    const [transactions, setTransactions] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newCategory, setNewCategory] = useState({ name: '', amount: '', type: 'expense' })

    // ============================================================================
    // EFFECT: Cargar datos desde Supabase al montar componente
    // ============================================================================
    useEffect(() => {
        const loadData = async () => {
            // Cargar presupuestos desde Supabase
            const budgetData = await initializeData('budgets', 'finanzas_budgets')
            setBudgets(budgetData || {})
            // Cargar transacciones desde Supabase
            const txData = await initializeData('transactions', 'finanzas_transactions')
            setTransactions(txData || [])
        }
        loadData()
    }, [])

    // ============================================================================
    // EFFECT: Escuchar cambios de storage (sincronización entre pestañas)
    // ============================================================================
    useEffect(() => {
        const handleStorageChange = () => {
            setTransactions(JSON.parse(localStorage.getItem('finanzas_transactions') || '[]'))
            setBudgets(JSON.parse(localStorage.getItem('finanzas_budgets') || '{}'))
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    // Initialize with default categories if empty for the current period
    useEffect(() => {
        if (!budgets[currentPeriod]) {
            const defaults = [
                ...DEFAULT_CATEGORIES.income.map(c => ({ id: c.id, name: c.name, projected: 0, actual: 0, type: 'income' })),
                ...DEFAULT_CATEGORIES.expense.map(c => ({ id: c.id, name: c.name, projected: 0, actual: 0, type: 'expense' }))
            ];
            setBudgets(prev => ({
                ...prev,
                [currentPeriod]: defaults
            }));
        }
    }, [currentPeriod, budgets]);

    // ============================================================================
    // EFFECT: Sincronizar presupuestos con Supabase y localStorage
    // ============================================================================
    useEffect(() => {
        const syncBudgets = async () => {
            // Guardar en localStorage
            localStorage.setItem('finanzas_budgets', JSON.stringify(budgets))
            // Sincronizar con Supabase
            if (Object.keys(budgets).length > 0) {
                await saveToSupabase('budgets', 'finanzas_budgets', budgets, [budgets])
            }
        }
        syncBudgets()
    }, [budgets])

    const currentMonthBudgets = budgets[currentPeriod] || []

    // ============================================================================
    // FUNCIÓN: handleAddCategory
    // PROPÓSITO: Agregar nueva categoría al presupuesto del mes actual
    // SINCRONIZA: Con Supabase automáticamente via useEffect
    // ============================================================================
    const handleAddCategory = (e) => {
        e.preventDefault()
        if (!newCategory.name || !newCategory.amount) return

        // Crear objeto de categoría
        const category = {
            id: crypto.randomUUID(),
            name: newCategory.name,
            projected: parseFloat(newCategory.amount),
            type: newCategory.type,
            actual: 0
        }

        // Actualizar presupuestos (se sincroniza automáticamente)
        setBudgets(prev => ({
            ...prev,
            [currentPeriod]: [...(prev[currentPeriod] || []), category]
        }))

        // Resetear formulario
        setNewCategory({ name: '', amount: '', type: 'expense' })
        setIsModalOpen(false)
    }

    // ============================================================================
    // FUNCIÓN: handleDeleteCategory
    // PROPÓSITO: Eliminar categoría del presupuesto
    // SINCRONIZA: Con Supabase automáticamente via useEffect
    // ============================================================================
    const handleDeleteCategory = (id) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
        setBudgets(prev => ({
            ...prev,
            [currentPeriod]: prev[currentPeriod].filter(c => c.id !== id)
        }))
    }

    // ============================================================================
    // FUNCIÓN: clonePreviousBudget
    // PROPÓSITO: Clonar presupuesto del mes anterior al mes actual
    // SINCRONIZA: Con Supabase automáticamente via useEffect
    // ============================================================================
    const clonePreviousBudget = () => {
        const prevPeriod = format(subMonths(parseISO(`${currentPeriod}-01`), 1), 'yyyy-MM')
        const prevBudgets = budgets[prevPeriod]

        if (!prevBudgets || prevBudgets.length === 0) {
            alert('No se encontró un presupuesto para el mes anterior.')
            return
        }

        if (currentMonthBudgets.length > 0 && !confirm('¿Deseas sobreescribir el presupuesto actual con el del mes anterior?')) {
            return
        }

        // Clonar presupuestos con nuevos IDs
        const clonedBudgets = prevBudgets.map(b => ({ ...b, id: crypto.randomUUID(), actual: 0 }))
        setBudgets(prev => ({
            ...prev,
            [currentPeriod]: clonedBudgets
        }))
    }

    // Unique category names for filtering
    const allCategoryNames = useMemo(() => {
        const names = new Set()
        Object.values(budgets).forEach(cats => {
            cats.filter(c => c.type === 'expense').forEach(c => names.add(c.name))
        })
        return Array.from(names).sort()
    }, [budgets])

    // Calculation for Analysis
    const stats = useMemo(() => {
        const monthlyStats = {}
        const yearlyStats = {}

        // Process Budgets
        Object.entries(budgets).forEach(([period, categories]) => {
            const year = period.substring(0, 4)
            if (!monthlyStats[period]) monthlyStats[period] = { budgeted: 0, executed: 0 }
            if (!yearlyStats[year]) yearlyStats[year] = { budgeted: 0, executed: 0 }

            categories.forEach(cat => {
                if (cat.type === 'expense') {
                    if (selectedCategoryFilter === 'All' || cat.name === selectedCategoryFilter) {
                        monthlyStats[period].budgeted += cat.projected || 0
                        yearlyStats[year].budgeted += cat.projected || 0
                    }
                }
            })
        })

        // Process Transactions
        transactions.forEach(t => {
            const period = t.date.substring(0, 7)
            const year = t.date.substring(0, 4)
            if (t.type === 'expense') {
                if (selectedCategoryFilter === 'All' || t.category === selectedCategoryFilter) {
                    if (!monthlyStats[period]) monthlyStats[period] = { budgeted: 0, executed: 0 }
                    if (!yearlyStats[year]) yearlyStats[year] = { budgeted: 0, executed: 0 }
                    monthlyStats[period].executed += t.amount
                    yearlyStats[year].executed += t.amount
                }
            }
        })

        return { monthlyStats, yearlyStats }
    }, [budgets, transactions, selectedCategoryFilter])

    const sortedPeriods = Object.keys(stats.monthlyStats).sort().reverse()
    const chartData = sortedPeriods.slice(0, 6).reverse().map(p => ({
        label: format(parseISO(p + '-01'), 'MMM yy', { locale: es }),
        budgeted: stats.monthlyStats[p].budgeted,
        executed: stats.monthlyStats[p].executed
    }))

    const totalProjected = currentMonthBudgets.reduce((sum, c) => sum + (c.type === 'expense' ? (c.projected || 0) : 0), 0)
    const totalExecuted = transactions
        .filter(t => t.date.startsWith(currentPeriod) && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Presupuesto</h2>
                    <p className="text-slate-500 font-medium tracking-tight">Controla y optimiza tu salud financiera mes a mes.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid size={18} />
                            <span>Configuración</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <BarChart3 size={18} />
                            <span>Análisis</span>
                        </button>
                    </div>

                    {activeTab === 'config' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="month"
                                value={currentPeriod}
                                onChange={(e) => setCurrentPeriod(e.target.value)}
                                className="input-field w-auto min-w-[150px] font-semibold text-slate-700 bg-white"
                            />
                            <button onClick={clonePreviousBudget} className="btn-secondary !p-3" title="Clonar Anterior">
                                <Copy size={18} />
                            </button>
                            <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                                <Plus size={18} />
                                <span className="hidden sm:inline">Nueva Categoría</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {activeTab === 'config' ? (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="card border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white group overflow-hidden relative">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Límite de Gastos</p>
                            <div className="flex items-baseline gap-1 relative z-10">
                                <span className="text-3xl font-black">${totalProjected.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-blue-200">MXN</span>
                            </div>
                        </div>
                        <div className="card border-none shadow-sm bg-white">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Gasto Real</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900">${totalExecuted.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-400">MXN</span>
                            </div>
                        </div>
                        <div className="card border-none shadow-sm bg-white flex items-center justify-between pr-8">
                            <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Disponible</p>
                                <p className={`text-2xl font-black ${(totalProjected - totalExecuted) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ${(totalProjected - totalExecuted).toLocaleString()}
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${totalProjected > 0 ? (totalExecuted / totalProjected > 1 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600') : 'bg-slate-50 text-slate-300'}`}>
                                {totalProjected > 0 ? ((totalExecuted / totalProjected) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                    </div>

                    {/* Categories Table */}
                    <div className="card !p-0 overflow-hidden shadow-xl border-slate-200/40">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <LayoutGrid size={18} className="text-slate-400" /> Catálogo Mensual
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(parseISO(currentPeriod + '-01'), 'MMMM yyyy', { locale: es })}</span>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo / Categoría</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Proyectado</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentMonthBudgets.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center text-slate-400 italic font-medium">No has definido categorías para este periodo.</td>
                                    </tr>
                                ) : (
                                    currentMonthBudgets.map((cat) => (
                                        <tr key={cat.id} className="group hover:bg-slate-50/80 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-slate-400 text-xs font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        value={cat.projected}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            setBudgets(prev => ({
                                                                ...prev,
                                                                [currentPeriod]: prev[currentPeriod].map(c => c.id === cat.id ? { ...c, projected: val } : c)
                                                            }));
                                                        }}
                                                        className="w-24 text-right font-black text-slate-900 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none transition-all py-1 px-2"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-rose-100">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Interactive Analysis Sidebar */}
                        <div className="lg:w-80 space-y-6">
                            <div className="card border-none shadow-xl shadow-slate-200/50 bg-white">
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                    <Filter size={18} className="text-blue-600" />
                                    <h4 className="font-black text-slate-900 text-sm italic uppercase tracking-wider">Filtro Inteligente</h4>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrar por Categoría</p>
                                    <select
                                        value={selectedCategoryFilter}
                                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                        className="input-field w-full font-bold text-sm bg-slate-50 border-slate-100"
                                    >
                                        <option value="All">Todas las de Gastos</option>
                                        {allCategoryNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                                        <TrendingUp size={16} className="text-blue-600 mt-1 shrink-0" />
                                        <p className="text-xs text-blue-900 font-medium leading-relaxed">
                                            Analiza la tendencia de tus gastos en los últimos 6 meses para tomar mejores decisiones.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Yearly Quick Badge */}
                            <div className="card bg-slate-900 text-white border-none shadow-lg">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">Ahorro Promedio Mensual</p>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-3xl font-black text-emerald-400">
                                        +{(Object.values(stats.monthlyStats).reduce((sum, s) => sum + (s.budgeted - s.executed), 0) / Math.max(1, Object.keys(stats.monthlyStats).length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </h4>
                                    <ArrowUpRight className="text-emerald-500" size={32} />
                                </div>
                            </div>
                        </div>

                        {/* Chart & Detail */}
                        <div className="flex-1 space-y-8">
                            {/* Graphic View */}
                            <div className="card border-none shadow-xl shadow-slate-200/50 bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight italic flex items-center gap-2">
                                        <TrendingUp size={20} className="text-blue-600" /> Comparativa vs Presupuesto
                                    </h4>
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-slate-200 rounded-sm" /> <span>Presupuesto</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-600 rounded-sm" /> <span>Real</span>
                                        </div>
                                    </div>
                                </div>
                                <ExecutionChart data={chartData} />
                            </div>

                            {/* Monthly Table */}
                            <div className="card !p-0 overflow-hidden shadow-xl border-slate-200/20 bg-white/80 backdrop-blur-md">
                                <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-3">
                                    <Calendar size={18} className="text-slate-400" />
                                    <h4 className="font-black text-slate-800 tracking-tight italic uppercase text-sm">Desglose de Ejecución Mensual</h4>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mes</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presupuesto</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ahorro / Variación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sortedPeriods.length === 0 ? (
                                            <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400 italic">No hay historial disponible.</td></tr>
                                        ) : (
                                            sortedPeriods.slice(0, 12).map(period => {
                                                const s = stats.monthlyStats[period]
                                                const diff = s.budgeted - s.executed
                                                return (
                                                    <tr key={period} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-8 py-5 font-black text-slate-800 capitalize italic">
                                                            {format(parseISO(period + '-01'), 'MMMM yyyy', { locale: es })}
                                                        </td>
                                                        <td className="px-8 py-5 text-right font-bold text-slate-500">${s.budgeted.toLocaleString()}</td>
                                                        <td className="px-8 py-5 text-right font-black text-slate-900">${s.executed.toLocaleString()}</td>
                                                        <td className={`px-8 py-5 text-right font-black ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            <div className="flex items-center justify-end gap-1">
                                                                {diff >= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                                ${Math.abs(diff).toLocaleString()}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Nueva Categoría */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900 italic tracking-tight">Nueva Categoría</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleAddCategory} className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setNewCategory({ ...newCategory, type: 'income' })} className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${newCategory.type === 'income' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}>Ingreso</button>
                                    <button type="button" onClick={() => setNewCategory({ ...newCategory, type: 'expense' })} className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${newCategory.type === 'expense' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}>Gasto</button>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                                        <input type="text" autoFocus required placeholder="Ej: Supermercado, Renta..." className="input-field !text-lg !font-bold" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meta Mensual ($)</label>
                                        <input type="number" required placeholder="0.00" className="input-field !text-3xl !font-black !py-4" value={newCategory.amount} onChange={(e) => setNewCategory({ ...newCategory, amount: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                                    <button type="submit" className="flex-1 btn-primary !py-4 !text-base shadow-xl shadow-blue-200">Guardar</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default BudgetModule
