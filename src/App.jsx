// ============================================================================
// IMPORTS: Componentes y autenticación
// ============================================================================
import React, { useState, useEffect, Suspense, lazy } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Auth from './components/Auth'
import SyncStatusIndicator from './components/SyncStatusIndicator'
import { SyncNotificationProvider } from './components/SyncNotification'
import { Menu, X, LogOut, Loader } from 'lucide-react'
import { supabase } from './lib/supabase'
import './utils/dataRecovery'

const BudgetModule = lazy(() => import('./components/BudgetModule'))
const Settings = lazy(() => import('./components/Settings'))
const Accounts = lazy(() => import('./components/Accounts'))
const Transactions = lazy(() => import('./components/Transactions'))
const Vehicles = lazy(() => import('./components/Vehicles'))
const MedicalHistory = lazy(() => import('./components/MedicalHistory'))
const Journal = lazy(() => import('./components/Journal'))
const DebtModule = lazy(() => import('./components/DebtModule'))
const InvestmentPortfolio = lazy(() => import('./components/InvestmentPortfolio'))
const BusinessModule = lazy(() => import('./components/BusinessModule'))
const CategoryCharts = lazy(() => import('./components/CategoryCharts'))

// ============================================================================
// COMPONENTE PRINCIPAL: App
// PROPÓSITO: Gestionar autenticación, navegación y ESTADO GLOBAL del sistema
// ============================================================================
function App() {
    const [activeView, setActiveView] = useState('dashboard')
    const [selectedAccountId, setSelectedAccountId] = useState(null)
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024)
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

    // ESTADO MÓDULO DE NEGOCIOS (ERP)
    const [bizProducts, setBizProducts] = useState([])
    const [bizContacts, setBizContacts] = useState([])
    // ERP Extendido
    const [bizSuppliers, setBizSuppliers] = useState([])
    const [bizPurchases, setBizPurchases] = useState([])
    const [bizPurchaseItems, setBizPurchaseItems] = useState([])
    const [bizSales, setBizSales] = useState([])
    const [bizSaleItems, setBizSaleItems] = useState([])
    const [bizRecipes, setBizRecipes] = useState([])
    const [bizRecipeItems, setBizRecipeItems] = useState([])
    const [bizProductionOrders, setBizProductionOrders] = useState([])
    const [bizMovements, setBizMovements] = useState([])

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
                setBizProducts([])
                setBizContacts([])
                setBizTransactions([])
                setBizTransactionItems([])
                setBizSuppliers([])
                setBizPurchases([])
                setBizPurchaseItems([])
                setBizSales([])
                setBizSaleItems([])
                setBizRecipes([])
                setBizRecipeItems([])
                setBizProductionOrders([])
                setBizMovements([])
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const loadGlobalData = async () => {
        try {
            const { initializeData } = await import('./lib/supabaseSync')

            const [txData, accData, budgetData, vehicleData, medRecordData, patientData, tccData, logData, medListData, invData, importLogData, bizProdData,
                bizSuppliersData, bizPurchasesData, bizPurchaseItemsData, bizSalesData, bizSaleItemsData, bizRecipesData, bizRecipeItemsData, bizProdOrdersData, bizMovData] = await Promise.all([
                    initializeData('transactions', 'finanzas_transactions'),
                    initializeData('accounts', 'finanzas_accounts'),
                    initializeData('budgets', 'finanzas_budgets'),
                    initializeData('vehicles', 'finanzas_vehicles'),
                    initializeData('medical_records', 'finanzas_medical_records'),
                    initializeData('patients', 'finanzas_patients'),
                    initializeData('journal_tcc', 'journal_tcc'),
                    initializeData('journal_health_log', 'journal_health_log'),
                    initializeData('journal_med_list', 'journal_med_list'),
                    initializeData('investments', 'finanzas_investments'),
                    initializeData('import_logs', 'finanzas_import_logs'),
                    initializeData('finanzas_business_products', 'finanzas_biz_products'),
                    // ERP Unified tables
                    initializeData('finanzas_biz_suppliers', 'finanzas_biz_suppliers_local'),
                    initializeData('finanzas_biz_purchases', 'finanzas_biz_purchases_local'),
                    initializeData('finanzas_biz_purchase_items', 'finanzas_biz_purchase_items_local'),
                    initializeData('finanzas_biz_sales', 'finanzas_biz_sales_local'),
                    initializeData('finanzas_biz_sale_items', 'finanzas_biz_sale_items_local'),
                    initializeData('finanzas_biz_recipes', 'finanzas_biz_recipes_local'),
                    initializeData('finanzas_biz_recipe_items', 'finanzas_biz_recipe_items_local'),
                    initializeData('finanzas_biz_production_orders', 'finanzas_biz_prod_orders_local'),
                    initializeData('finanzas_biz_inventory_movements', 'finanzas_biz_movements_local'),
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
            setBizProducts(bizProdData || [])
            setBizContacts(bizSuppliersData || []) // Load contacts from unified suppliers table
            setBizSuppliers(bizSuppliersData || [])
            setBizPurchases(bizPurchasesData || [])
            setBizPurchaseItems(bizPurchaseItemsData || [])
            setBizSales(bizSalesData || [])
            setBizSaleItems(bizSaleItemsData || [])
            setBizRecipes(bizRecipesData || [])
            setBizRecipeItems(bizRecipeItemsData || [])
            setBizProductionOrders(bizProdOrdersData || [])
            setBizMovements(bizMovData || [])

            // Manejar lista de medicamentos
            if (medListData && Array.isArray(medListData) && medListData.length > 0) {
                const firstRow = medListData[0]
                // Intentar obtener la lista de 'list' (nuevo), 'medications' (viejo) o usar el array directamente si es legacy
                const meds = firstRow.list || firstRow.medications

                if (Array.isArray(meds)) {
                    setMedicationList(meds)
                } else if (typeof firstRow === 'string') {
                    // Fallback si medListData es directamente un array de strings
                    setMedicationList(medListData)
                }
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
            // Limpiar localStorage antes de salir para evitar fuga de datos entre usuarios
            const appKeys = [
                'finanzas_transactions', 'finanzas_accounts', 'finanzas_budgets',
                'finanzas_vehicles', 'finanzas_medical_records', 'finanzas_patients',
                'journal_tcc', 'journal_health_log', 'journal_med_list',
                'finanzas_investments', 'finanzas_import_logs', 'finanzas_biz_products',
                'finanzas_biz_suppliers_local', 'finanzas_biz_purchases_local',
                'finanzas_biz_purchase_items_local', 'finanzas_biz_recipes_local',
                'finanzas_biz_recipe_items_local', 'finanzas_biz_prod_orders_local',
                'finanzas_biz_movements_local', 'finanzas_biz_contacts'
            ];
            appKeys.forEach(key => localStorage.removeItem(key));

            await supabase.auth.signOut()
            setUser(null)
            window.location.reload() // Recargar para asegurar estado limpio
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
                        accounts={accounts}
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
            case 'business':
                return (
                    <BusinessModule
                        // Main Finance State
                        transactions={transactions}
                        setTransactions={setTransactions}
                        accounts={accounts}
                        setAccounts={setAccounts}
                        // ERP state
                        products={bizProducts}
                        setProducts={setBizProducts}
                        contacts={bizContacts}
                        setContacts={setBizContacts}
                        bizSuppliers={bizSuppliers}
                        setBizSuppliers={setBizSuppliers}
                        bizPurchases={bizPurchases}
                        setBizPurchases={setBizPurchases}
                        bizPurchaseItems={bizPurchaseItems}
                        setBizPurchaseItems={setBizPurchaseItems}
                        bizSales={bizSales}
                        setBizSales={setBizSales}
                        bizSaleItems={bizSaleItems}
                        setBizSaleItems={setBizSaleItems}
                        bizRecipes={bizRecipes}
                        setBizRecipes={setBizRecipes}
                        bizRecipeItems={bizRecipeItems}
                        setBizRecipeItems={setBizRecipeItems}
                        bizProductionOrders={bizProductionOrders}
                        setBizProductionOrders={setBizProductionOrders}
                        bizMovements={bizMovements}
                        setBizMovements={setBizMovements}
                    />
                )
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
                <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-2">
                    <SyncStatusIndicator />
                    {window.location.hostname === 'localhost' && (
                        <div className="bg-emerald-500 text-[#0f172a] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border border-emerald-400/50 pointer-events-auto">
                            Ambiente de Pruebas: Auto-Save Navegador
                        </div>
                    )}
                </div>
                {/* Mobile Header */}
                <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-emerald-200/60 flex items-center justify-between px-6 z-50 transition-all duration-300" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(4rem + env(safe-area-inset-top))' }}>
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
                fixed lg:relative inset-y-0 left-0 bg-[#0f142b] border-r border-[#1b2245] z-50 transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0 overflow-hidden'}
            `}>
                    <Sidebar
                        activeView={activeView}
                        setActiveView={(view) => {
                            setActiveView(view)
                            // Solo ocultar si estamos en móvil (ancho menor a 1024px)
                            if (window.innerWidth < 1024) {
                                setIsSidebarOpen(false)
                            }
                        }}
                        onLogout={handleLogout}
                        userEmail={user?.email}
                        onToggle={toggleSidebar}
                    />
                </aside>

                {/* Botón flotante para abrir sidebar en Desktop (solo visible si está cerrado y es lg+) */}
                {!isSidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex fixed top-6 left-6 z-50 p-3 bg-white shadow-lg border border-emerald-100 text-[#0d8b5f] rounded-2xl hover:bg-emerald-50 transition-all animate-in fade-in zoom-in duration-300"
                        title="Mostrar menú"
                    >
                        <Menu size={24} />
                    </button>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 bg-[#f9fafb]">
                    <div className="max-w-7xl mx-auto p-4 md:p-8">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader className="animate-spin text-emerald-600" size={48} /></div>}>
                                {renderView()}
                            </Suspense>
                        </div>
                    </div>
                </main>
            </div>
        </SyncNotificationProvider>
    )
}

export default App
