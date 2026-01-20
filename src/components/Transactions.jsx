import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Filter, Calendar, Tag, CreditCard, ArrowUpCircle, ArrowDownCircle, Camera, Image as ImageIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DEFAULT_CATEGORIES } from '../constants/categories'

const Transactions = () => {
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('finanzas_transactions')
        return saved ? JSON.parse(saved) : []
    })
    const [accounts, setAccounts] = useState(() => {
        const saved = localStorage.getItem('finanzas_accounts')
        return saved ? JSON.parse(saved) : []
    })
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')

    const [newTx, setNewTx] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        accountId: '',
        categoryId: '',
        amount: '',
        type: 'expense',
        note: '',
        attachment: null
    })

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                };
            };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await compressImage(file);
            setNewTx({ ...newTx, attachment: compressed });
        }
    };

    useEffect(() => {
        localStorage.setItem('finanzas_transactions', JSON.stringify(transactions))
    }, [transactions])

    // Set default account when modal opens
    useEffect(() => {
        if (isModalOpen && accounts.length > 0 && !newTx.accountId) {
            setNewTx(prev => ({ ...prev, accountId: accounts[0].id }))
        }
    }, [isModalOpen, accounts])

    const handleAddTransaction = (e) => {
        e.preventDefault()
        if (!newTx.accountId) {
            alert('Por favor selecciona una cuenta.')
            return
        }

        const transaction = {
            id: crypto.randomUUID(),
            ...newTx,
            amount: parseFloat(newTx.amount)
        }

        const updatedTransactions = [transaction, ...transactions]
        setTransactions(updatedTransactions)
        localStorage.setItem('finanzas_transactions', JSON.stringify(updatedTransactions))

        // Update Account Balance
        const updatedAccounts = accounts.map(acc => {
            if (acc.id === newTx.accountId) {
                let newBalance = acc.balance
                if (acc.type === 'Préstamo') {
                    // For loans, income reduces balance (debt), expense increases it
                    newBalance = newTx.type === 'income' ? acc.balance - transaction.amount : acc.balance + transaction.amount
                } else {
                    // For regular accounts, income increases, expense decreases
                    newBalance = newTx.type === 'income' ? acc.balance + transaction.amount : acc.balance - transaction.amount
                }
                return { ...acc, balance: newBalance }
            }
            return acc
        })
        setAccounts(updatedAccounts)
        localStorage.setItem('finanzas_accounts', JSON.stringify(updatedAccounts))

        setIsModalOpen(false)
        setNewTx({
            date: format(new Date(), 'yyyy-MM-dd'),
            accountId: accounts[0]?.id || '',
            categoryId: '',
            amount: '',
            type: 'expense',
            note: '',
            attachment: null
        })
    }

    const deleteTransaction = (id) => {
        if (window.confirm('¿Eliminar esta transacción?')) {
            const txToDelete = transactions.find(t => t.id === id)
            if (txToDelete) {
                const updatedAccounts = accounts.map(acc => {
                    if (acc.id === txToDelete.accountId) {
                        let newBalance = acc.balance
                        if (acc.type === 'Préstamo') {
                            // Revert: income reduced balance, so we add it back
                            newBalance = txToDelete.type === 'income' ? acc.balance + txToDelete.amount : acc.balance - txToDelete.amount
                        } else {
                            // Revert: income increased balance, so we subtract it
                            newBalance = txToDelete.type === 'income' ? acc.balance - txToDelete.amount : acc.balance + txToDelete.amount
                        }
                        return { ...acc, balance: newBalance }
                    }
                    return acc
                })
                setAccounts(updatedAccounts)
                localStorage.setItem('finanzas_accounts', JSON.stringify(updatedAccounts))
            }
            const updatedTransactions = transactions.filter(t => t.id !== id)
            setTransactions(updatedTransactions)
            localStorage.setItem('finanzas_transactions', JSON.stringify(updatedTransactions))
        }
    }

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.note.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = filterType === 'all' || t.type === filterType
        return matchesSearch && matchesType
    })

    const categories = newTx.type === 'income' ? DEFAULT_CATEGORIES.income : DEFAULT_CATEGORIES.expense

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Movimientos</h2>
                    <p className="text-slate-500 font-medium">Registra y revisa todos tus ingresos y gastos.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    <span>Nuevo Movimiento</span>
                </button>
            </header>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nota..."
                        className="input-field pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="input-field w-auto"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Todos</option>
                        <option value="income">Ingresos</option>
                        <option value="expense">Gastos</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card !p-0 overflow-hidden border-slate-200/60 shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200/60">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Cuenta</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Nota</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Monto</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                                        No se encontraron movimientos.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => {
                                    const account = accounts.find(a => a.id === t.accountId)
                                    const category = [...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense].find(c => c.id === t.categoryId)

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {t.date}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account?.color || '#cbd5e1' }} />
                                                    <span className="text-sm font-semibold text-slate-700">{account?.name || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-200">
                                                    {category?.icon} {category?.name || 'Sin cat.'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-slate-600">{t.note || '---'}</span>
                                                    {t.attachment && (
                                                        <button
                                                            onClick={() => {
                                                                const win = window.open();
                                                                win.document.write(`<img src="${t.attachment}" style="max-width:100%"/>`);
                                                            }}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700"
                                                        >
                                                            <ImageIcon size={12} /> VER COMPROBANTE
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteTransaction(t.id)}
                                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">Nuevo Movimiento</h3>
                        </div>

                        <form onSubmit={handleAddTransaction} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setNewTx({ ...newTx, type: 'income', categoryId: '' })}
                                    className={`py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${newTx.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                                >
                                    <ArrowUpCircle size={18} /> Ingreso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewTx({ ...newTx, type: 'expense', categoryId: '' })}
                                    className={`py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${newTx.type === 'expense' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                                >
                                    <ArrowDownCircle size={18} /> Gasto
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha</label>
                                    <input
                                        type="date" required className="input-field"
                                        value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Monto ($)</label>
                                    <input
                                        type="number" step="0.01" required placeholder="0.00" className="input-field"
                                        value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Cuenta</label>
                                <select
                                    required className="input-field"
                                    value={newTx.accountId} onChange={e => setNewTx({ ...newTx, accountId: e.target.value })}
                                >
                                    <option value="">Selecciona una cuenta</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Categoría</label>
                                <select
                                    required className="input-field"
                                    value={newTx.categoryId} onChange={e => setNewTx({ ...newTx, categoryId: e.target.value })}
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nota / Descripción</label>
                                <input
                                    type="text" placeholder="Ej. Pago de internet" className="input-field"
                                    value={newTx.note} onChange={e => setNewTx({ ...newTx, note: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Comprobante (Opcional)</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <input
                                            type="file" accept="image/*" capture="environment"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        />
                                        <div className="btn-secondary !w-full flex items-center justify-center gap-2 !py-2.5">
                                            <Camera size={18} />
                                            <span>{newTx.attachment ? 'Cambiar Foto' : 'Tomar Foto / Subir'}</span>
                                        </div>
                                    </div>
                                    {newTx.attachment && (
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                                            <img src={newTx.attachment} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setNewTx({ ...newTx, attachment: null })}
                                                className="absolute top-0 right-0 bg-rose-500 text-white rounded-bl-lg p-0.5"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary !py-3">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transactions
