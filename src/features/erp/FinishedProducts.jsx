import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search, Plus, Edit3, Trash2, TrendingUp, DollarSign, Percent, BarChart3, PackageCheck } from 'lucide-react';

export default function FinishedProducts({ products, onSaveProduct, onDeleteProduct }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);

    const finishedGoods = useMemo(() =>
        products.filter(p => p.productType === 'producto_terminado' &&
            (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())))
        , [products, searchTerm]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const cost = Number(fd.get('averageCost')) || 0;
        const markup = Number(fd.get('markupPercentage')) || 0;
        const salesPrice = cost * (1 + (markup / 100));

        const data = {
            id: modal?.id || crypto.randomUUID(),
            sku: fd.get('sku'),
            name: fd.get('name'),
            productType: 'producto_terminado',
            unitOfMeasure: 'und',
            currentStock: Number(fd.get('currentStock')) || 0,
            averageCost: cost,
            markupPercentage: markup,
            basePrice: Number(salesPrice.toFixed(2)),
            status: 'active'
        };
        onSaveProduct(data);
        setModal(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100/70 text-[10px] font-black uppercase tracking-widest mb-1">Stock Vendible</p>
                            <h4 className="text-3xl font-black">{finishedGoods.reduce((acc, p) => acc + (p.currentStock || 0), 0)} <span className="text-sm font-medium opacity-60">und</span></h4>
                        </div>
                        <ShoppingBag className="text-white/20" size={28} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Margen Promedio</p>
                            <h4 className="text-3xl font-black text-slate-800">
                                {finishedGoods.length > 0 ? (finishedGoods.reduce((acc, p) => acc + (p.markupPercentage || 0), 0) / finishedGoods.length).toFixed(1) : 0}%
                            </h4>
                        </div>
                        <TrendingUp className="text-emerald-500" size={28} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Valor en Vitrina</p>
                            <h4 className="text-3xl font-black text-slate-800">
                                ${finishedGoods.reduce((acc, p) => acc + (p.currentStock * (p.basePrice || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </h4>
                        </div>
                        <BarChart3 className="text-indigo-500" size={28} />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text" placeholder="Buscar producto terminado..."
                        className="input-std pl-11 !bg-slate-50 border-none"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setModal({ productType: 'producto_terminado', currentStock: 0, averageCost: 0, markupPercentage: 30 })}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} /> Nuevo Producto Terminado
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="px-8 py-5">Producto / SKU</th>
                                <th className="px-8 py-5 text-center">Stock</th>
                                <th className="px-8 py-5 text-right">Costo (WAC)</th>
                                <th className="px-8 py-5 text-right">Ganancia</th>
                                <th className="px-8 py-5 text-right">Precio Venta</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {finishedGoods.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center text-slate-400">
                                        <PackageCheck size={64} className="mx-auto mb-4 opacity-10" />
                                        <p className="font-black text-lg">No hay productos terminados</p>
                                    </td>
                                </tr>
                            ) : finishedGoods.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="font-black text-slate-800 text-base">{p.name}</div>
                                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{p.sku || 'N/A'}</div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`font-black px-3 py-1 rounded-full text-[11px] ${p.currentStock > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {p.currentStock || 0} und
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right font-bold text-slate-500 underline decoration-slate-200 underline-offset-4">${Number(p.averageCost || 0).toFixed(2)}</td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-xs">+{p.markupPercentage || 0}%</span>
                                            <span className="text-[9px] font-bold text-slate-300 mt-1 uppercase">Sobre Costo</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="font-black text-indigo-600 text-xl tracking-tight">${Number(p.basePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => setModal(p)} className="p-2.5 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all"><Edit3 size={18} /></button>
                                            <button onClick={() => { if (confirm('¿Eliminar producto?')) onDeleteProduct(p.id) }} className="p-2.5 hover:bg-rose-50 text-rose-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - FIXED SIGNS */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-indigo-600 p-8 text-white">
                            <h3 className="text-2xl font-black tracking-tight">{modal.id ? 'Gestionar Producto' : 'Nuevo Producto Terminado'}</h3>
                            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Estrategia de Ganancias</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="label-xs">Referencia (SKU)</label>
                                    <input name="sku" defaultValue={modal.sku} className="input-std" placeholder="PT-001" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-xs">Nombre Comercial</label>
                                    <input name="name" defaultValue={modal.name} required className="input-std" placeholder="Nombre del perfume..." />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-5">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <TrendingUp size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Configuración de Precios</span>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-1.5 text-xs font-black text-slate-600">
                                            <DollarSign size={14} className="text-indigo-500" /> Costo Unitario
                                        </label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 font-black group-focus-within:text-indigo-400 transition-colors">$</span>
                                            <input type="number" name="averageCost" step="any" required
                                                defaultValue={modal.averageCost}
                                                className="input-std pl-10 bg-white shadow-sm border-slate-200" placeholder="0.00" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-1.5 text-xs font-black text-slate-600">
                                            <Percent size={14} className="text-emerald-500" /> Margen de Ganancia
                                        </label>
                                        <div className="relative group">
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black group-focus-within:text-emerald-400 transition-colors">%</span>
                                            <input type="number" name="markupPercentage" step="any" required
                                                defaultValue={modal.markupPercentage}
                                                className="input-std pr-10 bg-white shadow-sm border-slate-200" placeholder="30" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center font-bold px-4 italic leading-relaxed">
                                    * El precio de venta se ajustará automáticamente al guardar combinando el costo y tu margen.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-900/20 transition-all hover:-translate-y-1 uppercase text-xs tracking-[0.1em]">
                                    Guardar Producto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
