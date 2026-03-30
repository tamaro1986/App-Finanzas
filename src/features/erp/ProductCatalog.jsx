import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, Filter, Edit3, Trash2, Coins, AlertTriangle, Scale } from 'lucide-react';

export default function ProductCatalog({ products, onSaveProduct, onDeleteProduct }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);

    const rawMaterials = useMemo(() =>
        products.filter(p => p.productType === 'materia_prima' &&
            (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())))
        , [products, searchTerm]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            id: modal?.id || crypto.randomUUID(),
            sku: fd.get('sku'),
            name: fd.get('name'),
            productType: 'materia_prima', // Forced to MP in this tab
            unitOfMeasure: fd.get('unitOfMeasure'),
            currentStock: Number(fd.get('currentStock')) || 0,
            averageCost: Number(fd.get('averageCost')) || 0,
            minStock: Number(fd.get('minStock')) || 0,
            status: 'active'
        };
        onSaveProduct(data);
        setModal(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text" placeholder="Buscar materia prima..."
                        className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setModal({ productType: 'materia_prima', currentStock: 0, averageCost: 0 })}
                    className="w-full md:w-auto bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} /> Nueva Materia Prima
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Materia Prima</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Stock Actual</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Costo Unit. (CPP)</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rawMaterials.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">No se encontraron materias primas</p>
                                    </td>
                                </tr>
                            ) : rawMaterials.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-black text-slate-800">{p.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.sku || 'SIN SKU'} · {p.unitOfMeasure}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${p.currentStock <= (p.minStock || 0) ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {p.currentStock} {p.unitOfMeasure}
                                            </span>
                                            {p.currentStock <= (p.minStock || 0) && (
                                                <span className="text-[9px] font-bold text-rose-400 mt-1 flex items-center gap-0.5">
                                                    <AlertTriangle size={10} /> Stock Bajo
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 font-black text-slate-700">
                                            <Coins size={14} className="text-amber-500" />
                                            ${Number(p.averageCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setModal(p)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all" title="Editar">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => { if (confirm('¿Eliminar materia prima?')) onDeleteProduct(p.id) }} className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-all" title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Materia Prima */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-[#1e3a5f] p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Scale className="text-blue-300" />
                                <h3 className="font-black text-xl tracking-tight">{modal.id ? 'Editar' : 'Nueva'} Materia Prima</h3>
                            </div>
                            <button onClick={() => setModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors font-medium">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="label-xs">Referencia / SKU</label>
                                    <input name="sku" defaultValue={modal.sku} placeholder="Ejem: MP-001" className="input-std" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="label-xs">Unidad de Medida</label>
                                    <select name="unitOfMeasure" defaultValue={modal.unitOfMeasure || 'unidad'} className="input-std">
                                        <option value="unidad">Unidad (und)</option>
                                        <option value="kg">Kilogramo (kg)</option>
                                        <option value="gramo">Gramo (g)</option>
                                        <option value="litro">Litro (L)</option>
                                        <option value="ml">Mililitro (ml)</option>
                                        <option value="m">Metro (m)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="label-xs">Nombre de la Materia Prima</label>
                                <input name="name" defaultValue={modal.name} required placeholder="Nombre descriptivo..." className="input-std !text-lg" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                <div>
                                    <label className="label-xs">Stock Inicial</label>
                                    <input type="number" name="currentStock" defaultValue={modal.currentStock} step="any" className="input-std bg-white" />
                                </div>
                                <div>
                                    <label className="label-xs">Stock Mínimo</label>
                                    <input type="number" name="minStock" defaultValue={modal.minStock || 0} step="any" className="input-std bg-white" />
                                </div>
                                <div>
                                    <label className="label-xs">Costo Inicial</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-blue-500 transition-colors">$</span>
                                        <input type="number" name="averageCost" defaultValue={modal.averageCost} step="any" className="input-std pl-10 bg-white" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all text-sm uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-[#1e3a5f] text-white rounded-2xl font-black shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm uppercase">Guardar Materia Prima</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
