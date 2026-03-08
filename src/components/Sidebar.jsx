// ============================================================================
// COMPONENTE: Sidebar
// PROPÓSITO: Navegación lateral con marca GarFinanzas / García Integrum
// ============================================================================
import React from 'react'
import { LayoutDashboard, Wallet, CreditCard, Settings, PieChart, Car, Stethoscope, Brain, Landmark, TrendingUp, LogOut, BarChart3, X, Briefcase, ChevronsLeft, HelpCircle } from 'lucide-react'
import { BRAND_TEXT, BRAND_COLORS } from '../constants/brandColors'
import logoGarcia from '../assets/logo-garcia.png'
import mascotImage from '../assets/mascot.png'

const Sidebar = ({ activeView, setActiveView, onLogout, userEmail, onToggle }) => {
    // Mantendré los ítems funcionales actuales, pero con el diseño del nuevo menú
    const menuItems = [
        { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
        { id: 'business', label: 'Mi Negocio', icon: Briefcase },
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
        <div className="flex flex-col h-full bg-[#0f142b] border-r border-[#1b2245] relative overflow-hidden">
            {/* Imagen de Mascota de Fondo (Leon) */}
            <div className="absolute bottom-[-5%] right-[-10%] w-64 h-64 opacity-20 pointer-events-none mix-blend-lighten overflow-hidden z-0">
                <img src={mascotImage} alt="Mascota" className="w-full h-full object-contain grayscale brightness-150 rotate-12" />
            </div>

            {/* Logo y Header */}
            <div className="p-6 pb-4 flex-shrink-0 border-b border-[#1b2245] relative z-10">
                <div className="flex items-center gap-3">
                    {/* Contenedor del Logo Blanco */}
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl p-2 shrink-0">
                        <img src={logoGarcia} alt="GarFinanzas Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="overflow-hidden">
                        <h1 className="text-xl font-black text-white tracking-tight leading-tight font-sans">GarFinanzas</h1>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-[#00c760] font-black mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>{BRAND_TEXT.tagline}</p>
                    </div>
                </div>
                {/* Botón para colapsar (mobile) */}
                <button
                    onClick={onToggle}
                    className="lg:hidden absolute top-6 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-[#1b2245] rounded-lg transition-all"
                    title="Ocultar menú"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar relative z-10">
                <p className="px-3 text-[10px] font-black tracking-[0.2em] text-[#425287] uppercase mb-4">Menú Principal</p>

                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`sidebar-link group w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 ${activeView === item.id
                            ? 'bg-[#1b2245] text-white font-bold shadow-inner'
                            : 'text-[#6b7a99] hover:bg-[#151b36] hover:text-white font-medium'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon
                                size={18}
                                strokeWidth={activeView === item.id ? 2.5 : 2}
                                className={`transition-colors ${activeView === item.id ? 'text-white' : 'text-[#425287] group-hover:text-[#6b7a99]'}`}
                            />
                            <span className="text-sm">{item.label}</span>
                        </div>
                        {activeView === item.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer con Ayuda y Configuración */}
            <div className="p-4 flex-shrink-0 mt-auto space-y-3 relative z-10">

                {/* Caja de Soporte Técnico */}
                <div className="p-4 bg-[#151b36] rounded-2xl border border-[#1b2245]">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-[#6b7a99] mb-2 flex items-center gap-1.5">
                        Soporte Técnico
                    </h4>
                    <p className="text-xs text-[#8ca3c7] leading-relaxed">
                        ¿Necesitas ayuda? Contacta con IT.
                    </p>
                </div>

                <div className="space-y-1">
                    {/* Botón de configuración */}
                    <button
                        onClick={() => setActiveView('settings')}
                        className={`sidebar-link group w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 ${activeView === 'settings'
                            ? 'bg-[#1b2245] text-white font-bold'
                            : 'text-[#6b7a99] hover:bg-[#151b36] hover:text-white font-medium'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Settings size={18} className={`transition-colors ${activeView === 'settings' ? 'text-white' : 'text-[#425287] group-hover:text-[#6b7a99]'}`} />
                            <span className="text-sm">Configuración</span>
                        </div>
                        {activeView === 'settings' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        )}
                    </button>

                    {/* Info de usuario y Logout integrado */}
                    {userEmail && (
                        <div className="px-3 py-3 mt-2 rounded-xl bg-[#151b36]/50 border border-[#1b2245]/30 flex items-center justify-between group/user">
                            <div className="overflow-hidden mr-2">
                                <p className="text-[9px] uppercase tracking-widest text-[#425287] font-bold mb-0.5">Sesión Activa</p>
                                <p className="text-[11px] font-medium text-[#c6d4e9] truncate" title={userEmail}>{userEmail}</p>
                            </div>
                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    title="Cerrar Sesión"
                                    className="p-1.5 text-[#425287] hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-lg transition-all"
                                >
                                    <LogOut size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Botón Colapsar Panel Solo */}
                <div className="pt-3 border-t border-[#1b2245] flex items-center justify-between px-2">
                    <button
                        onClick={onToggle}
                        className="flex items-center gap-2 px-1 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#6b7a99] hover:text-white transition-colors"
                    >
                        <ChevronsLeft size={16} />
                        <span>Colapsar Panel</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
