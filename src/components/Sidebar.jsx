import React from 'react'
import { LayoutDashboard, Wallet, CreditCard, Settings, PieChart, Car, Stethoscope, Brain, Landmark, TrendingUp } from 'lucide-react'

const Sidebar = ({ activeView, setActiveView }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
        { id: 'budget', label: 'Presupuesto', icon: PieChart },
        { id: 'accounts', label: 'Mis Cuentas', icon: Wallet },
        { id: 'transactions', label: 'Movimientos', icon: CreditCard },
        { id: 'debts', label: 'Deudas', icon: Landmark },
        { id: 'investments', label: 'Inversiones', icon: TrendingUp },
        { id: 'vehicles', label: 'Mis Vehículos', icon: Car },
        { id: 'medical', label: 'Salud', icon: Stethoscope },
        { id: 'journal', label: 'Pensamientos', icon: Brain },
    ]

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-6 pb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">FinanzasPro</h1>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Smart Wealth</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`sidebar-link group w-full ${activeView === item.id
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <item.icon
                            size={20}
                            className={`transition-colors ${activeView === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                        />
                        <span className="text-sm">{item.label}</span>
                        {activeView === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm" />
                        )}
                    </button>
                ))}
            </nav>

            <div className="p-4 flex-shrink-0 border-t border-slate-100/80">
                <button
                    onClick={() => setActiveView('settings')}
                    className={`sidebar-link group w-full ${activeView === 'settings' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                    <Settings size={20} className={`transition-colors ${activeView === 'settings' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="text-sm">Configuración</span>
                    {activeView === 'settings' && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm" />
                    )}
                </button>
            </div>
        </div>
    )
}

export default Sidebar
