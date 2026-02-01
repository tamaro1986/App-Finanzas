// ============================================================================
// COMPONENTE: CategoryReport
// PROPÓSITO: Generar un reporte detallado de categorías y su ejecución
// ============================================================================
import React from 'react'
import { FileText, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const CategoryReport = ({ budgets, currentPeriod, transactions, onExport }) => {
    // 1. Obtener categorías del periodo actual
    const currentBudgets = budgets[currentPeriod] || []

    // 2. Calcular ejecución real para cada categoría
    const reportData = currentBudgets.map(cat => {
        const executed = transactions
            .filter(t => {
                if (!t.date.startsWith(currentPeriod)) return false
                if (t.type !== cat.type) return false
                // Aquí usamos el nombre para vincular (según la lógica existente en BudgetModule)
                // Es mejorable si usamos IDs, pero mantenemos consistencia
                return t.categoryName === cat.name || t.categoryId === cat.id
            })
            .reduce((sum, t) => sum + t.amount, 0)

        const diff = cat.projected - executed
        const percentage = cat.projected > 0 ? (executed / cat.projected * 100) : (executed > 0 ? 100 : 0)

        return {
            ...cat,
            executed,
            diff,
            percentage
        }
    })

    // 3. Totales
    const totals = reportData.reduce((acc, curr) => {
        if (curr.type === 'income') {
            acc.incomeProjected += curr.projected
            acc.incomeExecuted += curr.executed
        } else {
            acc.expenseProjected += curr.projected
            acc.expenseExecuted += curr.executed
        }
        return acc
    }, { incomeProjected: 0, incomeExecuted: 0, expenseProjected: 0, expenseExecuted: 0 })

    const totalSavings = totals.incomeExecuted - totals.expenseExecuted

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header del Reporte */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-xl text-white">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Reporte de Ejecución</h2>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        Periodo: {format(parseISO(currentPeriod + '-01'), 'MMMM yyyy', { locale: es })}
                    </p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-200"
                >
                    <Download size={18} /> Exportar PDF / Imprimir
                </button>
            </div>

            {/* Resumen Ejecutivo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Ingresos</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-black text-emerald-600">${totals.incomeExecuted.toLocaleString()}</h4>
                        <span className="text-xs font-bold text-slate-400">Meta: ${totals.incomeProjected.toLocaleString()}</span>
                    </div>
                    <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, (totals.incomeExecuted / Math.max(1, totals.incomeProjected)) * 100)}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Gastos</p>
                    <div className="flex items-center justify-between">
                        <h4 className="text-2xl font-black text-rose-600">${totals.expenseExecuted.toLocaleString()}</h4>
                        <span className="text-xs font-bold text-slate-400">Presupuesto: ${totals.expenseProjected.toLocaleString()}</span>
                    </div>
                    <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${Math.min(100, (totals.expenseExecuted / Math.max(1, totals.expenseProjected)) * 100)}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Balance Neto (Ahorro)</p>
                    <div className="flex items-center justify-between">
                        <h4 className={`text-2xl font-black ${totalSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ${totalSavings.toLocaleString()}
                        </h4>
                        <TrendingUp size={24} className={totalSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase">Resultado Real del Mes</p>
                </div>
            </div>

            {/* Tabla Detallada */}
            <div className="card !p-0 overflow-hidden shadow-xl border-slate-200/40 bg-white">
                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-800 italic uppercase text-sm tracking-tight flex items-center gap-2">
                        Desglose Detallado por Categoría
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                                <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proyectado</th>
                                <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ejecutado</th>
                                <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diferencia</th>
                                <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cumplimiento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 italic font-medium">No hay datos para este periodo.</td>
                                </tr>
                            ) : (
                                reportData.sort((a, b) => b.executed - a.executed).map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xl bg-slate-50 border border-slate-100">
                                                    {cat.icon}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{cat.name}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${cat.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right font-medium text-slate-500">
                                            ${cat.projected.toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`font-black ${cat.type === 'expense' && cat.executed > cat.projected ? 'text-rose-600' : 'text-slate-900'}`}>
                                                ${cat.executed.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className={`px-8 py-5 text-right font-bold text-sm ${cat.diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {cat.diff > 0 ? <TrendingUp size={14} /> : cat.diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                                ${Math.abs(cat.diff).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${cat.type === 'income' ? (cat.percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-400') : (cat.percentage > 100 ? 'bg-rose-500' : 'bg-emerald-500')}`}
                                                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400">{cat.percentage.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer del Reporte para impresión */}
            <div className="hidden print:block mt-12 pt-8 border-t border-slate-200 text-center">
                <p className="text-slate-500 text-sm font-bold italic">NegociosGarcia - Sistema de Gestión Financiera</p>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2">{new Date().toLocaleString()}</p>
            </div>

            <style jsx>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    )
}

export default CategoryReport
