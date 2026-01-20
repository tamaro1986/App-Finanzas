import { Account, AccountManager } from './accounts.js';
import { CategoryManager } from './categories.js';
import { supabaseClient } from './supabase-client.js';
import { AuthUI } from './auth-ui.js';

class App {
    constructor() {
        this.accountManager = new AccountManager();
        this.categoryManager = new CategoryManager();
        this.transactions = [];
        this.settings = {}; // Will load from config

        // Supabase y autenticación
        this.supabase = supabaseClient;
        this.authUI = null;
        this.syncInProgress = false;

        this.init();
    }

    async init() {
        await this.loadConfig();

        // Inicializar Supabase si está configurado
        if (this.settings.supabase) {
            const initialized = await this.supabase.init(this.settings.supabase);

            if (initialized) {
                // Crear UI de autenticación
                this.authUI = new AuthUI(this.supabase);
                this.authUI.createUserProfileButton();

                // Si hay usuario autenticado, sincronizar
                if (this.supabase.isAuthenticated()) {
                    this.authUI.updateUIForAuthenticatedUser(this.supabase.user);
                    await this.syncWithCloud();
                } else {
                    // Mostrar modal de login al iniciar
                    setTimeout(() => {
                        this.authUI.show();
                    }, 500);
                }
            }
        }

        this.loadData();
        this.setupEventListeners();
        this.render();
    }

    async loadConfig() {
        try {
            const response = await fetch('config.json');
            const config = await response.json();
            this.defaultCategories = config.defaultCategories;
            this.settings = config.appSettings || {};

            // Initialize categories if fresh start
            if (!localStorage.getItem('finanzas_categories')) {
                this.categoryManager.loadFromConfig(this.defaultCategories);
            }
        } catch (e) {
            console.error("Error loading config:", e);
        }
    }

    loadData() {
        const accountsData = JSON.parse(localStorage.getItem('finanzas_accounts')) || [];
        this.accountManager.setAccounts(accountsData);

        const categoriesData = JSON.parse(localStorage.getItem('finanzas_categories'));
        this.categoryManager.setCategories(categoriesData);

        this.transactions = JSON.parse(localStorage.getItem('finanzas_transactions')) || [];

        const settingsData = JSON.parse(localStorage.getItem('finanzas_settings'));
        if (settingsData) this.settings = { ...this.settings, ...settingsData };

        // Theme
        const storedTheme = localStorage.getItem('finanzas_theme') || 'light';
        if (storedTheme === 'dark') document.body.classList.add('dark-mode');
    }

    saveData() {
        localStorage.setItem('finanzas_accounts', JSON.stringify(this.accountManager.getAll()));
        localStorage.setItem('finanzas_categories', JSON.stringify(this.categoryManager.categories));
        localStorage.setItem('finanzas_transactions', JSON.stringify(this.transactions));
        localStorage.setItem('finanzas_settings', JSON.stringify(this.settings));
        localStorage.setItem('finanzas_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');

        // Sincronizar con la nube si está autenticado (sin bloquear)
        if (this.supabase.isAuthenticated() && !this.syncInProgress) {
            this.syncToCloud();
        }
    }

    /**
     * Sincronizar datos locales con la nube
     */
    async syncToCloud() {
        if (!this.supabase.isAuthenticated()) return;

        try {
            const localData = {
                accounts: this.accountManager.getAll(),
                categories: this.categoryManager.categories,
                transactions: this.transactions,
                settings: this.settings
            };

            await this.supabase.syncAllData(localData);
        } catch (error) {
            console.error('Error al sincronizar con la nube:', error);
        }
    }

