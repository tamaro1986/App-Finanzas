import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, X, Save, ShoppingBag, ShoppingCart, AlertTriangle, History, Calendar, User, Trash2, Edit3, Search, Tag, DollarSign } from 'lucide-react';

export default function SalesModule({ products, contacts, sales, saleItems, onSaveSale, onDeleteSale }) {
    const [view, setView] = useState('new');
    const [isOpen, setIsOpen] = useState(false);
    const [cart, setCart] = useState([]);
    const [clientId, setClientId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [searchProd, setSearchProd] = useState('');
    const [error, setError] = useState('');
    const [editId, setEditId] = useState(null);

    const finishedProducts = useMemo(() =>
        (products || [])
            .filter(p => p?.productType === 'producto_terminado')
            .filter(p => (p?.name || '').toLowerCase().includes(searchProd.toLowerCase()))
            .sort((a, b) => (a?.name || '').localeCompare(b?.name || '')),
        [products, searchProd]);

    const clients = useMemo(() => (contacts || []).filter(c => c?.type === 'cliente'), [contacts]);

    const resetForm = () => {
        setCart([]);
        setClientId('');
        setDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setError('');
        setEditId(null);
        setIsOpen(false);
        setView('new');
    };

    const startEdit = (s) => {
        const items = saleItems.filter(i => i.saleId === s.id);
        const cartItems = items.map(item => {
            const prod = products.find(pr => pr.id === item.productId) || {};
            return {
                productId: item.productId,
                productName: prod.name || 'Producto eliminado',
                unitOfMeasure: prod.unitOfMeasure || 'und',
                currentStock: Number(prod.currentStock || 0), // Note: current stock is AFTER the sale, but valid for validating edit increase?
                // Actually for editing we should allow more because we will revert previous stock in the handler
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                averageCost: prod.averageCost || 0,
                markupPercentage: prod.markupPercentage || 0
            };
        });
        setCart(cartItems);
        setClientId(s.clientId || '');
        setDate(new Date(s.date || Date.now()).toISOString().split('T')[0]);
        setNotes(s.notes || '');
        setEditId(s.id);
        setIsOpen(true);
    };

    const addToCart = (product) => {
        if (cart.find(c => c.productId === product.id)) return;

        const cost = Number(product.averageCost || 0);
        const markup = Number(product.markupPercentage || 30);
        const suggestedPrice = cost > 0 ? (cost * (1 + markup / 100)) : 0;
        const finalPrice = Number(product.basePrice) > 0 ? Number(product.basePrice) : suggestedPrice;

        setCart(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            unitOfMeasure: product.unitOfMeasure || 'und',
            currentStock: Number(product.currentStock || 0),
            quantity: 1,
            unitPrice: Number(finalPrice.toFixed(2)),
            averageCost: cost,
            markupPercentage: markup
        }]);
        setError('');
    };

    const updateCart = (productId, value) => {
        setCart(prev => prev.map(item => {
            if (item.productId !== productId) return item;
            return { ...item, quantity: value };
        }));
    };

    const updatePrice = (productId, value) => {
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, unitPrice: value } : item
        ));
    };

    const grandTotal = cart.reduce((sum, c) => sum + (Number(c.quantity || 0) * Number(c.unitPrice || 0)), 0);

    const validateStock = () => {
        // En edición el stock es más complejo por la reversión previa. 
        // Por simplicidad permitimos, pero idealmente avisamos.
        if (editId) return true;

        const violations = cart.filter(c => Number(c.quantity) > Number(c.currentStock));
        if (violations.length > 0) {
            setError(`❌ Stock insuficiente: ${violations.map(v => `${v.productName} (tiene ${v.currentStock}, pide ${v.quantity})`).join('; ')}`);
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (cart.length === 0) return setError('Agrega al menos un producto');
        if (!validateStock()) return;

        const saleId = editId || crypto.randomUUID();
        const sale = { id: saleId, clientId: clientId || null, date, total: grandTotal, status: 'completada', notes };

        const items = cart.map(c => ({
            id: crypto.randomUUID(),
            saleId,
            productId: c.productId,
            quantity: Number(c.quantity) || 0,
            unitPrice: Number(c.unitPrice) || 0,
            subtotal: Number(c.quantity || 0) * Number(c.unitPrice || 0),
        }));

        const movements = cart.map(c => {
            const product = products.find(p => p.id === c.productId);
            const stockBefore = Number(product?.currentStock || 0);
            return {
                id: crypto.randomUUID(),
                productId: c.productId,
                movementType: 'VENTA',
                quantity: Number(c.quantity) || 0,
                stockBefore,
                stockAfter: stockBefore - Number(c.quantity),
                unitCost: product?.averageCost || 0,
                referenceId: saleId,
                referenceType: 'sale',
                notes: `Venta: ${notes || 'Cliente ' + (clientId || 'Gral')}`,
                date,
            };
        });

        onSaveSale({ sale, items, movements });
        resetForm();
        setView('history');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-1 p-1.5 bg-slate-100 rounded-2xl w-full md:w-fit border border-slate-200">
                    <button onClick={() => { resetForm(); setView('new'); }} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${view === 'new' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        {editId ? 'EDITANDO VENTA' : 'NUEVA VENTA'}
                    </button>
                    <button onClick={() => setView('history')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        HISTORIAL DE VENTAS
                    </button>
                </div>
            </div>

            {view === 'new' ? (
                <>
                    <button onClick={() => setIsOpen(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-[2.5rem] flex items-center justify-between transition-all shadow-xl shadow-emerald-900/20 group border-b-4 border-emerald-800">
                        <div className="flex items-center gap-5">
                            <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={32} /></div>
                            <div className="text-left">
                                <p className="font-black text-2xl tracking-tight">{editId ? 'Continuar Edición' : 'Registrar Venta Directa'}</p>
                                <p className="text-emerald-100 text-sm font-medium opacity-90 italic">Selecciona productos terminados y ajusta precios de salida.</p>
                            </div>
                        </div>
                        <Plus size={32} />
                    </button>

                    {isOpen && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-stretch md:items-center p-0 md:p-4">
                            <div className="bg-white md:rounded-[3rem] w-full max-w-5xl h-full md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
                                {/* Panel izq: seleccionar PT */}
                                <div className="flex-1 border-r border-slate-100 flex flex-col bg-slate-50/50">
                                    <div className="bg-emerald-600 text-white p-6 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-3">
                                            <ShoppingBag size={24} />
                                            <p className="font-black text-xl tracking-tight">Catálogo de Venta</p>
                                        </div>
                                        <button onClick={() => setIsOpen(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"><X size={20} /></button>
                                    </div>
                                    <div className="p-4 border-b border-slate-200 bg-white">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input type="text" placeholder="Buscar producto para vender..." value={searchProd}
                                                onChange={e => setSearchProd(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.2 text-sm font-bold outline-none focus:ring-2 ring-emerald-500/20 transition-all" />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                                        {finishedProducts.map(p => {
                                            const inCart = cart.find(c => c.productId === p.id);
                                            const noStock = Number(p.currentStock || 0) <= 0;
                                            return (
                                                <div key={p.id} onClick={() => !noStock && addToCart(p)}
                                                    className={`p-4 bg-white border-2 rounded-3xl transition-all ${noStock ? 'opacity-50 cursor-not-allowed border-slate-100' : inCart ? 'border-emerald-500 bg-emerald-50 shadow-md ring-4 ring-emerald-500/5 cursor-pointer' : 'border-slate-100 cursor-pointer hover:border-emerald-200 hover:shadow-lg'}`}>
                                                    <div className="flex justify-between items-center text-left">
                                                        <div>
                                                            <p className="font-black text-slate-800 text-base mb-1">{p.name}</p>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">Stock: {Number(p.currentStock || 0)} {p.unitOfMeasure}</span>
                                                                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-indigo-100">P.V: ${Number(p.basePrice || 0).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        {noStock
                                                            ? <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 uppercase">Agotado</span>
                                                            : inCart
                                                                ? <div className="bg-emerald-500 p-2 rounded-full text-white"><Plus size={18} className="rotate-45" /></div>
                                                                : <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Plus size={18} /></div>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Panel der: carrito */}
                                <div className="w-full md:w-[420px] flex flex-col bg-white">
                                    <div className="p-6 border-b border-slate-100 space-y-4 shrink-0 shadow-sm">
                                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-widest flex items-center gap-2">
                                            <ShoppingCart size={18} className="text-emerald-500" /> Detalle de Venta
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="label-xs font-black text-slate-400 uppercase">Cliente</label>
                                                <select value={clientId} onChange={e => setClientId(e.target.value)} className="input-std !bg-slate-50 border-none font-bold">
                                                    <option value="">🛒 Venta General</option>
                                                    {clients.map(c => <option key={c?.id} value={c?.id}>{c?.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="label-xs font-black text-slate-400 uppercase">Fecha</label>
                                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-std !bg-slate-50 border-none font-bold" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="label-xs font-black text-slate-400 uppercase">Nota / Comprobante</label>
                                            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Ticket #502" className="input-std !bg-slate-50 border-none font-bold" />
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                                        {cart.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                                                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-4 animate-pulse">
                                                    <ShoppingBag size={56} className="text-slate-200" />
                                                </div>
                                                <p className="font-black uppercase text-xs tracking-[0.2em]">Selecciona Productos</p>
                                            </div>
                                        ) : cart.map(item => (
                                            <div key={item.productId} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 group hover:shadow-xl hover:border-emerald-200 transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl"><Tag size={16} /></div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm leading-tight">{item.productName}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Disp: {item.currentStock} {item.unitOfMeasure}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setCart(c => c.filter(x => x.productId !== item.productId)); setError(''); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X size={16} /></button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="label-xs font-black text-slate-400">Cantidad</label>
                                                        <input type="number" step="any" value={item.quantity}
                                                            onChange={e => { updateCart(item.productId, e.target.value); setError(''); }}
                                                            onFocus={(e) => e.target.select()}
                                                            className={`w-full bg-slate-50 border-2 rounded-2xl px-4 py-2.5 text-sm font-black outline-none transition-all ${Number(item.quantity) > item.currentStock && !editId ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-slate-50 focus:border-emerald-400 focus:bg-white'}`} />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="label-xs font-black text-slate-400">Precio Unitario ($)</label>
                                                        <div className="relative">
                                                            <input type="number" step="any" value={item.unitPrice}
                                                                onChange={e => updatePrice(item.productId, e.target.value)}
                                                                onFocus={(e) => e.target.select()}
                                                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-4 pr-3 py-2.5 text-sm font-black outline-none focus:border-emerald-400 focus:bg-white transition-all text-blue-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-emerald-50/50 p-3 rounded-2xl flex justify-between items-center border border-emerald-100">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Subtotal</span>
                                                    <span className="font-black text-emerald-700 text-base">${(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-8 border-t border-slate-100 space-y-4 shrink-0 bg-white">
                                        {error && (
                                            <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                                                <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                                <p className="text-xs font-bold text-rose-700">{error}</p>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">Total Venta</span>
                                            <span className="font-black text-4xl text-[#1e3a5f] tracking-tighter">${Number(grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            {editId && (
                                                <button onClick={resetForm} className="flex-1 px-4 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600">
                                                    Cancelar
                                                </button>
                                            )}
                                            <button onClick={handleSave} disabled={cart.length === 0}
                                                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-black py-4 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/20 active:scale-95">
                                                <Save size={20} /> {editId ? 'Aplicar Cambios' : 'Confirmar Registro'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Sales History View */
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <th className="px-8 py-6">Fecha / Venta</th>
                                    <th className="px-8 py-6">Referencia / Cliente</th>
                                    <th className="px-8 py-6 text-center">Productos</th>
                                    <th className="px-8 py-6 text-right">Monto Neto</th>
                                    <th className="px-8 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={16} className="text-emerald-400" />
                                                <div className="font-black text-slate-600 text-sm">{new Date(s.date).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-800 text-base leading-tight">{s.notes || 'Venta de Productos'}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <User size={10} className="text-slate-300" />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{(contacts || []).find(c => c.id === s.clientId)?.name || 'Consumidor Final'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black text-[11px] border border-emerald-100 whitespace-nowrap">
                                                {(saleItems || []).filter(i => i.saleId === s.id).length} ítems
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="font-black text-[#1e3a5f] text-lg leading-tight">${(Number(s.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(s)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Editar Venta">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={() => { if (confirm('¿Eliminar esta venta? El stock de los productos será reintegrado.')) onDeleteSale(s.id); }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Anular Venta">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sales.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest">No hay ventas registradas</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
