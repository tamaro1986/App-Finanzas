// ============================================================================
// IMPORTS: React, iconos, utilidades y funciones de sincronización
// ============================================================================
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Filter, Calendar, Tag, CreditCard, ArrowUpCircle, ArrowDownCircle, Camera, Image as ImageIcon, X, FileSpreadsheet, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { DEFAULT_CATEGORIES } from '../constants/categories'
import * as XLSX from 'xlsx' // Importar librería para Excel
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: Transactions
// PROPÓSITO: Gestionar transacciones (ingresos y gastos)
// CONECTADO A: Supabase tablas 'transactions' y 'accounts'
// ============================================================================
const Transactions = () => {
    // Estado para almacenar transacciones - se carga desde Supabase
    const [transactions, setTransactions] = useState([])
    // Estado para almacenar cuentas - se carga desde Supabase
    const [accounts, setAccounts] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')

    // Estados para importación de Excel
    const [importErrors, setImportErrors] = useState([])
    const [importPreview, setImportPreview] = useState([])
    const [importSuccessCount, setImportSuccessCount] = useState(0)

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

    // ============================================================================
    // EFFECT: Cargar datos desde Supabase al montar el componente
    // ============================================================================
    useEffect(() => {
        const loadData = async () => {
            // Cargar transacciones desde Supabase
            const txData = await initializeData('transactions', 'finanzas_transactions')
            setTransactions(txData)
            // Cargar cuentas desde Supabase
            const accData = await initializeData('accounts', 'finanzas_accounts')
            setAccounts(accData)
        }
        loadData()
    }, [])

    // ============================================================================
    // EFFECT: Sincronizar con localStorage (fallback)
    // ============================================================================
    useEffect(() => {
        if (transactions.length > 0) {
            localStorage.setItem('finanzas_transactions', JSON.stringify(transactions))
        }
    }, [transactions])

    // ============================================================================
    // EFFECT: Establecer cuenta por defecto al abrir modal
    // ============================================================================
    useEffect(() => {
        if (isModalOpen && accounts.length > 0 && !newTx.accountId) {
            setNewTx(prev => ({ ...prev, accountId: accounts[0].id }))
        }
    }, [isModalOpen, accounts])

    // ============================================================================
    // FUNCIÓN: handleAddTransaction
    // PROPÓSITO: Agregar nueva transacción y actualizar balance de cuenta
    // SINCRONIZA: Tanto la transacción como la cuenta actualizada con Supabase
    // ============================================================================
    const handleAddTransaction = async (e) => {
        e.preventDefault()
        // Validar que se haya seleccionado una cuenta
        if (!newTx.accountId) {
            alert('Por favor selecciona una cuenta.')
            return
        }

        // Crear objeto de transacción con ID único
        const transaction = {
            id: crypto.randomUUID(),
            ...newTx,
            amount: parseFloat(newTx.amount)
        }

        await processTransaction(transaction)

        // Cerrar modal y resetear formulario
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

    // Función auxiliar para procesar transacción y actualizar balances
    const processTransaction = async (transaction) => {
        // Agregar transacción al inicio del array
        const updatedTransactions = [transaction, ...transactions]
        setTransactions(updatedTransactions)
        // Sincronizar transacción con Supabase
        await saveToSupabase('transactions', 'finanzas_transactions', transaction, updatedTransactions)

        // Actualizar balance de la cuenta afectada
        const updatedAccounts = accounts.map(acc => {
            if (acc.id === transaction.accountId) {
                let newBalance = acc.balance
                // Para préstamos: ingreso reduce deuda, gasto aumenta deuda
                if (acc.type === 'Préstamo') {
                    newBalance = transaction.type === 'income' ? acc.balance - transaction.amount : acc.balance + transaction.amount
                } else {
                    // Para cuentas normales: ingreso aumenta, gasto disminuye
                    newBalance = transaction.type === 'income' ? acc.balance + transaction.amount : acc.balance - transaction.amount
                }
                return { ...acc, balance: newBalance }
            }
            return acc
        })
        setAccounts(updatedAccounts)

        // Sincronizar cuenta actualizada con Supabase
        const updatedAccount = updatedAccounts.find(acc => acc.id === transaction.accountId)
        if (updatedAccount) {
            await saveToSupabase('accounts', 'finanzas_accounts', updatedAccount, updatedAccounts)
        }
    }

    // ============================================================================
    // FUNCIÓN: deleteTransaction
    // PROPÓSITO: Eliminar transacción y revertir cambio en balance de cuenta
    // SINCRONIZA: Eliminación de transacción y cuenta actualizada con Supabase
    // ============================================================================
    const deleteTransaction = async (id) => {
        if (window.confirm('¿Eliminar esta transacción?')) {
            // Encontrar la transacción a eliminar
            const txToDelete = transactions.find(t => t.id === id)
            if (txToDelete) {
                // Revertir el cambio en el balance de la cuenta
                const updatedAccounts = accounts.map(acc => {
                    if (acc.id === txToDelete.accountId) {
                        let newBalance = acc.balance
                        if (acc.type === 'Préstamo') {
                            // Revertir: ingreso había reducido balance, ahora lo sumamos
                            newBalance = txToDelete.type === 'income' ? acc.balance + txToDelete.amount : acc.balance - txToDelete.amount
                        } else {
                            // Revertir: ingreso había aumentado balance, ahora lo restamos
                            newBalance = txToDelete.type === 'income' ? acc.balance - txToDelete.amount : acc.balance + txToDelete.amount
                        }
                        return { ...acc, balance: newBalance }
                    }
                    return acc
                })
                setAccounts(updatedAccounts)

                // Sincronizar cuenta actualizada con Supabase
                const updatedAccount = updatedAccounts.find(acc => acc.id === txToDelete.accountId)
                if (updatedAccount) {
                    await saveToSupabase('accounts', 'finanzas_accounts', updatedAccount, updatedAccounts)
                }
            }

            // Eliminar transacción del array
            const updatedTransactions = transactions.filter(t => t.id !== id)
            setTransactions(updatedTransactions)
            // Sincronizar eliminación con Supabase
            await deleteFromSupabase('transactions', 'finanzas_transactions', id, updatedTransactions)
        }
    }

    // ============================================================================
    // FUNCIONES PARA EXCEL: Descarga de plantilla y Carga de datos
    // ============================================================================
    const downloadTemplate = () => {
        const headers = ['Fecha (AAAA-MM-DD)', 'Tipo (ingreso/gasto)', 'Monto', 'Categoría', 'Nota', 'Cuenta']
        const data = [
            headers,
            ['2025-01-20', 'gasto', 150.50, 'Comida', 'Almuerzo trabajo', 'Efectivo'],
            ['2025-01-21', 'ingreso', 5000, 'Salario', 'Nómina quincenal', 'Banco']
        ]

        const ws = XLSX.utils.aoa_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
        XLSX.writeFile(wb, "Plantilla_Movimientos_NegociosGarcia.xlsx")
    }

    const handleExcelUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) // Leer como array de arrays

            validateAndPreviewData(data)
        }
        reader.readAsBinaryString(file)
    }

    const validateAndPreviewData = (data) => {
        const errors = []
        const validRows = []
        // Ignorar header (fila 0)
        const rows = data.slice(1)

        rows.forEach((row, index) => {
            const rowNum = index + 2 // +2 porque slice quitó header y excel es 1-indexed

            // Estructura esperada: [Fecha, Tipo, Monto, Categoría, Nota, Cuenta]
            const [dateRaw, typeRaw, amountRaw, categoryRaw, noteRaw, accountRaw] = row

            // Si la fila está vacía, saltar
            if (!dateRaw && !amountRaw) return

            // 1. Validar Fecha
            let date = dateRaw
            if (!date) errors.push(`Fila ${rowNum}: Falta la fecha`)
            // Excel a veces devuelve fecha como número serial
            if (typeof date === 'number') {
                const dateObj = new Date(Math.round((date - 25569) * 86400 * 1000))
                date = format(dateObj, 'yyyy-MM-dd')
            }

            // 2. Validar Tipo
            const type = typeRaw?.toString().toLowerCase()
            if (type !== 'ingreso' && type !== 'gasto') errors.push(`Fila ${rowNum}: Tipo inválido (debe ser 'ingreso' o 'gasto')`)

            // 3. Validar Monto
            const amount = parseFloat(amountRaw)
            if (isNaN(amount) || amount <= 0) errors.push(`Fila ${rowNum}: Monto inválido`)

            // 4. Validar Categoría (Buscamos ID)
            const allCats = [...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense]
            let categoryId = ''
            if (categoryRaw) {
                const catFound = allCats.find(c => c.name.toLowerCase() === categoryRaw.toString().toLowerCase())
                categoryId = catFound ? catFound.id : 'others' // Default a 'Otros'
            } else {
                errors.push(`Fila ${rowNum}: Falta categoría`)
            }

            // 5. Validar Cuenta (Buscamos ID)
            let accountId = ''
            if (accountRaw) {
                const accFound = accounts.find(a => a.name.toLowerCase() === accountRaw.toString().toLowerCase())
                if (accFound) {
                    accountId = accFound.id
                } else {
                    errors.push(`Fila ${rowNum}: Cuenta '${accountRaw}' no existe. Créala primero o usa una existente.`)
                }
            } else {
                // Si no se especifica cuenta y solo hay una, usar esa. Si hay varias, error.
                if (accounts.length === 1) accountId = accounts[0].id
                else errors.push(`Fila ${rowNum}: Falta especificar la cuenta`)
            }

            if (errors.length === 0 || errors[errors.length - 1].split(':')[0] !== `Fila ${rowNum}`) {
                // Si no hubo errores nuevos para esta fila
                validRows.push({
                    id: crypto.randomUUID(),
                    date,
                    type: type === 'ingreso' ? 'income' : 'expense',
                    amount,
                    categoryId,
                    accountId,
                    note: noteRaw || '',
                    attachment: null
                })
            }
        })

        setImportErrors(errors)
        setImportPreview(validRows)
        setImportSuccessCount(validRows.length)
    }

    const confirmImport = async () => {
        if (importPreview.length === 0) return

        let importedCount = 0
        for (const tx of importPreview) {
            await processTransaction(tx)
            importedCount++
        }

        alert(`Se importaron ${importedCount} movimientos correctamente.`)
        setIsImportModalOpen(false)
        setImportPreview([])
        setImportErrors([])
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
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Movimientos</h2>
                    <p className="text-slate-500 font-medium">Registra y revisa todos tus ingresos y gastos.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn-secondary text-sm"
                    >
                        <FileSpreadsheet size={18} />
                        <span>Importar Excel</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        <span>Nuevo Movimiento</span>
                    </button>
                </div>
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
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                                {t.date}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account?.color || '#cbd5e1' }} />
                                                    <span className="text-sm font-semibold text-slate-700">{account?.name || '---'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-200 whitespace-nowrap">
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
                                            <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
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

            {/* Import Excel Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>Importar Movimientos</h3>
                                <p className="text-sm text-slate-500 mt-1">Sube tus datos usando nuestra plantilla.</p>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            {!importPreview.length && !importErrors.length ? (
                                <div className="space-y-6">
                                    {/* Paso 1: Descargar Plantilla */}
                                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-4">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                            <Download size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-900 mb-1">Paso 1: Descarga la plantilla</h4>
                                            <p className="text-sm text-blue-700 mb-4">Usa este archivo para asegurar que el formato sea correcto. No cambies los encabezados.</p>
                                            <button onClick={downloadTemplate} className="btn-secondary text-xs">
                                                Descargar Plantilla Excel
                                            </button>
                                        </div>
                                    </div>

                                    {/* Paso 2: Subir Archivo */}
                                    <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center hover:bg-slate-100/50 transition-colors">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                            <Upload size={24} />
                                        </div>
                                        <h4 className="font-bold text-slate-700 mb-1">Paso 2: Sube tu archivo</h4>
                                        <p className="text-sm text-slate-500 mb-4">Arrastra tu archivo aquí o haz clic para buscarlo</p>
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleExcelUpload}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="btn-primary inline-flex cursor-pointer">
                                            Seleccionar Archivo
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Resumen de validación */}
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="text-emerald-600" size={20} />
                                                <span className="font-bold text-emerald-900">Válidos</span>
                                            </div>
                                            <p className="text-2xl font-bold text-emerald-700">{importSuccessCount}</p>
                                            <p className="text-xs text-emerald-600">listos para importar</p>
                                        </div>
                                        <div className="flex-1 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="text-rose-600" size={20} />
                                                <span className="font-bold text-rose-900">Errores</span>
                                            </div>
                                            <p className="text-2xl font-bold text-rose-700">{importErrors.length}</p>
                                            <p className="text-xs text-rose-600">requieren corrección</p>
                                        </div>
                                    </div>

                                    {/* Lista de Errores */}
                                    {importErrors.length > 0 && (
                                        <div className="bg-rose-50 border border-rose-100 rounded-xl overflow-hidden">
                                            <div className="px-4 py-3 bg-rose-100/50 border-b border-rose-100 font-bold text-rose-800 text-sm">
                                                Detalle de Errores (Corrige y vuelve a subir)
                                            </div>
                                            <div className="max-h-40 overflow-y-auto p-4 space-y-2">
                                                {importErrors.map((err, i) => (
                                                    <div key={i} className="flex items-start gap-2 text-sm text-rose-700">
                                                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                                        <span>{err}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Lista Previa (Primeros 5) */}
                                    {importPreview.length > 0 && (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-sm">
                                                Vista Previa ({importPreview.length} registros)
                                            </div>
                                            <div className="max-h-40 overflow-y-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                                        <tr>
                                                            <th className="px-4 py-2">Fecha</th>
                                                            <th className="px-4 py-2">Tipo</th>
                                                            <th className="px-4 py-2 text-right">Monto</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {importPreview.slice(0, 5).map((row, i) => (
                                                            <tr key={i}>
                                                                <td className="px-4 py-2">{row.date}</td>
                                                                <td className="px-4 py-2">{row.type}</td>
                                                                <td className="px-4 py-2 text-right">${row.amount}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {importPreview.length > 5 && (
                                                    <div className="px-4 py-2 text-center text-xs text-slate-400 bg-slate-50">
                                                        ... y {importPreview.length - 5} más
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                setImportPreview([])
                                                setImportErrors([])
                                                setImportSuccessCount(0)
                                            }}
                                            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
                                        >
                                            Cancelar / Subir Otro
                                        </button>
                                        <button
                                            onClick={confirmImport}
                                            disabled={importPreview.length === 0 || importErrors.length > 0}
                                            className="flex-1 btn-primary !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Confirmar Importación
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New Transaction Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>Nuevo Movimiento</h3>
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
