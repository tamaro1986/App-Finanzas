import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Trash2, Save, History, Search, ShoppingBag, FlaskConical, User, DollarSign, Calendar, Calculator, ArrowRight, Tag, Edit3, ChevronDown, ChevronRight, Package, Box } from 'lucide-react';

export default function PurchaseModule({ products, suppliers, purchases, purchaseItems, onSavePurchase, onDeletePurchase }) {
    const [view, setView] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [editId, setEditId] = useState(null);
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [expandedId, setExpandedId] = useState(null);

    const filteredProducts = useMemo(() =>
        products.filter(p => (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())))
        , [products, searchTerm]);

    const resetForm = () => {
        setCart([]);
        setSupplierId('');
        setNotes('');
        setEditId(null);
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setView('new');
    };

    const startEdit = (p) => {
        const items = purchaseItems.filter(i => i.purchaseId === p.id);
        const cartItems = items.map(item => {
            const prod = products.find(pr => pr.id === item.productId) || {};
            return {
                productId: item.productId,
                name: prod.name || 'Producto eliminado',
                packages: 1, // Defaulting for edit as we don't store original package split
                unitsPerPackage: item.quantity,
                quantity: item.quantity,
                totalPaid: item.totalCost,
                unitCost: item.unitCost,
                productType: prod.productType,
                unitOfMeasure: prod.unitOfMeasure,
                supplierId: item.supplierId || '',
                invoiceNumber: item.invoiceNumber || ''
            };
        });
        setCart(cartItems);
        setSupplierId(p.supplierId || '');
        setNotes(p.notes || '');
        setEditId(p.id);
        setPurchaseDate(new Date(p.date || Date.now()).toISOString().split('T')[0]);
        setView('new');
    };

    const addToCart = (p) => {
        const existing = cart.find(item => item.productId === p.id);
        if (existing) return;
        setCart([...cart, {
            productId: p.id,
            name: p.name,
            packages: p.productType === 'materia_prima' ? 0 : 1,
            unitsPerPackage: p.productType === 'materia_prima' ? 0 : 1,
            quantity: 1,
            totalPaid: p.averageCost || 0,
            unitCost: p.averageCost || 0,
            productType: p.productType,
            unitOfMeasure: p.unitOfMeasure,
            supplierId: supplierId || '', // Sugiere el global si existe (para migración suave)
            invoiceNumber: notes || ''    // Sugiere el global si existe
        }]);
    };

    const updateCartItem = (id, field, value) => {
        setCart(cart.map(item => {
            if (item.productId === id) {
                const updated = { ...item, [field]: value };

                const toNum = (val) => {
                    if (!val || val === '.' || val === ',') return 0;
                    const parsed = parseFloat(String(val).replace(',', '.'));
                    return isNaN(parsed) ? 0 : parsed;
                };

                if (field === 'packages' || field === 'unitsPerPackage') {
                    updated.quantity = toNum(updated.packages) * toNum(updated.unitsPerPackage);
                } else if (field === 'quantity') {
                    updated.packages = 1;
                    updated.unitsPerPackage = value;
                }

                // Recalcular Costo Unitario
                const finalQty = toNum(updated.quantity);
                const finalTotal = toNum(updated.totalPaid);

                if (finalQty > 0) {
                    updated.unitCost = finalTotal / finalQty;
                } else {
                    updated.unitCost = 0;
                }
                return updated;
            }
            return item;
        }));
    };

    const removeFromCart = (id) => setCart(cart.filter(item => item.productId !== id));

    const grandTotal = cart.reduce((sum, item) => sum + (Number(item.totalPaid) || 0), 0);

    const handleConfirmPurchase = () => {
        if (!cart.length) return alert('El carrito está vacío');

        const purchaseId = editId || crypto.randomUUID();
        const date = new Date(purchaseDate).toISOString();

        const purchase = {
            id: purchaseId,
            supplierId: supplierId || null,
            totalAmount: Number(grandTotal) || 0,
            notes,
            date,
            status: 'received'
        };

        const items = cart.map(item => ({
            id: crypto.randomUUID(),
            purchaseId,
            productId: item.productId,
            quantity: Number(item.quantity) || 0,
            unitCost: Number(item.unitCost) || 0,
            totalCost: Number(item.totalPaid) || 0,
            supplierId: item.supplierId || null,
            invoiceNumber: item.invoiceNumber || ''
        }));

        const movements = items.map(item => {
            const p = products.find(prod => prod.id === item.productId);
            const supObj = suppliers.find(s => s.id === item.supplierId);
            return {
                id: crypto.randomUUID(),
                productId: item.productId,
                movementType: 'COMPRA',
                quantity: item.quantity,
                stockBefore: p?.currentStock || 0,
                stockAfter: (p?.currentStock || 0) + item.quantity,
                unitCost: item.unitCost,
                referenceId: purchaseId,
                referenceType: 'purchase',
                notes: `Factura: ${item.invoiceNumber || 'S/N'} | Prov: ${supObj?.name || 'Gral'}`,
                date
            };
        });

        onSavePurchase({ purchase, items, movements });
        resetForm();
        setView('history');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-1 p-1.5 bg-slate-100 rounded-2xl w-full md:w-fit border border-slate-200">
                    <button onClick={() => { resetForm(); setView('new'); }} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${view === 'new' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        {editId ? 'EDITANDO COMPRA' : 'NUEVA COMPRA'}
                    </button>
                    <button onClick={() => setView('history')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        HISTORIAL
                    </button>
                </div>
                {view === 'new' && (
                    <div className="flex items-center gap-3 bg-blue-50 px-6 py-2.5 rounded-2xl border border-blue-100">
                        <DollarSign className="text-blue-500" size={18} />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Compra:</span>
                        <span className="text-xl font-black text-blue-600 tracking-tight">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                )}
            </div>

            {view === 'new' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Picker Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[600px]">
                            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" /> Seleccionar Items
                            </h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text" placeholder="Buscar por nombre o SKU..."
                                    className="input-std pl-10 !bg-slate-50 !border-transparent focus:!bg-white focus:!border-blue-200"
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                                {filteredProducts.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-100 hover:border-blue-100 transition-all text-left group">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${p.productType === 'materia_prima' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {p.productType === 'materia_prima' ? <FlaskConical size={16} /> : <ShoppingBag size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-700 truncate max-w-[150px]">{p.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Stock: {p.currentStock} {p.unitOfMeasure}</p>
                                            </div>
                                        </div>
                                        <Plus size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="lg:col-span-8">
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-[600px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-slate-800 text-xl tracking-tight">Detalle de la Recepción</h3>
                                <div className="text-blue-500 bg-blue-50 px-4 py-1.5 rounded-full flex items-center gap-2">
                                    <ShoppingCart size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{cart.length} Ítems</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-thin">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                                            <ShoppingCart size={48} className="opacity-10" />
                                        </div>
                                        <p className="font-black uppercase text-xs tracking-[0.2em]">El carrito está vacío</p>
                                        <p className="text-[10px] opacity-60 mt-1">Selecciona productos a la izquierda para iniciar la compra</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.productId} className="flex flex-col gap-6 p-6 bg-slate-50 hover:bg-slate-100 rounded-[2.5rem] border border-slate-100 transition-all group shadow-sm">
                                            {/* Superior: Nombre y Acciones */}
                                            <div className="flex justify-between items-start border-b border-slate-200/50 pb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${item.productType === 'materia_prima' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                        <Tag size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-lg leading-tight mb-1">{item.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${item.productType === 'materia_prima' ? 'bg-amber-200 text-amber-800' : 'bg-indigo-200 text-indigo-800'}`}>
                                                                {item.productType === 'materia_prima' ? 'Materia Prima' : 'Producto Terminado'}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">REF: {item.productId.slice(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeFromCart(item.productId)} className="p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                                                    <Trash2 size={22} />
                                                </button>
                                            </div>

                                            {/* Sección Intermedia: Proveedor y Factura (NUEVO) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="label-xs !mb-0 text-slate-400">Proveedor del Item</label>
                                                    <select 
                                                        value={item.supplierId} 
                                                        onChange={(e) => updateCartItem(item.productId, 'supplierId', e.target.value)}
                                                        className="input-std !bg-white border-slate-200 !py-3 text-xs font-bold"
                                                    >
                                                        <option value="">🛒 Proveedor General</option>
                                                        {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="label-xs !mb-0 text-slate-400">Factura / Referencia</label>
                                                    <input 
                                                        value={item.invoiceNumber} 
                                                        onChange={(e) => updateCartItem(item.productId, 'invoiceNumber', e.target.value)}
                                                        placeholder="N° Factura..."
                                                        className="input-std !bg-white border-slate-200 !py-3 text-xs font-bold" 
                                                    />
                                                </div>
                                            </div>

                                            {/* Inferior: Valores y Cálculos */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                                                {/* Precio Pagado */}
                                                <div className="space-y-2">
                                                    <label className="label-xs text-slate-500">Monto Pagado Total</label>
                                                    <div className="relative group">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-black group-focus-within:text-blue-500 transition-colors">$</span>
                                                        <input type="number" step="any" value={item.totalPaid}
                                                            onChange={(e) => updateCartItem(item.productId, 'totalPaid', e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            className="input-std !pl-10 !bg-white border-slate-200 shadow-sm !py-4 text-sm font-black text-blue-600 focus:border-blue-400 transition-all" />
                                                    </div>
                                                </div>

                                                {/* Cantidades / Empaques */}
                                                <div className="space-y-2">
                                                    {item.productType === 'materia_prima' ? (
                                                        <>
                                                            <label className="label-xs text-amber-600">Empaques × Contenido ({item.unitOfMeasure})</label>
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex-1">
                                                                    <input type="number" step="any" placeholder="Cant" value={item.packages || ''}
                                                                        onChange={(e) => updateCartItem(item.productId, 'packages', e.target.value)}
                                                                        onFocus={(e) => e.target.select()}
                                                                        className="w-full input-std !bg-white border-slate-200 shadow-sm !py-4 text-sm text-center font-black focus:border-amber-400" />
                                                                    <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Frascos</span>
                                                                </div>
                                                                <span className="text-xl font-black text-slate-300">×</span>
                                                                <div className="relative flex-1">
                                                                    <input type="number" step="any" placeholder="Vol" value={item.unitsPerPackage || ''}
                                                                        onChange={(e) => updateCartItem(item.productId, 'unitsPerPackage', e.target.value)}
                                                                        onFocus={(e) => e.target.select()}
                                                                        className="w-full input-std !bg-white border-slate-200 shadow-sm !py-4 text-sm text-center font-black focus:border-amber-400" />
                                                                    <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">{item.unitOfMeasure} c/u</span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <label className="label-xs text-indigo-600">Cantidad ({item.unitOfMeasure || 'U'})</label>
                                                            <input type="number" step="any" value={item.quantity} onChange={(e) => updateCartItem(item.productId, 'quantity', e.target.value)}
                                                                onFocus={(e) => e.target.select()}
                                                                className="input-std !bg-white border-slate-200 shadow-sm !py-4 text-sm text-center font-black focus:border-indigo-400" />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Resultado de Costo */}
                                                <div className="bg-slate-200/50 p-4 rounded-3xl border border-slate-300/30 flex flex-col items-center justify-center">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Costo Unitario</p>
                                                    <div className="text-center">
                                                        <p className="text-[10px] text-blue-500 font-bold leading-none mb-1">{item.quantity} {item.unitOfMeasure} totales</p>
                                                        <div className="flex items-center gap-2 text-xl font-black text-slate-800">
                                                            <Calculator size={18} className="text-slate-400" />
                                                            ${Number(item.unitCost || 0).toFixed(4)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer Cart */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-5 items-end">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div className="space-y-1.5 text-center md:text-left">
                                        <label className="label-xs">Fecha de Recepción Global</label>
                                        <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="input-std !bg-slate-50 border-none" />
                                    </div>
                                    <div className="flex items-center justify-center md:justify-end gap-3 bg-blue-600 px-8 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 py-4 cursor-default">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Total General</span>
                                            <span className="text-2xl font-black tracking-tight">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                    {editId && (
                                        <button onClick={resetForm} className="px-6 py-4 text-slate-400 hover:text-slate-600 font-black uppercase text-xs tracking-widest transition-colors">
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        disabled={cart.length === 0}
                                        onClick={handleConfirmPurchase}
                                        className="flex-1 md:flex-none px-10 py-6 bg-slate-900 border border-slate-800 hover:bg-black disabled:bg-slate-200 text-white rounded-[2rem] font-black transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest hover:-translate-y-1 active:scale-95"
                                    >
                                        <Save size={18} /> {editId ? 'Guardar Cambios' : 'Procesar Compra'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* History View con Detalle Expandible */
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <th className="px-8 py-6 w-10"></th>
                                    <th className="px-8 py-6">Fecha / Registro</th>
                                    <th className="px-8 py-6">Monto Total</th>
                                    <th className="px-8 py-6 text-center">Items</th>
                                    <th className="px-8 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...purchases].sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => (
                                    <React.Fragment key={p.id}>
                                        <tr 
                                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                            className={`hover:bg-blue-50/30 transition-all cursor-pointer group ${expandedId === p.id ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <td className="px-8 py-5">
                                                {expandedId === p.id ? <ChevronDown size={18} className="text-blue-500" /> : <ChevronRight size={18} className="text-slate-300" />}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-sm">{new Date(p.date).toLocaleDateString()}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.notes || 'Reabastecimiento'}</span>
                                                            <span className="text-[9px] text-blue-500 font-black uppercase mt-0.5">
                                                                Prov: {suppliers.find(s => s.id === p.supplierId)?.name || 'General'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-lg font-black text-blue-600 tracking-tight">${(Number(p.totalAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="bg-white text-slate-600 px-4 py-1 rounded-full font-black text-[10px] border border-slate-200 shadow-sm">
                                                    {purchaseItems.filter(i => i.purchaseId === p.id).length} PRODUCTOS
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); startEdit(p); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm transition-all" title="Editar">
                                                        <Edit3 size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar esta compra? Se revertirá el stock.')) onDeletePurchase(p.id); }}
                                                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm transition-all" title="Eliminar">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Detalle Expandible */}
                                        {expandedId === p.id && (
                                            <tr className="bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                                                <td colSpan="5" className="px-12 py-8 pt-2">
                                                    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/50 p-6">
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {purchaseItems.filter(i => i.purchaseId === p.id).map((item, idx) => {
                                                                const prod = products.find(pr => pr.id === item.productId);
                                                                const supItem = suppliers.find(s => s.id === item.supplierId);
                                                                return (
                                                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                                                        <div className="flex items-center gap-4 flex-1">
                                                                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-blue-500 shadow-sm">
                                                                                <Box size={18} />
                                                                            </div>
                                                                            <div className="max-w-xs">
                                                                                <p className="font-black text-slate-700 text-sm">{prod?.name || 'Desconocido'}</p>
                                                                                <p className="text-[10px] text-slate-400 font-bold">Qty: {item.quantity} {prod?.unitOfMeasure}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1 grid grid-cols-2 gap-8 px-6 border-x border-slate-200/50">
                                                                            <div>
                                                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Proveedor Específico</p>
                                                                                <p className={`text-[10px] font-bold ${supItem ? 'text-blue-600' : 'text-slate-500'}`}>
                                                                                    {supItem?.name || 'Proveedor General'}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">N° Factura</p>
                                                                                <p className="text-[10px] font-black text-slate-700 tracking-wider uppercase">
                                                                                    {item.invoiceNumber || 'Sin Factura'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end min-w-[120px]">
                                                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Costo Unit</p>
                                                                            <p className="text-sm font-black text-slate-800">${Number(item.unitCost || 0).toLocaleString()}</p>
                                                                            <p className="text-[9px] font-bold text-slate-400">${Number(item.totalCost || 0).toLocaleString()} Total</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
