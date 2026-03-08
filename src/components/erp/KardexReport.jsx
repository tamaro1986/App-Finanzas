import React, { useState, useMemo } from 'react';
import { Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const MOVEMENT_CONFIG = {
    COMPRA: { label: 'Compra', colorText: 'text-blue-700', colorBg: 'bg-blue-100', sign: '+' },
    VENTA: { label: 'Venta', colorText: 'text-emerald-700', colorBg: 'bg-emerald-100', sign: '-' },
    PRODUCCION_ENTRADA: { label: 'Prod. Entrada', colorText: 'text-violet-700', colorBg: 'bg-violet-100', sign: '+' },
    PRODUCCION_SALIDA: { label: 'Prod. Salida', colorText: 'text-amber-700', colorBg: 'bg-amber-100', sign: '-' },
    AJUSTE: { label: 'Ajuste', colorText: 'text-slate-600', colorBg: 'bg-slate-100', sign: '±' },
    DEVOLUCION: { label: 'Devolución', colorText: 'text-rose-700', colorBg: 'bg-rose-100', sign: '+' },
};

const PAGE_SIZE = 20;

export default function KardexReport({ movements, products }) {
    const [searchProd, setSearchProd] = useState('');
    const [filterType, setFilterType] = useState('TODOS');
    const [page, setPage] = useState(0);

    const sorted = useMemo(() =>
        [...movements].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)),
        [movements]);

    const filtered = useMemo(() => sorted.filter(m => {
        const product = products.find(p => p.id === m.productId);
        const matchProd = !searchProd || product?.name?.toLowerCase().includes(searchProd.toLowerCase());
        const matchType = filterType === 'TODOS' || m.movementType === filterType;
        return matchProd && matchType;
    }), [sorted, searchProd, filterType, products]);

    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handleFilter = (type) => { setFilterType(type); setPage(0); };
    const handleSearch = (v) => { setSearchProd(v); setPage(0); };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Controles */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Buscar por producto..." value={searchProd}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['TODOS', ...Object.keys(MOVEMENT_CONFIG)].map(t => (
                        <button key={t} onClick={() => handleFilter(t)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filterType === t ? 'bg-[#1e3a5f] text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            {MOVEMENT_CONFIG[t]?.label || 'Todos'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats de resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(MOVEMENT_CONFIG).map(([type, cfg]) => {
                    const count = movements.filter(m => m.movementType === type).length;
                    return (
                        <div key={type} className={`${cfg.colorBg} p-3 rounded-2xl`}>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${cfg.colorText}`}>{cfg.label}</p>
                            <p className={`text-2xl font-black ${cfg.colorText}`}>{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tabla desktop */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-slate-100 bg-slate-50/50">
                            {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Ant.', 'Stock Nuevo', 'Costo Unit.', 'Referencia'].map(h => (
                                <th key={h} className="px-4 pb-3 pt-4 text-[9px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginated.map(m => {
                            const product = products.find(p => p.id === m.productId);
                            const cfg = MOVEMENT_CONFIG[m.movementType] || MOVEMENT_CONFIG['AJUSTE'];
                            return (
                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-500 font-semibold whitespace-nowrap">{m.date || '—'}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-800 text-xs">{product?.name || '—'}</p>
                                        <p className="text-[9px] text-slate-400 uppercase">{product?.productType === 'materia_prima' ? 'MP' : 'PT'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`${cfg.colorBg} ${cfg.colorText} text-[9px] font-black uppercase px-2 py-1 rounded-lg`}>{cfg.label}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`font-black text-sm ${cfg.colorText}`}>{cfg.sign}{Number(m.quantity || 0).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">{Number(m.stockBefore || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 font-black text-xs text-slate-800">{Number(m.stockAfter || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">${Number(m.unitCost || 0).toFixed(4)}</td>
                                    <td className="px-4 py-3 text-[10px] text-slate-400 truncate max-w-[120px]">{m.referenceType || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {paginated.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Activity size={40} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">Sin movimientos</p>
                    </div>
                )}
            </div>

            {/* Cards mobile */}
            <div className="space-y-3 md:hidden">
                {paginated.map(m => {
                    const product = products.find(p => p.id === m.productId);
                    const cfg = MOVEMENT_CONFIG[m.movementType] || MOVEMENT_CONFIG['AJUSTE'];
                    return (
                        <div key={m.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-black text-slate-800 text-sm">{product?.name || '—'}</p>
                                    <p className="text-xs text-slate-400">{m.date}</p>
                                </div>
                                <span className={`${cfg.colorBg} ${cfg.colorText} text-[9px] font-black uppercase px-2 py-1 rounded-lg`}>{cfg.label}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <p className="text-[8px] uppercase font-black text-slate-400">Cantidad</p>
                                    <p className={`font-black text-sm ${cfg.colorText}`}>{cfg.sign}{Number(m.quantity).toFixed(2)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <p className="text-[8px] uppercase font-black text-slate-400">Ant.</p>
                                    <p className="font-black text-sm text-slate-600">{Number(m.stockBefore).toFixed(2)}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <p className="text-[8px] uppercase font-black text-slate-400">Nuevo</p>
                                    <p className="font-black text-sm text-slate-800">{Number(m.stockAfter).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Paginación */}
            {pages > 1 && (
                <div className="flex justify-center items-center gap-4 py-2">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40">
                        <ChevronLeft size={18} className="text-slate-600" />
                    </button>
                    <span className="text-sm font-black text-slate-600">{page + 1} / {pages}</span>
                    <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
                        className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40">
                        <ChevronRight size={18} className="text-slate-600" />
                    </button>
                </div>
            )}
        </div>
    );
}
