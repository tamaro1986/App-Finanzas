// ============================================================================
// IMPORTS: Componentes y autenticación
// ============================================================================
import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import BudgetModule from './components/BudgetModule'
import Settings from './components/Settings'
import Accounts from './components/Accounts'
import Transactions from './components/Transactions'
import Vehicles from './components/Vehicles'
import MedicalHistory from './components/MedicalHistory'
import Journal from './components/Journal'
import DebtModule from './components/DebtModule'
import InvestmentPortfolio from './components/InvestmentPortfolio'
import Auth from './components/Auth'
import CategoryCharts from './components/CategoryCharts'
import SyncStatusIndicator from './components/SyncStatusIndicator'
import { SyncNotificationProvider } from './components/SyncNotification'
import { Menu, X, LogOut, Loader } from 'lucide-react'
import { supabase } from './lib/supabase'
// Importar herramientas de recuperación de datos (disponibles en window.finanzasDebug)
import './utils/dataRecovery'

// ============================================================================
// COMPONENTE PRINCIPAL: App
// PROPÓSITO: Gestionar autenticación, navegación y ESTADO GLOBAL del sistema
// ============================================================================
function App() {
    const [activeView, setActiveView] = useState('dashboard')
    const [selectedAccountId, setSelectedAccountId] = useState(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    // Estado de autenticación
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // ESTADO GLOBAL DE DATOS
    const [transactions, setTransactions] = useState([])
    const [accounts, setAccounts] = useState([])
    const [budgets, setBudgets] = useState(null)
    const [vehicles, setVehicles] = useState([])
    const [medicalRecords, setMedicalRecords] = useState([])
    const [patients, setPatients] = useState([])
    const [tccEntries, setTccEntries] = useState([])
    const [logEntries, setLogEntries] = useState([])
    const [medicationList, setMedicationList] = useState(["Sertralina", "Quetiapina", "Magnesium", "Ashwaganda", "Ansiovit", "Somit"])
    const [investments, setInvestments] = useState([])
    const [importLogs, setImportLogs] = useState([])

    // ============================================================================
    // EFFECT: Verificar sesión y cargar datos al iniciar
    // ============================================================================
    useEffect(() => {
        // Guard para evitar errores si supabase no está inicializado
        if (!supabase) {
            setLoading(false)
            return
        }

        // 1. Verificar sesión activa
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) loadGlobalData()
            else setLoading(false)
        })

        // 2. Escuchar cambios en la autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) loadGlobalData()
            else {
                setLoading(false)
                // Limpiar estados locales al cerrar sesión
                setTransactions([])
                setAccounts([])
                setBudgets(null)
                setVehicles([])
                setMedicalRecords([])
                setPatients([])
                setTccEntries([])
                setLogEntries([])
                setInvestments([])
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const loadGlobalData = async () => {
        try {
            const { initializeData } = await import('./lib/supabaseSync')

            const [txData, accData, budgetData, vehicleData, medRecordData, patientData, tccData, logData, medListData, invData, importLogData] = await Promise.all([
                initializeData('transactions', 'finanzas_transactions'),
                initializeData('accounts', 'finanzas_accounts'),
                initializeData('budgets', 'finanzas_budgets'),
                initializeData('vehicles', 'finanzas_vehicles'),
                initializeData('medical_records', 'finanzas_medical_records'),
                initializeData('patients', 'finanzas_patients'),
                initializeData('journal_tcc', 'finanzas_journal_cbt'),
                initializeData('journal_health_log', 'finanzas_journal_health_log'),
                initializeData('medications', 'finanzas_journal_med_list'),
                initializeData('investments', 'finanzas_investments'),
                initializeData('import_logs', 'finanzas_import_logs')
            ])

            setTransactions(txData || [])
            setAccounts(accData || [])

            // Manejar presupuesto (convertir array de filas de Supabase en objeto de periodos)
            let finalBudgets = {}
            if (budgetData && Array.isArray(budgetData)) {
                budgetData.forEach(row => {
                    if (row.month && row.categories) {
                        finalBudgets[row.month] = row.categories
                    }
                })
            } else if (budgetData && !Array.isArray(budgetData)) {
                finalBudgets = budgetData // Fallback para localStorage
            }
            setBudgets(finalBudgets)

            setVehicles(vehicleData || [])
            setMedicalRecords(medRecordData || [])
            setPatients(patientData || [])
            setTccEntries(tccData || [])
            setLogEntries(logData || [])
            setInvestments(invData || [])
            setImportLogs(importLogData || [])

            // Manejar lista de medicamentos
            if (medListData && Array.isArray(medListData) && medListData.length > 0) {
                const meds = medListData[0].medications || medListData
                setMedicationList(Array.isArray(meds) ? meds : [])
            }
        } catch (error) {
            console.error('Error loading global data:', error)
        } finally {
            setLoading(false)
        }
    }

    // ============================================================================
    // FUNCIÓN: handleLogout
    // PROPÓSITO: Cerrar sesión del usuario
    // ============================================================================
    const handleLogout = async () => {
        if (!supabase) return
        if (confirm('¿Cerrar sesión?')) {
            await supabase.auth.signOut()
            setUser(null)
        }
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard transactions={transactions} accounts={accounts} setActiveView={setActiveView} />
            case 'analytics':
                return <CategoryCharts transactions={transactions} />
            case 'budget':
                return (
                    <BudgetModule
                        budgets={budgets || {}}
                        setBudgets={setBudgets}
                        transactions={transactions}
                    />
                )
            case 'accounts':
                return (
                    <Accounts
                        accounts={accounts}
                        setAccounts={setAccounts}
                        setActiveView={setActiveView}
                        setSelectedAccountId={setSelectedAccountId}
                    />
                )
            case 'transactions':
                return (
                    <Transactions
                        transactions={transactions}
                        setTransactions={setTransactions}
                        accounts={accounts}
                        setAccounts={setAccounts}
                        budgets={budgets || {}}
                        selectedAccountId={selectedAccountId}
                        setSelectedAccountId={setSelectedAccountId}
                    />
                )
            case 'vehicles':
                return <Vehicles vehicles={vehicles} setVehicles={setVehicles} />
            case 'medical':
                return (
                    <MedicalHistory
                        records={medicalRecords}
                        setRecords={setMedicalRecords}
                        patients={patients}
                        setPatients={setPatients}
                    />
                )
            case 'journal':
                return (
                    <Journal
                        tccEntries={tccEntries}
                        setTccEntries={setTccEntries}
                        logEntries={logEntries}
                        setLogEntries={setLogEntries}
                        medicationList={medicationList}
                        setMedicationList={setMedicationList}
                    />
                )
            case 'debts':
                return <DebtModule accounts={accounts} setAccounts={setAccounts} transactions={transactions} />
            case 'investments':
                return <InvestmentPortfolio investments={investments} setInvestments={setInvestments} />
            case 'settings':
                return <Settings />
            default:
                return <Dashboard transactions={transactions} accounts={accounts} />
        }
    }

    // ============================================================================
    // RENDERIZADO CONDICIONAL: Loading / Auth / App
    // ============================================================================

    // Mostrar pantalla de carga mientras se verifica la sesión
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50">
                <div className="text-center">
                    <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
                    <p className="text-slate-600 font-bold italic">Cargando NegociosGarcia...</p>
                </div>
            </div>
        )
    }

    // Mostrar pantalla de autenticación si no hay usuario
    if (!user) {
        return <Auth onAuthSuccess={(user) => {
            setUser(user)
            loadGlobalData()
        }} />
    }

    // Mostrar aplicación principal si hay usuario autenticado
    return (
        <SyncNotificationProvider>
            <div className="flex h-screen bg-[#f9fafb] overflow-hidden font-sans">
                {/* Indicador de Sincronización (Fijo en la parte superior derecha) */}
                <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
                    <SyncStatusIndicator />
                </div>
                {/* Mobile Header */}
                <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-emerald-200/60 flex items-center justify-between px-6 z-50">
                    <span className="text-lg font-bold text-[#1e3a5f]" style={{ fontFamily: 'Georgia, serif' }}>
                        NegociosGarcia
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                            title="Cerrar sesión"
                        >
                            <LogOut size={20} />
                        </button>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 text-[#0d8b5f] hover:bg-emerald-50 rounded-lg transition-colors"
                            aria-label="Toggle Menu"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </header>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200/60 z-40 transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                    <Sidebar
                        activeView={activeView}
                        setActiveView={(view) => {
                            setActiveView(view)
                            setIsSidebarOpen(false)
                        }}
                        onLogout={handleLogout}
                        userEmail={user?.email}
                    />
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
                    <div className="max-w-7xl mx-auto p-6 md:p-10">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {renderView()}
                        </div>
                    </div>
                </main>
            </div>
        </SyncNotificationProvider>
    )
}

export default App
