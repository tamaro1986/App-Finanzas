import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, LayoutDashboard, Scale, ShoppingCart, FlaskConical, Factory, TrendingUp, Activity, Users, ShoppingBag, Menu, X, Package, User, Plus, Edit3, Trash2, Search, Calculator, DollarSign, Percent } from 'lucide-react';
import { saveToSupabase, deleteFromSupabase, getUserId } from '../../shared/lib/supabaseSync';
import { useSyncNotifications } from '../../shared/contexts/SyncNotification';
import { supabase } from '../../shared/lib/supabase';

import DashboardERP from './DashboardERP';
import CatalogModule from './CatalogModule';
import PurchaseModule from './PurchaseModule';
import ProductionOrders from './ProductionOrders';
import SalesModule from './SalesModule';
import KardexReport from './KardexReport';

// ============ CSS UTILITY CLASSES ============
const styles = `
.label-xs { display: block; font-size: 0.625rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.25rem; }
.input-std { width: 100%; background: #f8fafc; padding: 0.5rem 0.8rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; font-size: 0.825rem; font-weight: 600; outline: none; transition: border-color 0.15s; }
.input-std:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
`;

const TABS = [
    { id: 'dashboard', label: 'Resumen', Icon: LayoutDashboard },
    { id: 'catalog', label: 'Catálogo e Inventario', Icon: Package },
    { id: 'purchases', label: 'Compras', Icon: ShoppingCart },
    { id: 'production', label: 'Fabricación', Icon: Factory },
    { id: 'sales', label: 'Ventas', Icon: TrendingUp },
    { id: 'kardex', label: 'Kardex', Icon: Activity },
    { id: 'contacts', label: 'Directorio', Icon: Users },
];

// ============ Weighted Average Cost (WAC) engine ============
function calcWAC(currentStock = 0, currentCost = 0, newQty = 0, newUnitCost = 0) {
    const totalStock = Number(currentStock || 0) + Number(newQty || 0);
    if (totalStock <= 0) return Number(newUnitCost || 0);
    const prevVal = Number(currentStock || 0) * Number(currentCost || 0);
    const newVal = Number(newQty || 0) * Number(newUnitCost || 0);
    return (prevVal + newVal) / totalStock;
}

