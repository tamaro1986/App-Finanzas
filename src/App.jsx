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
import { Menu, X, LogOut, Loader } from 'lucide-react'
import { supabase } from './lib/supabase'

// ============================================================================
// COMPONENTE PRINCIPAL: App
// PROPÓSITO: Gestionar autenticación y navegación
// ============================================================================
function App() {
    const [activeView, setActiveView] = useState('dashboard')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    // Estado de autenticación
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // ============================================================================
    // EFFECT: Verificar sesión al cargar la app
    // ============================================================================
    useEffect(() => {
        // Verificar si hay una sesión activa
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Escuchar cambios en la autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    // ============================================================================
    // FUNCIÓN: handleLogout
    // PROPÓSITO: Cerrar sesión del usuario
    // ============================================================================
    const handleLogout = async () => {
        if (confirm('¿Cerrar sesión?')) {
            await supabase.auth.signOut()
            setUser(null)
        }
    }

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <Dashboard />
            case 'budget':
                return <BudgetModule />
            case 'accounts':
                return <Accounts />
            case 'transactions':
                return <Transactions />
            case 'vehicles':
                return <Vehicles />
            case 'medical':
                return <MedicalHistory />
            case 'journal':
                return <Journal />
            case 'debts':
                return <DebtModule />
            case 'investments':
                return <InvestmentPortfolio />
            case 'settings':
                return <Settings />
            default:
                return <Dashboard />
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
                    <p className="text-slate-600 font-bold">Cargando...</p>
                </div>
            </div>
        )
    }

    // Mostrar pantalla de autenticación si no hay usuario
    if (!user) {
        return <Auth onAuthSuccess={(user) => setUser(user)} />
    }

    // Mostrar aplicación principal si hay usuario autenticado
    return (
        <div className="flex h-screen bg-[#f9fafb] overflow-hidden font-sans">
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
    )
}

export default App
