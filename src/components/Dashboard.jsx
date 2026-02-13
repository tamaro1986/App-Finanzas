// ============================================================================
// IMPORTS: React, iconos, utilidades de fecha y sincronización con Supabase
// ============================================================================
import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Clock, PieChart, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

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

    // El Balance Total debe ser la suma real de los saldos de todas las cuentas
    const totalBalance = accounts.reduce((sum, acc) => {
        if (acc.type === 'Préstamo') return sum - acc.balance;
        return sum + acc.balance;
    }, 0)

    // Obtener las 5 transacciones más recientes
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)

    const stats = { balance: totalBalance, income, expense, recentTransactions }
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Balance Total"
                    amount={stats.balance}
                    icon={Wallet}
                    colorClass="bg-blue-600 text-blue-600"
                />
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
                {/* Nueva Tarjeta de Análisis por Categoría */}
                <div
                    onClick={() => setActiveView('analytics')}
                    className="card min-h-[350px] flex flex-col items-center justify-center text-center p-10 border-dashed border-2 hover:border-blue-200 hover:bg-blue-50/10 cursor-pointer transition-all group"
                >
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                        <PieChart size={32} />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Análisis por Categoría</h4>
                    <p className="text-sm text-slate-500 max-w-xs">Haz clic para ver la distribución detallada de tus ingresos y gastos por categoría.</p>
                    <div className="mt-8 text-2xl font-black text-slate-900 italic">
                        ${stats.expense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{acc.type}</p>
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