export default function BusinessModule({
    // Main Finance State
    transactions, setTransactions,
    accounts, setAccounts,
    // Products & contacts
    products, setProducts,
    contacts, setContacts,
    // ERP state
    bizSuppliers, setBizSuppliers,
    bizPurchases, setBizPurchases,
    bizPurchaseItems, setBizPurchaseItems,
    bizSales, setBizSales,
    bizSaleItems, setBizSaleItems,
    bizRecipes, setBizRecipes,
    bizRecipeItems, setBizRecipeItems,
    bizProductionOrders, setBizProductionOrders,
    bizMovements, setBizMovements,
}) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileTabOpen, setMobileTabOpen] = useState(false);
    const { addNotification } = useSyncNotifications();

    useEffect(() => {
        if (!document.getElementById('erp-global-styles')) {
            const s = document.createElement('style'); s.id = 'erp-global-styles'; s.textContent = styles;
            document.head.appendChild(s);
        }

        // Sanitize existing products if they have 'date' (migration for PGRST204 error)
        if (products && products.some(p => p.hasOwnProperty('date'))) {
            const clean = products.map(({ date, ...rest }) => rest);
            setProducts(clean);
            localStorage.setItem('finanzas_biz_products', JSON.stringify(clean));
            console.log('ERP: Products sanitized (removed "date" column for compatibility)');
        }
    }, [products, setProducts]);

    // ====== PRODUCT CRUD (MP & PT) ======
    const handleSaveProduct = useCallback(async (data) => {
        // Recalculate price if PT and markup exists
        if (data.productType === 'producto_terminado' && data.markupPercentage !== undefined) {
            data.basePrice = Number(data.averageCost || 0) * (1 + (data.markupPercentage / 100));
        }

        const next = products.some(p => p.id === data.id)
            ? products.map(p => p.id === data.id ? { ...p, ...data } : p)
            : [...products, data];
        setProducts(next);
        const sanitized = {
            id: data.id,
            sku: data.sku,
            name: data.name,
            product_type: data.productType,
            unit_of_measure: data.unitOfMeasure,
            current_stock: Number(data.currentStock || 0),
            average_cost: Number(data.averageCost || 0),
            base_price: Number(data.basePrice || 0),
            min_stock_level: Number(data.minStock || 0),
            status: data.status || 'active'
        };

        if (data.hasOwnProperty('markupPercentage')) {
            sanitized.markup_percentage = Number(data.markupPercentage);
        }

        const result = await saveToSupabase('finanzas_business_products', 'finanzas_biz_products', sanitized, next);
        addNotification(result.savedToCloud ? 'Producto guardado' : 'Guardado localmente', result.savedToCloud ? 'success' : 'warning');
    }, [products, setProducts, addNotification]);

    const handleDeleteProduct = useCallback(async (id) => {
        const next = products.filter(p => p.id !== id);
        setProducts(next);
        await deleteFromSupabase('finanzas_business_products', 'finanzas_biz_products', id, next);
        addNotification('Producto eliminado', 'info');
    }, [products, setProducts, addNotification]);

    // ====== PURCHASE with WAC (MP & Purchased PT) ======
    // ====== PURCHASE with WAC (MP & Purchased PT) ======
    const handleSavePurchase = useCallback(async ({ purchase, items, movements, financeTx }) => {
        const isUpdate = bizPurchases.some(p => p.id === purchase.id);
        const currentProducts = products || [];

        // 0. Si es ACTUALIZACIÓN, revertimos primero el stock antiguo
        let baseProductsForCalc = [...currentProducts];
        if (isUpdate) {
            const oldItems = bizPurchaseItems.filter(i => i.purchaseId === purchase.id);
            baseProductsForCalc = baseProductsForCalc.map(p => {
                const oldItem = oldItems.find(oi => oi.productId === p.id);
                if (!oldItem) return p;
                return { ...p, currentStock: Number(p.currentStock || 0) - Number(oldItem.quantity || 0) };
            });
        }

        // 1. Calcular nuevos estados de productos con WAC
        const finalProductsList = baseProductsForCalc.map(p => {
            const item = items.find(i => i.productId === p.id);
            if (!item) return p;

            const buyQty = Number(item.quantity) || 0;
            const buyUnitCost = Number(item.unitCost) || 0;
            const newStock = Number(p.currentStock || 0) + buyQty;
            const newAvgCost = calcWAC(p.currentStock, p.averageCost, buyQty, buyUnitCost);

            let basePrice = p.basePrice || 0;
            if (p.productType === 'producto_terminado' && p.markupPercentage) {
                basePrice = newAvgCost * (1 + (Number(p.markupPercentage) / 100));
            }

            return {
                ...p,
                currentStock: Number(newStock.toFixed(4)),
                averageCost: Number(newAvgCost.toFixed(4)),
                basePrice: Number(Number(basePrice).toFixed(2))
            };
        });

        // 2. Actualizar Estados Locales
        const nextPurchases = isUpdate ? (bizPurchases || []).map(p => p.id === purchase.id ? purchase : p) : [...(bizPurchases || []), purchase];
        const nextItems = isUpdate ? [...(bizPurchaseItems || []).filter(i => i.purchaseId !== purchase.id), ...items] : [...(bizPurchaseItems || []), ...items];
        const nextMovements = isUpdate ? [...(bizMovements || []).filter(m => m.referenceId !== purchase.id || (m.referenceId === purchase.id && m.referenceType !== 'purchase')), ...movements] : [...(bizMovements || []), ...movements];

        // 2. Actualizar Estados Locales
        setProducts(finalProductsList);
        setBizPurchases(nextPurchases);
        setBizPurchaseItems(nextItems);
        setBizMovements(nextMovements);

        // 3. Integración con Finanzas (Simplificado)
        // Se puede añadir lógica aquí si se requiere pago automático

        // 4. Sincronizar a Cloud
        try {
            if (isUpdate) {
                await supabase.from('finanzas_biz_purchase_items').delete().eq('purchase_id', purchase.id);
                await supabase.from('finanzas_biz_inventory_movements').delete().eq('reference_id', purchase.id).eq('reference_type', 'purchase');
            }

            await saveToSupabase('finanzas_biz_purchases', 'finanzas_biz_purchases_local', purchase, nextPurchases);
            for (const item of items) await saveToSupabase('finanzas_biz_purchase_items', 'finanzas_biz_purchase_items_local', item, nextItems);
            for (const mov of movements) await saveToSupabase('finanzas_biz_inventory_movements', 'finanzas_biz_movements_local', mov, nextMovements);

            // Sincronizar productos afectados
            const affectedProds = finalProductsList.filter(p => items.some(i => i.productId === p.id) || (isUpdate && bizPurchaseItems.some(oi => oi.purchaseId === purchase.id && oi.productId === p.id)));
            for (const prod of affectedProds) {
                const sprod = {
                    id: prod.id,
                    sku: prod.sku || '',
                    name: prod.name || 'Sin nombre',
                    product_type: prod.productType,
                    unit_of_measure: prod.unitOfMeasure,
                    current_stock: Number(prod.currentStock || 0),
                    average_cost: Number(prod.averageCost || 0),
                    base_price: Number(prod.basePrice || 0),
                    min_stock_level: Number(prod.minStock || 0),
                    status: prod.status || 'active',
                    markup_percentage: Number(prod.markupPercentage || 0)
                };
                await saveToSupabase('finanzas_business_products', 'finanzas_biz_products', sprod, finalProductsList);
            }
            addNotification(isUpdate ? 'Compra actualizada' : 'Compra registrada', 'success');
        } catch (e) {
            console.error("ERP Purchase Sync Error:", e);
            addNotification('Sincronización pendiente', 'warning');
        }
    }, [products, setProducts, bizPurchases, setBizPurchases, bizPurchaseItems, setBizPurchaseItems, bizMovements, setBizMovements, addNotification]);

    const handleDeletePurchase = useCallback(async (id) => {
        const purchase = bizPurchases.find(p => p.id === id);
        if (!purchase) return;

        const items = bizPurchaseItems.filter(i => i.purchaseId === id);

        // Revertir Stock
        const nextProducts = products.map(p => {
            const item = items.find(i => i.productId === p.id);
            if (!item) return p;
            return { ...p, currentStock: Math.max(0, Number(p.currentStock || 0) - Number(item.quantity)) };
        });

        // Actualizar Estados locales
        const nextPurchases = (bizPurchases || []).filter(p => p.id !== id);
        const nextItems = (bizPurchaseItems || []).filter(i => i.purchaseId !== id);
        const nextMovements = (bizMovements || []).filter(m => !(m.referenceId === id && m.referenceType === 'purchase'));

        setProducts(nextProducts);
        setBizPurchases(nextPurchases);
        setBizPurchaseItems(nextItems);
        setBizMovements(nextMovements);

        // Cloud Delete
        try {
            await deleteFromSupabase('finanzas_biz_purchases', 'finanzas_biz_purchases_local', id, nextPurchases);
            localStorage.setItem('finanzas_biz_purchase_items_local', JSON.stringify(nextItems));
            localStorage.setItem('finanzas_biz_movements_local', JSON.stringify(nextMovements));

            await supabase.from('finanzas_biz_purchase_items').delete().eq('purchase_id', id);
            await supabase.from('finanzas_biz_inventory_movements').delete().eq('reference_id', id).eq('reference_type', 'purchase');

            // Sync products
            for (const prod of nextProducts.filter(p => items.some(i => i.productId === p.id))) {
                await saveToSupabase('finanzas_business_products', 'finanzas_biz_products', prod, nextProducts);
            }
            addNotification('Compra eliminada y Stock revertido', 'info');
        } catch (e) { addNotification('Eliminado localmente', 'warning'); }
    }, [products, bizPurchases, bizPurchaseItems, setProducts, setBizPurchases, setBizPurchaseItems, setBizMovements, addNotification]);

    // ====== PRODUCTION ORDER (WAC based on materials) ======
    const handleSaveOrder = useCallback(async ({ orderData, materialCheck, product }) => {
        // Calculate production unit cost from materials
        const actualTotalBatchCost = materialCheck.reduce((sum, m) => sum + (m.needed * (m.mp?.averageCost || 0)), 0);
        const productionUnitCost = actualTotalBatchCost / Number(orderData.quantityToProduce);

        const updatedProducts = products.map(p => {
            const matCheck = materialCheck.find(m => m.rawMaterialId === p.id);
            if (matCheck) return { ...p, currentStock: Number(p.currentStock || 0) - Number(matCheck.needed) };

            if (p.id === orderData.productId) {
                const newStock = Number(p.currentStock || 0) + Number(orderData.quantityToProduce);
                const newAvgCost = calcWAC(p.currentStock, p.averageCost, orderData.quantityToProduce, productionUnitCost);

                let basePrice = p.basePrice || 0;
                const markup = Number(p.markupPercentage) || 0;
                if (markup > 0) {
                    basePrice = newAvgCost * (1 + (markup / 100));
                }
                return {
                    ...p,
                    currentStock: Number(newStock.toFixed(4)),
                    averageCost: Number(newAvgCost.toFixed(4)),
                    basePrice: Number(Number(basePrice).toFixed(2))
                };
            }
            return p;
        });
        setProducts(updatedProducts);

        const salida = materialCheck.map(m => ({
            id: crypto.randomUUID(), productId: m.rawMaterialId, movementType: 'PRODUCCION_SALIDA',
            quantity: m.needed, stockBefore: m.available, stockAfter: m.available - m.needed,
            unitCost: m.mp?.averageCost || 0, referenceId: orderData.id, referenceType: 'production_order',
            notes: `Fábrica: ${orderData.id.slice(0, 8)}`, date: orderData.date,
        }));

        const ptProduct = updatedProducts.find(p => p.id === orderData.productId);
        const entrada = [{
            id: crypto.randomUUID(), productId: orderData.productId, movementType: 'PRODUCCION_ENTRADA',
            quantity: Number(orderData.quantityToProduce), stockBefore: Number(product?.currentStock || 0),
            stockAfter: Number(product?.currentStock || 0) + Number(orderData.quantityToProduce),
            unitCost: Number(productionUnitCost.toFixed(4)), referenceId: orderData.id, referenceType: 'production_order',
            notes: `Ingreso PT Manufacturado`, date: orderData.date,
        }];

        const newOrders = [...(bizProductionOrders || []), orderData];
        const newMovements = [...(bizMovements || []), ...salida, ...entrada];
        setBizProductionOrders(newOrders);
        setBizMovements(newMovements);

        try {
            await saveToSupabase('finanzas_biz_production_orders', 'finanzas_biz_prod_orders_local', orderData, newOrders);
            for (const mov of [...salida, ...entrada]) await saveToSupabase('finanzas_biz_inventory_movements', 'finanzas_biz_movements_local', mov, newMovements);
            for (const prod of updatedProducts.filter(p => materialCheck.find(m => m.rawMaterialId === p.id) || p.id === orderData.productId)) {
                const sprod = {
                    id: prod.id,
                    sku: prod.sku,
                    name: prod.name,
                    product_type: prod.productType,
                    unit_of_measure: prod.unitOfMeasure,
                    current_stock: Number(prod.currentStock || 0),
                    average_cost: Number(prod.averageCost || 0),
                    base_price: Number(prod.basePrice || 0),
                    min_stock_level: Number(prod.minStock || 0),
                    markup_percentage: Number(prod.markupPercentage || 0),
                    status: prod.status || 'active'
                };
                await saveToSupabase('finanzas_business_products', 'finanzas_biz_products', sprod, updatedProducts);
            }
            addNotification(`Fabricación finalizada (${orderData.quantityToProduce} und)`, 'success');
        } catch (e) {
            addNotification('Guardado localmente', 'warning');
        }
    }, [products, setProducts, bizProductionOrders, setBizProductionOrders, bizMovements, setBizMovements, addNotification]);

    const handleDeleteOrder = useCallback(async (orderId) => {
        const order = bizProductionOrders.find(o => o.id === orderId);
        if (!order) return;

        // Revertir Stock
        const affectedMovements = bizMovements.filter(m => m.referenceId === orderId && (m.movementType === 'PRODUCCION_SALIDA' || m.movementType === 'PRODUCCION_ENTRADA'));

        const nextProducts = products.map(p => {
            const outMov = affectedMovements.find(m => m.productId === p.id && m.movementType === 'PRODUCCION_SALIDA');
            const inMov = affectedMovements.find(m => m.productId === p.id && m.movementType === 'PRODUCCION_ENTRADA');

            let stock = Number(p.currentStock || 0);
            if (outMov) stock += Number(outMov.quantity); // Devolver MP
            if (inMov) stock -= Number(inMov.quantity);  // Quitar PT

            return { ...p, currentStock: stock };
        });

        const nextOrders = (bizProductionOrders || []).filter(o => o.id !== orderId);
        const nextMovements = (bizMovements || []).filter(m => m.referenceId !== orderId || (m.movementType !== 'PRODUCCION_SALIDA' && m.movementType !== 'PRODUCCION_ENTRADA'));

        setProducts(nextProducts);
        setBizProductionOrders(nextOrders);
        setBizMovements(nextMovements);

        try {
            await deleteFromSupabase('finanzas_biz_production_orders', 'finanzas_biz_prod_orders_local', orderId, nextOrders);
            localStorage.setItem('finanzas_biz_movements_local', JSON.stringify(nextMovements));

            await supabase.from('finanzas_biz_inventory_movements').delete().eq('reference_id', orderId).in('movement_type', ['PRODUCCION_SALIDA', 'PRODUCCION_ENTRADA']);

            for (const prod of nextProducts.filter(p => affectedMovements.some(m => m.productId === p.id))) {
                await saveToSupabase('finanzas_business_products', 'finanzas_biz_products', prod, nextProducts);
            }
            addNotification('Orden anulada y Stock revertido', 'info');
        } catch (e) { addNotification('Anulado localmente', 'warning'); }
    }, [products, setProducts, bizProductionOrders, setBizProductionOrders, bizMovements, setBizMovements, addNotification]);

    // ====== SALES & CONTACTS ======
    const handleSaveSale = useCallback(async ({ sale, items, movements }) => {
        const isUpdate = bizSales.some(s => s.id === sale.id);
        const currentProducts = products || [];

        // 0. Revertir stock si es actualización
        let baseProducts = [...currentProducts];
        if (isUpdate) {
            const oldItems = bizSaleItems.filter(i => i.saleId === sale.id);
            baseProducts = baseProducts.map(p => {
                const old = oldItems.find(oi => oi.productId === p.id);
                if (!old) return p;
                return { ...p, currentStock: Number(p.currentStock || 0) + Number(old.quantity || 0) };
            });
        }

        // 1. Aplicar nueva venta
        const finalProducts = baseProducts.map(p => {
            const item = items.find(i => i.productId === p.id);
            if (!item) return p;
            return { ...p, currentStock: Number(p.currentStock || 0) - Number(item.quantity) };
        });

        const newSales = isUpdate ? bizSales.map(s => s.id === sale.id ? sale : s) : [...(bizSales || []), sale];
        const newItems = isUpdate ? [...(bizSaleItems || []).filter(i => i.saleId !== sale.id), ...items] : [...(bizSaleItems || []), ...items];
        const newMovements = isUpdate ? [...(bizMovements || []).filter(m => m.referenceId !== sale.id || (m.referenceId === sale.id && m.referenceType !== 'sale')), ...movements] : [...(bizMovements || []), ...movements];

        setProducts(finalProducts);
        setBizSales(newSales);
        setBizSaleItems(newItems);
        setBizMovements(newMovements);

        try {
            if (isUpdate) {
                await supabase.from('finanzas_biz_sale_items').delete().eq('sale_id', sale.id);
                await supabase.from('finanzas_biz_inventory_movements').delete().eq('reference_id', sale.id).eq('reference_type', 'sale');
            }

            await saveToSupabase('finanzas_biz_sales', 'finanzas_biz_sales_local', sale, newSales);
            for (const it of items) await saveToSupabase('finanzas_biz_sale_items', 'finanzas_biz_sale_items_local', it, newItems);
            for (const mov of movements) await saveToSupabase('finanzas_biz_inventory_movements', 'finanzas_biz_movements_local', mov, newMovements);

            // Sync prods
            const affected = finalProducts.filter(p => items.some(i => i.productId === p.id) || (isUpdate && oldItems.some(oi => oi.productId === p.id)));
            for (const prod of affected) {
                const sprod = {
                    id: prod.id,
                    sku: prod.sku,
                    name: prod.name,
                    product_type: prod.productType,
                    unit_of_measure: prod.unitOfMeasure,
                    current_stock: Number(prod.currentStock || 0),
                    average_cost: Number(prod.averageCost || 0),
                    base_price: Number(prod.basePrice || 0),
                    min_stock_level: Number(prod.minStock || 0),
                    markup_percentage: Number(prod.markupPercentage || 0),
                    status: prod.status || 'active'
                };
                await saveToSupabase('finanzas_business_products', 'finanzas_biz_products', sprod, finalProducts);
            }
            addNotification(isUpdate ? 'Venta actualizada' : 'Venta registrada', 'success');
        } catch (e) { addNotification('Sincronización pendiente', 'warning'); }
    }, [products, setProducts, bizSales, setBizSales, bizSaleItems, setBizSaleItems, bizMovements, setBizMovements, addNotification]);

    const handleDeleteSale = useCallback(async (id) => {
        const sale = bizSales.find(s => s.id === id);
        if (!sale) return;

        const items = bizSaleItems.filter(i => i.saleId === id);

        // Revertir Stock
        const nextProducts = products.map(p => {
            const item = items.find(i => i.productId === p.id);
            if (!item) return p;
            return { ...p, currentStock: Number(p.currentStock || 0) + Number(item.quantity) };
        });

        const nextSales = (bizSales || []).filter(s => s.id !== id);
        const nextItems = (bizSaleItems || []).filter(i => i.saleId !== id);
        const nextMovements = (bizMovements || []).filter(m => !(m.referenceId === id && m.referenceType === 'sale'));

        setProducts(nextProducts);
        setBizSales(nextSales);
        setBizSaleItems(nextItems);
        setBizMovements(nextMovements);

        try {
            await deleteFromSupabase('finanzas_biz_sales', 'finanzas_biz_sales_local', id, nextSales);
            // Actualizar localmente items y movimientos también
            localStorage.setItem('finanzas_biz_sale_items_local', JSON.stringify(nextItems));
            localStorage.setItem('finanzas_biz_movements_local', JSON.stringify(nextMovements));

            await supabase.from('finanzas_biz_sale_items').delete().eq('sale_id', id);
            await supabase.from('finanzas_biz_inventory_movements').delete().eq('reference_id', id).eq('reference_type', 'sale');

            for (const prod of nextProducts.filter(p => items.some(i => i.productId === p.id))) {
                await saveToSupabase('finanzas_business_products', 'finanzas_biz_products', prod, nextProducts);
            }
            addNotification('Venta eliminada y Stock reintegrado', 'info');
        } catch (e) { addNotification('Eliminado localmente', 'warning'); }
    }, [products, setProducts, bizSales, setBizSales, bizSaleItems, setBizSaleItems, bizMovements, setBizMovements, addNotification]);

    const handleSaveRecipe = useCallback(async ({ recipe, items: rItems }) => {
        const isUpdate = bizRecipes.some(r => r.id === recipe.id);
        const nextRecipes = isUpdate ? bizRecipes.map(r => r.id === recipe.id ? recipe : r) : [...bizRecipes, recipe];
        const nextItems = [...(bizRecipeItems || []).filter(ri => ri.recipeId !== recipe.id), ...rItems];
        setBizRecipes(nextRecipes);
        setBizRecipeItems(nextItems);

        try {
            if (isUpdate) {
                await supabase.from('finanzas_biz_recipe_items').delete().eq('recipe_id', recipe.id);
            }
            await saveToSupabase('finanzas_biz_recipes', 'finanzas_biz_recipes_local', recipe, nextRecipes);
            for (const ri of rItems) await saveToSupabase('finanzas_biz_recipe_items', 'finanzas_biz_recipe_items_local', ri, nextItems);
            addNotification('Fórmula guardada', 'success');
        } catch (e) { addNotification('Error al sincronizar fórmula', 'warning'); }
    }, [bizRecipes, setBizRecipes, bizRecipeItems, setBizRecipeItems, addNotification]);

    const handleDeleteRecipe = useCallback(async (id) => {
        setBizRecipes(prev => prev.filter(r => r.id !== id));
        await deleteFromSupabase('finanzas_biz_recipes', 'finanzas_biz_recipes_local', id, bizRecipes.filter(r => r.id !== id));
        addNotification('Receta borrada', 'info');
    }, [bizRecipes, setBizRecipes, addNotification]);

    const handleSaveContact = useCallback(async (data) => {
        const next = contacts.some(c => c.id === data.id) ? contacts.map(c => c.id === data.id ? { ...c, ...data } : c) : [...contacts, data];
        setContacts(next);
        setBizSuppliers(next); // Unified state
        await saveToSupabase('finanzas_biz_suppliers', 'finanzas_biz_suppliers_local', data, next);
        addNotification('Contacto listo', 'success');
    }, [contacts, setContacts, setBizSuppliers, addNotification]);

    const handleDeleteContact = useCallback(async (id) => {
        const next = contacts.filter(c => c.id !== id);
        setContacts(next);
        setBizSuppliers(next); // Unified state
        await deleteFromSupabase('finanzas_biz_suppliers', 'finanzas_biz_suppliers_local', id, next);
        addNotification('Eliminado', 'info');
    }, [contacts, setContacts, setBizSuppliers, addNotification]);

    const activeTabConfig = TABS.find(t => t.id === activeTab) || TABS[0];

    return (
        <div className="max-w-full min-h-screen bg-[#fcfdfe]">
            {/* Header Moderno Deep Blue */}
            <div className="bg-[#0f172a] text-white px-8 pt-10 pb-10 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30">
                                    <Briefcase size={22} className="text-blue-400" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight">Gestión ERP</h1>
                                <span className="bg-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Industrial</span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">Control total de stock, costos de producción y rentabilidad comercial.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu de Navegación Lateral / Tabs con Glassmorphism */}
            <div className="max-w-7xl mx-auto px-4 -mt-6">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-2 sticky top-4 z-40">
                    {/* Desktop nav */}
                    <nav className="hidden lg:flex overflow-x-auto gap-1 scrollbar-none">
                        {TABS.map(({ id, label, Icon }) => (
                            <button key={id} onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === id ? 'bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 translate-y-[-2px]' : 'text-slate-500 hover:bg-slate-50'}`}>
                                <Icon size={14} className={activeTab === id ? 'text-blue-400' : 'text-slate-400'} /> {label}
                            </button>
                        ))}
                    </nav>

                    {/* Mobile nav indicator */}
                    <div className="lg:hidden flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-slate-100 rounded-xl text-slate-800">{activeTabConfig?.Icon && <activeTabConfig.Icon size={20} />}</span>
                            <span className="font-black text-slate-800 uppercase tracking-widest text-sm">{activeTabConfig?.label}</span>
                        </div>
                        <button onClick={() => setMobileTabOpen(!mobileTabOpen)} className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg">
                            {mobileTabOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    {mobileTabOpen && (
                        <div className="lg:hidden p-2 grid grid-cols-2 gap-2 animate-in slide-in-from-top-4 duration-300">
                            {TABS.map(({ id, label, Icon }) => (
                                <button key={id} onClick={() => { setActiveTab(id); setMobileTabOpen(false); }}
                                    className={`flex items-center gap-2 px-4 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600'}`}>
                                    <Icon size={14} /> {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Area de Contenido */}
            <div className="max-w-7xl mx-auto p-6 md:p-8 mt-4">
                {activeTab === 'dashboard' && (
                    <DashboardERP
                        products={products} purchases={bizPurchases}
                        purchaseItems={bizPurchaseItems} productions={bizProductionOrders}
                        movements={bizMovements} contacts={contacts}
                        sales={bizSales}
                    />
                )}
                {activeTab === 'catalog' && (
                    <CatalogModule
                        products={products}
                        recipes={bizRecipes}
                        recipeItems={bizRecipeItems}
                        onSaveProduct={handleSaveProduct}
                        onDeleteProduct={handleDeleteProduct}
                        onSaveRecipe={handleSaveRecipe}
                        onDeleteRecipe={handleDeleteRecipe}
                    />
                )}
                {activeTab === 'purchases' && (
                    <PurchaseModule
                        products={products}
                        suppliers={bizSuppliers}
                        purchases={bizPurchases}
                        purchaseItems={bizPurchaseItems}
                        onSavePurchase={handleSavePurchase}
                        onDeletePurchase={handleDeletePurchase}
                    />
                )}

                {activeTab === 'production' && (
                    <ProductionOrders
                        products={products} recipes={bizRecipes}
                        recipeItems={bizRecipeItems} productionOrders={bizProductionOrders}
                        onSaveOrder={handleSaveOrder}
                        onDeleteOrder={handleDeleteOrder}
                    />
                )}
                {activeTab === 'sales' && (
                    <SalesModule
                        products={products}
                        contacts={contacts}
                        sales={bizSales}
                        saleItems={bizSaleItems}
                        onSaveSale={handleSaveSale}
                        onDeleteSale={handleDeleteSale}
                    />
                )}
                {activeTab === 'kardex' && (
                    <KardexReport products={products} movements={bizMovements} />
                )}
                {activeTab === 'contacts' && (
                    <ContactsArea
                        contacts={contacts}
                        onSave={handleSaveContact} onDelete={handleDeleteContact}
                    />
                )}
            </div>
        </div>
    );
}

