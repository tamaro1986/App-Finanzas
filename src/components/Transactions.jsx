// ============================================================================
// IMPORTS: React, iconos, utilidades y funciones de sincronización
// ============================================================================
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Filter, Calendar, Tag, CreditCard, ArrowUpCircle, ArrowDownCircle, Camera, Image as ImageIcon, X, FileSpreadsheet, Download, Upload, AlertTriangle, CheckCircle, Edit2, Shield, History } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { DEFAULT_CATEGORIES, TRANSFER_CATEGORY } from '../constants/categories'
import * as XLSX from 'xlsx' // Importar librería para Excel
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase, syncToSupabase } from '../lib/supabaseSync'
// Importar sistema de notificaciones
import { useSyncNotifications } from './SyncNotification'
// Importar sistema de respaldo automático
import { createBackup } from '../utils/backup'
import BackupManager from './BackupManager'
import ImportHistoryManager from './ImportHistoryManager'

// ============================================================================
// COMPONENTE: Transactions
// PROPÓSITO: Gestionar transacciones (ingresos y gastos)
// CONECTADO A: Supabase tablas 'transactions' y 'accounts'
// ============================================================================
const Transactions = ({ transactions, setTransactions, accounts, setAccounts, budgets = {}, selectedAccountId, setSelectedAccountId }) => {
    // Hook de notificaciones
    const { addNotification } = useSyncNotifications()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [filterAccountType, setFilterAccountType] = useState('all')
    const [filterDateFrom, setFilterDateFrom] = useState('')
    const [filterDateTo, setFilterDateTo] = useState('')
    const [filterCategoryId, setFilterCategoryId] = useState('all')
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
    const [editingTransaction, setEditingTransaction] = useState(null)
    const [tempInitialBalance, setTempInitialBalance] = useState('')
    const [isInitialModalOpen, setIsInitialModalOpen] = useState(false)

    // Estado para ordenamiento de la tabla
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })

    // Estados para importación de Excel
    const [importErrors, setImportErrors] = useState([])
    const [importPreview, setImportPreview] = useState([])
    const [importSuccessCount, setImportSuccessCount] = useState(0)
    const [importLogs, setImportLogs] = useState(() => {
        const saved = localStorage.getItem('importLogs')
        return saved ? JSON.parse(saved) : []
    })

    // Guardar logs en localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem('importLogs', JSON.stringify(importLogs))
    }, [importLogs])

    // ============================================================================
    // FUNCIÓN: Obtener categorías combinadas (predefinidas + personalizadas del presupuesto)
    // ============================================================================
    const getCombinedCategories = (type) => {
        // Categorías predefinidas
        const defaultCats = type === 'income' ? DEFAULT_CATEGORIES.income : DEFAULT_CATEGORIES.expense

        // Obtener todas las categorías del presupuesto de todos los períodos
        const allBudgetCategories = Object.values(budgets).flat().filter(cat => cat && cat.type === type)

        // Usar un Map para evitar duplicados (clave: ID de categoría)
        const categoryMap = new Map()

        // 1. Primero agregar todas las categorías predefinidas
        defaultCats.forEach(cat => {
            categoryMap.set(cat.id, cat)
        })

        // 2. Luego agregar solo las categorías personalizadas que NO existen en las predefinidas
        allBudgetCategories.forEach(cat => {
            // Solo agregar si:
            // - No existe ya en el Map (por ID)
            // - No existe una categoría con el mismo nombre (case-insensitive)
            const existsById = categoryMap.has(cat.id)
            const existsByName = Array.from(categoryMap.values()).some(
                existing => existing.name.toLowerCase() === cat.name.toLowerCase()
            )

            if (!existsById && !existsByName) {
                categoryMap.set(cat.id, {
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon || (type === 'income' ? '💰' : '📄'),
                    color: type === 'income' ? '#2ecc71' : '#95a5a6'
                })
            }
        })

        // Convertir el Map a array
        return Array.from(categoryMap.values())
    }

    const [newTx, setNewTx] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        accountId: '',
        categoryId: '',
        amount: '',
        type: 'expense',
        note: '',
        attachment: null
    })

    // Estados para transferencias
    const [transferData, setTransferData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        note: ''
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
    // FUNCIÓN: closeModal
    // PROPÓSITO: Cerrar modal y resetear estados de formulario
    // ============================================================================
    const closeModal = () => {
        setIsModalOpen(false)

        // Resetear newTx
        setNewTx({
            date: format(new Date(), 'yyyy-MM-dd'),
            accountId: accounts[0]?.id || '',
            categoryId: '',
            amount: '',
            type: 'expense',
            note: '',
            attachment: null
        })

        // Resetear transferData
        setTransferData({
            date: format(new Date(), 'yyyy-MM-dd'),
            fromAccountId: '',
            toAccountId: '',
            amount: '',
            note: ''
        })
    }

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
    // PROPÓSITO: Agregar o editar transacción y actualizar balance de cuenta
    // SINCRONIZA: Tanto la transacción como la cuenta actualizada con Supabase
    // ============================================================================
    const handleAddTransaction = async (e) => {
        e.preventDefault()

        // Si es transferencia, usar el handler específico
        if (newTx.type === 'transfer') {
            return await handleAddTransfer(e)
        }

        // Validar que se haya seleccionado una cuenta
        if (!newTx.accountId) {
            alert('Por favor selecciona una cuenta.')
            return
        }

        const isEditing = !!newTx.id

        if (isEditing) {
            // MODO EDICIÓN: Actualizar transacción existente
            const oldTransaction = transactions.find(t => t.id === newTx.id)
            if (!oldTransaction) {
                addNotification('Error: transacción no encontrada', 'error')
                return
            }

            // Revertir el efecto de la transacción anterior
            const accountsAfterRevert = accounts.map(acc => {
                if (acc.id === oldTransaction.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = oldTransaction.type === 'income' ? acc.balance + oldTransaction.amount : acc.balance - oldTransaction.amount
                    } else {
                        newBalance = oldTransaction.type === 'income' ? acc.balance - oldTransaction.amount : acc.balance + oldTransaction.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                return acc
            })

            // Aplicar el efecto de la nueva transacción actualizada
            const updatedTransaction = {
                ...newTx,
                amount: parseFloat(newTx.amount)
            }

            const finalAccounts = accountsAfterRevert.map(acc => {
                if (acc.id === updatedTransaction.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = updatedTransaction.type === 'income' ? acc.balance - updatedTransaction.amount : acc.balance + updatedTransaction.amount
                    } else {
                        newBalance = updatedTransaction.type === 'income' ? acc.balance + updatedTransaction.amount : acc.balance - updatedTransaction.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                return acc
            })

            setAccounts(finalAccounts)

            // Actualizar la transacción en el array
            const updatedTransactions = transactions.map(t =>
                t.id === newTx.id ? updatedTransaction : t
            )
            setTransactions(updatedTransactions)

            // Sincronizar ambas cuentas si cambió de cuenta
            const accountsToUpdate = oldTransaction.accountId === updatedTransaction.accountId
                ? [updatedTransaction.accountId]
                : [oldTransaction.accountId, updatedTransaction.accountId]

            for (const accountId of accountsToUpdate) {
                const account = finalAccounts.find(a => a.id === accountId)
                if (account) {
                    await saveToSupabase('accounts', 'finanzas_accounts', account, finalAccounts)
                }
            }

            // Sincronizar transacción actualizada
            await saveToSupabase('transactions', 'finanzas_transactions', updatedTransaction, updatedTransactions)

            addNotification('Transacción actualizada correctamente', 'success')
        } else {
            // MODO CREACIÓN: Nueva transacción
            const transaction = {
                id: crypto.randomUUID(),
                ...newTx,
                amount: parseFloat(newTx.amount)
            }

            await processTransaction(transaction)
        }

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
        const txSaveResult = await saveToSupabase('transactions', 'finanzas_transactions', transaction, updatedTransactions)

        // Verificar si hubo problemas de sincronización
        if (txSaveResult && !txSaveResult.savedToCloud) {
            console.warn('⚠️ Transacción guardada solo localmente:', txSaveResult.message || txSaveResult.error)

            // Mostrar notificación si hay un error real
            if (txSaveResult.error) {
                addNotification(
                    `⚠️ La transacción se guardó solo en este dispositivo. ${txSaveResult.error}. Verifica tu conexión a internet.`,
                    'warning',
                    7000
                )
            }
        }

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
            const accSaveResult = await saveToSupabase('accounts', 'finanzas_accounts', updatedAccount, updatedAccounts)

            // Verificar sincronización de cuenta
            if (accSaveResult && !accSaveResult.savedToCloud && accSaveResult.error) {
                console.warn('⚠️ Cuenta actualizada solo localmente:', accSaveResult.message || accSaveResult.error)
            }
        }

        // 🔒 Crear respaldo automático de transacciones
        createBackup('transactions', updatedTransactions)
        createBackup('accounts', updatedAccounts)
    }

    // ============================================================================
    // FUNCIÓN: handleEditTransaction
    // PROPÓSITO: Editar transacción existente y ajustar balances de cuentas
    // SINCRONIZA: Transacción actualizada y cuentas afectadas con Supabase
    // ============================================================================
    const handleEditTransaction = async (e) => {
        e.preventDefault()
        if (!editingTransaction) return

        // Encontrar la transacción original
        const originalTx = transactions.find(t => t.id === editingTransaction.id)
        if (!originalTx) return

        // Crear transacción actualizada
        const updatedTx = {
            ...editingTransaction,
            amount: parseFloat(editingTransaction.amount)
        }

        // 1. Revertir el efecto de la transacción original en la cuenta original
        let updatedAccounts = accounts.map(acc => {
            if (acc.id === originalTx.accountId) {
                let newBalance = acc.balance
                if (acc.type === 'Préstamo') {
                    newBalance = originalTx.type === 'income' ? acc.balance + originalTx.amount : acc.balance - originalTx.amount
                } else {
                    newBalance = originalTx.type === 'income' ? acc.balance - originalTx.amount : acc.balance + originalTx.amount
                }
                return { ...acc, balance: newBalance }
            }
            return acc
        })

        // 2. Aplicar el efecto de la transacción actualizada en la cuenta nueva (puede ser la misma)
        updatedAccounts = updatedAccounts.map(acc => {
            if (acc.id === updatedTx.accountId) {
                let newBalance = acc.balance
                if (acc.type === 'Préstamo') {
                    newBalance = updatedTx.type === 'income' ? acc.balance - updatedTx.amount : acc.balance + updatedTx.amount
                } else {
                    newBalance = updatedTx.type === 'income' ? acc.balance + updatedTx.amount : acc.balance - updatedTx.amount
                }
                return { ...acc, balance: newBalance }
            }
            return acc
        })

        // 3. Actualizar la transacción en el array
        const updatedTransactions = transactions.map(t => t.id === updatedTx.id ? updatedTx : t)
        setTransactions(updatedTransactions)
        setAccounts(updatedAccounts)

        // 4. Sincronizar con Supabase
        await saveToSupabase('transactions', 'finanzas_transactions', updatedTx, updatedTransactions)

        // Sincronizar cuentas afectadas
        const affectedAccountIds = new Set([originalTx.accountId, updatedTx.accountId])
        for (const accountId of affectedAccountIds) {
            const account = updatedAccounts.find(acc => acc.id === accountId)
            if (account) {
                await saveToSupabase('accounts', 'finanzas_accounts', account, updatedAccounts)
            }
        }

        // Cerrar modal
        setIsEditModalOpen(false)
        setEditingTransaction(null)
        addNotification('Transacción actualizada correctamente', 'success')

        // 🔒 Crear respaldo automático
        createBackup('transactions', updatedTransactions)
        createBackup('accounts', updatedAccounts)
    }

    // ============================================================================
    // FUNCIÓN: handleUpdateInitialBalance
    // PROPÓSITO: Ajustar el saldo inicial de una cuenta y recalcular el actual
    // ============================================================================
    const handleUpdateInitialBalance = async (e) => {
        if (e) e.preventDefault()
        const newInitial = parseFloat(tempInitialBalance)
        if (isNaN(newInitial)) {
            addNotification('Monto inválido', 'error')
            return
        }

        const account = accounts.find(a => a.id === selectedAccountId)
        if (!account) return

        // 1. Encontrar el saldo inicial actual calculado desde el historial disponible
        const initialRow = transactionsWithRunningBalance.find(t => t.isInitialBalance)
        if (!initialRow) return

        const currentInitial = initialRow.runningBalance

        // 2. Calcular el desplazamiento (shift)
        const shift = newInitial - currentInitial

        // 3. El saldo actual de la cuenta se ajusta por ese desplazamiento
        const newBalance = account.balance + shift

        const updatedAccounts = accounts.map(a =>
            a.id === selectedAccountId ? { ...a, balance: newBalance } : a
        )

        setAccounts(updatedAccounts)
        setIsInitialModalOpen(false)

        // Sincronizar con Supabase
        await saveToSupabase('accounts', 'finanzas_accounts', { ...account, balance: newBalance }, updatedAccounts)
        addNotification('Saldo base ajustado correctamente', 'success')

        // 🔒 Crear respaldo
        createBackup('accounts', updatedAccounts)
    }

    const openInitialEditModal = (currentInitial) => {
        setTempInitialBalance(currentInitial.toString())
        setIsInitialModalOpen(true)
    }

    // ============================================================================
    // FUNCIÓN: handleAddTransfer
    // PROPÓSITO: Crear o editar transferencia entre cuentas (2 transacciones vinculadas)
    // ============================================================================
    const handleAddTransfer = async (e) => {
        if (e) e.preventDefault()

        // Validaciones
        if (!transferData.fromAccountId || !transferData.toAccountId) {
            addNotification('Selecciona ambas cuentas', 'error')
            return
        }

        if (transferData.fromAccountId === transferData.toAccountId) {
            addNotification('No puedes transferir a la misma cuenta', 'error')
            return
        }

        const amount = parseFloat(transferData.amount)
        if (isNaN(amount) || amount <= 0) {
            addNotification('Monto inválido', 'error')
            return
        }

        const isEditing = !!transferData.id

        if (isEditing) {
            // MODO EDICIÓN: Eliminar transferencia anterior y crear nueva
            const oldTx1 = transactions.find(t => t.id === transferData.id)
            const oldTx2 = transactions.find(t => t.id === transferData.siblingId)

            if (!oldTx1 || !oldTx2) {
                addNotification('Error: no se encontró la transferencia original', 'error')
                return
            }

            // Revertir ambas transacciones de la transferencia anterior
            let revertedAccounts = [...accounts]

            // Revertir tx1
            revertedAccounts = revertedAccounts.map(acc => {
                if (acc.id === oldTx1.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = oldTx1.type === 'income' ? acc.balance + oldTx1.amount : acc.balance - oldTx1.amount
                    } else {
                        newBalance = oldTx1.type === 'income' ? acc.balance - oldTx1.amount : acc.balance + oldTx1.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                return acc
            })

            // Revertir tx2
            revertedAccounts = revertedAccounts.map(acc => {
                if (acc.id === oldTx2.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = oldTx2.type === 'income' ? acc.balance + oldTx2.amount : acc.balance - oldTx2.amount
                    } else {
                        newBalance = oldTx2.type === 'income' ? acc.balance - oldTx2.amount : acc.balance + oldTx2.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                return acc
            })

            setAccounts(revertedAccounts)

            // Eliminar de Supabase las versiones antiguas
            await deleteFromSupabase('transactions', 'finanzas_transactions', transferData.id, transactions)
            await deleteFromSupabase('transactions', 'finanzas_transactions', transferData.siblingId, transactions)
        }

        // Base de transacciones a usar (si es edición, usar el array sin las antiguas)
        const baseTransactions = isEditing
            ? transactions.filter(t => t.id !== transferData.id && t.id !== transferData.siblingId)
            : transactions

        // Crear ID único compartido para vincular ambas transacciones
        const transferId = isEditing ? transferData.transferId : crypto.randomUUID()

        // Encontrar nombres de cuentas
        const fromAccount = accounts.find(a => a.id === transferData.fromAccountId)
        const toAccount = accounts.find(a => a.id === transferData.toAccountId)

        if (!fromAccount || !toAccount) {
            addNotification('Error al encontrar las cuentas', 'error')
            return
        }

        // Transacción 1: Salida de cuenta origen
        const tx1 = {
            id: crypto.randomUUID(),
            transferId: transferId,
            isTransfer: true,
            type: 'expense',
            accountId: transferData.fromAccountId,
            categoryId: 'transfer',
            amount: amount,
            date: transferData.date,
            note: `Transferencia a ${toAccount.name}${transferData.note ? ': ' + transferData.note : ''}`,
            attachment: null
        }

        // Transacción 2: Entrada a cuenta destino
        const tx2 = {
            id: crypto.randomUUID(),
            transferId: transferId,
            isTransfer: true,
            type: 'income',
            accountId: transferData.toAccountId,
            categoryId: 'transfer',
            amount: amount,
            date: transferData.date,
            note: `Transferencia desde ${fromAccount.name}${transferData.note ? ': ' + transferData.note : ''}`,
            attachment: null
        }

        // Procesar ambas transacciones en lote para evitar condiciones de carrera en el estado
        try {
            // 1. Preparar el nuevo array de transacciones
            const updatedTransactions = [tx1, tx2, ...baseTransactions]

            // 2. Preparar el nuevo array de cuentas con balances actualizados
            // 💡 IMPORTANTE: Si es edición, usamos revertedAccounts como base. Si no, usamos accounts.
            const baseAccounts = isEditing ? revertedAccounts : accounts
            const updatedAccounts = baseAccounts.map(acc => {
                if (acc.id === tx1.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = tx1.type === 'income' ? acc.balance - tx1.amount : acc.balance + tx1.amount
                    } else {
                        newBalance = tx1.type === 'income' ? acc.balance + tx1.amount : acc.balance - tx1.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                if (acc.id === tx2.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = tx2.type === 'income' ? acc.balance - tx2.amount : acc.balance + tx2.amount
                    } else {
                        newBalance = tx2.type === 'income' ? acc.balance + tx2.amount : acc.balance - tx2.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                return acc
            })

            // 3. Actualizar estados una sola vez
            setTransactions(updatedTransactions)
            setAccounts(updatedAccounts)

            // 4. Sincronizar con Supabase de forma paralela
            const syncPromises = [
                saveToSupabase('transactions', 'finanzas_transactions', tx1, updatedTransactions),
                saveToSupabase('transactions', 'finanzas_transactions', tx2, updatedTransactions),
                saveToSupabase('accounts', 'finanzas_accounts', updatedAccounts.find(a => a.id === tx1.accountId), updatedAccounts),
                saveToSupabase('accounts', 'finanzas_accounts', updatedAccounts.find(a => a.id === tx2.accountId), updatedAccounts)
            ]

            await Promise.all(syncPromises)

            // 5. Crear respaldos
            createBackup('transactions', updatedTransactions)
            createBackup('accounts', updatedAccounts)

            addNotification(isEditing ? 'Transferencia actualizada exitosamente' : 'Transferencia completada exitosamente', 'success')
            setIsModalOpen(false)

            // Resetear formularios
            setTransferData({
                date: format(new Date(), 'yyyy-MM-dd'),
                fromAccountId: '',
                toAccountId: '',
                amount: '',
                note: ''
            })

            setNewTx({
                date: format(new Date(), 'yyyy-MM-dd'),
                accountId: accounts[0]?.id || '',
                categoryId: '',
                amount: '',
                type: 'expense',
                note: '',
                attachment: null
            })
        } catch (error) {
            console.error('Error al procesar transferencia:', error)
            addNotification('Error al procesar la transferencia', 'error')
        }
    }

    // ============================================================================
    // FUNCIÓN: openEditModal
    // PROPÓSITO: Abrir modal de edición con los datos de la transacción
    // ============================================================================
    const openEditModal = (transaction) => {
        // Si es una transferencia, poblar transferData y establecer tipo 'transfer'
        if (transaction.isTransfer) {
            // Encontrar la transacción hermana para obtener la cuenta de destino
            const siblingTx = transactions.find(
                t => t.transferId === transaction.transferId && t.id !== transaction.id
            )

            // Determinar cuál es la cuenta origen y cuál es la destino
            // La transacción de tipo 'expense' es la cuenta de origen
            const fromAccountId = transaction.type === 'expense' ? transaction.accountId : siblingTx?.accountId
            const toAccountId = transaction.type === 'income' ? transaction.accountId : siblingTx?.accountId

            setTransferData({
                date: transaction.date,
                fromAccountId: fromAccountId || '',
                toAccountId: toAccountId || '',
                amount: transaction.amount.toString(),
                note: transaction.note || '',
                id: transaction.id, // Guardar el ID para la edición
                transferId: transaction.transferId,
                siblingId: siblingTx?.id // ID de la transacción hermana
            })

            setNewTx({
                ...newTx,
                type: 'transfer'
            })
        } else {
            // Es una transacción normal (ingreso/gasto)
            setNewTx({
                ...transaction,
                amount: transaction.amount.toString(),
                id: transaction.id // Guardar el ID para la edición
            })
        }

        setIsModalOpen(true)
    }

    // ============================================================================
    // FUNCIÓN: handleRestoreBackup
    // PROPÓSITO: Restaurar transacciones desde un respaldo
    // ============================================================================
    const handleRestoreBackup = (restoredData) => {
        setTransactions(restoredData)
        addNotification('✅ Respaldo restaurado correctamente', 'success')
    }

    // ============================================================================
    // FUNCIÓN: deleteTransaction
    // PROPÓSITO: Eliminar transacción y revertir cambio en balance de cuenta
    // SINCRONIZA: Eliminación de transacción y cuenta actualizada con Supabase
    // ============================================================================
    const deleteTransaction = async (id) => {
        const txToDelete = transactions.find(t => t.id === id)

        if (!txToDelete) return

        // Si es una transferencia, confirmar eliminación de ambas partes
        if (txToDelete.isTransfer) {
            if (!window.confirm('⚠️ Esto eliminará ambas partes de la transferencia. ¿Continuar?')) {
                return
            }

            // Encontrar la transacción hermana
            const siblingTx = transactions.find(
                t => t.transferId === txToDelete.transferId && t.id !== id
            )

            // Eliminar ambas transacciones
            if (siblingTx) {
                // Revertir ambas en las cuentas afectadas
                let updatedAccounts = [...accounts]

                // Revertir transacción principal
                updatedAccounts = updatedAccounts.map(acc => {
                    if (acc.id === txToDelete.accountId) {
                        let newBalance = acc.balance
                        if (acc.type === 'Préstamo') {
                            newBalance = txToDelete.type === 'income' ? acc.balance + txToDelete.amount : acc.balance - txToDelete.amount
                        } else {
                            newBalance = txToDelete.type === 'income' ? acc.balance - txToDelete.amount : acc.balance + txToDelete.amount
                        }
                        return { ...acc, balance: newBalance }
                    }
                    return acc
                })

                // Revertir transacción hermana
                updatedAccounts = updatedAccounts.map(acc => {
                    if (acc.id === siblingTx.accountId) {
                        let newBalance = acc.balance
                        if (acc.type === 'Préstamo') {
                            newBalance = siblingTx.type === 'income' ? acc.balance + siblingTx.amount : acc.balance - siblingTx.amount
                        } else {
                            newBalance = siblingTx.type === 'income' ? acc.balance - siblingTx.amount : acc.balance + siblingTx.amount
                        }
                        return { ...acc, balance: newBalance }
                    }
                    return acc
                })

                setAccounts(updatedAccounts)

                // Sincronizar cuentas con Supabase
                for (const account of updatedAccounts) {
                    const affectedAccountIds = [txToDelete.accountId, siblingTx.accountId]
                    if (affectedAccountIds.includes(account.id)) {
                        await saveToSupabase('accounts', 'finanzas_accounts', account, updatedAccounts)
                    }
                }

                // Eliminar ambas transacciones
                const updatedTransactions = transactions.filter(t => t.id !== id && t.id !== siblingTx.id)
                setTransactions(updatedTransactions)

                await deleteFromSupabase('transactions', 'finanzas_transactions', id, updatedTransactions)
                await deleteFromSupabase('transactions', 'finanzas_transactions', siblingTx.id, updatedTransactions)

                addNotification('Transferencia eliminada correctamente', 'success')
                return
            }
        }

        // Eliminación normal (no es transferencia)
        if (window.confirm('¿Eliminar esta transacción?')) {
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
                const accSaveResult = await saveToSupabase('accounts', 'finanzas_accounts', updatedAccount, updatedAccounts)

                // Verificar sincronización
                if (accSaveResult && !accSaveResult.savedToCloud) {
                    console.warn('⚠️ Cuenta actualizada solo localmente después de eliminar:', accSaveResult.message || accSaveResult.error)
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
        // 1. Obtener TODAS las categorías (predefinidas + personalizadas del presupuesto)
        const allIncomeCategories = getCombinedCategories('income')
        const allExpenseCategories = getCombinedCategories('expense')

        const catIncome = allIncomeCategories.map(c => c.name)
        const catExpense = allExpenseCategories.map(c => c.name)
        const accountNames = accounts.map(a => a.name)

        // 2. Hoja Principal: Plantilla con ejemplos reales
        const headers = ['Fecha (DD/MM/AAAA)', 'Tipo (ingreso/gasto/transferencia)', 'Monto', 'Categoría', 'Nota', 'Cuenta Origen', 'Es Transferencia (SI/NO)', 'Cuenta Destino']
        const exampleData = [
            headers,
            ['20/01/2025', 'gasto', 150.50, allExpenseCategories[0]?.name || 'Comida', 'Almuerzo trabajo', accounts[0]?.name || 'Efectivo', 'NO', ''],
            ['21/01/2025', 'ingreso', 5000, allIncomeCategories[0]?.name || 'Salario', 'Nómina quincenal', accounts[1]?.name || 'Banco', 'NO', ''],
            ['22/01/2025', 'transferencia', 1000, 'Transferencia', 'Retiro cajero', accounts[1]?.name || 'Banco', 'SI', accounts[0]?.name || 'Efectivo']
        ]

        // 3. Hoja de Catálogos (Referencia completa)
        const maxRows = Math.max(catIncome.length, catExpense.length, accountNames.length)
        const catalogHeaders = ['Categorías de Ingreso', 'Categorías de Gasto', 'Mis Cuentas']
        const catalogData = [catalogHeaders]

        for (let i = 0; i < maxRows; i++) {
            catalogData.push([
                catIncome[i] || '',
                catExpense[i] || '',
                accountNames[i] || ''
            ])
        }

        const wb = XLSX.utils.book_new()

        // Crear las hojas
        const wsPlantilla = XLSX.utils.aoa_to_sheet(exampleData)
        const wsCatalogos = XLSX.utils.aoa_to_sheet(catalogData)

        // 4. AGREGAR VALIDACIONES DE DATOS (Filtros/Dropdowns)
        // Configurar el rango de validación para las filas de datos (desde fila 2 hasta 1000)
        const dataValidations = []

        // Validación para columna B (Tipo): ingreso/gasto/transferencia
        dataValidations.push({
            sqref: 'B2:B1000',
            type: 'list',
            formula1: '"ingreso,gasto,transferencia"',
            showDropDown: true
        })

        // Validación para columna D (Categoría): todas las categorías
        const allCategories = [...new Set([...catIncome, ...catExpense, 'Transferencia'])]
        dataValidations.push({
            sqref: 'D2:D1000',
            type: 'list',
            formula1: `"${allCategories.join(',')}"`,
            showDropDown: true
        })

        // Validación para columna F (Cuenta Origen): todas las cuentas
        if (accountNames.length > 0) {
            dataValidations.push({
                sqref: 'F2:F1000',
                type: 'list',
                formula1: `"${accountNames.join(',')}"`,
                showDropDown: true
            })
        }

        // Validación para columna G (Es Transferencia): SI/NO
        dataValidations.push({
            sqref: 'G2:G1000',
            type: 'list',
            formula1: '"SI,NO"',
            showDropDown: true
        })

        // Validación para columna H (Cuenta Destino): todas las cuentas
        if (accountNames.length > 0) {
            dataValidations.push({
                sqref: 'H2:H1000',
                type: 'list',
                formula1: `"${accountNames.join(',')}"`,
                showDropDown: true
            })
        }

        // Aplicar validaciones a la hoja
        if (!wsPlantilla['!dataValidation']) {
            wsPlantilla['!dataValidation'] = []
        }
        wsPlantilla['!dataValidation'] = dataValidations

        // 5. Ajustar anchos de columna para mejor visualización
        wsPlantilla['!cols'] = [
            { wch: 18 }, // Fecha
            { wch: 12 }, // Tipo
            { wch: 10 }, // Monto
            { wch: 20 }, // Categoría
            { wch: 30 }, // Nota
            { wch: 18 }, // Cuenta Origen
            { wch: 18 }, // Es Transferencia
            { wch: 18 }  // Cuenta Destino
        ]

        wsCatalogos['!cols'] = [
            { wch: 25 },
            { wch: 25 },
            { wch: 25 }
        ]

        // Añadir hojas al libro
        XLSX.utils.book_append_sheet(wb, wsPlantilla, "Plantilla de Movimientos")
        XLSX.utils.book_append_sheet(wb, wsCatalogos, "Catálogos (REFERENCIA)")

        // Descargar
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

            // Estructura esperada: [Fecha, Tipo, Monto, Categoría, Nota, Cuenta Origen, Es Transferencia, Cuenta Destino]
            const [dateRaw, typeRaw, amountRaw, categoryRaw, noteRaw, accountRaw, isTransferRaw, toAccountRaw] = row

            // Si la fila está vacía, saltar
            if (!dateRaw && !amountRaw) return

            // Detectar si es transferencia (por columna SI, o por tipo/categoría "transferencia")
            const isTransfer = isTransferRaw?.toString().toUpperCase() === 'SI' ||
                typeRaw?.toString().toLowerCase() === 'transferencia' ||
                categoryRaw?.toString().toLowerCase() === 'transferencia'

            // 1. Validar Fecha
            let date = dateRaw
            if (!date) errors.push(`Fila ${rowNum}: Falta la fecha`)
            // Excel a veces devuelve fecha como número serial
            if (typeof date === 'number') {
                const dateObj = new Date(Math.round((date - 25569) * 86400 * 1000))
                date = format(dateObj, 'yyyy-MM-dd')
            }
            // Si es string, puede ser DD/MM/AAAA o AAAA-MM-DD
            else if (typeof date === 'string') {
                // Detectar formato DD/MM/AAAA
                if (date.includes('/')) {
                    const [day, month, year] = date.split('/')
                    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                }
                // Si ya está en formato AAAA-MM-DD, dejarlo así
            }

            // 2. Validar Monto
            const amount = parseFloat(amountRaw)
            if (isNaN(amount) || amount <= 0) errors.push(`Fila ${rowNum}: Monto inválido`)

            if (isTransfer) {
                // VALIDACIÓN PARA TRANSFERENCIAS
                // 3. Validar Cuenta Origen
                let fromAccountId = ''
                if (accountRaw) {
                    const searchAcc = accountRaw.toString().trim().toLowerCase()
                    const accFound = accounts.find(a => a.name.trim().toLowerCase() === searchAcc)
                    if (accFound) {
                        fromAccountId = accFound.id
                    } else {
                        errors.push(`Fila ${rowNum}: La cuenta origen '${accountRaw}' no existe.`)
                    }
                } else {
                    errors.push(`Fila ${rowNum}: Falta la cuenta origen para la transferencia.`)
                }

                // 4. Validar Cuenta Destino
                let toAccountId = ''
                if (toAccountRaw) {
                    const searchAcc = toAccountRaw.toString().trim().toLowerCase()
                    const accFound = accounts.find(a => a.name.trim().toLowerCase() === searchAcc)
                    if (accFound) {
                        toAccountId = accFound.id
                    } else {
                        errors.push(`Fila ${rowNum}: La cuenta destino '${toAccountRaw}' no existe.`)
                    }
                } else {
                    errors.push(`Fila ${rowNum}: Falta la cuenta destino para la transferencia.`)
                }

                // Validar que no sean la misma cuenta
                if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
                    errors.push(`Fila ${rowNum}: La cuenta origen y destino no pueden ser la misma.`)
                }

                if (errors.length === 0 || !errors[errors.length - 1].includes(`Fila ${rowNum}`)) {
                    validRows.push({
                        isTransfer: true,
                        date,
                        amount,
                        fromAccountId,
                        toAccountId,
                        note: noteRaw || '',
                        type: 'transfer'
                    })
                }
            } else {
                // VALIDACIÓN PARA INGRESOS/GASTOS NORMALES
                // 3. Validar Tipo
                const type = typeRaw?.toString().toLowerCase()
                if (type !== 'ingreso' && type !== 'gasto') errors.push(`Fila ${rowNum}: Tipo inválido (debe ser 'ingreso' o 'gasto')`)

                // 4. Validar Categoría (Buscamos ID)
                const allCats = [...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense]
                let categoryId = ''
                if (categoryRaw) {
                    const searchName = categoryRaw.toString().trim().toLowerCase()
                    const catFound = allCats.find(c => c.name.toLowerCase() === searchName)
                    categoryId = catFound ? catFound.id : 'others' // Default a 'Otros'
                } else {
                    errors.push(`Fila ${rowNum}: Falta el nombre de la categoría`)
                }

                // 5. Validar Cuenta (Buscamos ID)
                let accountId = ''
                if (accountRaw) {
                    const searchAcc = accountRaw.toString().trim().toLowerCase()
                    const accFound = accounts.find(a => a.name.trim().toLowerCase() === searchAcc)
                    if (accFound) {
                        accountId = accFound.id
                    } else {
                        errors.push(`Fila ${rowNum}: La cuenta '${accountRaw}' no coincide con ninguna cuenta guardada. Verifica el nombre exacto.`)
                    }
                } else {
                    // Si no se especifica cuenta y solo hay una, usar esa. Si hay varias, error.
                    if (accounts.length === 1) accountId = accounts[0].id
                    else errors.push(`Fila ${rowNum}: No se especificó la cuenta en el Excel y tienes varias registradas.`)
                }

                if (errors.length === 0 || !errors[errors.length - 1].includes(`Fila ${rowNum}`)) {
                    // Si no hubo errores nuevos para esta fila
                    validRows.push({
                        id: crypto.randomUUID(),
                        date,
                        type: type === 'ingreso' ? 'income' : 'expense',
                        amount,
                        categoryId,
                        accountId,
                        note: noteRaw || '',
                        attachment: null,
                        isTransfer: false
                    })
                }
            }
        })

        setImportErrors(errors)
        setImportPreview(validRows)
        setImportSuccessCount(validRows.length)
    }

    const confirmImport = async () => {
        if (importPreview.length === 0) return

        // Separar transferencias de transacciones normales
        const transfers = importPreview.filter(tx => tx.isTransfer)
        const normalTransactions = importPreview.filter(tx => !tx.isTransfer)

        // 1. Preparar transacciones normales
        const newNormalTransactions = [...normalTransactions, ...transactions]

        // 2. Preparar transacciones de transferencias (crear pares)
        const transferTransactions = []
        transfers.forEach(transfer => {
            const transferId = crypto.randomUUID()
            const fromAccount = accounts.find(a => a.id === transfer.fromAccountId)
            const toAccount = accounts.find(a => a.id === transfer.toAccountId)

            // Transacción de salida
            transferTransactions.push({
                id: crypto.randomUUID(),
                transferId,
                isTransfer: true,
                type: 'expense',
                accountId: transfer.fromAccountId,
                categoryId: 'transfer',
                amount: transfer.amount,
                date: transfer.date,
                note: `Transferencia a ${toAccount?.name || 'Destino'}${transfer.note ? ': ' + transfer.note : ''}`,
                attachment: null
            })

            // Transacción de entrada
            transferTransactions.push({
                id: crypto.randomUUID(),
                transferId,
                isTransfer: true,
                type: 'income',
                accountId: transfer.toAccountId,
                categoryId: 'transfer',
                amount: transfer.amount,
                date: transfer.date,
                note: `Transferencia desde ${fromAccount?.name || 'Origen'}${transfer.note ? ': ' + transfer.note : ''}`,
                attachment: null
            })
        })

        // 3. Combinar todas las transacciones
        const allNewTransactions = [...transferTransactions, ...normalTransactions, ...transactions]

        // 4. Calcular los nuevos balances de las cuentas
        let updatedAccounts = [...accounts]

        // Procesar transacciones normales
        normalTransactions.forEach(tx => {
            updatedAccounts = updatedAccounts.map(acc => {
                if (acc.id === tx.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = tx.type === 'income' ? acc.balance - tx.amount : acc.balance + tx.amount
                    } else {
                        newBalance = tx.type === 'income' ? acc.balance + tx.amount : acc.balance - tx.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                return acc
            })
        })

        // Procesar transferencias
        transferTransactions.forEach(tx => {
            updatedAccounts = updatedAccounts.map(acc => {
                if (acc.id === tx.accountId) {
                    let newBalance = acc.balance
                    if (acc.type === 'Préstamo') {
                        newBalance = tx.type === 'income' ? acc.balance - tx.amount : acc.balance + tx.amount
                    } else {
                        newBalance = tx.type === 'income' ? acc.balance + tx.amount : acc.balance - tx.amount
                    }
                    return { ...acc, balance: newBalance }
                }
                return acc
            })
        })

        // 5. Actualizar estados locales
        setTransactions(allNewTransactions)
        setAccounts(updatedAccounts)

        // 6. Sincronizar masivamente con Supabase
        // Primero las transacciones (usando syncToSupabase que ahora maneja arrays)
        const txSyncResult = await syncToSupabase('transactions', 'finanzas_transactions', allNewTransactions)

        // Luego las cuentas con sus nuevos balances
        const accSyncResult = await syncToSupabase('accounts', 'finanzas_accounts', updatedAccounts)

        if (txSyncResult && accSyncResult) {
            addNotification(`✅ Se importaron ${importPreview.length} movimientos y se actualizaron los balances correctamente.`, 'success')
        } else {
            addNotification(`⚠️ Los datos se cargaron localmente pero hubo un problema al sincronizar con la nube.`, 'warning')
        }

        setIsImportModalOpen(false)
        setImportPreview([])
        setImportErrors([])
    }

    // Función para limpiar todos los filtros
    const clearAllFilters = () => {
        setSearchQuery('')
        setFilterType('all')
        setFilterAccountType('all')
        setFilterDateFrom('')
        setFilterDateTo('')
        setFilterCategoryId('all')
        setSelectedAccountId(null)
    }

    // Verificar si hay filtros activos
    const hasActiveFilters = searchQuery || filterType !== 'all' || filterAccountType !== 'all' || filterDateFrom || filterDateTo || filterCategoryId !== 'all' || selectedAccountId

    // Obtener todas las categorías para el filtro
    const allCategoriesForFilter = [
        ...getCombinedCategories('income'),
        ...getCombinedCategories('expense'),
        TRANSFER_CATEGORY
    ].filter((cat, index, self) => self.findIndex(c => c.id === cat.id) === index)

    // Obtener tipos de cuenta únicos
    const accountTypes = [...new Set(accounts.map(acc => acc.type))].filter(Boolean)

    const filteredTransactions = React.useMemo(() => {
        let result = transactions.filter(t => {
            const matchesSearch = (t.note || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = filterType === 'all' || t.type === filterType
            const matchesAccount = !selectedAccountId || t.accountId === selectedAccountId

            // Filtro por tipo de cuenta
            const account = accounts.find(a => a.id === t.accountId)
            const matchesAccountType = filterAccountType === 'all' || account?.type === filterAccountType

            // Filtro por rango de fechas
            let matchesDateRange = true
            if (filterDateFrom) {
                matchesDateRange = matchesDateRange && t.date >= filterDateFrom
            }
            if (filterDateTo) {
                matchesDateRange = matchesDateRange && t.date <= filterDateTo
            }

            // Filtro por categoría
            const matchesCategory = filterCategoryId === 'all' || t.categoryId === filterCategoryId

            return matchesSearch && matchesType && matchesAccount && matchesAccountType && matchesDateRange && matchesCategory
        })

        // Aplicar ordenamiento
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key]
                let bValue = b[sortConfig.key]

                // Manejo especial por tipo de dato
                if (sortConfig.key === 'amount') {
                    aValue = parseFloat(aValue) || 0
                    bValue = parseFloat(bValue) || 0
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1
                }
                return 0
            })
        }
        return result
    }, [transactions, searchQuery, filterType, selectedAccountId, filterAccountType, filterDateFrom, filterDateTo, filterCategoryId, accounts, sortConfig])


    // ============================================================================
    // LÓGICA: Calcular Saldo por Línea
    // PROPÓSITO: Si hay una cuenta seleccionada, calcular la evolución del saldo
    // ============================================================================
    const transactionsWithRunningBalance = React.useMemo(() => {
        if (!selectedAccountId) return filteredTransactions

        const account = accounts.find(a => a.id === selectedAccountId)
        if (!account) return filteredTransactions

        // 1. Ordenar transacciones por fecha (más antiguas primero para el cálculo)
        // Usamos una copia para no mutar el original
        const sortedForBalance = [...transactions]
            .filter(t => t.accountId === selectedAccountId)
            .sort((a, b) => new Date(a.date) - new Date(b.date))

        // 2. Calcular saldos históricos trabajando hacia atrás desde el balance actual
        // B_final = B_inicial + Sum(Deltas) -> B_inicial = B_final - Sum(Deltas)
        let currentIterativeBalance = account.balance

        // Pero es más fácil ir desde el presente hacia atrás si queremos el saldo justo después de cada tx
        // Ordenamos descendente (más nuevas primero)
        const sortedDesc = [...sortedForBalance].reverse()
        const results = []

        let running = account.balance
        sortedDesc.forEach(tx => {
            results.push({ ...tx, runningBalance: running })

            // Revertir delta para la siguiente (anterior en el tiempo)
            const isLoan = account.type === 'Préstamo'
            if (isLoan) {
                // Para préstamos: ingreso redujo balance, gasto aumentó.
                // Para revertir: ingreso suma, gasto resta.
                running = tx.type === 'income' ? running + tx.amount : running - tx.amount
            } else {
                // Para cuentas normales: ingreso aumentó, gasto disminuyó.
                // Para revertir: ingreso resta, gasto suma.
                running = tx.type === 'income' ? running - tx.amount : running + tx.amount
            }
        })

        // Añadir fila de SALDO INICIAL al final (es el punto de partida)
        results.push({
            id: 'initial-' + selectedAccountId,
            isInitialBalance: true,
            date: sortedForBalance.length > 0 ? sortedForBalance[0].date : format(new Date(), 'yyyy-MM-dd'),
            note: 'PUNTO DE PARTIDA (Saldo Inicial)',
            amount: 0,
            type: 'neutral',
            runningBalance: running,
            accountId: selectedAccountId
        })

        // El resultado ya está filtrado por cuenta y tiene el saldo por línea
        let finalResults = results.filter(t => {
            if (t.isInitialBalance) return searchQuery === '' && filterType === 'all'
            const matchesSearch = (t.note || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = filterType === 'all' || t.type === filterType

            // También aplicar filtros avanzados
            const account = accounts.find(a => a.id === t.accountId)
            const matchesAccountType = filterAccountType === 'all' || account?.type === filterAccountType

            let matchesDateRange = true
            if (filterDateFrom) matchesDateRange = matchesDateRange && t.date >= filterDateFrom
            if (filterDateTo) matchesDateRange = matchesDateRange && t.date <= filterDateTo

            const matchesCategory = filterCategoryId === 'all' || t.categoryId === filterCategoryId

            return matchesSearch && matchesType && matchesAccountType && matchesDateRange && matchesCategory
        })

        // Aplicar ordenamiento también aquí si no es el orden por defecto (fecha desc)
        if (sortConfig.key) {
            finalResults.sort((a, b) => {
                // El saldo inicial siempre va al final o al principio dependiendo de la dirección? 
                // Por ahora lo dejamos fijo si es fecha, o lo tratamos como registro especial.
                if (a.isInitialBalance) return sortConfig.direction === 'desc' ? 1 : -1
                if (b.isInitialBalance) return sortConfig.direction === 'desc' ? -1 : 1

                let aValue = a[sortConfig.key]
                let bValue = b[sortConfig.key]

                if (sortConfig.key === 'amount') {
                    aValue = parseFloat(aValue) || 0
                    bValue = parseFloat(bValue) || 0
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return finalResults
    }, [filteredTransactions, selectedAccountId, accounts, transactions, searchQuery, filterType, filterAccountType, filterDateFrom, filterDateTo, filterCategoryId, sortConfig])

    // Obtener categorías combinadas según el tipo de transacción
    const categories = getCombinedCategories(newTx.type)
    const editCategories = editingTransaction ? getCombinedCategories(editingTransaction.type) : []

    // Calcular totales para el resumen basado en filteredTransactions
    const totals = React.useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.isTransfer) return acc; // No contar transferencias en totales de ingresos/gastos para no duplicar
            if (t.type === 'income') acc.income += t.amount;
            if (t.type === 'expense') acc.expense += t.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Movimientos</h2>
                    <p className="text-slate-500 font-medium">Registra y revisa todos tus ingresos y gastos.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsBackupModalOpen(true)}
                        className="btn-secondary text-sm"
                        title="Gestionar respaldos automáticos"
                    >
                        <Shield size={18} />
                        <span>Respaldos</span>
                    </button>
                    <button
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="btn-secondary text-sm"
                        title="Ver historial de importaciones"
                    >
                        <History size={18} />
                        <span>Historial</span>
                    </button>
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

            {/* Resumen de Saldos del Periodo Filtro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-white border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <ArrowUpCircle size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ingresos del Periodo</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                        ${totals.income.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="card bg-white border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                            <ArrowDownCircle size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gastos del Periodo</span>
                    </div>
                    <p className="text-2xl font-bold text-rose-600">
                        ${totals.expense.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="card bg-white border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Balance del Periodo</span>
                    </div>
                    <p className={`text-2xl font-bold ${(totals.income - totals.expense) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        ${(totals.income - totals.expense).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                {/* Fila principal de filtros */}
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
                    <div className="flex gap-2 flex-wrap">
                        <select
                            className="input-field w-auto"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Todos los tipos</option>
                            <option value="income">Ingresos</option>
                            <option value="expense">Gastos</option>
                        </select>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`btn-secondary text-sm ${showAdvancedFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
                        >
                            <Filter size={16} />
                            <span>Filtros</span>
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                        </button>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="btn-secondary text-sm text-rose-600 hover:bg-rose-50 border-rose-200"
                            >
                                <X size={16} />
                                <span>Limpiar</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Panel de filtros avanzados */}
                {showAdvancedFilters && (
                    <div className="card !p-4 bg-slate-50/50 border-slate-200/60 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Filtro por Cuenta Específica */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                    Cuenta
                                </label>
                                <select
                                    className="input-field"
                                    value={selectedAccountId || 'all'}
                                    onChange={(e) => setSelectedAccountId(e.target.value === 'all' ? null : e.target.value)}
                                >
                                    <option value="all">Todas las cuentas</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Tipo de Cuenta */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                    Tipo de Cuenta
                                </label>
                                <select
                                    className="input-field"
                                    value={filterAccountType}
                                    onChange={(e) => setFilterAccountType(e.target.value)}
                                >
                                    <option value="all">Todos los tipos</option>
                                    {accountTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Categoría */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                    Categoría
                                </label>
                                <select
                                    className="input-field"
                                    value={filterCategoryId}
                                    onChange={(e) => setFilterCategoryId(e.target.value)}
                                >
                                    <option value="all">Todas</option>
                                    {allCategoriesForFilter.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Fecha Desde */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                    Desde
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="date"
                                        className="input-field pl-10"
                                        value={filterDateFrom}
                                        onChange={(e) => setFilterDateFrom(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filtro por Fecha Hasta */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                    Hasta
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="date"
                                        className="input-field pl-10"
                                        value={filterDateTo}
                                        onChange={(e) => setFilterDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Resumen de filtros activos */}
                        {hasActiveFilters && (
                            <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activos:</span>
                                {searchQuery && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                                        Búsqueda: "{searchQuery}"
                                        <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                                    </span>
                                )}
                                {filterType !== 'all' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                                        {filterType === 'income' ? '📈 Ingresos' : '📉 Gastos'}
                                        <button onClick={() => setFilterType('all')} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                                    </span>
                                )}
                                {filterAccountType !== 'all' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                                        🏦 {filterAccountType}
                                        <button onClick={() => setFilterAccountType('all')} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                                    </span>
                                )}
                                {filterCategoryId !== 'all' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                                        {allCategoriesForFilter.find(c => c.id === filterCategoryId)?.icon} {allCategoriesForFilter.find(c => c.id === filterCategoryId)?.name}
                                        <button onClick={() => setFilterCategoryId('all')} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                                    </span>
                                )}
                                {filterDateFrom && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                                        📅 Desde: {filterDateFrom}
                                        <button onClick={() => setFilterDateFrom('')} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                                    </span>
                                )}
                                {filterDateTo && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                                        📅 Hasta: {filterDateTo}
                                        <button onClick={() => setFilterDateTo('')} className="text-slate-400 hover:text-rose-500"><X size={12} /></button>
                                    </span>
                                )}
                                {selectedAccountId && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg text-xs font-medium text-blue-600 border border-blue-200">
                                        💳 {accounts.find(a => a.id === selectedAccountId)?.name}
                                        <button onClick={() => setSelectedAccountId(null)} className="text-blue-400 hover:text-rose-500"><X size={12} /></button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedAccountId && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Filtrando por cuenta</p>
                            <h4 className="font-bold text-slate-900">{accounts.find(a => a.id === selectedAccountId)?.name}</h4>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedAccountId(null)}
                        className="text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all flex items-center gap-2"
                    >
                        <X size={14} /> QUITAR FILTRO
                    </button>
                </div>
            )}

            {/* Transactions Table */}
            <div className="card !p-0 overflow-hidden border-slate-200/60 shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 border-b border-slate-200/60">
                            <tr>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => setSortConfig({ key: 'date', direction: sortConfig.key === 'date' && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                                >
                                    <div className="flex items-center gap-2">
                                        Fecha
                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'date' ? 'opacity-100' : ''}`}>
                                            {sortConfig.key === 'date' && sortConfig.direction === 'asc' ? <ArrowUpCircle size={14} className="text-blue-500" /> : <ArrowDownCircle size={14} className="text-slate-400" />}
                                        </div>
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => setSortConfig({ key: 'accountId', direction: sortConfig.key === 'accountId' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                >
                                    <div className="flex items-center gap-2">
                                        Cuenta
                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'accountId' ? 'opacity-100' : ''}`}>
                                            {sortConfig.key === 'accountId' && sortConfig.direction === 'asc' ? <ArrowUpCircle size={14} className="text-blue-500" /> : <ArrowDownCircle size={14} className="text-slate-400" />}
                                        </div>
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => setSortConfig({ key: 'categoryId', direction: sortConfig.key === 'categoryId' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                >
                                    <div className="flex items-center gap-2">
                                        Categoría
                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'categoryId' ? 'opacity-100' : ''}`}>
                                            {sortConfig.key === 'categoryId' && sortConfig.direction === 'asc' ? <ArrowUpCircle size={14} className="text-blue-500" /> : <ArrowDownCircle size={14} className="text-slate-400" />}
                                        </div>
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => setSortConfig({ key: 'note', direction: sortConfig.key === 'note' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                >
                                    <div className="flex items-center gap-2">
                                        Nota
                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'note' ? 'opacity-100' : ''}`}>
                                            {sortConfig.key === 'note' && sortConfig.direction === 'asc' ? <ArrowUpCircle size={14} className="text-blue-500" /> : <ArrowDownCircle size={14} className="text-slate-400" />}
                                        </div>
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group"
                                    onClick={() => setSortConfig({ key: 'amount', direction: sortConfig.key === 'amount' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Monto
                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'amount' ? 'opacity-100' : ''}`}>
                                            {sortConfig.key === 'amount' && sortConfig.direction === 'asc' ? <ArrowUpCircle size={14} className="text-blue-500" /> : <ArrowDownCircle size={14} className="text-slate-400" />}
                                        </div>
                                    </div>
                                </th>
                                {selectedAccountId && <th className="px-6 py-4 text-right text-xs font-bold text-blue-600 uppercase tracking-widest">Saldo</th>}
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest w-28">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {transactionsWithRunningBalance.length === 0 ? (
                                <tr>
                                    <td colSpan={selectedAccountId ? "7" : "6"} className="px-6 py-20 text-center text-slate-400">
                                        No se encontraron movimientos.
                                    </td>
                                </tr>
                            ) : (
                                transactionsWithRunningBalance.map((t) => {
                                    const account = accounts.find(a => a.id === t.accountId)
                                    const allCategories = getCombinedCategories(t.type)
                                    const category = allCategories.find(c => c.id === t.categoryId)

                                    if (t.isInitialBalance) {
                                        return (
                                            <tr key={t.id} className="bg-blue-50/30">
                                                <td className="px-6 py-4 text-sm text-slate-400 font-bold italic">
                                                    {t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : t.date}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-400">---</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-blue-600 text-[10px] font-black uppercase border border-blue-100 shadow-sm">
                                                        🏁 INICIO
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-blue-700/60 uppercase tracking-tight">{t.note}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-bold text-slate-400">---</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-blue-600 bg-blue-100/20 whitespace-nowrap">
                                                    ${t.runningBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => openInitialEditModal(t.runningBalance)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Ajustar Saldo Inicial"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    }

                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                                                {t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : t.date}
                                            </td>
                                            <td className="px-6 py-4">
                                                {t.isTransfer ? (
                                                    /* Mostrar ambas cuentas para transferencias */
                                                    <div className="flex items-center gap-2">
                                                        {(() => {
                                                            // Intentar encontrar la transacción hermana para completar el origen/destino
                                                            const siblingTx = transactions.find(tx => tx.transferId === t.transferId && tx.id !== t.id)

                                                            // Definir origen y destino basándonos en el tipo de la transacción actual
                                                            let fromAccId = t.type === 'expense' ? t.accountId : siblingTx?.accountId
                                                            let toAccId = t.type === 'income' ? t.accountId : siblingTx?.accountId

                                                            const fromAcc = accounts.find(a => a.id === fromAccId)
                                                            const toAcc = accounts.find(a => a.id === toAccId)

                                                            return (
                                                                <>
                                                                    <div className="flex items-center gap-1.5 min-w-[80px]">
                                                                        {fromAcc ? (
                                                                            <>
                                                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fromAcc.color }} />
                                                                                <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">{fromAcc.name}</span>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-slate-300 italic">Origen</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-blue-400 font-bold">→</span>
                                                                    <div className="flex items-center gap-1.5 min-w-[80px]">
                                                                        {toAcc ? (
                                                                            <>
                                                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: toAcc.color }} />
                                                                                <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">{toAcc.name}</span>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-slate-300 italic">Destino</span>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {account ? (
                                                            <>
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account.color }} />
                                                                <span className="text-sm font-semibold text-slate-700">{account.name}</span>
                                                            </>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold uppercase border border-amber-200">
                                                                ⚠️ SIN CUENTA
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {t.isTransfer ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold uppercase border border-blue-200 whitespace-nowrap">
                                                        {TRANSFER_CATEGORY.icon} {TRANSFER_CATEGORY.name}
                                                    </span>
                                                ) : category ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold uppercase transition-colors group-hover:bg-white border border-transparent group-hover:border-slate-200 whitespace-nowrap">
                                                        {category.icon} {category.name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold uppercase border border-amber-200">
                                                        ⚠️ SIN CAT.
                                                    </span>
                                                )}
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
                                            {selectedAccountId && (
                                                <td className="px-6 py-4 text-right font-black text-slate-900 bg-slate-50/30 whitespace-nowrap">
                                                    ${t.runningBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(t)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTransaction(t.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                                {(newTx.id || transferData.id) ? 'Editar Movimiento' : 'Nuevo Movimiento'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddTransaction} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Type Toggle - 3 opciones */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNewTx({ ...newTx, type: 'income', categoryId: '' })}
                                    className={`py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 text-sm ${newTx.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                                >
                                    <ArrowUpCircle size={16} /> Ingreso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewTx({ ...newTx, type: 'expense', categoryId: '' })}
                                    className={`py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 text-sm ${newTx.type === 'expense' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                                >
                                    <ArrowDownCircle size={16} /> Gasto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewTx({ ...newTx, type: 'transfer', categoryId: '' })}
                                    className={`py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 text-sm ${newTx.type === 'transfer' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                                >
                                    🔄 Transfer
                                </button>
                            </div>

                            {newTx.type === 'transfer' ? (
                                /* UI PARA TRANSFERENCIAS */
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha</label>
                                        <input
                                            type="date" required className="input-field"
                                            value={transferData.date} onChange={e => setTransferData({ ...transferData, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Desde Cuenta</label>
                                        <select
                                            required className="input-field"
                                            value={transferData.fromAccountId} onChange={e => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                                        >
                                            <option value="">Selecciona cuenta origen</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Hacia Cuenta</label>
                                        <select
                                            required className="input-field"
                                            value={transferData.toAccountId} onChange={e => setTransferData({ ...transferData, toAccountId: e.target.value })}
                                        >
                                            <option value="">Selecciona cuenta destino</option>
                                            {accounts
                                                .filter(acc => acc.id !== transferData.fromAccountId)
                                                .map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Monto ($)</label>
                                        <input
                                            type="number" step="0.01" required placeholder="0.00" className="input-field"
                                            value={transferData.amount} onChange={e => setTransferData({ ...transferData, amount: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nota (Opcional)</label>
                                        <input
                                            type="text" placeholder="Ej. Retiro cajero" className="input-field"
                                            value={transferData.note} onChange={e => setTransferData({ ...transferData, note: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                        <button type="submit" className="flex-1 btn-primary !py-3">Transferir</button>
                                    </div>
                                </>
                            ) : (
                                /* UI PARA INGRESOS/GASTOS */
                                <>
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
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Transaction Modal */}
            {isEditModalOpen && editingTransaction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>Editar Movimiento</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditTransaction} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income', categoryId: '' })}
                                    className={`py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${editingTransaction.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                                >
                                    <ArrowUpCircle size={18} /> Ingreso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense', categoryId: '' })}
                                    className={`py-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${editingTransaction.type === 'expense' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'}`}
                                >
                                    <ArrowDownCircle size={18} /> Gasto
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha</label>
                                    <input
                                        type="date" required className="input-field"
                                        value={editingTransaction.date} onChange={e => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Monto ($)</label>
                                    <input
                                        type="number" step="0.01" required placeholder="0.00" className="input-field"
                                        value={editingTransaction.amount} onChange={e => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Cuenta</label>
                                <select
                                    required className="input-field"
                                    value={editingTransaction.accountId} onChange={e => setEditingTransaction({ ...editingTransaction, accountId: e.target.value })}
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
                                    value={editingTransaction.categoryId} onChange={e => setEditingTransaction({ ...editingTransaction, categoryId: e.target.value })}
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {editCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nota / Descripción</label>
                                <input
                                    type="text" placeholder="Ej. Pago de internet" className="input-field"
                                    value={editingTransaction.note} onChange={e => setEditingTransaction({ ...editingTransaction, note: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary !py-3">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Backup Manager Modal */}
            <BackupManager
                dataType="transactions"
                isOpen={isBackupModalOpen}
                onClose={() => setIsBackupModalOpen(false)}
                onRestore={handleRestoreBackup}
            />

            {/* Import History Manager Modal */}
            <ImportHistoryManager
                importLogs={importLogs}
                setImportLogs={setImportLogs}
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                onReimport={() => { }}
            />

            {/* Initial Balance Adjustment Modal */}
            {isInitialModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsInitialModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Ajustar Saldo Inicial</h3>
                                <p className="text-sm text-slate-500 mt-1">Cambia el punto de partida histórico de esta cuenta.</p>
                            </div>
                            <button onClick={() => setIsInitialModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateInitialBalance} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nuevo Saldo Inicial</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number" step="0.01" required autoFocus
                                        className="input-field !pl-8 text-2xl font-black text-slate-900"
                                        value={tempInitialBalance} onChange={e => setTempInitialBalance(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 italic">
                                    * Esto ajustará proporcionalmente tu saldo actual sin alterar tus transacciones registradas.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsInitialModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary !py-3">Ajustar Saldo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transactions
