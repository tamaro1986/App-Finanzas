import React, { useMemo } from 'react';
import { TrendingUp, Package, DollarSign, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, ShoppingCart, Factory } from 'lucide-react';

function KPICard({ title, value, subtitle, icon: Icon, color, bg }) {
    return (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`${bg} p-3 rounded-2xl shrink-0`}>
                <Icon className={color} size={24} />
            </div>
            <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <p className="text-2xl font-black text-[#1e3a5f]">{value}</p>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

export default function DashboardERP({ products, purchases, purchaseItems, productions, movements, contacts, sales = [] }) {
    const fmt = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const kpis = useMemo(() => {
        const inventoryValue = products.reduce((sum, p) => sum + (Number(p.currentStock || 0) * Number(p.averageCost || 0)), 0);
        const totalPurchased = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
        const totalSalesValue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
        const activeProductions = productions.filter(p => p.status === 'pendiente' || p.status === 'en_proceso').length;
        const lowStockProducts = products.filter(p => Number(p.currentStock) <= Number(p.minStock || 0));
        return { inventoryValue, totalPurchased, totalSalesValue, activeProductions, lowStockProducts };
    }, [products, purchases, movements, productions, sales]);

    const recentMovements = useMemo(() => [...movements]
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 8), [movements]);

    const movementConfig = {
        COMPRA: { label: 'Compra', color: 'text-blue-600', bg: 'bg-blue-50', icon: ShoppingCart, sign: '+' },
        VENTA: { label: 'Venta', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ArrowUpRight, sign: '-' },
        PRODUCCION_ENTRADA: { label: 'Prod. Entrada', color: 'text-violet-600', bg: 'bg-violet-50', icon: Factory, sign: '+' },
        PRODUCCION_SALIDA: { label: 'Prod. Salida', color: 'text-amber-600', bg: 'bg-amber-50', icon: Factory, sign: '-' },
        AJUSTE: { label: 'Ajuste', color: 'text-slate-600', bg: 'bg-slate-50', icon: Activity, sign: '±' },
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Valor Inventario" value={fmt(kpis.inventoryValue)} icon={Package} color="text-blue-600" bg="bg-blue-100" />
                <KPICard title="Total Comprado" value={fmt(kpis.totalPurchased)} icon={ShoppingCart} color="text-amber-600" bg="bg-amber-100" />
                <KPICard title="Total Ventas" value={fmt(kpis.totalSalesValue)} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-100" />
                <KPICard title="Bajo Stock" value={kpis.lowStockProducts.length} subtitle="Productos con alerta" icon={AlertTriangle} color="text-rose-600" bg="bg-rose-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alertas de Stock Bajo */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-black text-[#1e3a5f] mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-rose-500" /> Alertas de Inventario
                    </h3>
                    <div className="space-y-2">
                        {kpis.lowStockProducts.length === 0 ? (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl">
                                <Activity size={18} className="text-emerald-500" />
                                <span className="text-emerald-700 font-semibold text-sm">Todo en niveles óptimos ✓</span>
                            </div>
                        ) : kpis.lowStockProducts.map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 bg-rose-50 border border-rose-100 rounded-2xl">
                                <div>
                                    <p className="font-bold text-rose-900 text-sm">{p.name}</p>
                                    <p className="text-[10px] font-semibold uppercase text-rose-500">{p.productType === 'materia_prima' ? 'Materia Prima' : 'Prod. Terminado'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-rose-700">{p.currentStock} <span className="text-[10px] uppercase">{p.unitOfMeasure || 'und'}</span></p>
                                    <p className="text-[10px] text-rose-400">Mín: {p.minStock || 0}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Últimos Movimientos */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-black text-[#1e3a5f] mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500" /> Últimos Movimientos
                    </h3>
                    <div className="space-y-2">
                        {recentMovements.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-4">Sin movimientos aún</p>
                        ) : recentMovements.map(m => {
                            const product = products.find(p => p.id === m.productId);
                            const cfg = movementConfig[m.movementType] || movementConfig['AJUSTE'];
                            const Icon = cfg.icon;
                            return (
                                <div key={m.id} className={`flex items-center justify-between p-3 ${cfg.bg} rounded-2xl`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 bg-white rounded-xl ${cfg.color}`}><Icon size={14} /></div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-xs">{product?.name || 'Producto'}</p>
                                            <p className={`text-[10px] font-black uppercase ${cfg.color}`}>{cfg.label}</p>
                                        </div>
                                    </div>
                                    <span className={`font-black text-sm ${cfg.color}`}>{cfg.sign}{Number(m.quantity || 0).toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
