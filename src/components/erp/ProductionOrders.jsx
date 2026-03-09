import React, { useState, useMemo } from 'react';
import { Factory, Plus, X, AlertTriangle, CheckCircle, Clock, ChevronRight, Trash2, Calendar, ClipboardList } from 'lucide-react';

function OrderModal({ recipes, recipeItems, products, onSave, onClose }) {
    const [recipeId, setRecipeId] = useState('');
    const [qty, setQty] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const selectedRecipe = recipes.find(r => r.id === recipeId);
    const selectedItems = recipeItems.filter(ri => (ri.recipeId === recipeId || ri.recipe_id === recipeId));

    const materialCheck = useMemo(() => {
        if (!recipeId || !qty) return [];
        return selectedItems.map(item => {
            const rawId = item.rawMaterialId || item.raw_material_id;
            const mp = products.find(p => p.id === rawId);
            const reqQty = Number(item.quantityRequired || item.quantity_required || 0);
            const needed = reqQty * Number(qty);
            const available = Number(mp?.currentStock || 0);
            return { ...item, mp, needed, available, sufficient: available >= needed };
        });
    }, [recipeId, qty, selectedItems, products]);

    const canProduce = materialCheck.length > 0 && materialCheck.every(m => m.sufficient);

    const handleSave = () => {
        if (!recipeId) return alert('Selecciona una receta');
        if (!qty || Number(qty) <= 0) return alert('Cantidad inválida');
        if (!canProduce) return alert('No hay suficientes materias primas. Revisa los requerimientos.');
        const product = products.find(p => p.id === selectedRecipe?.productId);
        onSave({
            id: crypto.randomUUID(),
            recipeId,
            productId: selectedRecipe?.productId,
            quantityToProduce: Number(qty),
            status: 'finalizado',
            date,
            notes,
        }, materialCheck, product);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-violet-100 p-2 rounded-xl text-violet-600"><Factory size={22} /></div>
                        <h3 className="font-black text-[#1e3a5f] text-xl tracking-tight">Nueva Orden de Producción</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
                    <div className="space-y-1.5">
                        <label className="label-xs font-black text-slate-400 uppercase tracking-widest">Receta Maestra *</label>
                        <select value={recipeId} onChange={e => setRecipeId(e.target.value)} className="input-std !bg-slate-50 border-none font-bold">
                            <option value="">-- Seleccionar receta --</option>
                            {recipes.map(r => {
                                const p = products.find(x => x.id === r.productId);
                                return <option key={r.id} value={r.id}>{r.name} ➡️ {p?.name}</option>;
                            })}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label-xs font-black text-slate-400 uppercase">Cantidad a Fabricar *</label>
                            <input type="number" step="any" min="0.001" value={qty}
                                onChange={e => setQty(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="input-std !bg-slate-50 border-none font-black text-center text-lg text-violet-600" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label-xs font-black text-slate-400 uppercase">Fecha Producción</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-std !bg-slate-50 border-none font-bold" />
                        </div>
                    </div>

                    {/* Verificación de Materias Primas */}
                    {recipeId && selectedItems.length === 0 && (
                        <div className="p-5 rounded-3xl border bg-amber-50 border-amber-200">
                            <p className="text-[11px] font-black uppercase text-amber-700 flex items-center gap-2">
                                <AlertTriangle size={16} /> Recipe sin ingredientes
                            </p>
                            <p className="text-[10px] text-amber-600 font-bold mt-1">Esta receta no tiene insumos configurados. Ve a Catálogo para editarlos.</p>
                        </div>
                    )}

                    {materialCheck.length > 0 && (
                        <div className={`p-5 rounded-3xl border ${canProduce ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50 border-rose-100 shadow-lg shadow-rose-200/50'}`}>
                            <p className={`text-[11px] font-black uppercase tracking-[0.1em] mb-4 flex items-center gap-2 ${canProduce ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {canProduce ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                {canProduce ? 'Disponibilidad de Insumos: OK' : 'Alerta: Faltan Materias Primas'}
                            </p>
                            <div className="space-y-2">
                                {materialCheck.map((m, i) => (
                                    <div key={i} className={`flex justify-between items-center p-3 rounded-2xl text-xs border transition-all ${m.sufficient ? 'bg-white border-emerald-200/60' : 'bg-white border-rose-300 shadow-sm'}`}>
                                        <span className="font-black text-slate-700">{m.mp?.name}</span>
                                        <div className="text-right">
                                            <p className={`font-black ${m.sufficient ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                Req: {Number(m.needed).toFixed(2)} {m.mp?.unitOfMeasure}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold italic">Stock: {Number(m.available).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="label-xs font-black text-slate-400 uppercase">Notas de Producción</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-std !bg-slate-50 border-none font-bold resize-none" placeholder="Lote, condiciones, etc..." />
                    </div>

                    <div className="pt-2">
                        <button onClick={handleSave} disabled={!canProduce}
                            className={`w-full font-black py-4 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl ${canProduce ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-900/20 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}>
                            <Factory size={22} /> {canProduce ? 'Ejecutar Producción' : 'Revisar Inventarios'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductionOrders({ products, recipes, recipeItems, productionOrders, onSaveOrder, onDeleteOrder }) {
    const [isOpen, setIsOpen] = useState(false);

    const ordersWithDetails = useMemo(() =>
        [...productionOrders]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(o => {
                const recipe = recipes.find(r => r.id === o.recipeId);
                const product = products.find(p => p.id === o.productId);
                return { ...o, recipeName: recipe?.name, productName: product?.name };
            }),
        [productionOrders, recipes, products]);

    const statusConfig = {
        finalizado: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
        pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
        en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Factory },
        cancelado: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: X },
    };

    const handleSave = (orderData, materialCheck, product) => {
        onSaveOrder({ orderData, materialCheck, product });
        setIsOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* CTA Button */}
            <button onClick={() => setIsOpen(true)}
                className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white p-6 rounded-[2.5rem] flex items-center justify-between transition-all shadow-xl shadow-slate-900/20 group border-b-4 border-slate-900">
                <div className="flex items-center gap-5">
                    <div className="bg-violet-500 p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/30"><Factory size={32} /></div>
                    <div className="text-left">
                        <p className="font-black text-2xl tracking-tight tracking-wider uppercase">Nueva Orden Industrial</p>
                        <p className="text-slate-400 text-sm font-medium opacity-90 italic">Transformación automática de materia prima en producto terminado.</p>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-full"><Plus size={32} /></div>
            </button>

            {recipes.length === 0 && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm animate-pulse">
                    <div className="bg-amber-500 p-3 rounded-2xl text-white"><AlertTriangle size={24} /></div>
                    <div>
                        <p className="font-black text-amber-900 text-sm uppercase mb-0.5">Faltan Recetas</p>
                        <p className="text-amber-700 text-xs font-bold leading-relaxed">Debes definir el "Cómo se hace" antes de producir. <span className="underline cursor-pointer">Crea una receta ahora.</span></p>
                    </div>
                </div>
            )}

            {/* History Card */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <h3 className="font-black text-[#1e3a5f] uppercase tracking-widest text-xs flex items-center gap-2">
                        <ClipboardList size={18} className="text-violet-500" /> Registro de Actividad Industrial
                    </h3>
                    <span className="bg-white border-2 border-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase">{ordersWithDetails.length} Órdenes</span>
                </div>

                {ordersWithDetails.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/10">
                        <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                            <Factory size={40} className="text-slate-300" />
                        </div>
                        <p className="font-black text-slate-400 uppercase text-xs tracking-[0.2em]">Bandeja de Producción Vacía</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-5">Fecha / Lote</th>
                                    <th className="px-8 py-5">Producto / Receta</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                    <th className="px-8 py-5 text-right">Cantidad</th>
                                    <th className="px-8 py-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ordersWithDetails.map(o => {
                                    const cfg = statusConfig[o.status] || statusConfig.pendiente;
                                    const Icon = cfg.icon;
                                    return (
                                        <tr key={o.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-violet-50 p-2 rounded-xl text-violet-400"><Calendar size={14} /></div>
                                                    <span className="font-black text-slate-600 text-sm whitespace-nowrap">{new Date(o.date).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="font-black text-slate-800 text-sm leading-tight">{o.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold italic mt-0.5">Receta: {o.recipeName}</p>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 ${cfg.color}`}>
                                                    <Icon size={12} /> {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <p className="font-black text-violet-700 text-lg leading-none tracking-tighter">×{o.quantityToProduce}</p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase mt-0.5">Unidades</p>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => { if (confirm('¿Anular esta orden de producción? Las materias primas serán reintegradas y el producto terminado será descontado.')) onDeleteOrder(o.id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                                                    title="Anular Proceso">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isOpen && (
                <OrderModal
                    recipes={recipes}
                    recipeItems={recipeItems}
                    products={products}
                    onSave={handleSave}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
