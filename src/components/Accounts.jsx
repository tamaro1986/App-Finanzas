import React, { useState, useEffect } from 'react'
import { Plus, CreditCard, Wallet, Trash2 } from 'lucide-react'

const Accounts = () => {
    const [accounts, setAccounts] = useState(() => {
        const saved = localStorage.getItem('finanzas_accounts')
        return saved ? JSON.parse(saved) : []
    })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'Ahorros',
        balance: 0,
        color: '#3b82f6',
        loanDetails: {
            loanAmount: 0,
            interestRate: 0,
            term: 12,
            grantingDate: new Date().toISOString().split('T')[0],
            firstPaymentDate: new Date().toISOString().split('T')[0],
            commissions: 0,
            insurance: 0,
            paymentFrequency: 'monthly'
        }
    })

    useEffect(() => {
        localStorage.setItem('finanzas_accounts', JSON.stringify(accounts))
    }, [accounts])

    const handleAddAccount = (e) => {
        e.preventDefault()
        const account = {
            id: crypto.randomUUID(),
            ...newAccount,
            balance: parseFloat(newAccount.balance),
            loanDetails: newAccount.type === 'Préstamo' ? {
                ...newAccount.loanDetails,
                loanAmount: parseFloat(newAccount.loanDetails.loanAmount),
                interestRate: parseFloat(newAccount.interestRate), // Fixing this: newAccount doesn't have interestRate directly, it's in loanDetails
                term: parseInt(newAccount.loanDetails.term),
                commissions: parseFloat(newAccount.loanDetails.commissions),
                insurance: parseFloat(newAccount.loanDetails.insurance)
            } : null
        }
        // Actually, let's fix the nesting in handleAddAccount
        const processedAccount = {
            id: crypto.randomUUID(),
            name: newAccount.name,
            type: newAccount.type,
            balance: parseFloat(newAccount.balance),
            color: newAccount.color,
            loanDetails: newAccount.type === 'Préstamo' ? {
                ...newAccount.loanDetails,
                loanAmount: parseFloat(newAccount.loanDetails.loanAmount),
                interestRate: parseFloat(newAccount.loanDetails.interestRate),
                term: parseInt(newAccount.loanDetails.term),
                commissions: parseFloat(newAccount.loanDetails.commissions),
                insurance: parseFloat(newAccount.loanDetails.insurance)
            } : null,
            paidInstallments: []
        }
        setAccounts([...accounts, processedAccount])
        setIsModalOpen(false)
        setNewAccount({
            name: '',
            type: 'Ahorros',
            balance: 0,
            color: '#3b82f6',
            loanDetails: {
                loanAmount: 0,
                interestRate: 0,
                term: 12,
                grantingDate: new Date().toISOString().split('T')[0],
                firstPaymentDate: new Date().toISOString().split('T')[0],
                commissions: 0,
                insurance: 0,
                paymentFrequency: 'monthly'
            }
        })
    }

    const deleteAccount = (id) => {
        if (window.confirm('¿Eliminar esta cuenta?')) {
            setAccounts(accounts.filter(a => a.id !== id))
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Cuentas</h2>
                    <p className="text-slate-500 font-medium">Gestiona tus bancos, efectivo y tarjetas.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    <span>Nueva Cuenta</span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.length === 0 ? (
                    <div className="col-span-full card py-20 text-center border-dashed border-2">
                        <Wallet className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-400 font-medium">No tienes cuentas registradas.</p>
                    </div>
                ) : (
                    accounts.map((acc) => (
                        <div key={acc.id} className="card relative group overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: acc.color }} />
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                                    <CreditCard size={20} />
                                </div>
                                <button
                                    onClick={() => deleteAccount(acc.id)}
                                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-1">{acc.name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{acc.type}</p>
                            <p className="text-2xl font-bold text-slate-900">
                                ${acc.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">Nueva Cuenta</h3>
                        </div>
                        <form onSubmit={handleAddAccount} className="p-8 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                                    <input
                                        type="text" required placeholder="Ej. Banco Agrícola" className="input-field"
                                        value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo</label>
                                    <select
                                        className="input-field" value={newAccount.type}
                                        onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                    >
                                        <option>Ahorros</option>
                                        <option>Corriente</option>
                                        <option>Efectivo</option>
                                        <option>Tarjeta de Crédito</option>
                                        <option>Inversión</option>
                                        <option>Préstamo</option>
                                    </select>
                                </div>
                            </div>

                            {newAccount.type === 'Préstamo' ? (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detalles del Préstamo</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Monto Principal</label>
                                            <input
                                                type="number" step="0.01" required className="input-field"
                                                value={newAccount.loanDetails.loanAmount}
                                                onChange={e => setNewAccount({
                                                    ...newAccount,
                                                    balance: e.target.value, // El saldo inicial de la cuenta es el total de la deuda
                                                    loanDetails: { ...newAccount.loanDetails, loanAmount: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Tasa Interés Anual (%)</label>
                                            <input
                                                type="number" step="0.01" required className="input-field"
                                                value={newAccount.loanDetails.interestRate}
                                                onChange={e => setNewAccount({ ...newAccount, loanDetails: { ...newAccount.loanDetails, interestRate: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Plazo (Meses)</label>
                                            <input
                                                type="number" required className="input-field"
                                                value={newAccount.loanDetails.term}
                                                onChange={e => setNewAccount({ ...newAccount, loanDetails: { ...newAccount.loanDetails, term: e.target.value } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Comisiones (Total)</label>
                                            <input
                                                type="number" step="0.01" className="input-field"
                                                value={newAccount.loanDetails.commissions}
                                                onChange={e => setNewAccount({ ...newAccount, loanDetails: { ...newAccount.loanDetails, commissions: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Seguros (Mensual)</label>
                                            <input
                                                type="number" step="0.01" className="input-field"
                                                value={newAccount.loanDetails.insurance}
                                                onChange={e => setNewAccount({ ...newAccount, loanDetails: { ...newAccount.loanDetails, insurance: e.target.value } })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha Otorgamiento</label>
                                            <input
                                                type="date" required className="input-field"
                                                value={newAccount.loanDetails.grantingDate}
                                                onChange={e => setNewAccount({ ...newAccount, loanDetails: { ...newAccount.loanDetails, grantingDate: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha Primer Pago</label>
                                        <input
                                            type="date" required className="input-field"
                                            value={newAccount.loanDetails.firstPaymentDate}
                                            onChange={e => setNewAccount({ ...newAccount, loanDetails: { ...newAccount.loanDetails, firstPaymentDate: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Saldo Inicial</label>
                                    <input
                                        type="number" step="0.01" required placeholder="0.00" className="input-field"
                                        value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Color Identificador</label>
                                <input
                                    type="color" className="w-full h-10 rounded-lg cursor-pointer mt-1"
                                    value={newAccount.color} onChange={e => setNewAccount({ ...newAccount, color: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary !py-3">Crear Cuenta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Accounts
