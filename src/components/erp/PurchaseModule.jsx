import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Trash2, Save, History, Search, ShoppingBag, FlaskConical, User, DollarSign, Calendar, Calculator, ArrowRight, Tag } from 'lucide-react';

export default function PurchaseModule({ products, suppliers, purchases, purchaseItems, onSavePurchase }) {
    const [view, setView] = useState('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');

    const filteredProducts = useMemo(() =>
        products.filter(p => (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())))
        , [products, searchTerm]);

    const addToCart = (p) => {
        const existing = cart.find(item => item.productId === p.id);
        if (existing) return;
        setCart([...cart, {
            productId: p.id,
            name: p.name,
            quantity: 1,
            totalPaid: p.averageCost || 0, // Inicia con el costo actual como sugerencia
            unitCost: p.averageCost || 0,
            productType: p.productType
        }]);
    };

    const updateCartItem = (id, field, value) => {
        setCart(cart.map(item => {
            if (item.productId === id) {
                const updated = { ...item, [field]: Number(value) };
                // Autocalcular el costo unitario basado en el nuevo total pagado o cantidad
                if (updated.quantity > 0) {
                    updated.unitCost = updated.totalPaid / updated.quantity;
                }
                return updated;
            }
            return item;
        }));
    };

    const removeFromCart = (id) => setCart(cart.filter(item => item.productId !== id));

    const grandTotal = cart.reduce((sum, item) => sum + item.totalPaid, 0);

    const handleConfirmPurchase = () => {
        if (!cart.length) return alert('El carrito está vacío');

        const purchaseId = crypto.randomUUID();
        const date = new Date().toISOString();

        const purchase = {
            id: purchaseId,
            supplierId: supplierId || null,
            totalAmount: grandTotal,
            notes,
            date,
            status: 'received'
        };

        const items = cart.map(item => ({
            id: crypto.randomUUID(),
            purchaseId,
            productId: item.productId,
            quantity: Number(item.quantity),
            unitCost: Number(item.unitCost),
            totalCost: Number(item.totalPaid)
        }));

        const movements = items.map(item => {
            const p = products.find(prod => prod.id === item.productId);
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
                notes: `Compra: ${notes || 'Stock'}`,
                date
            };
        });

        onSavePurchase({ purchase, items, movements });
        setCart([]);
        setSupplierId('');
        setNotes('');
        setView('history');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-1 p-1.5 bg-slate-100 rounded-2xl w-full md:w-fit border border-slate-200">
                    <button onClick={() => setView('new')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${view === 'new' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                        NUEVA COMPRA
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
                                                <p className="text-xs font-black text-slate-700 truncate max-w-[120px]">{p.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Stock: {p.currentStock} {p.unitOfMeasure}</p>
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
                                        <div key={item.productId} className="grid grid-cols-12 gap-5 items-center p-5 bg-slate-50 hover:bg-slate-100 rounded-[2rem] border border-slate-100 transition-colors group">
                                            <div className="col-span-4">
                                                <div className="flex items-center gap-3">
                                                    <Tag size={16} className="text-slate-300" />
                                                    <div>
                                                        <p className="font-black text-slate-700 text-sm truncate">{item.name}</p>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg ${item.productType === 'materia_prima' ? 'bg-amber-200 text-amber-800' : 'bg-indigo-200 text-indigo-800'}`}>
                                                            {item.productType === 'materia_prima' ? 'Materia Prima' : 'Producto Terminado'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-[9px] font-black text-slate-400 block mb-1.5 uppercase">Monto Pagado Total</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">$</span>
                                                    <input type="number" step="any" value={item.totalPaid} onChange={(e) => updateCartItem(item.productId, 'totalPaid', e.target.value)}
                                                        className="input-std pl-7 !bg-white border-transparent shadow-sm !py-1.5 text-sm font-black text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[9px] font-black text-slate-400 block mb-1.5 uppercase">Cantidad</label>
                                                <input type="number" step="any" value={item.quantity} onChange={(e) => updateCartItem(item.productId, 'quantity', e.target.value)}
                                                    className="input-std !bg-white border-transparent shadow-sm !py-1.5 text-sm text-center font-black" />
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <label className="text-[9px] font-black text-slate-400 block mb-1.5 uppercase tracking-tighter">Costo Unitario</label>
                                                <div className="text-xs font-black text-slate-500 bg-white/50 px-2 py-2 rounded-xl flex items-center justify-end gap-1">
                                                    <Calculator size={10} className="text-slate-300" />
                                                    ${Number(item.unitCost || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <button onClick={() => removeFromCart(item.productId)} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer Cart */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-5 items-end">
                                <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                    <div className="space-y-1.5">
                                        <label className="label-xs">Proveedor Seleccionado</label>
                                        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input-std !bg-slate-50 border-none">
                                            <option value="">🛒 Proveedor General</option>
                                            {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="label-xs">Referencia / Factura</label>
                                        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Factura #9901" className="input-std !bg-slate-50 border-none" />
                                    </div>
                                </div>
                                <button
                                    disabled={cart.length === 0}
                                    onClick={handleConfirmPurchase}
                                    className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-2xl font-black shadow-xl shadow-blue-900/30 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest hover:-translate-y-1 active:scale-95"
                                >
                                    <Save size={18} /> Procesar Compra
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* History View remains similar but polished */
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <th className="px-8 py-6">Fecha / Registro</th>
                                    <th className="px-8 py-6">Detalle / Proveedor</th>
                                    <th className="px-8 py-6 text-center">Diversidad</th>
                                    <th className="px-8 py-6 text-right">Monto Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...purchases].sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={16} className="text-blue-400" />
                                                <div className="font-black text-slate-600 text-sm">{new Date(p.date).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-800 text-base">{p.notes || 'Reabastecimiento'}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <User size={10} className="text-slate-300" />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{suppliers.find(s => s.id === p.supplierId)?.name || 'General'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-[11px] border border-blue-100">
                                                {purchaseItems.filter(i => i.purchaseId === p.id).length} ítems
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-blue-600 text-lg">${Number(p.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
