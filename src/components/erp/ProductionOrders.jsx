import React, { useState, useMemo } from 'react';
import { Factory, Plus, X, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';

function OrderModal({ recipes, recipeItems, products, onSave, onClose }) {
    const [recipeId, setRecipeId] = useState('');
    const [qty, setQty] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const selectedRecipe = recipes.find(r => r.id === recipeId);
    const selectedItems = recipeItems.filter(ri => ri.recipeId === recipeId);

    const materialCheck = useMemo(() => {
        if (!recipeId || !qty) return [];
        return selectedItems.map(item => {
            const mp = products.find(p => p.id === item.rawMaterialId);
            const needed = Number(item.quantityRequired) * Number(qty);
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
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-black text-[#1e3a5f] text-lg flex items-center gap-2"><Factory size={18} /> Nueva Orden de Producción</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div>
                        <label className="label-xs">Receta *</label>
                        <select value={recipeId} onChange={e => setRecipeId(e.target.value)} className="input-std">
                            <option value="">-- Seleccionar receta --</option>
                            {recipes.map(r => {
                                const p = products.find(x => x.id === r.productId);
                                return <option key={r.id} value={r.id}>{r.name} → {p?.name}</option>;
                            })}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label-xs">Cantidad a Producir *</label>
                            <input type="number" step="0.001" min="0.001" value={qty}
                                onChange={e => setQty(e.target.value)} className="input-std font-black text-center" />
                        </div>
                        <div>
                            <label className="label-xs">Fecha</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-std" />
                        </div>
                    </div>

                    {/* Verificación de Materias Primas */}
                    {materialCheck.length > 0 && (
                        <div className={`p-4 rounded-2xl border ${canProduce ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                            <p className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 ${canProduce ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {canProduce ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                {canProduce ? 'Materias Primas: Suficientes ✓' : 'Materias Primas: Insuficientes ✗'}
                            </p>
                            <div className="space-y-2">
                                {materialCheck.map((m, i) => (
                                    <div key={i} className={`flex justify-between items-center p-2 rounded-xl text-xs ${m.sufficient ? 'bg-emerald-100/60' : 'bg-rose-100/60'}`}>
                                        <span className="font-semibold text-slate-700">{m.mp?.name}</span>
                                        <div className="text-right">
                                            <p className={`font-black ${m.sufficient ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                Necesita: {m.needed.toFixed(2)} {m.unitOfMeasure}
                                            </p>
                                            <p className="text-[10px] text-slate-500">Disponible: {m.available.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label-xs">Notas</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-std resize-none" placeholder="Observaciones de la producción..." />
                    </div>

                    <button onClick={handleSave} disabled={!canProduce && materialCheck.length > 0}
                        className={`w-full font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${canProduce ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                        <Factory size={18} /> {canProduce ? 'Ejecutar Producción' : 'Faltan Materias Primas'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProductionOrders({ products, recipes, recipeItems, productionOrders, onSaveOrder }) {
    const [isOpen, setIsOpen] = useState(false);

    const ordersWithDetails = useMemo(() =>
        [...productionOrders]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20)
            .map(o => {
                const recipe = recipes.find(r => r.id === o.recipeId);
                const product = products.find(p => p.id === o.productId);
                return { ...o, recipeName: recipe?.name, productName: product?.name };
            }),
        [productionOrders, recipes, products]);

    const statusConfig = {
        finalizado: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
        pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock },
        en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700', icon: Factory },
        cancelado: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500', icon: X },
    };

    const handleSave = (orderData, materialCheck, product) => {
        onSaveOrder({ orderData, materialCheck, product });
        setIsOpen(false);
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            <button onClick={() => setIsOpen(true)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white p-5 rounded-3xl flex items-center justify-between transition-all shadow-lg shadow-violet-400/20 group">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform"><Factory size={28} /></div>
                    <div className="text-left">
                        <p className="font-black text-xl">Nueva Orden de Producción</p>
                        <p className="text-violet-100 text-sm opacity-80">Convierte materias primas en productos terminados</p>
                    </div>
                </div>
                <Plus size={24} />
            </button>

            {recipes.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-800">Necesitas crear al menos una Receta antes de producir. Ve al tab "Recetas".</p>
                </div>
            )}

            {/* Historial */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-black text-[#1e3a5f]">Historial de Producción</h3>
                </div>
                {ordersWithDetails.length === 0 ? (
                    <div className="text-center py-10 text-slate-400"><Factory size={36} className="mx-auto mb-2 opacity-40" /><p>Sin órdenes de producción aún</p></div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {ordersWithDetails.map(o => {
                            const cfg = statusConfig[o.status] || statusConfig.pendiente;
                            const Icon = cfg.icon;
                            return (
                                <div key={o.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-violet-100 p-2 rounded-xl"><Factory size={16} className="text-violet-600" /></div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{o.productName}</p>
                                            <p className="text-xs text-slate-400">{o.date} · Receta: {o.recipeName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-violet-700 text-lg">×{o.quantityToProduce}</p>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${cfg.color}`}>{cfg.label}</span>
                                    </div>
                                </div>
                            );
                        })}
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
