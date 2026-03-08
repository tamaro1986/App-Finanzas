import React, { useState, useMemo } from 'react';
import { Plus, X, Save, FlaskConical, Trash2, ChevronRight, Edit2, Check } from 'lucide-react';

function RecipeModal({ recipe, recipeItems, products, onSave, onClose }) {
    const finishedProducts = products.filter(p => p.productType === 'producto_terminado');
    const rawMaterials = products.filter(p => p.productType === 'materia_prima');

    const existingItems = recipeItems.filter(ri => ri.recipeId === recipe?.id);
    const [items, setItems] = useState(existingItems.map(i => ({ ...i })));
    const [productId, setProductId] = useState(recipe?.productId || '');
    const [name, setName] = useState(recipe?.name || '');

    const addIngredient = () => setItems(prev => [...prev, { id: crypto.randomUUID(), rawMaterialId: '', quantityRequired: 1, unitOfMeasure: 'und', isNew: true }]);
    const updateItem = (idx, field, value) => setItems(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n; });
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleSave = () => {
        if (!productId) return alert('Selecciona el producto terminado');
        if (!name.trim()) return alert('Ingresa un nombre para la receta');
        if (items.length === 0) return alert('Agrega al menos un ingrediente');
        if (items.some(i => !i.rawMaterialId || !i.quantityRequired)) return alert('Completa todos los ingredientes');
        const recipeId = recipe?.id || crypto.randomUUID();
        onSave({
            recipe: { id: recipeId, productId, name, status: 'activo' },
            items: items.map(i => ({ id: i.id || crypto.randomUUID(), recipeId, rawMaterialId: i.rawMaterialId, quantityRequired: Number(i.quantityRequired), unitOfMeasure: i.unitOfMeasure || 'und' }))
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-black text-[#1e3a5f] text-lg flex items-center gap-2"><FlaskConical size={18} /> {recipe ? 'Editar Receta' : 'Nueva Receta'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div>
                        <label className="label-xs">Producto Terminado *</label>
                        <select value={productId} onChange={e => setProductId(e.target.value)} className="input-std">
                            <option value="">-- Seleccionar producto --</option>
                            {finishedProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label-xs">Nombre de la Receta *</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="input-std" placeholder="Ej: Vitamina C 500mg v2" />
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <p className="font-black text-slate-700 text-sm uppercase tracking-wider">Ingredientes</p>
                            <button onClick={addIngredient} className="text-xs font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all">
                                <Plus size={14} /> Agregar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {items.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin ingredientes</p>}
                            {items.map((item, idx) => (
                                <div key={item.id || idx} className="bg-slate-50 p-3 rounded-2xl space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <select value={item.rawMaterialId} onChange={e => updateItem(idx, 'rawMaterialId', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none">
                                            <option value="">-- Materia Prima --</option>
                                            {rawMaterials.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {Number(p.currentStock || 0).toFixed(2)} {p.unitOfMeasure})</option>)}
                                        </select>
                                        <button onClick={() => removeItem(idx)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="label-xs">Cantidad Requerida</label>
                                            <input type="number" step="0.001" min="0.001" value={item.quantityRequired}
                                                onChange={e => updateItem(idx, 'quantityRequired', e.target.value)}
                                                className="w-full border border-slate-200 bg-white rounded-xl px-2 py-1.5 text-xs font-black outline-none" />
                                        </div>
                                        <div>
                                            <label className="label-xs">Unidad</label>
                                            <input value={item.unitOfMeasure} onChange={e => updateItem(idx, 'unitOfMeasure', e.target.value)} className="w-full border border-slate-200 bg-white rounded-xl px-2 py-1.5 text-xs font-black outline-none" placeholder="und" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSave} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all">
                        <Save size={18} /> Guardar Receta
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RecipeManager({ products, recipes, recipeItems, onSaveRecipe, onDeleteRecipe }) {
    const [modal, setModal] = useState(null);

    const recipesWithDetails = useMemo(() =>
        recipes.map(r => {
            const product = products.find(p => p.id === r.productId);
            const items = recipeItems.filter(ri => ri.recipeId === r.id);
            return { ...r, productName: product?.name, items };
        }).sort((a, b) => a.name?.localeCompare(b.name)),
        [recipes, recipeItems, products]);

    const handleSave = (data) => { onSaveRecipe(data); setModal(null); };
    const handleDelete = (id) => { if (confirm('¿Eliminar esta receta?')) onDeleteRecipe(id); };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex justify-end">
                <button onClick={() => setModal('new')} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition-all">
                    <Plus size={16} /> Nueva Receta
                </button>
            </div>

            {recipesWithDetails.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400">
                    <FlaskConical size={44} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold">Sin recetas de producción</p>
                    <p className="text-sm mt-1">Crea una receta para definir cómo fabricar un producto terminado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipesWithDetails.map(recipe => (
                        <div key={recipe.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <FlaskConical size={16} className="text-violet-500" />
                                        <h4 className="font-black text-[#1e3a5f]">{recipe.name}</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">➜ Produce: <span className="font-bold text-slate-600">{recipe.productName}</span></p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setModal(recipe)} className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(recipe.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="border-t border-slate-50 pt-3 space-y-1.5">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Ingredientes</p>
                                {recipe.items.map(item => {
                                    const mp = products.find(p => p.id === item.rawMaterialId);
                                    const hasStock = Number(mp?.currentStock || 0) >= Number(item.quantityRequired || 0);
                                    return (
                                        <div key={item.id} className={`flex justify-between items-center px-3 py-1.5 rounded-xl text-xs ${hasStock ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                            <span className={`font-semibold ${hasStock ? 'text-slate-700' : 'text-rose-700'}`}>{mp?.name || 'Materia Prima'}</span>
                                            <span className={`font-black ${hasStock ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {item.quantityRequired} {item.unitOfMeasure}
                                                {!hasStock && ' ⚠️'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <RecipeModal
                    recipe={modal === 'new' ? null : modal}
                    recipeItems={recipeItems}
                    products={products}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
