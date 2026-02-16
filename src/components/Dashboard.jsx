// ============================================================================
// IMPORTS: React, iconos, utilidades de fecha y sincronización con Supabase
// ============================================================================
import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Clock, PieChart, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { calculateDebtBreakdown, getLoanTermLabel, getTermColorClass } from '../utils/loanUtils'
import { DEFAULT_CATEGORIES } from '../constants/categories'

const StatCard = ({ title, amount, icon: Icon, colorClass, trend }) => (
    <div className="card group hover:border-blue-200 transition-all duration-300">
        <div className="flex items-center justify-between mb-5">
            <div className={`p-2.5 rounded-xl ${colorClass.split(' ')[0]} bg-opacity-10 ${colorClass.split(' ')[1]}`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold tracking-tight ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h3>
        </div>
    </div>
)

const Dashboard = ({ transactions = [], accounts = [], setActiveView }) => {
    // Estado para período seleccionado
    const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'))

    // Navegación de meses
    const handlePrevMonth = () => {
        const prev = subMonths(parseISO(selectedPeriod + '-01'), 1)
        setSelectedPeriod(format(prev, 'yyyy-MM'))
    }

    const handleNextMonth = () => {
        const next = subMonths(parseISO(selectedPeriod + '-01'), -1)
        setSelectedPeriod(format(next, 'yyyy-MM'))
    }

    // Calcular estadísticas basadas en el período seleccionado
    const currentMonth = format(new Date(), 'yyyy-MM')
    const isCurrentMonth = selectedPeriod === currentMonth

    // Calcular ingresos del período seleccionado (excluyendo transferencias)
    const income = transactions
        .filter(t => t.type === 'income' && t.date.startsWith(selectedPeriod) && !t.isTransfer && t.categoryId !== 'transfer')
        .reduce((sum, t) => sum + t.amount, 0)

    // Calcular gastos del período seleccionado (excluyendo transferencias)
    const expense = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(selectedPeriod) && !t.isTransfer && t.categoryId !== 'transfer')
        .reduce((sum, t) => sum + t.amount, 0)

    // Calcular saldos por categorías para liquidez
    const assets = accounts
        .filter(acc => acc.type !== 'Préstamo')
        .reduce((sum, acc) => sum + acc.balance, 0)

    const debtsBreakdown = accounts
        .filter(acc => acc.type === 'Préstamo')
        .reduce((sum, loan) => {
            const b = calculateDebtBreakdown(loan)
            sum.short += b.short
            sum.medium += b.medium
            sum.long += b.long
            return sum
        }, { short: 0, medium: 0, long: 0 })

    const totalDebts = debtsBreakdown.short + debtsBreakdown.medium + debtsBreakdown.long
    const netBalance = assets - totalDebts

    // Obtener las 5 transacciones más recientes
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)

    const stats = {
        balance: netBalance,
        assets,
        debts: debtsBreakdown,
        income,
        expense,
        recentTransactions
    }
    const todayStr = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">¡Hola, Enrique! 👋</h2>
                    <p className="text-slate-500 mt-1 font-medium">Esto es lo que está pasando con tu dinero hoy.</p>
                </div>

                {/* Selector de Mes */}
                <div className="flex items-center gap-3">
                    {!isCurrentMonth && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-200">
                            Histórico
                        </span>
                    )}
                    <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100 shadow-sm">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 font-black text-slate-700 text-sm uppercase tracking-tight italic min-w-[140px] text-center capitalize">
                            {format(parseISO(selectedPeriod + '-01'), 'MMMM yyyy', { locale: es })}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Patrimonio Neto / Balance Card - Toma 2 columnas en desktop y tablet */}
                <div className="md:col-span-2 card bg-white border-slate-200 overflow-hidden relative group shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />

                    <div className="relative p-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200/50">
                                <Wallet size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Balance Total (Patrimonio)</p>
                                <h3 className={`text-4xl font-black tracking-tight ${stats.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                                    ${stats.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group/item hover:bg-slate-50 hover:border-blue-100 transition-all">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Corto Plazo
                                </p>
                                <p className="text-sm font-black text-slate-800 italic">
                                    ${stats.debts.short.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">Vence ≤ 1 año</p>
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group/item hover:bg-slate-50 hover:border-blue-100 transition-all">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Mediano Plazo
                                </p>
                                <p className="text-sm font-black text-slate-800 italic">
                                    ${stats.debts.medium.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">1 a 5 años</p>
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group/item hover:bg-slate-50 hover:border-blue-100 transition-all">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Largo Plazo
                                </p>
                                <p className="text-sm font-black text-slate-800 italic">
                                    ${stats.debts.long.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">Vence &gt; 5 años</p>
                            </div>
                        </div>
                    </div>
                </div>

                <StatCard
                    title={`Ingresos de ${format(parseISO(selectedPeriod + '-01'), 'MMMM', { locale: es })}`}
                    amount={stats.income}
                    icon={TrendingUp}
                    colorClass="bg-emerald-600 text-emerald-600"
                />
                <StatCard
                    title={`Gastos de ${format(parseISO(selectedPeriod + '-01'), 'MMMM', { locale: es })}`}
                    amount={stats.expense}
                    icon={TrendingDown}
                    colorClass="bg-rose-600 text-rose-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tarjeta de Análisis por Categoría - Ahora de Ancho Completo en Móvil */}
                <div
                    onClick={() => setActiveView('analytics')}
                    className="card min-h-[400px] flex flex-col p-8 hover:border-blue-200 hover:bg-blue-50/5 cursor-pointer transition-all group overflow-hidden relative"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-2">
                                <PieChart size={20} className="text-blue-600" /> Distribución de Gastos
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {format(parseISO(selectedPeriod + '-01'), 'MMMM yyyy', { locale: es })}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <TrendingDown size={20} />
                        </div>
                    </div>

                    <div className="flex-1 w-full mt-2">
                        {(() => {
                            const expenseTransactions = transactions.filter(t =>
                                t.type === 'expense' && t.date.startsWith(selectedPeriod) && !t.isTransfer && t.categoryId !== 'transfer'
                            );

                            const categoryMap = {};
                            let total = 0;

                            expenseTransactions.forEach(t => {
                                const amount = parseFloat(t.amount) || 0;
                                const cat = [...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense].find(c => c.id === t.categoryId);
                                const name = t.categoryName || cat?.name || 'Otros';
                                categoryMap[name] = (categoryMap[name] || 0) + amount;
                                total += amount;
                            });

                            const sortedCategories = Object.entries(categoryMap)
                                .map(([name, amount]) => ({ name, amount }))
                                .sort((a, b) => b.amount - a.amount);

                            if (total === 0) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-10">
                                        <PieChart size={48} className="mb-4 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Sin gastos en este mes</p>
                                    </div>
                                );
                            }

                            const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#64748b', '#10b981', '#f43f5e', '#fbbf24'];

                            return (
                                <div className="space-y-5">
                                    {sortedCategories.map((item, index) => {
                                        const percentage = (item.amount / total) * 100;
                                        const color = colors[index % colors.length];

                                        return (
                                            <div key={index} className="space-y-1.5 group/bar">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate group-hover/bar:text-blue-600 transition-colors">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[10px] font-bold text-slate-400">{percentage.toFixed(1)}%</span>
                                                        <span className="text-xs font-black text-slate-900">${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: color,
                                                            boxShadow: `0 0 10px ${color}40`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gasto Total del Mes</p>
                                        <p className="text-lg font-black text-slate-900 italic">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="card min-h-[350px] p-0 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">Estado de Cuentas</h4>
                        <Wallet size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {accounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                                <p className="text-sm text-slate-500 font-medium">No hay cuentas registradas.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {accounts.map((acc) => (
                                    <div key={acc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{acc.name}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{acc.type}</p>
                                                    {acc.type === 'Préstamo' && (
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${getTermColorClass(getLoanTermLabel(acc))}`}>
                                                            {getLoanTermLabel(acc)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">
                                            ${acc.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="card min-h-[350px] p-0 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">Últimos Movimientos</h4>
                        <Clock size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {stats.recentTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <CreditCard size={32} />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">No hay transacciones recientes.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {stats.recentTransactions.map((tx) => (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{tx.note || 'Sin nota'}</p>
                                                <p className="text-xs text-slate-500">{tx.date}</p>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