    /**
     * Sincronizar datos desde la nube al local
     */
    async syncWithCloud() {
        if (!this.supabase.isAuthenticated() || this.syncInProgress) return;

        this.syncInProgress = true;
        this.showSyncStatus('syncing', 'Sincronizando...');

        try {
            // Obtener datos de la nube
            const result = await this.supabase.getAllData();

            if (result.success && result.data) {
                const cloudData = result.data;

                // Verificar si hay datos locales
                const hasLocalData = this.accountManager.getAll().length > 0 ||
                    this.transactions.length > 0;

                const hasCloudData = cloudData.accounts.length > 0 || cloudData.transactions.length > 0;
                const syncInitialized = localStorage.getItem('finanzas_cloud_sync_initialized') === 'true';

                if (hasLocalData && hasCloudData && !syncInitialized) {
                    // Solo preguntamos si hay datos en ambos sitios Y es la primera vez que vinculamos en esta sesión
                    const choice = confirm(
                        'Se han detectado datos tanto en este dispositivo como en la nube.\n\n' +
                        '¿Qué datos deseas mantener?\n\n' +
                        'ACEPTAR = Usar datos de la NUBE (los datos locales se borrarán)\n' +
                        'CANCELAR = Mantener datos LOCALES (se subirán a la nube)'
                    );

                    if (choice) {
                        this.loadCloudData(cloudData);
                    } else {
                        await this.syncToCloud();
                    }
                } else if (hasCloudData) {
                    // Si ya estamos inicializados o solo hay datos en la nube, cargamos de la nube para estar al día
                    this.loadCloudData(cloudData);
                } else if (hasLocalData) {
                    // Si solo hay datos locales (usuario nuevo con datos previos), subimos a la nube
                    await this.syncToCloud();
                }

                // Marcar como inicializado una vez resuelto el conflicto inicial
                localStorage.setItem('finanzas_cloud_sync_initialized', 'true');

                this.showSyncStatus('success', 'Sincronizado');
                setTimeout(() => this.hideSyncStatus(), 3000);
            }
        } catch (error) {
            console.error('Error en sincronización:', error);
            this.showSyncStatus('error', 'Error al sincronizar');
            setTimeout(() => this.hideSyncStatus(), 5000);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Cargar datos desde la nube
     */
    loadCloudData(cloudData) {
        if (cloudData.accounts && cloudData.accounts.length > 0) {
            this.accountManager.setAccounts(cloudData.accounts);
        }

        if (cloudData.categories) {
            this.categoryManager.setCategories(cloudData.categories);
        }

        if (cloudData.transactions && cloudData.transactions.length > 0) {
            this.transactions = cloudData.transactions;
        }

        if (cloudData.settings) {
            this.settings = { ...this.settings, ...cloudData.settings };
        }

        // Guardar localmente
        this.saveData();
        this.render();
    }

    /**
     * Callback cuando el usuario se autentica
     */
    async onUserAuthenticated() {
        await this.syncWithCloud();
        this.render();
    }

    /**
     * Mostrar estado de sincronización
     */
    showSyncStatus(status, message) {
        let statusEl = document.getElementById('sync-status');

        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'sync-status';
            statusEl.className = 'sync-status';
            document.body.appendChild(statusEl);
        }

        statusEl.className = `sync-status ${status}`;

        let icon = 'fa-sync';
        if (status === 'success') icon = 'fa-check-circle';
        else if (status === 'error') icon = 'fa-exclamation-circle';
        else if (status === 'offline') icon = 'fa-wifi-slash';

        statusEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        statusEl.style.display = 'flex';
    }

    /**
     * Ocultar estado de sincronización
     */
    hideSyncStatus() {
        const statusEl = document.getElementById('sync-status');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }


    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
                document.getElementById(`view-${btn.dataset.view}`).classList.add('active');

                document.getElementById('page-title').textContent = btn.textContent.trim();
            });
        });

        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = document.querySelector('#theme-toggle i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.replace('fa-moon', 'fa-sun');
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
            }
            this.saveData();
        });

        // Modals
        document.querySelectorAll('.close-modal').forEach(x => {
            x.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Transaction Handling
        document.getElementById('btn-add-transaction').addEventListener('click', () => this.openTransactionModal());
        const transForm = document.getElementById('form-transaction');
        if (transForm) {
            transForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }

        // Account Handling
        document.getElementById('btn-add-account').addEventListener('click', () => this.openAccountModal());
        document.getElementById('form-account').addEventListener('submit', (e) => this.handleAccountSubmit(e));

        // Filters
        document.getElementById('filter-account').addEventListener('change', () => this.renderTransactions());
        document.getElementById('filter-month').addEventListener('change', () => this.renderTransactions());
        document.getElementById('filter-search').addEventListener('input', () => this.renderTransactions());
        document.getElementById('budget-filter-month').addEventListener('change', () => this.renderBudget());
        document.getElementById('budget-filter-year').addEventListener('change', () => this.renderBudget());

        // Budget View Toggle
        document.querySelectorAll('input[name="budget-view"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const view = e.target.value;
                const monthlyView = document.getElementById('budget-monthly-view');
                const annualView = document.getElementById('budget-annual-view');
                const monthSelector = document.getElementById('month-selector-container');
                const yearSelector = document.getElementById('year-selector-container');

                if (view === 'monthly') {
                    monthlyView.style.display = 'block';
                    annualView.style.display = 'none';
                    monthSelector.style.display = 'block';
                    yearSelector.style.display = 'none';
                } else {
                    monthlyView.style.display = 'none';
                    annualView.style.display = 'block';
                    monthSelector.style.display = 'none';
                    yearSelector.style.display = 'block';
                }
                this.renderBudget();
            });
        });

        // Toggle Income/Expense Budget Sections
        document.getElementById('btn-toggle-income-budget').addEventListener('click', () => {
            const container = document.getElementById('income-budget-container');
            const icon = document.querySelector('#btn-toggle-income-budget i');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                container.style.display = 'none';
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        });

        document.getElementById('btn-toggle-expense-budget').addEventListener('click', () => {
            const container = document.getElementById('expense-budget-container');
            const icon = document.querySelector('#btn-toggle-expense-budget i');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                container.style.display = 'none';
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        });


        // Transaction Type Toggle Logic
        document.querySelectorAll('input[name="type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const type = e.target.value;
                const toAccountGroup = document.getElementById('group-to-account');
                const categoryGroup = document.getElementById('group-category');

                if (type === 'transfer') {
                    toAccountGroup.classList.remove('hidden');
                    categoryGroup.classList.add('hidden');
                    document.getElementById('trans-to-account').setAttribute('required', 'true');
                } else {
                    toAccountGroup.classList.add('hidden');
                    categoryGroup.classList.remove('hidden');
                    document.getElementById('trans-to-account').removeAttribute('required');
                    this.populateCategorySelect(type);
                }
            });
        });

        // Excel Import
        const fileInput = document.getElementById('file-import-xlsx');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Settings - Clear Data
        document.getElementById('btn-clear-data').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
                localStorage.clear();
                location.reload();
            }
        });

        // General Budget
        const btnSaveGeneralBudget = document.getElementById('btn-save-general-budget');
        if (btnSaveGeneralBudget) {
            btnSaveGeneralBudget.addEventListener('click', () => {
                const amount = parseFloat(document.getElementById('input-general-budget').value) || 0;
                const filterMonth = document.getElementById('budget-filter-month').value || new Date().toISOString().slice(0, 7);

                if (!this.settings.monthlyBudgets) {
                    this.settings.monthlyBudgets = {};
                }
                if (!this.settings.monthlyBudgets[filterMonth]) {
                    this.settings.monthlyBudgets[filterMonth] = {
                        general: 0,
                        income: {},
                        expense: {}
                    };
                }

                this.settings.monthlyBudgets[filterMonth].general = amount;
                this.settings.generalBudget = amount; // Keep for backwards compatibility
                this.saveData();
                this.render();
                this.showNotification('¡Presupuesto general actualizado!');
            });
        }

        // Category Management
        const btnManageCats = document.getElementById('btn-manage-categories');
        if (btnManageCats) {
            btnManageCats.addEventListener('click', () => this.openCategoryModal());
        }
        document.getElementById('form-category').addEventListener('submit', (e) => this.handleCategorySubmit(e));

        // Category Tabs in Modal
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderCategoriesList(e.target.dataset.tab);
            });
        });

        document.getElementById('btn-cancel-cat-edit').addEventListener('click', () => {
            this.resetCategoryForm();
        });
    }

    // --- RENDER METHODS ---

    render() {
        this.renderDashboard();
        this.renderAccountsList();
        this.renderTransactions();
        this.renderBudget();
        this.populateAccountSelects();
    }

    renderDashboard() {
        // Calculate Totals
        let totalBalance = 0;
        let income = 0;
        let expense = 0;

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        const accounts = this.accountManager.getAll();

        // 1. Calculate Balances Per Account
        accounts.forEach(acc => {
            const bal = this.accountManager.calculateBalance(acc.id, this.transactions);
            totalBalance += bal;
        });

        // 2. Global Income/Expense for Current Month
        this.transactions.forEach(t => {
            if (t.date.startsWith(currentMonth)) {
                if (t.type === 'income') income += t.amount;
                if (t.type === 'expense') expense += t.amount;
            }
        });

        // Update UI Summary
        document.getElementById('total-balance-display').textContent = this.formatCurrency(totalBalance);
        document.getElementById('monthly-income-display').textContent = `+${this.formatCurrency(income)}`;
        document.getElementById('monthly-expense-display').textContent = `-${this.formatCurrency(expense)}`;

        // Budget Remaining
        const budgetRemainingDisplay = document.getElementById('budget-remaining-display');
        const generalBudget = this.settings.generalBudget || 0;
        if (generalBudget > 0) {
            const remaining = generalBudget - expense;
            budgetRemainingDisplay.textContent = this.formatCurrency(remaining);
            budgetRemainingDisplay.style.color = remaining < 0 ? 'var(--danger-color)' : 'var(--success-color)';
        } else {
            budgetRemainingDisplay.textContent = 'N/A';
        }

        // Update Account Preview List
        const previewList = document.getElementById('accounts-list-preview');
        previewList.innerHTML = '';
        accounts.forEach(acc => {
            const bal = this.accountManager.calculateBalance(acc.id, this.transactions);
            const div = document.createElement('div');
            div.className = 'account-item-preview';
            div.innerHTML = `
                <span style="color: ${acc.color}; font-weight: 500;">${acc.name}</span>
                <span>${this.formatCurrency(bal)}</span>
            `;
            previewList.appendChild(div);
        });

        // Budget Bars (Simple Implementation for now)
        const budgetContainer = document.getElementById('budget-bars-container');
        budgetContainer.innerHTML = '';

        accounts.forEach(acc => {
            if (acc.budget > 0) {
                // Calculate expenses for this account this month
                let monthlySpent = 0;
                this.transactions.forEach(t => {
                    if (t.accountId === acc.id && t.type === 'expense' && t.date.startsWith(currentMonth)) {
                        monthlySpent += t.amount;
                    }
                });

                const percentage = Math.min((monthlySpent / acc.budget) * 100, 100);
                let progressClass = '';
                if (percentage >= 90) progressClass = 'danger';
                else if (percentage >= 75) progressClass = 'warning';

                const div = document.createElement('div');
                div.style.marginBottom = '10px';
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:3px;">
                        <span>${acc.name}</span>
                        <span>${Math.round(percentage)}% (${this.formatCurrency(monthlySpent)} / ${this.formatCurrency(acc.budget)})</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar ${progressClass}" style="width: ${percentage}%"></div>
                    </div>
                `;
                budgetContainer.appendChild(div);
            }
        });
    }

    renderAccountsList() {
        const grid = document.getElementById('accounts-grid');
        grid.innerHTML = '';
        const accounts = this.accountManager.getAll();

        if (accounts.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No tienes cuentas. ¡Crea una para empezar!</p>';
            return;
        }

        accounts.forEach(acc => {
            const bal = this.accountManager.calculateBalance(acc.id, this.transactions);
            const card = document.createElement('div');
            card.className = 'card';
            card.style.borderTop = `4px solid ${acc.color}`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3>${acc.name}</h3>
                    <div class="dropdown">
                        <button class="icon-btn-small" onclick="window.editAccount('${acc.id}')"><i class="fa-solid fa-pencil"></i></button>
                    </div>
                </div>
                <p style="font-size:0.9rem; opacity:0.7; margin-top:5px;">${acc.type.toUpperCase()}</p>
                <p class="amount" style="margin-top:15px;">${this.formatCurrency(bal)}</p>
            `;
            grid.appendChild(card);
        });

        // Expose edit function globally for onclick
        window.editAccount = (id) => this.openAccountModal(id);
    }

    renderTransactions() {
        const tbody = document.querySelector('#transactions-table tbody');
        tbody.innerHTML = '';

        const filterAccount = document.getElementById('filter-account').value;
        const filterMonth = document.getElementById('filter-month').value;
        const filterSearch = document.getElementById('filter-search').value.toLowerCase();

        const filtered = this.transactions.filter(t => {
            if (filterAccount !== 'all' && t.accountId !== filterAccount && t.toAccountId !== filterAccount) return false;
            if (filterMonth && !t.date.startsWith(filterMonth)) return false;
            // Search text in Note, Category Name or Amount
            const catName = this.categoryManager.getCategory(t.categoryId)?.name.toLowerCase() || '';
            const matchSearch = t.note.toLowerCase().includes(filterSearch) ||
                catName.includes(filterSearch) ||
                t.amount.toString().includes(filterSearch);
            if (!matchSearch) return false;

            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        filtered.forEach(t => {
            const tr = document.createElement('tr');

            const account = this.accountManager.getAccount(t.accountId);
            const accountName = account ? account.name : 'Desconocida';

            let categoryHTML = '';
            let amountClass = '';
            let amountPrefix = '';

            if (t.type === 'transfer') {
                const toAccount = this.accountManager.getAccount(t.toAccountId);
                categoryHTML = `<i class="fa-solid fa-arrow-right-arrow-left"></i> A: ${toAccount ? toAccount.name : '?'}`;
                amountClass = ''; // Neutral
            } else {
                const cat = this.categoryManager.getCategory(t.categoryId);
                categoryHTML = cat ? `${cat.icon} ${cat.name}` : 'Sin categoría';
                amountClass = t.type === 'income' ? 'positive' : 'negative';
                amountPrefix = t.type === 'income' ? '+' : '-';
            }

            tr.innerHTML = `
                <td>${t.date}</td>
                <td><span style="color:${account?.color || '#333'}">${accountName}</span></td>
                <td>${categoryHTML}</td>
                <td>${t.note}</td>
                <td class="${amountClass}" style="font-weight:600">${amountPrefix}${this.formatCurrency(t.amount)}</td>
                <td>
                     <button class="icon-btn-small" style="color:red;" onclick="window.deleteTransaction('${t.id}')">
                        <i class="fa-solid fa-trash"></i>
                     </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        window.deleteTransaction = (id) => {
            if (confirm('¿Borrar transacción?')) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveData();
                this.render();
            }
        };
    }

    populateAccountSelects() {
        const accounts = this.accountManager.getAll();
        const selects = ['trans-account', 'trans-to-account', 'filter-account'];

        // Filter account select has an "All" option, others don't
        const filterSelect = document.getElementById('filter-account');
        const currentFilter = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">Todas</option>';

        const transSelect = document.getElementById('trans-account');
        const transToSelect = document.getElementById('trans-to-account');

        transSelect.innerHTML = '';
        transToSelect.innerHTML = '';

        accounts.forEach(acc => {
            const opt = `<option value="${acc.id}">${acc.name}</option>`;
            filterSelect.innerHTML += opt;
            transSelect.innerHTML += opt;
            transToSelect.innerHTML += opt;
        });

        filterSelect.value = currentFilter;
    }

    populateCategorySelect(type) {
        const select = document.getElementById('trans-category');
        select.innerHTML = '';
        const cats = this.categoryManager.getCategories(type);
        cats.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
        });
    }

    // --- FORM HANDLERS ---

    openAccountModal(id = null) {
        const modal = document.getElementById('modal-account');
        const form = document.getElementById('form-account');
        form.reset();

        if (id) {
            // Edit Mode
            const acc = this.accountManager.getAccount(id);
            if (acc) {
                document.getElementById('acc-id').value = acc.id;
                document.getElementById('acc-name').value = acc.name;
                document.getElementById('acc-type').value = acc.type;
                document.getElementById('acc-color').value = acc.color;
                document.getElementById('acc-balance').value = acc.initialBalance;
                document.getElementById('acc-budget').value = acc.budget || 0;
                document.getElementById('modal-account-title').textContent = "Editar Cuenta";
            }
        } else {
            document.getElementById('acc-id').value = '';
            document.getElementById('modal-account-title').textContent = "Nueva Cuenta";
        }

        modal.classList.add('active');
    }

    handleAccountSubmit(e) {
        e.preventDefault();
        const idInput = document.getElementById('acc-id').value;
        const name = document.getElementById('acc-name').value;
        const type = document.getElementById('acc-type').value;
        const color = document.getElementById('acc-color').value;
        const balance = parseFloat(document.getElementById('acc-balance').value);
        const budget = parseFloat(document.getElementById('acc-budget').value);

        if (idInput) {
            // Update
            const acc = new Account(idInput, name, type, color, balance, budget);
            this.accountManager.updateAccount(acc);
        } else {
            // New
            const newId = crypto.randomUUID();
            const acc = new Account(newId, name, type, color, balance, budget);
            this.accountManager.addAccount(acc);
        }

        this.saveData();
        this.render();
        document.getElementById('modal-account').classList.remove('active');
    }

    openTransactionModal() {
        if (this.accountManager.getAll().length === 0) {
            alert("Primero crea una cuenta.");
            return;
        }
        const modal = document.getElementById('modal-transaction');
        document.getElementById('form-transaction').reset();
        document.getElementById('trans-date').valueAsDate = new Date(); // Today

        // Trigger logic to show correction category inputs
        document.getElementById('type-expense').checked = true;
        document.getElementById('group-to-account').classList.add('hidden');
        document.getElementById('group-category').classList.remove('hidden');
        this.populateCategorySelect('expense');

        modal.classList.add('active');
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        const typeRadios = document.getElementsByName('type');
        let type;
        typeRadios.forEach(r => { if (r.checked) type = r.value; });

        const accountId = document.getElementById('trans-account').value;
        const amount = parseFloat(document.getElementById('trans-amount').value);
        const date = document.getElementById('trans-date').value;
        const note = document.getElementById('trans-note').value;

        const newTx = {
            id: crypto.randomUUID(),
            accountId,
            type,
            amount,
            date,
            note
        };

        if (type === 'transfer') {
            newTx.toAccountId = document.getElementById('trans-to-account').value;
            if (newTx.accountId === newTx.toAccountId) {
                alert("La cuenta destino debe ser diferente.");
                return;
            }
        } else {
            newTx.categoryId = document.getElementById('trans-category').value;
        }

        this.transactions.push(newTx);
        this.saveData();
        this.render();
        document.getElementById('modal-transaction').classList.remove('active');
    }

    renderBudget() {
        const budgetView = document.querySelector('input[name="budget-view"]:checked')?.value || 'monthly';

        if (budgetView === 'monthly') {
            this.renderMonthlyBudget();
        } else {
            this.renderAnnualBudget();
        }
    }

    renderMonthlyBudget() {
        const filterMonthInput = document.getElementById('budget-filter-month');

        if (!filterMonthInput.value) {
            filterMonthInput.value = new Date().toISOString().slice(0, 7);
        }

        const filterMonth = filterMonthInput.value;
        const [year, month] = filterMonth.split('-');
        const monthDate = new Date(year, month - 1);
        const monthName = monthDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        document.getElementById('budget-month-title').textContent = `Presupuesto: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;

        // Initialize monthly budgets if not exists
        if (!this.settings.monthlyBudgets) {
            this.settings.monthlyBudgets = {};
        }
        if (!this.settings.monthlyBudgets[filterMonth]) {
            this.settings.monthlyBudgets[filterMonth] = {
                general: this.settings.generalBudget || 0,
                income: {},
                expense: {}
            };
        }

        const currentMonthBudget = this.settings.monthlyBudgets[filterMonth];

        // General Budget Status
        const generalBudget = currentMonthBudget.general || 0;
        const totalSpent = this.transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(filterMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const inputGeneralBudget = document.getElementById('input-general-budget');
        if (inputGeneralBudget && !inputGeneralBudget.value && generalBudget > 0) {
            inputGeneralBudget.value = generalBudget;
        }

        const progressBar = document.getElementById('general-budget-progress-bar');
        const spentText = document.getElementById('general-budget-spent');
        const totalText = document.getElementById('general-budget-total');
        const statusText = document.getElementById('general-budget-status-text');

        if (generalBudget > 0) {
            const percentage = Math.min((totalSpent / generalBudget) * 100, 100);
            progressBar.style.width = `${percentage}%`;
            progressBar.className = 'progress-bar';
            if (percentage >= 90) progressBar.classList.add('danger');
            else if (percentage >= 75) progressBar.classList.add('warning');

            spentText.textContent = `${this.formatCurrency(totalSpent)} gastados`;
            totalText.textContent = `Meta: ${this.formatCurrency(generalBudget)}`;

            const remaining = generalBudget - totalSpent;
            if (remaining >= 0) {
                statusText.textContent = `Te quedan ${this.formatCurrency(remaining)} para este mes.`;
            } else {
                statusText.textContent = `¡Has excedido tu presupuesto por ${this.formatCurrency(Math.abs(remaining))}!`;
            }
        } else {
            progressBar.style.width = '0%';
            spentText.textContent = `${this.formatCurrency(totalSpent)} gastados`;
            totalText.textContent = 'Sin meta definida';
            statusText.textContent = 'Define un presupuesto mensual para controlar tus gastos totales.';
        }

        // Render Income Budget Items
        this.renderIncomeBudgetItems(filterMonth, currentMonthBudget);

        // Render Expense Budget Items
        this.renderExpenseBudgetItems(filterMonth, currentMonthBudget);

        // Legacy budget categories grid (keep for backwards compatibility)
        const budgetContainer = document.getElementById('budget-categories-grid');
        budgetContainer.innerHTML = '';
    }

    renderIncomeBudgetItems(filterMonth, currentMonthBudget) {
        const incomeGrid = document.getElementById('income-budget-grid');
        incomeGrid.innerHTML = '';

        const incomeCategories = this.categoryManager.getCategories('income');

        if (incomeCategories.length === 0) {
            incomeGrid.innerHTML = '<p style="text-align:center; opacity:0.6; padding: 1rem;">No hay categorías de ingresos. Crea una categoría de ingresos para comenzar.</p>';
            return;
        }

        incomeCategories.forEach(cat => {
            const budgetedAmount = currentMonthBudget.income[cat.id] || 0;

            // Calculate actual income in this category for the filtered month
            const actualIncome = this.transactions
                .filter(t => t.type === 'income' && t.categoryId === cat.id && t.date.startsWith(filterMonth))
                .reduce((sum, t) => sum + t.amount, 0);

            const percentage = budgetedAmount > 0 ? Math.min((actualIncome / budgetedAmount) * 100, 100) : 0;

            const card = document.createElement('div');
            card.style.padding = '1rem';
            card.style.border = '1px solid #e0e0e0';
            card.style.borderRadius = '8px';
            card.style.backgroundColor = 'var(--card-bg)';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.3rem;">${cat.icon}</span>
                        <span style="font-weight:600; font-size:0.95rem;">${cat.name}</span>
                    </div>
                </div>
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <input type="number" 
                        class="income-budget-input" 
                        data-category-id="${cat.id}" 
                        value="${budgetedAmount || ''}" 
                        placeholder="Presupuesto" 
                        step="0.01"
                        style="flex:1; padding:6px; border:1px solid #ddd; border-radius:4px;">
                    <button class="btn btn-primary save-income-budget-btn" 
                        data-category-id="${cat.id}" 
                        style="padding:6px 12px; font-size:0.85rem;">
                        Guardar
                    </button>
                </div>
                <div style="font-size:0.85rem; color:#666; margin-bottom:8px;">
                    <strong>Real:</strong> ${this.formatCurrency(actualIncome)} ${budgetedAmount > 0 ? `/ ${this.formatCurrency(budgetedAmount)}` : ''}
                </div>
                ${budgetedAmount > 0 ? `
                    <div class="progress-container" style="height:8px;">
                        <div class="progress-bar ${percentage >= 100 ? 'success' : ''}" style="width: ${percentage}%"></div>
                    </div>
                    <p style="font-size:0.75rem; opacity:0.7; margin-top:4px; text-align:right;">
                        ${percentage >= 100 ? '¡Meta alcanzada!' : `${Math.round(percentage)}% de la meta`}
                    </p>
                ` : ''}
            `;
            incomeGrid.appendChild(card);
        });

        // Add event listeners for save buttons
        document.querySelectorAll('.save-income-budget-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.dataset.categoryId;
                const input = document.querySelector(`.income-budget-input[data-category-id="${categoryId}"]`);
                const amount = parseFloat(input.value) || 0;

                currentMonthBudget.income[categoryId] = amount;
                this.saveData();
                this.renderBudget();
                this.showNotification('Presupuesto de ingreso guardado');
            });
        });
    }

    renderExpenseBudgetItems(filterMonth, currentMonthBudget) {
        const expenseGrid = document.getElementById('expense-budget-grid');
        expenseGrid.innerHTML = '';

        const expenseCategories = this.categoryManager.getCategories('expense');

        if (expenseCategories.length === 0) {
            expenseGrid.innerHTML = '<p style="text-align:center; opacity:0.6; padding: 1rem;">No hay categorías de gastos. Crea una categoría de gastos para comenzar.</p>';
            return;
        }

        expenseCategories.forEach(cat => {
            const budgetedAmount = currentMonthBudget.expense[cat.id] || 0;

            // Calculate actual expense in this category for the filtered month
            const actualExpense = this.transactions
                .filter(t => t.type === 'expense' && t.categoryId === cat.id && t.date.startsWith(filterMonth))
                .reduce((sum, t) => sum + t.amount, 0);

            const percentage = budgetedAmount > 0 ? Math.min((actualExpense / budgetedAmount) * 100, 100) : 0;
            let progressClass = '';
            if (percentage >= 90) progressClass = 'danger';
            else if (percentage >= 75) progressClass = 'warning';

            const card = document.createElement('div');
            card.style.padding = '1rem';
            card.style.border = '1px solid #e0e0e0';
            card.style.borderRadius = '8px';
            card.style.backgroundColor = 'var(--card-bg)';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.3rem;">${cat.icon}</span>
                        <span style="font-weight:600; font-size:0.95rem;">${cat.name}</span>
                    </div>
                </div>
                <div style="display:flex; gap:8px; margin-bottom:10px;">
                    <input type="number" 
                        class="expense-budget-input" 
                        data-category-id="${cat.id}" 
                        value="${budgetedAmount || ''}" 
                        placeholder="Presupuesto" 
                        step="0.01"
                        style="flex:1; padding:6px; border:1px solid #ddd; border-radius:4px;">
                    <button class="btn btn-primary save-expense-budget-btn" 
                        data-category-id="${cat.id}" 
                        style="padding:6px 12px; font-size:0.85rem;">
                        Guardar
                    </button>
                </div>
                <div style="font-size:0.85rem; color:#666; margin-bottom:8px;">
                    <strong>Gastado:</strong> ${this.formatCurrency(actualExpense)} ${budgetedAmount > 0 ? `/ ${this.formatCurrency(budgetedAmount)}` : ''}
                </div>
                ${budgetedAmount > 0 ? `
                    <div class="progress-container" style="height:8px;">
                        <div class="progress-bar ${progressClass}" style="width: ${percentage}%"></div>
                    </div>
                    <p style="font-size:0.75rem; opacity:0.7; margin-top:4px; text-align:right;">
                        ${percentage >= 100 ? '¡Presupuesto excedido!' : `${Math.round(100 - percentage)}% restante (${this.formatCurrency(budgetedAmount - actualExpense)})`}
                    </p>
                ` : ''}
            `;
            expenseGrid.appendChild(card);
        });

        // Add event listeners for save buttons
        document.querySelectorAll('.save-expense-budget-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.dataset.categoryId;
                const input = document.querySelector(`.expense-budget-input[data-category-id="${categoryId}"]`);
                const amount = parseFloat(input.value) || 0;

                currentMonthBudget.expense[categoryId] = amount;
                this.saveData();
                this.renderBudget();
                this.showNotification('Presupuesto de gasto guardado');
            });
        });
    }

    renderAnnualBudget() {
        const filterYearInput = document.getElementById('budget-filter-year');

        if (!filterYearInput.value) {
            filterYearInput.value = new Date().getFullYear();
        }

        const filterYear = filterYearInput.value;
        document.getElementById('budget-month-title').textContent = `Resumen Anual ${filterYear}`;

        // Calculate annual totals
        const yearPrefix = `${filterYear}-`;

        let totalIncome = 0;
        let totalExpense = 0;
        const incomeByCategory = {};
        const expenseByCategory = {};
        const monthlyData = {};

        // Initialize monthly data for all 12 months
        for (let m = 1; m <= 12; m++) {
            const monthKey = `${filterYear}-${String(m).padStart(2, '0')}`;
            monthlyData[monthKey] = { income: 0, expense: 0, balance: 0 };
        }

        this.transactions.forEach(t => {
            if (t.date.startsWith(yearPrefix)) {
                const monthKey = t.date.slice(0, 7);

                if (t.type === 'income') {
                    totalIncome += t.amount;
                    monthlyData[monthKey].income += t.amount;

                    if (t.categoryId) {
                        if (!incomeByCategory[t.categoryId]) {
                            incomeByCategory[t.categoryId] = 0;
                        }
                        incomeByCategory[t.categoryId] += t.amount;
                    }
                } else if (t.type === 'expense') {
                    totalExpense += t.amount;
                    monthlyData[monthKey].expense += t.amount;

                    if (t.categoryId) {
                        if (!expenseByCategory[t.categoryId]) {
                            expenseByCategory[t.categoryId] = 0;
                        }
                        expenseByCategory[t.categoryId] += t.amount;
                    }
                }
            }
        });

        const netBalance = totalIncome - totalExpense;

        // Render Summary Cards
        const summaryCards = document.getElementById('annual-summary-cards');
        summaryCards.innerHTML = `
            <div style="padding:1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:12px; color:white;">
                <div style="font-size:0.85rem; opacity:0.9; margin-bottom:8px;">Ingresos Totales</div>
                <div style="font-size:1.8rem; font-weight:700;">${this.formatCurrency(totalIncome)}</div>
            </div>
            <div style="padding:1.5rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius:12px; color:white;">
                <div style="font-size:0.85rem; opacity:0.9; margin-bottom:8px;">Gastos Totales</div>
                <div style="font-size:1.8rem; font-weight:700;">${this.formatCurrency(totalExpense)}</div>
            </div>
            <div style="padding:1.5rem; background: linear-gradient(135deg, ${netBalance >= 0 ? '#4facfe 0%, #00f2fe' : '#fa709a 0%, #fee140'} 100%); border-radius:12px; color:white;">
                <div style="font-size:0.85rem; opacity:0.9; margin-bottom:8px;">Balance Neto</div>
                <div style="font-size:1.8rem; font-weight:700;">${this.formatCurrency(netBalance)}</div>
            </div>
            <div style="padding:1.5rem; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius:12px; color:#333;">
                <div style="font-size:0.85rem; opacity:0.8; margin-bottom:8px;">Promedio Mensual</div>
                <div style="font-size:1.8rem; font-weight:700;">${this.formatCurrency(totalIncome / 12)}</div>
            </div>
        `;

        // Render Income Chart
        this.renderAnnualCategoryChart('income', incomeByCategory, 'annual-income-chart');

        // Render Expense Chart
        this.renderAnnualCategoryChart('expense', expenseByCategory, 'annual-expense-chart');

        // Render Monthly Comparison Table
        this.renderMonthlyComparisonTable(monthlyData, filterYear);
    }

    renderAnnualCategoryChart(type, categoryData, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        const categories = this.categoryManager.getCategories(type);
        const sortedData = Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1]);

        if (sortedData.length === 0) {
            container.innerHTML = `<p style="text-align:center; opacity:0.6; padding: 2rem;">No hay ${type === 'income' ? 'ingresos' : 'gastos'} registrados para este año.</p>`;
            return;
        }

        const total = sortedData.reduce((sum, [_, amount]) => sum + amount, 0);

        sortedData.forEach(([catId, amount]) => {
            const cat = categories.find(c => c.id === catId);
            if (!cat) return;

            const percentage = (amount / total) * 100;

            const item = document.createElement('div');
            item.style.marginBottom = '1rem';
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:1.2rem;">${cat.icon}</span>
                        <span style="font-weight:600;">${cat.name}</span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700; font-size:1.1rem;">${this.formatCurrency(amount)}</div>
                        <div style="font-size:0.8rem; opacity:0.7;">${percentage.toFixed(1)}% del total</div>
                    </div>
                </div>
                <div class="progress-container" style="height:10px;">
                    <div class="progress-bar" style="width: ${percentage}%; background: linear-gradient(90deg, var(--primary-color), var(--accent-color));"></div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    renderMonthlyComparisonTable(monthlyData, year) {
        const table = document.getElementById('annual-comparison-table');

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        let html = `
            <thead>
                <tr style="background-color: var(--primary-color); color: white;">
                    <th style="padding:12px; text-align:left; border:1px solid #ddd;">Mes</th>
                    <th style="padding:12px; text-align:right; border:1px solid #ddd;">Ingresos</th>
                    <th style="padding:12px; text-align:right; border:1px solid #ddd;">Gastos</th>
                    <th style="padding:12px; text-align:right; border:1px solid #ddd;">Balance</th>
                </tr>
            </thead>
            <tbody>
        `;

        for (let m = 1; m <= 12; m++) {
            const monthKey = `${year}-${String(m).padStart(2, '0')}`;
            const data = monthlyData[monthKey];
            const balance = data.income - data.expense;

            html += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px; border:1px solid #ddd; font-weight:600;">${monthNames[m - 1]} ${year}</td>
                    <td style="padding:10px; border:1px solid #ddd; text-align:right; color:var(--success-color);">+${this.formatCurrency(data.income)}</td>
                    <td style="padding:10px; border:1px solid #ddd; text-align:right; color:var(--danger-color);">-${this.formatCurrency(data.expense)}</td>
                    <td style="padding:10px; border:1px solid #ddd; text-align:right; font-weight:700; color:${balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">${this.formatCurrency(balance)}</td>
                </tr>
            `;
        }

        html += '</tbody>';
        table.innerHTML = html;
    }

    showNotification(message) {
        // Simple notification - you can enhance this
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }


    // --- CATEGORY MANAGEMENT METHODS ---

    openCategoryModal() {
        const modal = document.getElementById('modal-categories');
        this.resetCategoryForm();
        this.renderCategoriesList('expense'); // Default view
        modal.classList.add('active');
    }

    resetCategoryForm() {
        const form = document.getElementById('form-category');
        form.reset();
        document.getElementById('cat-id').value = '';
        document.getElementById('cat-budget').value = '';
        document.getElementById('cat-form-title').textContent = 'Nueva Categoría';
        document.getElementById('btn-cancel-cat-edit').classList.add('hidden');
    }

    renderCategoriesList(type) {
        const container = document.getElementById('categories-list');
        container.innerHTML = '';

        const categories = this.categoryManager.getCategories(type);

        if (categories.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888;">No hay categorías.</p>';
            return;
        }

        categories.forEach(cat => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid #eee';

            div.innerHTML = `
                <span>${cat.icon} ${cat.name}</span>
                <div>
                    <button class="icon-btn-small" onclick="window.editCategory('${cat.id}', '${type}')"><i class="fa-solid fa-pencil"></i></button>
                    <button class="icon-btn-small" style="color:red;" onclick="window.deleteCategory('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            container.appendChild(div);
        });

        // Expose helpers globally
        window.editCategory = (id, type) => this.startEditCategory(id, type);
        window.deleteCategory = (id) => {
            if (confirm('¿Borrar categoría?')) {
                this.categoryManager.deleteCategory(id);
                this.saveData();
                this.renderCategoriesList(document.querySelector('.tab-btn.active').dataset.tab);
                this.renderTransactions(); // Update icons in table if needed
            }
        };
    }

    startEditCategory(id, type) {
        const cat = this.categoryManager.getCategory(id);
        if (!cat) return;

        document.getElementById('cat-id').value = cat.id;
        document.getElementById('cat-name').value = cat.name;
        document.getElementById('cat-icon').value = cat.icon;
        document.getElementById('cat-budget').value = cat.budget || '';
        document.getElementById('cat-type').value = type;

        document.getElementById('cat-form-title').textContent = 'Editar Categoría';
        document.getElementById('btn-cancel-cat-edit').classList.remove('hidden');
    }

    handleCategorySubmit(e) {
        e.preventDefault();
        const id = document.getElementById('cat-id').value;
        const name = document.getElementById('cat-name').value;
        const icon = document.getElementById('cat-icon').value;
        const budget = parseFloat(document.getElementById('cat-budget').value) || 0;
        const type = document.getElementById('cat-type').value;

        if (id) {
            // Edit
            // Check if type changed
            const currentIncome = this.categoryManager.categories.income.find(c => c.id === id);
            const currentType = currentIncome ? 'income' : 'expense';

            if (currentType !== type) {
                // Remove from old
                this.categoryManager.deleteCategory(id);
                // Add to new
                this.categoryManager.addCategory(type, { id, name, icon, budget });
            } else {
                // Same type, just update
                this.categoryManager.updateCategory({ id, name, icon, budget });
            }
        } else {
            // New
            const newId = crypto.randomUUID();
            this.categoryManager.addCategory(type, { id: newId, name, icon, budget });
        }

        this.saveData();
        this.renderCategoriesList(document.querySelector('.tab-btn.active').dataset.tab);
        this.resetCategoryForm();

        // Update the select in the transaction modal if it's open
        // Check current radio in transaction modal to update correct list
        const txTypeRadio = document.querySelector('input[name="type"]:checked');
        if (txTypeRadio && txTypeRadio.value === type) {
            this.populateCategorySelect(type);
        }
    }

    // --- IMPORT ---

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                // Use SheetJS to read
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                this.processExcelData(jsonData);
            } catch (error) {
                console.error(error);
                alert("Error al leer el archivo Excel. Asegúrate de que sea un formato válido (.xlsx).");
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset input
        e.target.value = '';
    }

    processExcelData(rows) {
        if (!rows || rows.length === 0) return;

        let addedCount = 0;
        // Check for headers in first row
        let startIndex = 0;
        if (rows[0] && (String(rows[0][0]).toLowerCase().includes('fecha') || String(rows[0][0]).toLowerCase().includes('date'))) {
            startIndex = 1;
        }

        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            // Expected: 0:Date, 1:Account, 2:Category, 3:Note, 4:Amount, 5:Type
            if (row.length < 5) continue;

            let dateStr = '';
            // Handle Date
            if (row[0] instanceof Date) {
                dateStr = row[0].toISOString().split('T')[0];
            } else if (typeof row[0] === 'number') {
                // Approximate fallback for serial date
                const d = new Date(Math.round((row[0] - 25569) * 86400 * 1000));
                dateStr = d.toISOString().split('T')[0];
            } else {
                try {
                    const d = new Date(row[0]);
                    if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
                } catch (e) { }
            }

            const accountName = String(row[1] || '').trim();
            const categoryName = String(row[2] || '').trim();
            const note = String(row[3] || '').trim();

            // Amount
            let amountRaw = row[4];
            if (typeof amountRaw === 'string') {
                amountRaw = amountRaw.replace(/[$,]/g, '');
            }
            let amount = parseFloat(amountRaw);

            let type = String(row[5] || '').toLowerCase().trim();

            if (!dateStr || isNaN(amount)) continue;

            if (type !== 'income' && type !== 'expense' && type !== 'transfer') {
                type = amount >= 0 ? 'income' : 'expense';
            }

            const exists = this.transactions.some(t => t.date === dateStr && Math.abs(t.amount) === Math.abs(amount) && t.note === note);
            if (exists) continue;

            let accountId = this.resolveAccount(accountName);
            let categoryId = this.resolveCategory(categoryName, type);

            const newTx = {
                id: crypto.randomUUID(),
                accountId,
                categoryId,
                type,
                amount: Math.abs(amount),
                date: dateStr,
                note
            };

            this.transactions.push(newTx);
            addedCount++;
        }

        if (addedCount > 0) {
            this.saveData();
            alert(`Se importaron ${addedCount} transacciones desde Excel.`);
            this.render();
        } else {
            alert('No se encontraron transacciones nuevas en el archivo.');
        }
    }

    resolveAccount(name) {
        if (!name) return this.accountManager.getAll()[0]?.id; // Default to first

        const acc = this.accountManager.getAll().find(a => a.name.toLowerCase() === name.toLowerCase());
        if (acc) return acc.id;

        // Create new Account if not exists
        const newId = crypto.randomUUID();
        const newAcc = new Account(newId, name, 'cash', '#95a5a6', 0, 0); // Default grey color
        this.accountManager.addAccount(newAcc);
        return newId;
    }

    resolveCategory(name, type) {
        if (!name) return null;

        let cat = this.categoryManager.getAll().find(c => c.name.toLowerCase() === name.toLowerCase());

        if (cat) return cat.id;

        // Create new
        const newId = crypto.randomUUID();
        const icon = '📝'; // Default icon
        // Ensure type is valid for addCategory
        const catType = (type === 'income') ? 'income' : 'expense';
        this.categoryManager.addCategory(catType, { id: newId, name, icon });
        return newId;
    }

    // --- UTILS ---
    formatCurrency(val) {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
