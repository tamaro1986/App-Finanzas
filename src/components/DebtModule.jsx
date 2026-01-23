import React, { useState, useEffect } from 'react'
import { Landmark, Calendar, DollarSign, CheckCircle2, Circle, ArrowLeft, TrendingDown, Info, CreditCard, Plus, Trash2 } from 'lucide-react'
import { format, addMonths, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const DebtModule = ({ accounts = [], setAccounts, transactions = [] }) => {
    const [selectedDebtId, setSelectedDebtId] = useState(null)
    const [isExtraPaymentModalOpen, setIsExtraPaymentModalOpen] = useState(false)
    const [extraPayment, setExtraPayment] = useState({
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: 'Pago realizado'
    })

    const debts = accounts.filter(acc => acc.type === 'Préstamo' || acc.loanDetails)

    const calculateAmortization = (loan) => {
        if (!loan.loanDetails) return []

        const { loanAmount, interestRate, term, firstPaymentDate, insurance } = loan.loanDetails
        const monthlyRate = (interestRate / 100) / 12
        const monthlyPayment = monthlyRate === 0
            ? loanAmount / term
            : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)

        let balance = loanAmount
        const schedule = []
        let startDate = parseISO(firstPaymentDate)

        for (let i = 1; i <= term; i++) {
            const interest = balance * monthlyRate
            const principal = monthlyPayment - interest
            balance -= principal

            schedule.push({
                installment: i,
                date: format(addMonths(startDate, i - 1), 'yyyy-MM-dd'),
                payment: monthlyPayment + (insurance || 0),
                principal: principal,
                interest: interest,
                insurance: insurance || 0,
                remainingBalance: Math.max(0, balance),
                isPaid: (loan.paidInstallments || []).includes(i)
            })
        }

        return schedule
    }

    const handleTogglePayment = (debtId, installmentNum) => {
        const updatedAccounts = accounts.map(acc => {
            if (acc.id === debtId) {
                const paid = acc.paidInstallments || []
                const newPaid = paid.includes(installmentNum)
                    ? paid.filter(n => n !== installmentNum)
                    : [...paid, installmentNum]

                return {
                    ...acc,
                    paidInstallments: newPaid
                }
            }
            return acc
        })
        setAccounts(updatedAccounts)
        localStorage.setItem('finanzas_accounts', JSON.stringify(updatedAccounts))
    }

    const handleAddManualPayment = (e) => {
        e.preventDefault()
        const amount = parseFloat(extraPayment.amount)
        if (isNaN(amount) || amount <= 0) return

        const updatedAccounts = accounts.map(acc => {
            if (acc.id === selectedDebtId) {
                const manualPayments = acc.manualPayments || []
                const newManualPayment = {
                    id: crypto.randomUUID(),
                    ...extraPayment,
                    amount: amount
                }
                return {
                    ...acc,
                    manualPayments: [...manualPayments, newManualPayment],
                    balance: Math.max(0, acc.balance - amount)
                }
            }
            return acc
        })

        setAccounts(updatedAccounts)
        localStorage.setItem('finanzas_accounts', JSON.stringify(updatedAccounts))
        setIsExtraPaymentModalOpen(false)
        setExtraPayment({
            amount: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            note: 'Pago realizado'
        })
    }

    const deleteManualPayment = (debtId, paymentId) => {
        if (!window.confirm('¿Eliminar este registro de pago manual?')) return

        const updatedAccounts = accounts.map(acc => {
            if (acc.id === debtId) {
                const payment = acc.manualPayments.find(p => p.id === paymentId)
                return {
                    ...acc,
                    manualPayments: acc.manualPayments.filter(p => p.id !== paymentId),
                    balance: acc.balance + (payment ? payment.amount : 0)
                }
            }
            return acc
        })

        setAccounts(updatedAccounts)
        localStorage.setItem('finanzas_accounts', JSON.stringify(updatedAccounts))
    }

    if (selectedDebtId) {
        const debt = debts.find(d => d.id === selectedDebtId)
        if (!debt) {
            setSelectedDebtId(null)
            return null
        }

        const schedule = calculateAmortization(debt)
        const relevantTransactions = transactions.filter(t => t.accountId === debt.id)
        const manualPayments = debt.manualPayments || []

        const totalPaidFromTransactions = relevantTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const totalManualPayments = manualPayments.reduce((sum, p) => sum + p.amount, 0)

        const totalToPay = schedule.reduce((sum, s) => sum + s.payment, 0)
        const pendingBalance = Math.max(0, totalToPay - totalPaidFromTransactions - totalManualPayments)

        const currentCapitalBalance = debt.balance

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedDebtId(null)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{debt.name}</h2>
                            <p className="text-slate-500 font-medium capitalize">
                                {debt.type} • Tasa: {debt.loanDetails.interestRate}% • {debt.loanDetails.term} cuotas
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsExtraPaymentModalOpen(true)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <Plus size={18} />
                            <span>Registrar Pago Manual</span>
                        </button>
                        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Actual</p>
                            <p className="text-lg font-bold text-blue-600">${currentCapitalBalance.toLocaleString('es-MX')}</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card bg-slate-900 text-white border-none shadow-xl shadow-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <TrendingDown size={20} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capital Pendiente</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1">${currentCapitalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-slate-400 text-xs font-medium">Saldo para liquidar hoy</p>
                    </div>

                    <div className="card border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Landmark size={20} className="text-blue-600" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total proyectado</span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">${pendingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-slate-400 text-xs font-medium">Capital + Intereses futuros</p>
                    </div>

                    <div className="card border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Abonos Realizados</span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">${(totalPaidFromTransactions + totalManualPayments).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-slate-400 text-xs font-medium">Incluye pagos manuales</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card !p-0 overflow-hidden shadow-md border-slate-200/60">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar size={18} className="text-slate-400" /> Plan de Pagos
                                </h4>
                                <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                    Sistema Francés
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/30">
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuota</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Monto</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Check</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {schedule.map((row) => (
                                            <tr key={row.installment} className={`hover:bg-slate-50/50 transition-colors ${row.isPaid ? 'bg-emerald-50/30' : ''}`}>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-400">#{row.installment}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{row.date}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">${row.payment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleTogglePayment(debt.id, row.installment)}
                                                        className={`p-1.5 rounded-lg transition-all ${row.isPaid ? 'text-emerald-600 bg-emerald-100' : 'text-slate-300 hover:text-slate-400 hover:bg-slate-100'}`}
                                                    >
                                                        {row.isPaid ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card shadow-sm border-slate-200/60">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <CreditCard size={18} className="text-slate-400" /> Historial de Abonos
                            </h4>
                            <div className="space-y-6">
                                {/* Regular Transactions */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desde Movimientos</p>
                                    {relevantTransactions.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic px-2">Sin movimientos vinculados.</p>
                                    ) : (
                                        relevantTransactions.map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{t.note || 'Abono'}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{t.date}</p>
                                                </div>
                                                <p className="text-sm font-bold text-emerald-600">+${t.amount.toLocaleString('es-MX')}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Manual Payments */}
                                <div className="space-y-3 pt-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pagos Manuales (Control)</p>
                                    {manualPayments.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic px-2">Sin pagos manuales.</p>
                                    ) : (
                                        manualPayments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50/30 rounded-xl border border-blue-100 group relative">
                                                <div>
                                                    <p className="text-xs font-bold text-blue-900 truncate max-w-[120px]">{p.note}</p>
                                                    <p className="text-[10px] text-blue-500 font-medium">{p.date}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-bold text-blue-600">${p.amount.toLocaleString('es-MX')}</p>
                                                    <button
                                                        onClick={() => deleteManualPayment(debt.id, p.id)}
                                                        className="p-1.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Nota</p>
                                <p className="text-xs text-slate-500 leading-relaxed italic">
                                    Los pagos manuales solo afectan el saldo de este préstamo y no se registran en tus otras cuentas de banco/efectivo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {isExtraPaymentModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsExtraPaymentModalOpen(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-900">Registrar Pago Manual</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Este pago solo afecta el control de este préstamo.</p>
                            </div>
                            <form onSubmit={handleAddManualPayment} className="p-8 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha</label>
                                        <input
                                            type="date" required className="input-field"
                                            value={extraPayment.date} onChange={e => setExtraPayment({ ...extraPayment, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Monto ($)</label>
                                        <input
                                            type="number" step="0.01" required placeholder="0.00" className="input-field"
                                            value={extraPayment.amount} onChange={e => setExtraPayment({ ...extraPayment, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción / Nota</label>
                                    <input
                                        type="text" placeholder="Ej. Pago histórico, abono extra..." className="input-field"
                                        value={extraPayment.note} onChange={e => setExtraPayment({ ...extraPayment, note: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsExtraPaymentModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                    <button type="submit" className="flex-1 btn-primary !py-3">Guardar Pago</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Módulo de Deudas</h2>
                <p className="text-slate-500 font-medium">Controla tus préstamos y planes de pago.</p>
            </header>

            {debts.length === 0 ? (
                <div className="card py-20 text-center border-dashed border-2 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                        <Landmark size={40} />
                    </div>
                    <p className="text-slate-500 font-bold text-lg">No tienes deudas registradas.</p>
                    <p className="text-slate-400 max-w-sm mt-2">Crea una cuenta de tipo "Préstamo" en el módulo de Cuentas para comenzar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {debts.map((debt) => {
                        const schedule = calculateAmortization(debt)
                        const nextPayment = schedule.find(s => !s.isPaid)
                        const progress = (debt.paidInstallments?.length || 0) / debt.loanDetails.term

                        return (
                            <div
                                key={debt.id}
                                onClick={() => setSelectedDebtId(debt.id)}
                                className="card group cursor-pointer hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: debt.color }} />
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <Landmark size={24} />
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${progress === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {progress === 1 ? 'Liquidado' : 'Activo'}
                                    </div>
                                </div>
                                <h4 className="font-bold text-slate-900 text-xl mb-1">{debt.name}</h4>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
                                    <Calendar size={12} /> Próximo pago: {nextPayment ? nextPayment.date : 'Finalizado'}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saldo de Capital</p>
                                        <p className="text-2xl font-bold text-slate-900">
                                            ${debt.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progreso</p>
                                            <p className="text-xs font-bold text-slate-600">{(progress * 100).toFixed(0)}%</p>
                                        </div>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full transition-all duration-700"
                                                style={{ width: `${progress * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default DebtModule
