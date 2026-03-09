import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit3, Trash2, FlaskConical, Tag, RefreshCcw, DollarSign, Percent, X } from 'lucide-react';

export default function CatalogModule({ products, recipes, recipeItems, onSaveProduct, onDeleteProduct, onSaveRecipe, onDeleteRecipe }) {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [productModal, setProductModal] = useState(null);

    const filteredProducts = useMemo(() => {
        return [...products]
            .filter(p => filterType === 'all' || p.productType === filterType)
            .filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => a.name?.localeCompare(b.name));
    }, [products, search, filterType]);

    const handleEdit = (p) => {
        setProductModal(p);
    };

    const handleCreate = () => {
        setProductModal({ productType: 'producto_terminado', currentStock: 0, averageCost: 0, basePrice: 0, isNew: true });
    };

    const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-1 flex-col md:flex-row gap-4 w-full">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text" placeholder="Buscar en el catálogo..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="flex bg-slate-50 rounded-2xl p-1 gap-1 border border-slate-100">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Todos</button>
                        <button onClick={() => setFilterType('materia_prima')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'materia_prima' ? 'bg-amber-100 text-amber-700' : 'text-slate-400'}`}>Insumos</button>
                        <button onClick={() => setFilterType('producto_terminado')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'producto_terminado' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>Terminados</button>
                    </div>
                </div>
                <button onClick={handleCreate} className="w-full md:w-auto bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all">
                    <Plus size={16} /> Crear Producto
                </button>
            </div>

            {/* Catalog List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map(p => {
                    const isMP = p.productType === 'materia_prima';
                    const hasRecipe = recipes.some(r => r.productId === p.id);

                    return (
                        <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${isMP ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {isMP ? <FlaskConical size={20} /> : <Package size={20} />}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={15} /></button>
                                        <button onClick={() => { if (confirm('¿Eliminar producto?')) onDeleteProduct(p.id) }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{p.name}</h3>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{p.sku || 'SIN SKU'}</p>
                            </div>

                            <div className="mt-5 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-500">Stock</span>
                                    <span className={`font-black ${(p.currentStock || 0) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{Number(p.currentStock || 0).toFixed(2)} {p.unitOfMeasure}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-500">Costo (WAC)</span>
                                    <span className="font-black text-slate-700">{fmt(p.averageCost)}</span>
                                </div>
                                {!isMP && (
                                    <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2">
                                        <span className="font-semibold text-slate-500">Precio Venta</span>
                                        <span className="font-black text-indigo-600">{fmt(p.basePrice)}</span>
                                    </div>
                                )}
                                {!isMP && hasRecipe && (
                                    <div className="mt-3 bg-violet-50 text-violet-700 text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg flex items-center gap-2 w-fit">
                                        <RefreshCcw size={12} /> Requiere Producción (Con Receta)
                                    </div>
                                )}
                                {!isMP && !hasRecipe && (
                                    <div className="mt-3 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg flex items-center gap-2 w-fit">
                                        <Tag size={12} /> Compra / Reventa
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-[3rem] border border-slate-200 border-dashed">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-black text-lg">No se encontraron productos</p>
                        <p className="text-sm mt-1">Ajusta los filtros o crea uno nuevo.</p>
                    </div>
                )}
            </div>

            {/* Product Modal */}
            {productModal && (
                <ProductEditorModal
                    product={productModal}
                    recipes={recipes}
                    recipeItems={recipeItems}
                    products={products}
                    onClose={() => setProductModal(null)}
                    onSave={(updatedProduct, recipeToSave) => {
                        onSaveProduct(updatedProduct);
                        if (recipeToSave) {
                            onSaveRecipe(recipeToSave);
                        }
                        setProductModal(null);
                    }}
                />
            )}
        </div>
    );
}

