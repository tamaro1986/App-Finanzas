import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Clock } from 'lucide-react'
import { format } from 'date-fns'
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

const Dashboard = () => {
    const [stats, setStats] = useState({
        balance: 0,
        income: 0,
        expense: 0,
        recentTransactions: []
    })

    useEffect(() => {
        const transactions = JSON.parse(localStorage.getItem('finanzas_transactions') || '[]')
        const currentMonth = format(new Date(), 'yyyy-MM')

        const income = transactions
            .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0)

        const expense = transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0)

        const balance = transactions.reduce((sum, t) => {
            if (t.type === 'income') return sum + t.amount
            if (t.type === 'expense') return sum - t.amount
            return sum
        }, 0)

        const recent = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)

        setStats({ balance, income, expense, recentTransactions: recent })
    }, [])

    const todayStr = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">¡Hola, Enrique! 👋</h2>
                    <p className="text-slate-500 mt-1 font-medium">Esto es lo que está pasando con tu dinero hoy.</p>
                </div>
                <div className="hidden md:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 capitalize">
                        {todayStr}
                    </p>
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
                    title="Ingresos del Mes"
                    amount={stats.income}
                    icon={TrendingUp}
                    colorClass="bg-emerald-600 text-emerald-600"
                />
                <StatCard
                    title="Gastos del Mes"
                    amount={stats.expense}
                    icon={TrendingDown}
                    colorClass="bg-rose-600 text-rose-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card min-h-[350px] flex flex-col items-center justify-center text-center p-10 border-dashed border-2 hover:border-slate-300 transition-colors">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <TrendingUp size={32} />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1">Análisis de Gastos</h4>
                    <p className="text-sm text-slate-500 max-w-xs">Tus gastos de {format(new Date(), 'MMMM', { locale: es })} aparecen aquí.</p>
                    <div className="mt-8 text-2xl font-bold text-slate-900">
                        ${stats.expense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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

