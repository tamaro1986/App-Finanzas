import React, { useState, useMemo } from 'react';
import {
    Briefcase, Package, ShoppingCart, Users, TrendingUp, DollarSign,
    ArrowUpRight, ArrowDownRight, Plus, Search, Edit2, Trash2, X, AlertTriangle, Save, Calculator, FileText
} from 'lucide-react';
import { saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync';
import { useSyncNotifications } from './SyncNotification';

export default function BusinessModule({
    products, setProducts,
    contacts, setContacts,
    transactions, setTransactions,
    transactionItems, setTransactionItems
}) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { addNotification } = useSyncNotifications();

    // =============== ESTADO MODALES ===============
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [searchTermProd, setSearchTermProd] = useState('');

    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState(null);

    const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
    const [operationType, setOperationType] = useState('venta'); // 'venta' | 'compra'
    const [operationCart, setOperationCart] = useState([]);
    const [selectedContactId, setSelectedContactId] = useState('');

    // =============== CÁLCULOS KPI ===============
    const kpis = useMemo(() => {
        let totalSales = 0;
        let totalPurchases = 0;
        let cogs = 0; // Cost of Goods Sold

        transactions.forEach(tx => {
            if (tx.status === 'completada') {
                if (tx.type === 'venta') {
                    totalSales += Number(tx.totalAmount || 0);
                    // Buscar los items de esta venta para calcular el costo real de lo vendido
                    const items = transactionItems.filter(item => item.transactionId === tx.id);
                    items.forEach(item => {
                        cogs += Number(item.quantity) * Number(item.unitCost);
                    });
                } else if (tx.type === 'compra') {
                    totalPurchases += Number(tx.totalAmount || 0);
                }
            }
        });

        const grossProfit = totalSales - cogs;
        const marginPerc = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

        let inventoryValue = 0;
        products.forEach(p => {
            inventoryValue += Number(p.currentStock || 0) * Number(p.averageCost || 0);
        });

        return { totalSales, totalPurchases, grossProfit, marginPerc, inventoryValue, cogs };
    }, [transactions, transactionItems, products]);

    // Filtrado alfabético
    const sortedProducts = useMemo(() => {
        return [...products]
            .filter(p => p.name?.toLowerCase().includes(searchTermProd.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products, searchTermProd]);

    const sortedContacts = useMemo(() => [...contacts].sort((a, b) => a.name.localeCompare(b.name)), [contacts]);

    // ============================================================================
    // HANDLERS: GUARDAR DATOS (CREATE / UPDATE)
    // ============================================================================
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const markup = Number(formData.get('markup') || 0);
        const avgCost = Number(formData.get('averageCost') || 0);
        let basePrice = Number(formData.get('basePrice') || 0);

        // Si el usuario introdujo un % de markup, sugerir precio
        if (markup > 0 && avgCost > 0) {
            basePrice = avgCost * (1 + (markup / 100));
        }

        const productData = {
            id: currentProduct?.id || crypto.randomUUID(),
            sku: formData.get('sku'),
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category'),
            currentStock: Number(formData.get('currentStock') || 0),
            minStockLevel: Number(formData.get('minStockLevel') || 5),
            averageCost: avgCost,
            basePrice: basePrice,
            date: new Date().toISOString()
        };

        const isUpdating = !!currentProduct;
        const newProductsList = isUpdating
            ? products.map(p => p.id === productData.id ? productData : p)
            : [...products, productData];

        setProducts(newProductsList);
        setIsProductModalOpen(false);
        setCurrentProduct(null);

        const syncResult = await saveToSupabase('finanzas_business_products', 'finanzas_business_products', productData, newProductsList);

        if (syncResult.success) {
            addNotification(isUpdating ? 'Producto actualizado' : 'Producto creado', syncResult.savedToCloud ? 'success' : 'warning');
        } else {
            addNotification('Error al guardar producto', 'error');
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('¿Eliminar producto? Si tiene historial de ventas, podría causar errores de referencia.')) return;
        const updatedList = products.filter(p => p.id !== id);
        setProducts(updatedList);
        await deleteFromSupabase('finanzas_business_products', 'finanzas_business_products', id, updatedList);
    };

    const handleSaveContact = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const contactData = {
            id: currentContact?.id || crypto.randomUUID(),
            type: formData.get('type'),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            taxId: formData.get('taxId'),
            notes: formData.get('notes'),
            date: new Date().toISOString()
        };

        const isUpdating = !!currentContact;
        const newContactsList = isUpdating
            ? contacts.map(c => c.id === contactData.id ? contactData : c)
            : [...contacts, contactData];

        setContacts(newContactsList);
        setIsContactModalOpen(false);
        setCurrentContact(null);

        const syncResult = await saveToSupabase('finanzas_business_contacts', 'finanzas_business_contacts', contactData, newContactsList);

        if (syncResult.success) {
            addNotification(isUpdating ? 'Contacto actualizado' : 'Contacto guardado', syncResult.savedToCloud ? 'success' : 'warning');
        } else {
            addNotification('Error al guardar contacto', 'error');
        }
    };

    // Agregar/quitar item en la creación de venta/compra
    const addToOperationCart = (product) => {
        const existing = operationCart.find(item => item.productId === product.id);
        if (existing) {
            setOperationCart(operationCart.map(item =>
                item.productId === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.usedPrice } : item
            ));
        } else {
            const usedPrice = operationType === 'venta' ? product.basePrice : product.averageCost;
            setOperationCart([...operationCart, {
                productId: product.id,
                productName: product.name,
                unitCost: product.averageCost, // Siempre guardamos costo para el histórico
                usedPrice: usedPrice, // El precio o costo al que se está operando hoy
                quantity: 1,
                total: usedPrice
            }]);
        }
    };

    const handleSaveOperation = async () => {
        if (operationCart.length === 0) return alert('Agrega productos al carrito');
        if (!selectedContactId) return alert('Selecciona un cliente/proveedor');

        const txId = crypto.randomUUID();
        let grandTotal = operationCart.reduce((sum, item) => sum + item.total, 0);

        const txData = {
            id: txId,
            contactId: selectedContactId,
            type: operationType,
            status: 'completada',
            totalAmount: grandTotal,
            date: new Date().toISOString().split('T')[0],
        };

        // Crear array de items para bd
        const newItems = operationCart.map(cartItem => ({
            id: crypto.randomUUID(),
            transactionId: txId,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            unitCost: cartItem.unitCost, // Costo histórico para calcular ganancias después
            unitPrice: cartItem.usedPrice,
            total: cartItem.total
        }));

        // === ACTUALIZACIÓN REACTIVA DE INVENTARIO ===
        let updatedProducts = [...products];
        operationCart.forEach(cartItem => {
            const pIdx = updatedProducts.findIndex(p => p.id === cartItem.productId);
            if (pIdx > -1) {
                let prod = { ...updatedProducts[pIdx] };
                if (operationType === 'venta') {
                    prod.currentStock -= cartItem.quantity;
                } else if (operationType === 'compra') {
                    // Recalcular costo promedio
                    const currentTotalValue = prod.currentStock * prod.averageCost;
                    const newPurchasedValue = cartItem.quantity * cartItem.usedPrice; // Aquí el usedPrice es de compra
                    const newTotalStock = prod.currentStock + cartItem.quantity;

                    prod.currentStock = newTotalStock;
                    prod.averageCost = newTotalStock > 0 ? (currentTotalValue + newPurchasedValue) / newTotalStock : 0;
                }
                updatedProducts[pIdx] = prod;
                // Guardar actualización de inventario silenciosamente en el backend
                saveToSupabase('finanzas_business_products', 'finanzas_business_products', prod, updatedProducts);
            }
        });
        setProducts(updatedProducts);

        // Guardar Encabezado
        const newTxList = [...transactions, txData];
        setTransactions(newTxList);
        await saveToSupabase('finanzas_business_transactions', 'finanzas_business_transactions', txData, newTxList);

        // Guardar Detalle (esto en un ERP avanzado se hace en bloque, aquí iteramos o confiamos en el sync)
        const newGlobalItemsList = [...transactionItems, ...newItems];
        setTransactionItems(newGlobalItemsList);

        // Loop simple para guardar a supabase. El último disparará notificación.
        let finalSyncRes;
        for (const item of newItems) {
            finalSyncRes = await saveToSupabase('finanzas_business_transaction_items', 'finanzas_business_transaction_items', item, newGlobalItemsList);
        }

        if (finalSyncRes.success) {
            addNotification(`${operationType === 'venta' ? 'Venta' : 'Compra'} registrada con éxito`, finalSyncRes.savedToCloud ? 'success' : 'warning');
        } else {
            addNotification('Error al registrar operación', 'error');
        }

        setIsOperationModalOpen(false);
        setOperationCart([]);
    };


    // ============================================================================
    // RENDERIZADOS: TABS
    // ============================================================================

    return (
        <div className="space-y-6 pb-20">
            {/* Header Módulo */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100 to-transparent rounded-full opacity-50 -mr-20 -mt-20 z-0"></div>
                <div className="z-10 relative">
                    <h1 className="text-3xl font-extrabold text-[#1e3a5f] flex items-center gap-3">
                        <Briefcase className="text-blue-600" size={32} />
                        Centro de Negocio
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión integral de inventario, TPV y rentabilidad</p>
                </div>
            </div>

            {/* Navegación Tabs */}
            <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-200 max-w-2xl overflow-x-auto scroller-hidden">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                    { id: 'inventory', label: 'Inventario', icon: Package },
                    { id: 'operations', label: 'Ventas / Compras', icon: ShoppingCart },
                    { id: 'contacts', label: 'Contactos', icon: Users }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
                            }`}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ================= TAB: DASHBOARD ================= */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard title="Ventas Totales" amount={kpis.totalSales} icon={ArrowUpRight} color="text-emerald-600" bg="bg-emerald-100" />
                        <KPICard title="Ganancia Bruta" amount={kpis.grossProfit} subtitle={`Margen: ${kpis.marginPerc.toFixed(1)}%`} icon={DollarSign} color="text-amber-600" bg="bg-amber-100" />
                        <KPICard title="Costo Invertido (COGS)" amount={kpis.cogs} icon={FileText} color="text-slate-600" bg="bg-slate-100" />
                        <KPICard title="Activo en Inventario" amount={kpis.inventoryValue} icon={Package} color="text-blue-600" bg="bg-blue-100" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-[#1e3a5f] mb-4 text-lg">Alertas de Inventario Bajo</h3>
                            <div className="space-y-3">
                                {products.filter(p => p.currentStock <= p.minStockLevel).length === 0 && (
                                    <p className="text-slate-500 text-sm">El stock está en niveles óptimos.</p>
                                )}
                                {products.filter(p => p.currentStock <= p.minStockLevel).map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="text-rose-500" size={18} />
                                            <span className="font-semibold text-rose-900">{p.name}</span>
                                        </div>
                                        <span className="text-rose-700 font-bold">{p.currentStock} unds</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= TAB: INVENTARIO ================= */}
            {activeTab === 'inventory' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="relative flex-1 w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar en inventario..."
                                value={searchTermProd}
                                onChange={(e) => setSearchTermProd(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={() => { setCurrentProduct(null); setIsProductModalOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
                        >
                            <Plus size={20} /> Nuevo Producto
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-100 text-slate-400 text-sm uppercase tracking-wider">
                                    <th className="pb-3 pl-2 font-semibold">SKU / Producto</th>
                                    <th className="pb-3 text-right font-semibold">Stock</th>
                                    <th className="pb-3 text-right font-semibold">Costo Prom.</th>
                                    <th className="pb-3 text-right font-semibold">Precio Venta</th>
                                    <th className="pb-3 font-semibold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedProducts.map((p, i) => (
                                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-2">
                                            <div className="font-bold text-[#1e3a5f]">{p.name}</div>
                                            <div className="text-xs text-slate-400">{p.sku || 'Sin SKU'} • {p.category || 'Sin Cat'}</div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className={`font-semibold px-2 py-0.5 rounded-md ${p.currentStock <= p.minStockLevel ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {p.currentStock}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right text-slate-600 font-medium">$ {Number(p.averageCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-4 text-right text-slate-900 font-bold">$ {Number(p.basePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-4 text-center">
                                            <button onClick={() => { setCurrentProduct(p); setIsProductModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg ml-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ================= TAB: OPERACIONES ================= */}
            {activeTab === 'operations' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => { setOperationType('venta'); setOperationCart([]); setSelectedContactId(''); setIsOperationModalOpen(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 group"
                        >
                            <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={32} /></div>
                            <span className="font-bold text-xl">Registrar Venta</span>
                            <span className="text-emerald-100 text-sm font-medium opacity-80">Resta inventario, genera ganancia</span>
                        </button>

                        <button
                            onClick={() => { setOperationType('compra'); setOperationCart([]); setSelectedContactId(''); setIsOperationModalOpen(true); }}
                            className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all shadow-lg shadow-amber-500/20 group"
                        >
                            <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-110 transition-transform"><Package size={32} /></div>
                            <span className="font-bold text-xl">Abastecer Inventario (Compra)</span>
                            <span className="text-amber-100 text-sm font-medium opacity-80">Suma inventario, promedia costo</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-[#1e3a5f] mb-4 text-lg">Historial Reciente</h3>
                        <div className="space-y-3">
                            {transactions.slice().reverse().slice(0, 10).map(tx => {
                                const contact = contacts.find(c => c.id === tx.contactId);
                                const isSale = tx.type === 'venta';
                                return (
                                    <div key={tx.id} className={`p-4 rounded-2xl border flex items-center justify-between ${isSale ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${isSale ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {isSale ? <ShoppingCart size={20} /> : <Package size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{isSale ? 'Venta a:' : 'Compra a:'} {contact?.name || 'Cliente Genérico'}</p>
                                                <p className="text-sm text-slate-500">{tx.date}</p>
                                            </div>
                                        </div>
                                        <div className={`font-bold text-lg ${isSale ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {isSale ? '+' : '-'} $ {Number(tx.totalAmount || 0).toLocaleString('en-US')}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ================= TAB: CONTACTOS ================= */}
            {activeTab === 'contacts' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#1e3a5f]">Directorio de Contactos</h2>
                        <button
                            onClick={() => { setCurrentContact(null); setIsContactModalOpen(true); }}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium"
                        >
                            <Plus size={18} /> Nuevo Contacto
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {sortedContacts.map(c => (
                            <div key={c.id} className="p-4 border border-slate-200 rounded-2xl flex flex-col gap-2 hover:border-blue-300 transition-colors group cursor-pointer" onClick={() => { setCurrentContact(c); setIsContactModalOpen(true); }}>
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider ${c.type === 'cliente' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {c.type}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 text-slate-400">
                                        <Edit2 size={14} />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#1e3a5f] text-lg">{c.name}</h4>
                                    <p className="text-sm text-slate-500">{c.phone || c.email || 'Sin datos de contacto'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* ================= MODALES ================= */}

            {/* Modal Producto */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-[#1e3a5f] text-lg">{currentProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-1"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre *</label>
                                    <input required type="text" name="name" defaultValue={currentProduct?.name} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">SKU / Código</label>
                                    <input type="text" name="sku" defaultValue={currentProduct?.sku} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Categoría</label>
                                <input type="text" name="category" defaultValue={currentProduct?.category} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                <h4 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2"><Calculator size={16} /> Estrategia de Precio</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Promedio ($)</label>
                                        <input type="number" step="0.01" name="averageCost" defaultValue={currentProduct?.averageCost || 0} className="w-full bg-white p-2 rounded-lg border border-slate-200" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Margen Deseado (%)</label>
                                        <input type="number" step="1" name="markup" placeholder="Ej: 30" className="w-full bg-white p-2 rounded-lg border border-slate-200 text-blue-700 font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-extrabold text-[#1e3a5f] mb-1">Precio Final ($)</label>
                                        <input type="number" step="0.01" name="basePrice" defaultValue={currentProduct?.basePrice || 0} className="w-full bg-white p-2 rounded-lg border-2 border-[#1e3a5f] shadow-inner font-bold" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic">Si ingresas un margen %, el Precio Final se sobreescribirá usando: Costo + (Costo * Margen/100).</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Stock Actual</label>
                                    <input type="number" name="currentStock" defaultValue={currentProduct?.currentStock || 0} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Stock Mínimo (Alerta)</label>
                                    <input type="number" name="minStockLevel" defaultValue={currentProduct?.minStockLevel || 5} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 pt-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2">
                                <Save size={20} /> Guardar Producto
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Contacto (Similar, simplificado para ahorrar espacio) */}
            {isContactModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-[#1e3a5f] text-lg">{currentContact ? 'Editar' : 'Nuevo'} Contacto</h3>
                            <button onClick={() => setIsContactModalOpen(false)} className="text-slate-400"><X /></button>
                        </div>
                        <form onSubmit={handleSaveContact} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Tipo de Entidad</label>
                                <select name="type" defaultValue={currentContact?.type || 'cliente'} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    <option value="cliente">Cliente</option>
                                    <option value="proveedor">Proveedor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">Nombre / Razón Social *</label>
                                <input required type="text" name="name" defaultValue={currentContact?.name} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" name="phone" placeholder="Teléfono" defaultValue={currentContact?.phone} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                                <input type="text" name="taxId" placeholder="NIT / Cédula" defaultValue={currentContact?.taxId} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200" />
                            </div>
                            <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg mt-2">Guardar Entidad</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de OPERACIÓN (TPV) */}
            {isOperationModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-stretch md:items-center p-0 md:p-4">
                    <div className="bg-white md:rounded-3xl shadow-2xl w-full max-w-5xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden">

                        {/* Izquierda: Buscador de productos */}
                        <div className="flex-1 border-r border-slate-100 flex flex-col bg-slate-50/50">
                            <div className={`p-5 text-white font-bold text-lg flex items-center justify-between ${operationType === 'venta' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                                <div className="flex items-center gap-2">
                                    {operationType === 'venta' ? <ShoppingCart /> : <Package />}
                                    Registrar {operationType === 'venta' ? 'Venta' : 'Compra'}
                                </div>
                                <button onClick={() => setIsOperationModalOpen(false)} className="text-white/80 hover:text-white"><X /></button>
                            </div>

                            <div className="p-4 border-b border-slate-200">
                                <Search className="absolute ml-3 mt-2.5 text-slate-400" size={18} />
                                <input type="text" placeholder="Buscar producto para agregar..."
                                    value={searchTermProd} onChange={e => setSearchTermProd(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {sortedProducts.map(p => (
                                    <div key={p.id} onClick={() => addToOperationCart(p)} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 cursor-pointer transition-all hover:shadow-md">
                                        <div>
                                            <p className="font-bold text-slate-800">{p.name}</p>
                                            <p className="text-xs text-slate-500">Stock actual: {p.currentStock}</p>
                                        </div>
                                        <div className="font-bold text-[#1e3a5f]">$ {operationType === 'venta' ? p.basePrice : p.averageCost}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Derecha: Carrito y Check-out */}
                        <div className="w-full md:w-[400px] flex flex-col bg-white">
                            <div className="p-5 border-b border-slate-100 flex-shrink-0">
                                <label className="block text-sm font-semibold text-slate-600 mb-1">
                                    {operationType === 'venta' ? 'Seleccionar Cliente' : 'Seleccionar Proveedor'}
                                </label>
                                <select
                                    value={selectedContactId}
                                    onChange={e => setSelectedContactId(e.target.value)}
                                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium font-sans text-[#1e3a5f]"
                                >
                                    <option value="">Seleccione o cree uno primero...</option>
                                    {contacts.filter(c => c.type === (operationType === 'venta' ? 'cliente' : 'proveedor')).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50 font-sans">
                                {operationCart.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                        <ShoppingCart size={48} className="mb-2" />
                                        <p>Agrega productos a la lista</p>
                                    </div>
                                )}
                                {operationCart.map((item, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm text-[#1e3a5f] truncate w-40">{item.productName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <input type="number" value={item.quantity} readOnly className="w-12 text-center bg-slate-100 rounded text-xs font-bold py-1" />
                                                <span className="text-xs text-slate-500">x ${item.usedPrice}</span>
                                            </div>
                                        </div>
                                        <div className="font-bold text-slate-800">
                                            $ {item.total}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 border-t border-slate-200 bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-500 font-bold">TOTAL</span>
                                    <span className="text-3xl font-extrabold text-[#1e3a5f]">
                                        $ {operationCart.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-US')}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSaveOperation}
                                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all ${operationType === 'venta' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                                        }`}
                                >
                                    Confirmar {operationType === 'venta' ? 'Venta' : 'Compra'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ title, amount, subtitle, icon: Icon, color, bg }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{title}</p>
                <p className={`text-2xl font-extrabold ${color}`}>$ {Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>
                {subtitle && <p className="text-xs font-semibold mt-1 text-slate-400">{subtitle}</p>}
            </div>
        </div>
    );
}