// ----------------------------------------------------
// Modal for Creating/Editing Products AND their Recipes
// ----------------------------------------------------
function ProductEditorModal({ product, recipes, recipeItems, products, onClose, onSave }) {
    const isNew = product.isNew;
    const isPT = product.productType === 'producto_terminado';

    const linkedRecipe = isPT ? recipes.find(r => r.productId === product.id) : null;
    const linkedItems = linkedRecipe ? recipeItems.filter(ri => ri.recipeId === linkedRecipe.id) : [];

    const [form, setForm] = useState({
        name: product.name || '',
        sku: product.sku || '',
        productType: product.productType || 'producto_terminado',
        unitOfMeasure: product.unitOfMeasure || (product.productType === 'materia_prima' ? 'ml' : 'und'),
        averageCost: product.averageCost || 0,
        markupPercentage: product.markupPercentage || 30,
        basePrice: product.basePrice || 0,
        minStock: product.minStock || 0,
    });

    const [hasRecipeConfig, setHasRecipeConfig] = useState(!!linkedRecipe);
    const [recipeData, setRecipeData] = useState({
        name: linkedRecipe?.name || `Receta ${product.name || ''}`,
        items: linkedItems.length > 0 ? linkedItems : []
    });

    const rawMaterials = products.filter(p => p.productType === 'materia_prima');

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => {
            const next = { ...prev, [name]: value };
            // Auto recalc price if cost or markup changes (for PT)
            if (next.productType === 'producto_terminado' && (name === 'averageCost' || name === 'markupPercentage')) {
                const cost = Number(next.averageCost) || 0;
                const markup = Number(next.markupPercentage) || 0;
                next.basePrice = (cost * (1 + markup / 100)).toFixed(2);
            }
            return next;
        });
    };

    const addRecipeIngredient = () => {
        setRecipeData(prev => ({
            ...prev,
            items: [...prev.items, { id: crypto.randomUUID(), rawMaterialId: '', quantityRequired: 1, unitOfMeasure: 'ml' }]
        }));
    };

    const updateRecipeItem = (idx, field, val) => {
        setRecipeData(prev => {
            const nextItems = [...prev.items];
            nextItems[idx] = { ...nextItems[idx], [field]: val };
            return { ...prev, items: nextItems };
        });
    };

    const removeRecipeItem = (idx) => {
        setRecipeData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.name) return alert('El nombre es obligatorio');

        const productIdToSave = product.id || crypto.randomUUID();

        const productData = {
            id: productIdToSave,
            name: form.name,
            sku: form.sku || `SKU-${Math.floor(Math.random() * 1000)}`,
            productType: form.productType,
            unitOfMeasure: form.unitOfMeasure,
            averageCost: Number(form.averageCost),
            markupPercentage: Number(form.markupPercentage),
            basePrice: Number(form.basePrice),
            minStock: Number(form.minStock),
            currentStock: Number(product.currentStock || 0), // Presever stock on edit
            status: 'active'
        };

        if (form.productType === 'materia_prima') {
            productData.markupPercentage = 0;
            productData.basePrice = 0;
        }

        let recipeToSave = null;
        if (form.productType === 'producto_terminado' && hasRecipeConfig) {
            if (recipeData.items.length === 0) return alert('La receta debe tener al menos un ingrediente');
            if (recipeData.items.some(i => !i.rawMaterialId)) return alert('Selecciona la materia prima para todos los ingredientes');

            const recipeIdToSave = linkedRecipe?.id || crypto.randomUUID();

            recipeToSave = {
                recipe: {
                    id: recipeIdToSave,
                    productId: productIdToSave,
                    name: recipeData.name || `Receta ${form.name}`,
                    status: 'activo'
                },
                items: recipeData.items.map(i => ({
                    id: i.id || crypto.randomUUID(),
                    recipeId: recipeIdToSave,
                    rawMaterialId: i.rawMaterialId,
                    quantityRequired: Number(i.quantityRequired),
                    unitOfMeasure: i.unitOfMeasure || 'ml'
                }))
            };
        }

        onSave(productData, recipeToSave);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-0 md:p-4 overflow-y-auto">
            <div className="bg-white md:rounded-[3rem] w-full max-w-2xl shadow-2xl relative my-auto">
                <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-6 border-b border-slate-100 flex justify-between items-center z-10 md:rounded-t-[3rem]">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">{isNew ? 'Nuevo Producto' : 'Editar Producto'}</h2>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">Catálogo Maestro</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-8">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-6">

                        {/* Tipo de Producto Selector Row */}
                        {!isNew && (
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                                <Tag size={16} className="text-slate-400" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Producto</p>
                                    <p className="font-bold text-slate-700">{form.productType === 'materia_prima' ? 'Materia Prima / Insumo' : 'Producto Terminado / Reventa'}</p>
                                </div>
                            </div>
                        )}

                        {isNew && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Elemento</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setForm(p => ({ ...p, productType: 'materia_prima', unitOfMeasure: 'ml' }))}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left ${form.productType === 'materia_prima' ? 'border-amber-400 bg-amber-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                        <FlaskConical size={20} className={form.productType === 'materia_prima' ? 'text-amber-600 mb-2' : 'text-slate-400 mb-2'} />
                                        <p className="font-black text-sm text-slate-800">Materia Prima</p>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">Insumos para producción (Ej: Extractos, Envases)</p>
                                    </button>
                                    <button type="button" onClick={() => setForm(p => ({ ...p, productType: 'producto_terminado', unitOfMeasure: 'und' }))}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left ${form.productType === 'producto_terminado' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                                        <Package size={20} className={form.productType === 'producto_terminado' ? 'text-indigo-600 mb-2' : 'text-slate-400 mb-2'} />
                                        <p className="font-black text-sm text-slate-800">Caja / Terminado</p>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">Para venta directa o manufactura final</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre del Producto *</label>
                                <input required name="name" value={form.name} onChange={handleFormChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Ej: Esencia Floral 50ml" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">SKU / Código</label>
                                <input name="sku" value={form.sku} onChange={handleFormChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-100" placeholder="Auto-generado si vacío" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Unidad de Medida</label>
                                <select name="unitOfMeasure" value={form.unitOfMeasure} onChange={handleFormChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-100">
                                    <option value="und">Unidades (und)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                    <option value="gr">Gramos (gr)</option>
                                    <option value="l">Litros (L)</option>
                                    <option value="kg">Kilogramos (kg)</option>
                                </select>
                            </div>
                        </div>

                        {/* Cost & Pricing Strategy */}
                        <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 border border-slate-100">
                            <h4 className="font-black text-slate-700 text-sm flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" /> Costos y Precios</h4>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Costo Promedio (WAC)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <input type="number" step="any" name="averageCost" value={form.averageCost} onChange={handleFormChange} onFocus={(e) => e.target.select()} className="w-full bg-white border border-slate-200 rounded-2xl pl-8 pr-4 py-3 font-black text-slate-700 outline-none" />
                                    </div>
                                </div>
                                {form.productType === 'producto_terminado' && (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Ganancia Sugerida (%)</label>
                                        <div className="relative">
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                            <input type="number" step="any" name="markupPercentage" value={form.markupPercentage} onChange={handleFormChange} onFocus={(e) => e.target.select()} className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-3 font-black text-indigo-700 outline-none" />
                                        </div>
                                    </div>
                                )}
                                {form.productType === 'producto_terminado' && (
                                    <div className="col-span-2 pt-2 border-t border-slate-200/60">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Precio de Venta Final</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-lg">$</span>
                                            <input type="number" step="any" name="basePrice" value={form.basePrice} onChange={handleFormChange} onFocus={(e) => e.target.select()} className="w-full bg-white border-2 border-indigo-100 rounded-2xl pl-9 pr-4 py-3 font-black text-indigo-700 text-lg outline-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recipe Configuration - ONLY FOR PRODUCTO TERMINADO */}
                        {form.productType === 'producto_terminado' && (
                            <div className="border-t border-slate-200 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="font-black text-slate-800 flex items-center gap-2"><FlaskConical size={18} className="text-violet-500" /> Producción Propia</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">¿Tú mismo fabricas este producto?</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={hasRecipeConfig} onChange={() => setHasRecipeConfig(!hasRecipeConfig)} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                    </label>
                                </div>

                                {hasRecipeConfig && (
                                    <div className="bg-violet-50/50 p-5 rounded-3xl border border-violet-100 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-violet-700 uppercase tracking-widest mb-1.5 block">Nombre de Ficha Técnica</label>
                                            <input value={recipeData.name} onChange={(e) => setRecipeData(p => ({ ...p, name: e.target.value }))} className="w-full bg-white border border-violet-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Ingredientes Requeridos</label>
                                                <button type="button" onClick={addRecipeIngredient} className="text-[10px] font-black bg-white border border-violet-200 px-3 py-1.5 rounded-lg text-violet-700 hover:bg-violet-600 hover:text-white transition-colors">
                                                    + Añadir
                                                </button>
                                            </div>
                                            {recipeData.items.length === 0 && (
                                                <p className="text-xs text-slate-400 italic text-center py-3 bg-white/50 rounded-xl border border-dashed border-violet-200">Añade los insumos necesarios para fabricar (1) unidad.</p>
                                            )}
                                            <div className="space-y-2">
                                                {recipeData.items.map((it, idx) => (
                                                    <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-violet-100/50 shadow-sm">
                                                        <select value={it.rawMaterialId} onChange={e => updateRecipeItem(idx, 'rawMaterialId', e.target.value)} className="flex-1 bg-slate-50 border-none text-xs font-semibold py-2 px-2 rounded-lg outline-none">
                                                            <option value="">-- Seleccionar MP --</option>
                                                            {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name} ({rm.unitOfMeasure})</option>)}
                                                        </select>
                                                        <input type="number" step="any" placeholder="Cant" value={it.quantityRequired} onChange={e => updateRecipeItem(idx, 'quantityRequired', e.target.value)} onFocus={(e) => e.target.select()} className="w-20 bg-slate-50 border-none text-xs font-bold py-2 px-2 rounded-lg text-center outline-none" />
                                                        <span className="text-xs text-slate-400 font-bold w-6">{rawMaterials.find(rm => rm.id === it.rawMaterialId)?.unitOfMeasure || 'u'}</span>
                                                        <button type="button" onClick={() => removeRecipeItem(idx)} className="text-rose-300 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 flex gap-3 sticky bottom-0 pb-4 bg-white">
                            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl uppercase text-[11px] tracking-widest transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" form="productForm" className="flex-[2] py-4 bg-[#0f172a] hover:bg-slate-800 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg hover:-translate-y-0.5">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
