import React, { useState, useMemo } from 'react';
import {
    FlaskConical, ShoppingBag, ShoppingCart,
    Plus, Search, Edit3, Trash2, Save, Trash,
    DollarSign, Percent, Calculator, Package,
    TrendingUp, AlertTriangle, Coins, Calendar,
    Tag, User, BarChart3, CheckCircle2, X, Scale, Camera
} from 'lucide-react';

// ────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────
const fmt = (n, d = 2) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d });
const UNITS = ['unidad', 'kg', 'gramo', 'litro', 'ml', 'metro', 'caja', 'botella'];

// ────────────────────────────────────────────────
//  SECCIÓN 1 — INSUMOS (Materias Primas)
// ────────────────────────────────────────────────
function InsumosSection({ products, onSave, onDelete }) {
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);

    const items = useMemo(() =>
        products
            .filter(p => p.productType === 'materia_prima')
            .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => a.name?.localeCompare(b.name))
        , [products, search]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        onSave({
            id: modal?.id || crypto.randomUUID(),
            sku: fd.get('sku'),
            name: fd.get('name'),
            productType: 'materia_prima',
            unitOfMeasure: fd.get('unitOfMeasure'),
            currentStock: Number(fd.get('currentStock')) || 0,
            averageCost: Number(fd.get('averageCost')) || 0,
            minStock: Number(fd.get('minStock')) || 0,
            status: 'active'
        });
        setModal(null);
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" placeholder="Buscar insumo…" value={search} onChange={e => setSearch(e.target.value)}
                        className="input-std pl-10 !bg-slate-50 border-none" />
                </div>
                <button onClick={() => setModal({ productType: 'materia_prima', currentStock: 0, averageCost: 0, minStock: 0 })}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5">
                    <Plus size={16} /> Nuevo Insumo
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-amber-50/60 border-b border-amber-50 text-[10px] font-black uppercase text-amber-700/60 tracking-widest">
                            <th className="px-7 py-4">Materia Prima / SKU</th>
                            <th className="px-7 py-4 text-center">Stock</th>
                            <th className="px-7 py-4 text-right">Costo CPP</th>
                            <th className="px-7 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.length === 0 ? (
                            <tr><td colSpan="4" className="py-16 text-center text-slate-300">
                                <FlaskConical size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-black text-sm uppercase tracking-widest">Sin insumos registrados</p>
                                <p className="text-xs mt-1">Agrega materias primas para comenzar</p>
                            </td></tr>
                        ) : items.map(p => {
                            const low = p.currentStock <= (p.minStock || 0);
                            return (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-7 py-4">
                                        <div className="font-black text-slate-800">{p.name}</div>
                                        <div className="text-[10px] text-amber-500 font-black uppercase tracking-wider">{p.sku || '—'} · {p.unitOfMeasure}</div>
                                    </td>
                                    <td className="px-7 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${low ? 'bg-rose-100 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>
                                            {fmt(p.currentStock, 0)} {p.unitOfMeasure}
                                        </span>
                                        {low && <div className="text-[9px] text-rose-400 font-bold mt-0.5 flex items-center justify-center gap-1"><AlertTriangle size={9} />Stock bajo</div>}
                                    </td>
                                    <td className="px-7 py-4 text-right font-black text-slate-700 flex items-center justify-end gap-1.5">
                                        <Coins size={13} className="text-amber-500" />${fmt(p.averageCost, 4)}
                                    </td>
                                    <td className="px-7 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => setModal(p)} className="p-2 hover:bg-amber-50 text-amber-600 rounded-xl transition-all"><Edit3 size={15} /></button>
                                            <button onClick={() => { if (confirm('¿Eliminar?')) onDelete(p.id) }} className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-all"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-amber-500 p-7 text-white">
                            <h3 className="font-black text-2xl">{modal.id ? 'Editar' : 'Nueva'} Materia Prima</h3>
                            <p className="text-amber-100/70 text-[10px] uppercase tracking-widest font-black mt-1">Catálogo de Insumos</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-xs">SKU / Referencia</label><input name="sku" defaultValue={modal.sku} placeholder="MP-001" className="input-std" /></div>
                                <div>
                                    <label className="label-xs">Unidad de Medida</label>
                                    <select name="unitOfMeasure" defaultValue={modal.unitOfMeasure || 'unidad'} className="input-std">
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div><label className="label-xs">Nombre del Insumo</label><input name="name" defaultValue={modal.name} required placeholder="Ej: Aceite esencial de lavanda…" className="input-std !text-base font-bold" /></div>
                            <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div><label className="label-xs">Stock Inicial</label><input type="number" step="any" name="currentStock" defaultValue={modal.currentStock} className="input-std bg-white" /></div>
                                <div><label className="label-xs">Stock Mínimo</label><input type="number" step="any" name="minStock" defaultValue={modal.minStock || 0} className="input-std bg-white" /></div>
                                <div>
                                    <label className="label-xs">Costo Inicial</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm group-focus-within:text-amber-500 transition-colors">$</span>
                                        <input type="number" step="any" name="averageCost" defaultValue={modal.averageCost} className="input-std pl-10 bg-white" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 text-xs uppercase tracking-widest transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 text-xs uppercase tracking-widest">Guardar Insumo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────
//  SECCIÓN 2 — PRODUCTOS TERMINADOS
// ────────────────────────────────────────────────
function TerminadosSection({ products, onSave, onDelete }) {
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);

    const items = useMemo(() =>
        products
            .filter(p => p.productType === 'producto_terminado')
            .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => a.name?.localeCompare(b.name))
        , [products, search]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const cost = Number(fd.get('averageCost')) || 0;
        const markup = Number(fd.get('markupPercentage')) || 0;
        onSave({
            id: modal?.id || crypto.randomUUID(),
            sku: fd.get('sku'),
            name: fd.get('name'),
            productType: 'producto_terminado',
            unitOfMeasure: 'und',
            currentStock: Number(modal?.currentStock || 0),
            averageCost: cost,
            markupPercentage: markup,
            basePrice: Number((cost * (1 + markup / 100)).toFixed(2)),
            status: 'active'
        });
        setModal(null);
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" placeholder="Buscar producto…" value={search} onChange={e => setSearch(e.target.value)}
                        className="input-std pl-10 !bg-slate-50 border-none" />
                </div>
                <button onClick={() => setModal({ productType: 'producto_terminado', currentStock: 0, averageCost: 0, markupPercentage: 30 })}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
                    <Plus size={16} /> Nuevo Producto
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-indigo-50/60 border-b border-indigo-50 text-[10px] font-black uppercase text-indigo-700/60 tracking-widest">
                            <th className="px-7 py-4">Producto / SKU</th>
                            <th className="px-7 py-4 text-center">Stock</th>
                            <th className="px-7 py-4 text-right">Costo (WAC)</th>
                            <th className="px-7 py-4 text-right">Ganancia</th>
                            <th className="px-7 py-4 text-right">Precio Venta</th>
                            <th className="px-7 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.length === 0 ? (
                            <tr><td colSpan="6" className="py-16 text-center text-slate-300">
                                <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-black text-sm uppercase tracking-widest">Sin productos terminados</p>
                                <p className="text-xs mt-1">Agrégalos aquí o importa desde Compras</p>
                            </td></tr>
                        ) : items.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-7 py-4">
                                    <div className="font-black text-slate-800">{p.name}</div>
                                    <div className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">{p.sku || '—'}</div>
                                </td>
                                <td className="px-7 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${(p.currentStock || 0) > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {fmt(p.currentStock, 0)} und
                                    </span>
                                </td>
                                <td className="px-7 py-4 text-right font-bold text-slate-500">${fmt(p.averageCost)}</td>
                                <td className="px-7 py-4 text-right">
                                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg font-black text-xs">+{p.markupPercentage || 0}%</span>
                                </td>
                                <td className="px-7 py-4 text-right font-black text-indigo-600 text-lg">${fmt(p.basePrice)}</td>
                                <td className="px-7 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => setModal(p)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all"><Edit3 size={15} /></button>
                                        <button onClick={() => { if (confirm('¿Eliminar?')) onDelete(p.id) }} className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl transition-all"><Trash2 size={15} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-indigo-600 p-7 text-white">
                            <h3 className="font-black text-2xl">{modal.id ? 'Editar' : 'Nuevo'} Producto Terminado</h3>
                            <p className="text-indigo-200/70 text-[10px] uppercase tracking-widest font-black mt-1">Estrategia de Ganancias</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-xs">SKU / Referencia</label><input name="sku" defaultValue={modal.sku} placeholder="PT-001" className="input-std" /></div>
                                <div><label className="label-xs">Nombre Comercial</label><input name="name" defaultValue={modal.name} required placeholder="Nombre del perfume…" className="input-std" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><DollarSign size={12} className="text-indigo-500" />Costo de Referencia</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-sm">$</span>
                                        <input type="number" step="any" name="averageCost" defaultValue={modal.averageCost} className="input-std pl-10 bg-white" placeholder="0.00" />
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-1 italic">Se actualiza con compras y producción</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Percent size={12} className="text-emerald-500" />Ganancia (%)</label>
                                    <div className="relative group">
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm group-focus-within:text-emerald-500 transition-colors">%</span>
                                        <input type="number" step="any" name="markupPercentage" defaultValue={modal.markupPercentage} className="input-std pr-10 bg-white" placeholder="30" />
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-1 italic">Margen sobre el costo</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 text-xs uppercase tracking-widest transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 text-xs uppercase tracking-widest">Guardar Producto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────
//  SECCIÓN 3 — COMPRAS (auto-registra en inventario)
// ────────────────────────────────────────────────
function ComprasSection({ products, suppliers, purchases, purchaseItems, onSavePurchase, onQuickCreate, accounts = [] }) {
    const [view, setView] = useState('new');
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [originAccountId, setOriginAccountId] = useState('');
    const [attachment, setAttachment] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 800;
                    let w = img.width, h = img.height;
                    if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
                    else if (h > MAX) { w *= MAX / h; h = MAX; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    setAttachment(canvas.toDataURL('image/jpeg', 0.6));
                };
            };
        }
    };

    const allProducts = useMemo(() =>
        products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
        , [products, search]);

    const addToCart = (p) => {
        if (cart.find(c => c.productId === p.id)) return;
        setCart(prev => [...prev, {
            productId: p.id, name: p.name,
            productType: p.productType,
            unitOfMeasure: p.unitOfMeasure || 'und',
            totalPaid: 0, quantity: 1,
            unitCost: p.averageCost || 0,
            isNew: false
        }]);
    };

    const addNewToCart = (type) => {
        const tempId = `new-${crypto.randomUUID()}`;
        setCart(prev => [...prev, {
            productId: tempId,
            name: '',
            sku: '',
            productType: type,
            unitOfMeasure: type === 'materia_prima' ? 'ml' : 'und',
            totalPaid: 0,
            quantity: 1,
            unitCost: 0,
            markupPercentage: 30,
            isNew: true
        }]);
    };

    const updateItem = (id, field, val) => {
        setCart(prev => prev.map(c => {
            if (c.productId !== id) return c;
            const u = { ...c, [field]: field === 'name' || field === 'sku' || field === 'unitOfMeasure' ? val : Number(val) };
            if (u.quantity > 0) u.unitCost = u.totalPaid / u.quantity;
            return u;
        }));
    };

    const total = cart.reduce((s, c) => s + (c.totalPaid || 0), 0);

    const handleConfirm = () => {
        if (!cart.length) return;

        // Validation: New items must have a name
        if (cart.some(c => c.isNew && !c.name.trim())) {
            alert("Los productos nuevos deben tener un nombre.");
            return;
        }

        const purchaseId = crypto.randomUUID();
        const date = new Date().toISOString();

        // Map cart items, creating new products if isNew is true
        const processedItems = cart.map(c => {
            if (c.isNew) {
                const newProd = {
                    id: crypto.randomUUID(),
                    name: c.name,
                    sku: c.sku || `AUTO-${Math.floor(Math.random() * 1000)}`,
                    productType: c.productType,
                    unitOfMeasure: c.unitOfMeasure,
                    currentStock: 0, // Stock before this purchase
                    averageCost: 0,
                    markupPercentage: c.markupPercentage || 30,
                    status: 'active'
                };
                onQuickCreate(newProd); // Parent registers this new SKU
                return { ...c, productId: newProd.id };
            }
            return c;
        });

        const purchase = { id: purchaseId, supplierId: supplierId || null, totalAmount: total, notes, date, status: 'received' };
        const items = processedItems.map(c => ({ id: crypto.randomUUID(), purchaseId, productId: c.productId, quantity: c.quantity, unitCost: c.unitCost, totalCost: c.totalPaid }));
        const movements = processedItems.map(c => {
            const prod = products.find(p => p.id === c.productId);
            const stockBef = prod ? (prod.currentStock || 0) : 0;
            return {
                id: crypto.randomUUID(), productId: c.productId,
                movementType: 'COMPRA', quantity: c.quantity,
                stockBefore: stockBef,
                stockAfter: stockBef + c.quantity,
                unitCost: c.unitCost, referenceId: purchaseId,
                referenceType: 'purchase', notes: `Compra (Unificada): ${notes || 'stock'}`, date
            };
        });

        onSavePurchase({
            purchase: {
                id: purchaseId,
                date: new Date().toISOString().split('T')[0],
                supplierId,
                total,
                status: 'completado',
                notes
            },
            items: items,
            movements,
            financeTx: originAccountId ? {
                accountId: originAccountId,
                categoryId: 'erp_purchase',
                attachment // Link the image to the transaction
            } : null
        });
        setCart([]); setSupplierId(''); setNotes(''); setOriginAccountId(''); setAttachment(null);
        setView('history');
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Tabs sub-action */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {['new', 'history'].map(v => (
                        <button key={v} onClick={() => setView(v)}
                            className={`px-7 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${view === v ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                            {v === 'new' ? 'Nueva Compra' : 'Historial'}
                        </button>
                    ))}
                </div>
                {view === 'new' && (
                    <div className="flex items-center gap-2 bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100">
                        <DollarSign className="text-blue-400" size={16} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total:</span>
                        <span className="text-xl font-black text-blue-600">${fmt(total)}</span>
                    </div>
                )}
            </div>

            {view === 'new' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: picker */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col" style={{ height: 580 }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-slate-800 flex items-center gap-2"><Package size={18} className="text-blue-400" />Pick Items</h3>
                                <div className="flex gap-1.5">
                                    <button onClick={() => addNewToCart('materia_prima')} className="px-2 py-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-1 border border-amber-100 shadow-sm">
                                        <Plus size={12} strokeWidth={3} />
                                        <FlaskConical size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Insumo</span>
                                    </button>
                                    <button onClick={() => addNewToCart('producto_terminado')} className="px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1 border border-indigo-100 shadow-sm">
                                        <Plus size={12} strokeWidth={3} />
                                        <ShoppingBag size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Producto</span>
                                    </button>
                                </div>
                            </div>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                                <input type="text" placeholder="Buscar producto…" value={search} onChange={e => setSearch(e.target.value)}
                                    className="input-std pl-9 !bg-slate-50 border-none text-xs" />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                {allProducts.map(p => {
                                    const inCart = cart.find(c => c.productId === p.id);
                                    const isMP = p.productType === 'materia_prima';
                                    return (
                                        <button key={p.id} onClick={() => addToCart(p)}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${inCart ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:border-blue-100 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isMP ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                    {isMP ? <FlaskConical size={14} /> : <ShoppingBag size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-700 truncate max-w-[130px]">{p.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{isMP ? 'Insumo' : 'Prod. T.'} · Stock: {p.currentStock || 0}</p>
                                                </div>
                                            </div>
                                            {inCart
                                                ? <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                                                : <Plus size={15} className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: cart */}
                    <div className="lg:col-span-8">
                        <div className="bg-white p-7 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col" style={{ height: 580 }}>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-black text-slate-800 text-lg">Detalle de Recepción</h3>
                                <span className="bg-blue-50 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{cart.length} ítems</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-200">
                                        <ShoppingCart size={56} className="mb-4 opacity-50" />
                                        <p className="font-black text-sm uppercase tracking-widest">Carrito vacío</p>
                                        <p className="text-xs mt-1 text-slate-300">Selecciona productos de la izquierda</p>
                                    </div>
                                ) : cart.map(item => {
                                    const isMP = item.productType === 'materia_prima';
                                    return (
                                        <div key={item.productId} className={`grid grid-cols-12 gap-3 items-center p-4 rounded-[2rem] border group transition-all ${item.isNew ? 'bg-white border-dashed border-blue-300 ring-2 ring-blue-50' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="col-span-4 flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg shrink-0 ${isMP ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                    {isMP ? <FlaskConical size={13} /> : <ShoppingBag size={13} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {item.isNew ? (
                                                        <div className="space-y-1">
                                                            <input value={item.name} onChange={e => updateItem(item.productId, 'name', e.target.value)} placeholder="Nombre Nuevo..." className="input-std !py-1 text-[10px] !bg-slate-50" />
                                                            <div className="flex gap-1">
                                                                <input value={item.sku} onChange={e => updateItem(item.productId, 'sku', e.target.value)} placeholder="SKU" className="input-std !py-0.5 text-[8px] !bg-slate-50 w-1/2" />
                                                                <select value={item.unitOfMeasure} onChange={e => updateItem(item.productId, 'unitOfMeasure', e.target.value)} className="input-std !py-0.5 text-[8px] !bg-slate-50 w-1/2">
                                                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="font-black text-slate-700 text-xs truncate">{item.name}</p>
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isMP ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                {isMP ? 'Insumo' : 'Prod. Terminado'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Monto Pagado</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs group-focus-within:text-blue-500">$</span>
                                                    <input type="number" step="any" value={item.totalPaid} onChange={e => updateItem(item.productId, 'totalPaid', e.target.value)}
                                                        className="input-std pl-8 !py-1.5 !bg-white border-transparent shadow-sm text-xs font-black text-blue-600" />
                                                </div>
                                                {!isMP && item.isNew && (
                                                    <div className="mt-1 flex items-center gap-1">
                                                        <Percent size={8} className="text-emerald-500" />
                                                        <input type="number" value={item.markupPercentage} onChange={e => updateItem(item.productId, 'markupPercentage', e.target.value)} className="w-8 text-[8px] font-black outline-none bg-emerald-50 text-emerald-600 rounded px-1" title="Margen de ganancia" />
                                                        <span className="text-[8px] text-slate-400">%</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Cantidad</label>
                                                <input type="number" step="any" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', e.target.value)}
                                                    className="input-std !py-1.5 !bg-white border-transparent shadow-sm text-xs text-center font-black" />
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Costo Unit.</label>
                                                <div className="text-xs font-black text-slate-500 flex items-center justify-end gap-1">
                                                    <Calculator size={10} className="text-slate-300" />$ {fmt(item.unitCost)}
                                                </div>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button onClick={() => setCart(p => p.filter(c => c.productId !== item.productId))}
                                                    className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50/50 p-6 flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="label-xs">Proveedor</label>
                                        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="input-std !bg-white text-xs">
                                            <option value="">🛒 General</option>
                                            {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-xs">Cuenta de Pago (Enlace Financiero)</label>
                                        <select value={originAccountId} onChange={e => setOriginAccountId(e.target.value)}
                                            className={`input-std text-xs transition-all ${originAccountId ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                                            <option value="">⚠️ No registrar en finanzas</option>
                                            {accounts?.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} (${Number(acc.balance || 0).toLocaleString()})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-xs">Referencia / Factura</label>
                                        <div className="flex gap-2">
                                            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: FAC-001" className="input-std !bg-white text-xs flex-1" />
                                            <label className={`shrink-0 p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${attachment ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'}`}>
                                                <Camera size={16} />
                                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Total Compra</span>
                                        <span className="text-2xl font-black text-[#1e3a5f]">$ {total.toFixed(2)}</span>
                                    </div>
                                    <button onClick={handleConfirm} disabled={cart.length === 0}
                                        className={`px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all shadow-lg ${cart.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                        {originAccountId ? <DollarSign size={18} /> : <ShoppingCart size={18} />} Confirmar Compra
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* History */
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-5">Fecha</th>
                                <th className="px-8 py-5">Detalle / Proveedor</th>
                                <th className="px-8 py-5 text-center">Ítems</th>
                                <th className="px-8 py-5 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {purchases.length === 0 ? (
                                <tr><td colSpan="4" className="py-14 text-center text-slate-300">
                                    <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
                                    <p className="font-black text-sm uppercase">Sin compras registradas</p>
                                </td></tr>
                            ) : [...purchases].sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-blue-400" />
                                            <span className="font-black text-slate-600 text-sm">{new Date(p.date).toLocaleDateString('es-MX')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="font-black text-slate-800">{p.notes || 'Reabastecimiento'}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <User size={9} className="text-slate-300" />
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{suppliers?.find(s => s.id === p.supplierId)?.name || 'General'}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="bg-blue-50 text-blue-500 px-3 py-1 rounded-full font-black text-[11px]">
                                            {purchaseItems.filter(i => i.purchaseId === p.id).length} ítems
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-blue-600 text-lg">${fmt(p.totalAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────
//  ROOT EXPORT — InventoryHub
// ────────────────────────────────────────────────
const SECTIONS = [
    { id: 'stock', label: 'Inventario', Icon: Package, color: 'blue' },
    { id: 'compras', label: 'Compras', Icon: ShoppingCart, color: 'emerald' }
];

const COLOR = {
    amber: { pill: 'bg-amber-500  text-white shadow-amber-400/30', ghost: 'text-amber-600  hover:bg-amber-50', dot: 'bg-amber-500' },
    indigo: { pill: 'bg-indigo-600 text-white shadow-indigo-400/30', ghost: 'text-indigo-600 hover:bg-indigo-50', dot: 'bg-indigo-600' },
    blue: { pill: 'bg-blue-600   text-white shadow-blue-400/30', ghost: 'text-blue-600   hover:bg-blue-50', dot: 'bg-blue-600' },
    emerald: { pill: 'bg-emerald-600 text-white shadow-emerald-400/30', ghost: 'text-emerald-600 hover:bg-emerald-50', dot: 'bg-emerald-600' },
    slate: { pill: 'bg-slate-600 text-white shadow-slate-400/30', ghost: 'text-slate-600 hover:bg-slate-50', dot: 'bg-slate-600' },
};

export default function InventoryHub({ products = [], suppliers = [], purchases = [], purchaseItems = [], onSaveProduct, onDeleteProduct, onSavePurchase, accounts = [] }) {
    const [active, setActive] = useState('stock');
    const [modal, setModal] = useState(null);

    const productsMP = products.filter(p => p.productType === 'materia_prima');
    const productsPT = products.filter(p => p.productType === 'producto_terminado');
    const totalMP = productsMP.reduce((s, p) => s + (Number(p.currentStock || 0) * Number(p.averageCost || 0)), 0);
    const totalPT = productsPT.reduce((s, p) => s + (Number(p.currentStock || 0) * Number(p.averageCost || 0)), 0);
    const totalSKUs = products.length;

    const openCreateModal = (type) => {
        if (type === 'materia_prima') {
            setModal({ id: null, productType: 'materia_prima', currentStock: 0, averageCost: 0, minStock: 0 });
        } else {
            setModal({ id: null, productType: 'producto_terminado', currentStock: 0, averageCost: 0, markupPercentage: 30 });
        }
    };

    const handleSaveFromHub = (data) => {
        onSaveProduct(data);
        setModal(null);
    };

    const activeSection = SECTIONS.find(s => s.id === active);
    const c = COLOR[activeSection.color];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Global KPI Strip */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-2xl"><FlaskConical className="text-amber-600" size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Insumos</p>
                        <p className="text-xl font-black text-slate-800">$ {fmt(totalMP, 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-2xl"><ShoppingBag className="text-indigo-600" size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Terminados</p>
                        <p className="text-xl font-black text-slate-800">$ {fmt(totalPT, 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-2xl"><Package className="text-blue-600" size={22} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Referencias</p>
                        <p className="text-xl font-black text-slate-800">{totalSKUs} SKUs</p>
                    </div>
                </div>
            </div>

            {/* Section Switcher */}
            <div className="flex gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-[2rem] w-fit">
                {SECTIONS.map(({ id, label, Icon, color }) => {
                    const isActive = id === active;
                    const cc = COLOR[color];
                    return (
                        <button key={id} onClick={() => setActive(id)}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${isActive ? `${cc.pill} shadow-lg -translate-y-0.5` : `${cc.ghost} bg-transparent`}`}>
                            <Icon size={15} />{label}
                        </button>
                    );
                })}
            </div>

            {/* Active Section */}
            {active === 'stock' && (
                <div className="space-y-6">
                    <InsumosSection products={products} onSave={onSaveProduct} onDelete={onDeleteProduct} />
                    <TerminadosSection products={products} onSave={onSaveProduct} onDelete={onDeleteProduct} />
                </div>
            )}
            {active === 'compras' && (
                <ComprasSection
                    products={products} suppliers={suppliers || []}
                    purchases={purchases || []} purchaseItems={purchaseItems || []}
                    onSavePurchase={onSavePurchase}
                    onQuickCreate={onSaveProduct}
                    accounts={accounts}
                />
            )}

            {/* Unifed Modal logic for HUB shortcuts */}
            {modal && (
                modal.productType === 'materia_prima' ? (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="bg-amber-500 p-7 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-2xl">{modal.id ? 'Editar' : 'Nueva'} Materia Prima</h3>
                                    <p className="text-amber-100/70 text-[10px] uppercase tracking-widest font-black mt-1">Catálogo de Insumos</p>
                                </div>
                                <button onClick={() => setModal(null)} className="text-white/60 hover:text-white"><X size={24} /></button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.target);
                                handleSaveFromHub({
                                    id: modal.id || crypto.randomUUID(),
                                    sku: fd.get('sku'),
                                    name: fd.get('name'),
                                    productType: 'materia_prima',
                                    unitOfMeasure: fd.get('unitOfMeasure'),
                                    currentStock: Number(fd.get('currentStock')) || 0,
                                    averageCost: Number(fd.get('averageCost')) || 0,
                                    minStock: Number(fd.get('minStock')) || 0,
                                    status: 'active'
                                });
                            }} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-xs">SKU / Referencia</label><input name="sku" defaultValue={modal.sku} placeholder="MP-001" className="input-std" /></div>
                                    <div>
                                        <label className="label-xs">Unidad de Medida</label>
                                        <select name="unitOfMeasure" defaultValue={modal.unitOfMeasure || 'unidad'} className="input-std">
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div><label className="label-xs">Nombre del Insumo</label><input name="name" defaultValue={modal.name} required placeholder="Ej: Aceite esencial..." className="input-std !text-base font-bold" /></div>
                                <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <div><label className="label-xs">Stock Inicial</label><input type="number" step="any" name="currentStock" defaultValue={modal.currentStock} className="input-std bg-white" /></div>
                                    <div><label className="label-xs">Stock Mínimo</label><input type="number" step="any" name="minStock" defaultValue={modal.minStock || 0} className="input-std bg-white" /></div>
                                    <div>
                                        <label className="label-xs">Costo Inicial</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm group-focus-within:text-amber-500">$</span>
                                            <input type="number" step="any" name="averageCost" defaultValue={modal.averageCost} className="input-std pl-11 bg-white" placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 text-xs uppercase tracking-widest transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-[2] py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 text-xs uppercase tracking-widest">Guardar Insumo</button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="bg-indigo-600 p-7 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-2xl">{modal.id ? 'Editar' : 'Nuevo'} Producto Terminado</h3>
                                    <p className="text-indigo-200/70 text-[10px] uppercase tracking-widest font-black mt-1">Estrategia de Ganancias</p>
                                </div>
                                <button onClick={() => setModal(null)} className="text-white/60 hover:text-white"><X size={24} /></button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.target);
                                const cost = Number(fd.get('averageCost')) || 0;
                                const markup = Number(fd.get('markupPercentage')) || 0;
                                handleSaveFromHub({
                                    id: modal.id || crypto.randomUUID(),
                                    sku: fd.get('sku'),
                                    name: fd.get('name'),
                                    productType: 'producto_terminado',
                                    unitOfMeasure: 'und',
                                    currentStock: Number(modal.currentStock || 0),
                                    averageCost: cost,
                                    markupPercentage: markup,
                                    basePrice: Number((cost * (1 + markup / 100)).toFixed(2)),
                                    status: 'active'
                                });
                            }} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="label-xs">SKU / Referencia</label><input name="sku" defaultValue={modal.sku} placeholder="PT-001" className="input-std" /></div>
                                    <div><label className="label-xs">Nombre Comercial</label><input name="name" defaultValue={modal.name} required placeholder="Nombre del perfume..." className="input-std" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><DollarSign size={12} className="text-indigo-500" />Costo de Referencia</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-sm">$</span>
                                            <input type="number" step="any" name="averageCost" defaultValue={modal.averageCost} className="input-std pl-11 bg-white" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Percent size={12} className="text-emerald-500" />Ganancia (%)</label>
                                        <div className="relative group">
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm group-focus-within:text-emerald-500">%</span>
                                            <input type="number" step="any" name="markupPercentage" defaultValue={modal.markupPercentage} className="input-std pr-10 bg-white" placeholder="30" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => setModal(null)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 text-xs uppercase tracking-widest transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 text-xs uppercase tracking-widest">Guardar Producto</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
