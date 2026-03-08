import React, { useState, useMemo } from 'react';
import { TrendingUp, Plus, X, Save, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function SalesModule({ products, contacts, onSaveSale }) {
    const [isOpen, setIsOpen] = useState(false);
    const [cart, setCart] = useState([]);
    const [clientId, setClientId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [searchProd, setSearchProd] = useState('');
    const [error, setError] = useState('');

    const finishedProducts = useMemo(() =>
        products
            .filter(p => p.productType === 'producto_terminado')
            .filter(p => p.name?.toLowerCase().includes(searchProd.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [products, searchProd]);

    const clients = useMemo(() => contacts.filter(c => c.type === 'cliente'), [contacts]);

    const addToCart = (product) => {
        if (cart.find(c => c.productId === product.id)) return;
        setCart(prev => [...prev, {
            productId: product.id,
            productName: product.name,
            unitOfMeasure: product.unitOfMeasure || 'und',
            currentStock: Number(product.currentStock || 0),
            quantity: 1,
            unitPrice: Number(product.basePrice || 0),
        }]);
        setError('');
    };

    const updateCart = (productId, value) => {
        setCart(prev => prev.map(item => {
            if (item.productId !== productId) return item;
            return { ...item, quantity: Number(value) };
        }));
    };

    const updatePrice = (productId, value) => {
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, unitPrice: Number(value) } : item
        ));
    };

    const grandTotal = cart.reduce((sum, c) => sum + (Number(c.quantity || 0) * Number(c.unitPrice || 0)), 0);

    const validateStock = () => {
        const violations = cart.filter(c => c.quantity > c.currentStock);
        if (violations.length > 0) {
            setError(`❌ Stock insuficiente: ${violations.map(v => `${v.productName} (tiene ${v.currentStock}, pide ${v.quantity})`).join('; ')}`);
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (cart.length === 0) return setError('Agrega al menos un producto');
        if (!validateStock()) return;
        const saleId = crypto.randomUUID();
        const sale = { id: saleId, clientId: clientId || null, date, total: grandTotal, status: 'completada', notes };
        const items = cart.map(c => ({
            id: crypto.randomUUID(), saleId,
            productId: c.productId,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            subtotal: c.quantity * c.unitPrice,
        }));
        const movements = cart.map(c => {
            const product = products.find(p => p.id === c.productId);
            const stockBefore = Number(product?.currentStock || 0);
            return {
                id: crypto.randomUUID(),
                productId: c.productId,
                movementType: 'VENTA',
                quantity: c.quantity,
                stockBefore,
                stockAfter: stockBefore - c.quantity,
                unitCost: product?.averageCost || 0,
                referenceId: saleId,
                referenceType: 'sale',
                notes: `Venta a cliente: ${clientId}`,
                date,
            };
        });
        onSaveSale({ sale, items, movements });
        setCart([]); setIsOpen(false); setClientId(''); setNotes(''); setError('');
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            <button onClick={() => setIsOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-3xl flex items-center justify-between transition-all shadow-lg shadow-emerald-400/20 group">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                    <div className="text-left">
                        <p className="font-black text-xl">Registrar Venta</p>
                        <p className="text-emerald-100 text-sm opacity-80">Solo Productos Terminados · Valida stock disponible</p>
                    </div>
                </div>
                <Plus size={24} />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-stretch md:items-center p-0 md:p-4">
                    <div className="bg-white md:rounded-3xl w-full max-w-4xl h-full md:h-[88vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
                        {/* Panel izq: seleccionar PT */}
                        <div className="flex-1 border-r border-slate-100 flex flex-col bg-slate-50/30">
                            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between shrink-0">
                                <p className="font-black text-lg flex items-center gap-2"><ShoppingBag size={20} /> Seleccionar Productos</p>
                                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X /></button>
                            </div>
                            <div className="p-3 border-b border-slate-200">
                                <input type="text" placeholder="Buscar producto terminado..." value={searchProd}
                                    onChange={e => setSearchProd(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {finishedProducts.map(p => {
                                    const inCart = cart.find(c => c.productId === p.id);
                                    const noStock = Number(p.currentStock || 0) <= 0;
                                    return (
                                        <div key={p.id} onClick={() => !noStock && addToCart(p)}
                                            className={`p-3 bg-white border rounded-2xl transition-all ${noStock ? 'opacity-50 cursor-not-allowed border-slate-100' : inCart ? 'border-emerald-400 bg-emerald-50 cursor-pointer' : 'border-slate-200 cursor-pointer hover:border-emerald-300 hover:shadow-sm'}`}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                                                    <p className="text-xs text-slate-400">Stock: {Number(p.currentStock || 0).toFixed(2)} {p.unitOfMeasure} · P.V: ${Number(p.basePrice || 0).toFixed(2)}</p>
                                                </div>
                                                {noStock
                                                    ? <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2 py-1 rounded-lg">SIN STOCK</span>
                                                    : inCart
                                                        ? <span className="text-emerald-600 font-black text-xs">✓</span>
                                                        : <Plus size={16} className="text-emerald-500" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Panel der: carrito */}
                        <div className="w-full md:w-[380px] flex flex-col bg-white">
                            <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
                                <div>
                                    <label className="label-xs">Cliente</label>
                                    <select value={clientId} onChange={e => setClientId(e.target.value)} className="input-std">
                                        <option value="">-- Cliente genérico --</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-xs">Fecha</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-std" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <ShoppingBag size={44} className="mb-2" />
                                        <p className="text-sm">Selecciona productos</p>
                                    </div>
                                ) : cart.map(item => (
                                    <div key={item.productId} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-[#1e3a5f] text-xs">{item.productName}</p>
                                                <p className="text-[9px] text-slate-400">Disponible: {item.currentStock} {item.unitOfMeasure}</p>
                                            </div>
                                            <button onClick={() => { setCart(c => c.filter(x => x.productId !== item.productId)); setError(''); }} className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="label-xs">Cantidad</label>
                                                <input type="number" step="0.001" min="0.001" max={item.currentStock} value={item.quantity}
                                                    onChange={e => { updateCart(item.productId, e.target.value); setError(''); }}
                                                    className={`w-full border rounded-xl px-2 py-1.5 text-xs font-black outline-none text-center ${Number(item.quantity) > item.currentStock ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="label-xs">Precio Unit. ($)</label>
                                                <div className="relative group">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black group-focus-within:text-emerald-500 transition-colors">$</span>
                                                    <input type="number" step="any" value={item.unitPrice}
                                                        onChange={e => updatePrice(item.productId, e.target.value)}
                                                        className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-black outline-none focus:border-emerald-300" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50 px-3 py-1.5 rounded-xl flex justify-between items-center">
                                            <span className="text-[9px] font-black text-emerald-700 uppercase">Subtotal:</span>
                                            <span className="font-black text-emerald-800 text-xs">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t space-y-3 shrink-0">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2 flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                        <p className="text-xs font-semibold text-rose-700">{error}</p>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-slate-700">Total:</span>
                                    <span className="font-black text-2xl text-[#1e3a5f]">${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <button onClick={handleSave} disabled={cart.length === 0}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 transition-all">
                                    <Save size={18} /> Confirmar Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
