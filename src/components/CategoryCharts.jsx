// ============================================================================
// COMPONENTE: CategoryCharts
// PROPÓSITO: Visualizar la distribución de ingresos y gastos por categorías
// ============================================================================
import React, { useState, useMemo } from 'react'
import { PieChart, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, BarChart3, LayoutGrid } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { DEFAULT_CATEGORIES } from '../constants/categories'

// Mini componente para gráfico de dona (Doughnut Chart) con SVG
const DonutChart = ({ data, total, title, colorScheme = 'blue' }) => {
    // Calcular ángulos
    let currentAngle = 0;
    const radius = 80;
    const center = 100;
    const strokeWidth = 25;
    const circumference = 2 * Math.PI * radius;

    const itemsWithAngles = data.map((item, index) => {
        const percentage = total > 0 ? (item.amount / total) : 0;
        const dashArray = (percentage * circumference);
        const dashOffset = (currentAngle / total) * circumference;

        // Colores dinámicos basados en el esquema
        const colors = {
            blue: [
                '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe',
                '#1d4ed8', '#1e40af', '#1e3a8a', '#172554'
            ],
            emerald: [
                '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',
                '#047857', '#065f46', '#064e3b', '#022c22'
            ],
            rose: [
                '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#fff1f2',
                '#be123c', '#9f1239', '#881337', '#4c0519'
            ]
        };

        const palette = colors[colorScheme] || colors.blue;
        const color = palette[index % palette.length];

        currentAngle += item.amount;

        return { ...item, color, dashArray, dashOffset: -dashOffset };
    });

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {/* Fondo vacío si no hay datos */}
                    {total === 0 && (
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth={strokeWidth}
                        />
                    )}
                    {itemsWithAngles.map((item, index) => (
                        item.amount > 0 && (
                            <motion.circle
                                key={index}
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${item.dashArray} ${circumference}`}
                                strokeDashoffset={item.dashOffset}
                                initial={{ strokeDasharray: `0 ${circumference}` }}
                                animate={{ strokeDasharray: `${item.dashArray} ${circumference}` }}
                                transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                                className="transition-all hover:stroke-[30px] cursor-pointer"
                            />
                        )
                    ))}
                    {/* Centro blanco para efecto dona */}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className="text-2xl font-black text-slate-900">${total.toLocaleString()}</p>
                </div>
            </div>

            {/* Leyenda */}
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 w-full">
                {itemsWithAngles.map((item, index) => (
                    item.amount > 0 && (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-800 truncate uppercase tracking-tight">{item.name}</p>
                                <p className="text-[10px] font-bold text-slate-400">${item.amount.toLocaleString()} ({((item.amount / total) * 100).toFixed(0)}%)</p>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

const CategoryCharts = ({ transactions }) => {
    const [currentPeriod, setCurrentPeriod] = useState(format(new Date(), 'yyyy-MM'))
    const [viewType, setViewType] = useState('donut') // 'donut' or 'bars'

    // 1. Obtener datos procesados para el mes seleccionado
    const data = useMemo(() => {
        // Filtrar transacciones del periodo Y excluir transferencias
        const periodTransactions = transactions.filter(t =>
            t.date.startsWith(currentPeriod) && !t.isTransfer
        );

        const incomeMap = {};
        const expenseMap = {};
        let totalIncome = 0;
        let totalExpense = 0;

        periodTransactions.forEach(t => {
            const amount = parseFloat(t.amount) || 0;
            // Intentar obtener el nombre de la categoría
            // Buscamos en DEFAULT_CATEGORIES por ID si existe, sino usamos categoryName
            const category = [...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense].find(c => c.id === t.categoryId);
            const catName = t.categoryName || category?.name || 'Otros';

            if (t.type === 'income') {
                incomeMap[catName] = (incomeMap[catName] || 0) + amount;
                totalIncome += amount;
            } else {
                expenseMap[catName] = (expenseMap[catName] || 0) + amount;
                totalExpense += amount;
            }
        });

        const incomeData = Object.entries(incomeMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        const expenseData = Object.entries(expenseMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        return { incomeData, expenseData, totalIncome, totalExpense };
    }, [transactions, currentPeriod]);

    // Navegación de meses
    const handlePrevMonth = () => {
        const prev = subMonths(parseISO(currentPeriod + '-01'), 1);
        setCurrentPeriod(format(prev, 'yyyy-MM'));
    };

    const handleNextMonth = () => {
        const next = subMonths(parseISO(currentPeriod + '-01'), -1);
        setCurrentPeriod(format(next, 'yyyy-MM'));
    };

    const monthDisplay = format(parseISO(currentPeriod + '-01'), 'MMMM yyyy', { locale: es });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header con selector de mes */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl text-white shadow-lg">
                            <PieChart size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Distribución de Categorías</h2>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Analiza de dónde viene y a dónde va tu dinero</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100 shadow-sm">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 font-black text-slate-700 text-sm uppercase tracking-tight italic min-w-[140px] text-center">
                            {monthDisplay}
                        </span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid de Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Ingresos */}
                <div className="card bg-white border-none shadow-xl shadow-slate-200/40 p-10 group overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="font-black text-slate-900 italic uppercase tracking-tight flex items-center gap-2">
                                <TrendingUp className="text-emerald-500" size={20} /> Ingresos por Categoría
                            </h3>
                            <button onClick={() => setViewType(viewType === 'donut' ? 'bars' : 'donut')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all">
                                {viewType === 'donut' ? <BarChart3 size={18} /> : <LayoutGrid size={18} />}
                            </button>
                        </div>

                        {data.totalIncome > 0 ? (
                            <AnimatePresence mode="wait">
                                {viewType === 'donut' ? (
                                    <motion.div
                                        key="donut-income"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <DonutChart
                                            data={data.incomeData}
                                            total={data.totalIncome}
                                            title="Ingresos"
                                            colorScheme="emerald"
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="bars-income"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="space-y-6 pt-4"
                                    >
                                        {data.incomeData.map((item, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{item.name}</span>
                                                    <span className="text-xs font-black text-slate-900">${item.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.amount / data.totalIncome) * 100}%` }}
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        transition={{ duration: 1, ease: "circOut" }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 italic">
                                <PieChart size={48} className="mb-4 opacity-20" />
                                <p>No hay ingresos registrados en este periodo.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de Gastos */}
                <div className="card bg-white border-none shadow-xl shadow-slate-200/40 p-10 group overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="font-black text-slate-900 italic uppercase tracking-tight flex items-center gap-2">
                                <TrendingDown className="text-rose-500" size={20} /> Gastos por Categoría
                            </h3>
                            <button onClick={() => setViewType(viewType === 'donut' ? 'bars' : 'donut')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all">
                                {viewType === 'donut' ? <BarChart3 size={18} /> : <LayoutGrid size={18} />}
                            </button>
                        </div>

                        {data.totalExpense > 0 ? (
                            <AnimatePresence mode="wait">
                                {viewType === 'donut' ? (
                                    <motion.div
                                        key="donut-expense"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <DonutChart
                                            data={data.expenseData}
                                            total={data.totalExpense}
                                            title="Gastos"
                                            colorScheme="rose"
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="bars-expense"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="space-y-6 pt-4"
                                    >
                                        {data.expenseData.map((item, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{item.name}</span>
                                                    <span className="text-xs font-black text-slate-900">${item.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.amount / data.totalExpense) * 100}%` }}
                                                        className="h-full bg-rose-500 rounded-full"
                                                        transition={{ duration: 1, ease: "circOut" }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 italic">
                                <PieChart size={48} className="mb-4 opacity-20" />
                                <p>No hay gastos registrados en este periodo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comparativa de Balance */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Balance Operativo del Mes</p>
                        <h4 className={`text-5xl font-black italic tracking-tighter ${data.totalIncome - data.totalExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ${(data.totalIncome - data.totalExpense).toLocaleString()}
                        </h4>
                    </div>
                    <div className="flex gap-12">
                        <div className="text-right">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Entradas</p>
                            <p className="text-2xl font-black text-white">${data.totalIncome.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Salidas</p>
                            <p className="text-2xl font-black text-white">${data.totalExpense.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CategoryCharts
