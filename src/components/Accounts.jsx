// ============================================================================
// IMPORTS: React, iconos de Lucide, y funciones de sincronización con Supabase
// ============================================================================
import React, { useState, useEffect } from 'react'
import { Plus, CreditCard, Wallet, Trash2 } from 'lucide-react'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: Accounts
// PROPÓSITO: Gestionar cuentas bancarias, efectivo, tarjetas, etc.
// CONECTADO A: Supabase tabla 'accounts' + localStorage como fallback
// ============================================================================
const Accounts = () => {
    // Estado para almacenar el array de cuentas
    // Inicialmente vacío, se cargará desde Supabase en useEffect
    const [accounts, setAccounts] = useState([])
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

    // ============================================================================
    // EFFECT: Cargar datos desde Supabase al montar el componente
    // Se ejecuta solo una vez cuando el componente se monta
    // ============================================================================
    useEffect(() => {
        // Función asíncrona para cargar datos desde Supabase
        const loadAccounts = async () => {
            // initializeData intenta cargar desde Supabase, si falla usa localStorage
            const data = await initializeData('accounts', 'finanzas_accounts')
            // Actualizar el estado con los datos cargados
            setAccounts(data)
        }
        // Ejecutar la función de carga
        loadAccounts()
    }, []) // Array vacío = solo se ejecuta al montar

    // ============================================================================
    // EFFECT: Sincronizar con localStorage cada vez que cambian las cuentas
    // Este es un fallback por si Supabase falla
    // ============================================================================
    useEffect(() => {
        // Solo sincronizar si hay cuentas (evitar sobrescribir en carga inicial)
        if (accounts.length > 0) {
            localStorage.setItem('finanzas_accounts', JSON.stringify(accounts))
        }
    }, [accounts])

    // ============================================================================
    // FUNCIÓN: handleAddAccount
    // PROPÓSITO: Agregar una nueva cuenta y sincronizarla con Supabase
    // PARÁMETROS: e - Evento del formulario
    // ============================================================================
    const handleAddAccount = async (e) => {
        e.preventDefault() // Prevenir recarga de página

        // Crear objeto de cuenta procesado con todos los datos
        const processedAccount = {
            id: crypto.randomUUID(), // Generar ID único
            name: newAccount.name,
            type: newAccount.type,
            balance: parseFloat(newAccount.balance), // Convertir a número
            color: newAccount.color,
            // Si es préstamo, incluir detalles del préstamo, si no, null
            loanDetails: newAccount.type === 'Préstamo' ? {
                ...newAccount.loanDetails,
                loanAmount: parseFloat(newAccount.loanDetails.loanAmount),
                interestRate: parseFloat(newAccount.loanDetails.interestRate),
                term: parseInt(newAccount.loanDetails.term),
                commissions: parseFloat(newAccount.loanDetails.commissions),
                insurance: parseFloat(newAccount.loanDetails.insurance)
            } : null,
            paidInstallments: [] // Array vacío para pagos futuros
        }

        // Crear nuevo array con la cuenta agregada
        const updatedAccounts = [...accounts, processedAccount]

        // Actualizar estado local (React)
        setAccounts(updatedAccounts)

        // Sincronizar con Supabase (asíncrono, no bloqueante)
        await saveToSupabase('accounts', 'finanzas_accounts', processedAccount, updatedAccounts)

        // Cerrar modal
        setIsModalOpen(false)

        // Resetear formulario a valores iniciales
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

    // ============================================================================
    // FUNCIÓN: deleteAccount
    // PROPÓSITO: Eliminar una cuenta y sincronizar con Supabase
    // PARÁMETROS: id - ID de la cuenta a eliminar
    // ============================================================================
    const deleteAccount = async (id) => {
        // Confirmar con el usuario antes de eliminar
        if (window.confirm('¿Eliminar esta cuenta?')) {
            // Filtrar el array para remover la cuenta con el ID especificado
            const updatedAccounts = accounts.filter(a => a.id !== id)

            // Actualizar estado local
            setAccounts(updatedAccounts)

            // Sincronizar eliminación con Supabase
            await deleteFromSupabase('accounts', 'finanzas_accounts', id, updatedAccounts)
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
