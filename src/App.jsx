import React, { useState } from 'react'
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
import { Menu, X } from 'lucide-react'

function App() {
    const [activeView, setActiveView] = useState('dashboard')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

    return (
        <div className="flex h-screen bg-[#f9fafb] overflow-hidden font-sans">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 z-50">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    FinanzasPro
                </span>
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Toggle Menu"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
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
