// ============================================================================
// COMPONENTE: Sidebar
// PROPÓSITO: Navegación lateral con marca NegociosGarcia
// ============================================================================
import React from 'react'
import { LayoutDashboard, Wallet, CreditCard, Settings, PieChart, Car, Stethoscope, Brain, Landmark, TrendingUp, LogOut, BarChart3, X } from 'lucide-react'
import { BRAND_TEXT } from '../constants/brandColors'

const Sidebar = ({ activeView, setActiveView, onLogout, userEmail, onToggle }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
        { id: 'analytics', label: 'Análisis Mensual', icon: BarChart3 },
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
            {/* Logo y Header */}
            <div className="p-6 pb-4 flex-shrink-0 border-b border-emerald-100/50 relative">
                <div className="flex items-center gap-3">
                    {/* Logo NG con escudo */}
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#0d8b5f] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/20 to-transparent"></div>
                        <span className="text-xl font-bold relative z-10" style={{ fontFamily: 'Georgia, serif' }}>{BRAND_TEXT.initials}</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[#1e3a5f] tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>{BRAND_TEXT.name}</h1>
                        <p className="text-[9px] uppercase tracking-widest text-[#d4af37] font-semibold italic" style={{ fontFamily: 'Georgia, serif' }}>{BRAND_TEXT.tagline}</p>
                    </div>
                </div>
                {/* Botón para colapsar (solo visible en desktop, ya que en mobile hay un header externo) */}
                <button
                    onClick={onToggle}
                    className="hidden lg:flex absolute top-4 right-4 p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Ocultar menú"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`sidebar-link group w-full ${activeView === item.id
                            ? 'bg-gradient-to-r from-[#0d8b5f]/10 to-[#0d8b5f]/5 text-[#0d8b5f] font-semibold border-l-4 border-[#0d8b5f]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#1e3a5f] border-l-4 border-transparent'
                            }`}
                    >
                        <item.icon
                            size={20}
                            className={`transition-colors ${activeView === item.id ? 'text-[#0d8b5f]' : 'text-slate-400 group-hover:text-[#1e3a5f]'}`}
                        />
                        <span className="text-sm">{item.label}</span>
                        {activeView === item.id && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-[#0d8b5f] shadow-sm" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer con usuario y configuración */}
            <div className="p-4 flex-shrink-0 border-t border-emerald-100/50 space-y-2">
                {/* Info de usuario */}
                {userEmail && (
                    <div className="px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Usuario</p>
                        <p className="text-xs font-semibold text-[#1e3a5f] truncate">{userEmail}</p>
                    </div>
                )}

                {/* Botón de configuración */}
                <button
                    onClick={() => setActiveView('settings')}
                    className={`sidebar-link group w-full ${activeView === 'settings'
                        ? 'bg-gradient-to-r from-[#0d8b5f]/10 to-[#0d8b5f]/5 text-[#0d8b5f] font-semibold border-l-4 border-[#0d8b5f]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-[#1e3a5f] border-l-4 border-transparent'
                        }`}
                >
                    <Settings size={20} className={`transition-colors ${activeView === 'settings' ? 'text-[#0d8b5f]' : 'text-slate-400 group-hover:text-[#1e3a5f]'}`} />
                    <span className="text-sm">Configuración</span>
                    {activeView === 'settings' && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-[#0d8b5f] shadow-sm" />
                    )}
                </button>

                {/* Botón de logout (solo desktop) */}
                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="hidden lg:flex sidebar-link group w-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 border-l-4 border-transparent hover:border-rose-500"
                    >
                        <LogOut size={20} className="transition-colors text-slate-400 group-hover:text-rose-600" />
                        <span className="text-sm">Cerrar Sesión</span>
                    </button>
                )}
            </div>
        </div>
    )
}

export default Sidebar