// ContactsArea Component Inline Rewrite
function ContactsArea({ contacts, onSave, onDelete }) {
    const [modal, setModal] = useState(null);
    const sorted = [...contacts].sort((a, b) => a.name?.localeCompare(b.name));
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Directorio Industrial</h2>
                <button onClick={() => setModal({})} className="bg-[#0f172a] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg">
                    <Plus size={16} /> Agregar Contacto
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map(c => (
                    <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-blue-400 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${c.type === 'cliente' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                <User size={20} />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => setModal(c)} className="p-2 hover:bg-slate-100 rounded-xl"><Edit3 size={14} /></button>
                                <button onClick={() => onDelete(c.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <p className="font-black text-slate-800 text-lg">{c.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{c.type}</p>
                        <div className="space-y-1">
                            {c.phone && <p className="text-xs text-slate-500 flex items-center gap-2">📞 {c.phone}</p>}
                            {c.email && <p className="text-xs text-slate-500 flex items-center gap-2">✉️ {c.email}</p>}
                        </div>
                    </div>
                ))}
            </div>
            {modal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="font-black text-2xl text-slate-800 mb-6">{modal.id ? 'Editar' : 'Nuevo'} Contacto</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.target);
                            onSave({ id: modal.id || crypto.randomUUID(), type: fd.get('type'), name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email') });
                            setModal(null);
                        }} className="space-y-4">
                            <div className="space-y-1">
                                <label className="label-xs">Rol</label>
                                <select name="type" defaultValue={modal.type || 'cliente'} className="input-std">
                                    <option value="cliente">Cliente</option>
                                    <option value="proveedor">Proveedor/Insumos</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="label-xs">Nombre Completo</label>
                                <input name="name" defaultValue={modal.name} required className="input-std" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="label-xs">WhatsApp / Tel</label>
                                    <input name="phone" defaultValue={modal.phone} className="input-std" />
                                </div>
                                <div className="space-y-1">
                                    <label className="label-xs">Correo</label>
                                    <input name="email" type="email" defaultValue={modal.email} className="input-std" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#0f172a] text-white rounded-2xl font-black uppercase tracking-widest mt-4">Guardar en Directorio</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
