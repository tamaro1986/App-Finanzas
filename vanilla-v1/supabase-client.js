/**
 * Supabase Client Module
 * Maneja toda la comunicación con la base de datos en la nube
 */

class SupabaseClient {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.syncQueue = []; // Cola de operaciones pendientes cuando está offline

        // Escuchar cambios en la conectividad
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    /**
     * Inicializar conexión con Supabase
     */
    async init(config) {
        try {
            if (!config || !config.url || !config.anonKey) {
                console.warn('⚠️ Supabase no configurado. Funcionando en modo offline.');
                return false;
            }

            // Cargar la librería de Supabase desde CDN
            if (!window.supabase) {
                await this.loadSupabaseLibrary();
            }

            // Crear cliente de Supabase
            this.supabase = window.supabase.createClient(config.url, config.anonKey);

            // Verificar sesión existente
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.user = session.user;
            }

            // Escuchar cambios en la autenticación
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.user = session?.user || null;
                if (event === 'SIGNED_IN') {
                    this.onSignIn();
                } else if (event === 'SIGNED_OUT') {
                    this.onSignOut();
                }
            });

            this.isInitialized = true;
            console.log('✅ Supabase inicializado correctamente');
            return true;

        } catch (error) {
            console.error('❌ Error al inicializar Supabase:', error);
            return false;
        }
    }

    /**
     * Cargar librería de Supabase desde CDN
     */
    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return this.user !== null;
    }

    /**
     * Registrar nuevo usuario
     */
    async signUp(email, password, fullName = '') {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) throw error;

            // Crear perfil de usuario
            if (data.user) {
                await this.supabase.from('user_profiles').insert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName
                });
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Iniciar sesión
     */
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cerrar sesión
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Recuperar contraseña
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al recuperar contraseña:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Evento cuando el usuario inicia sesión
     */
    async onSignIn() {
        console.log('👤 Usuario autenticado:', this.user.email);

        // Sincronizar datos locales con la nube
        if (window.app) {
            await window.app.syncWithCloud();
        }
    }

    /**
     * Evento cuando el usuario cierra sesión
     */
    onSignOut() {
        console.log('👋 Usuario desconectado');
        this.user = null;
    }

    /**
     * Evento cuando se recupera la conexión
     */
    async handleOnline() {
        console.log('🌐 Conexión restaurada');
        this.isOnline = true;

        // Procesar cola de sincronización
        await this.processSyncQueue();
    }

    /**
     * Evento cuando se pierde la conexión
     */
    handleOffline() {
        console.log('📴 Sin conexión - Modo offline');
        this.isOnline = false;
    }

    /**
     * Procesar cola de operaciones pendientes
     */
    async processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        console.log(`🔄 Sincronizando ${this.syncQueue.length} operaciones pendientes...`);

        while (this.syncQueue.length > 0) {
            const operation = this.syncQueue.shift();
            try {
                await operation();
            } catch (error) {
                console.error('Error al procesar operación:', error);
            }
        }

        console.log('✅ Sincronización completada');
    }

    // ==================== OPERACIONES CRUD ====================

    /**
     * Obtener todas las cuentas del usuario
     */
    async getAccounts() {
        if (!this.isAuthenticated()) return { success: false, error: 'No autenticado' };

        try {
            const { data, error } = await this.supabase
                .from('accounts')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener cuentas:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Guardar/actualizar cuenta
     */
    async saveAccount(account) {
        if (!this.isAuthenticated()) {
            // Agregar a cola si está offline
            this.syncQueue.push(() => this.saveAccount(account));
            return { success: true, queued: true };
        }

        try {
            const accountData = {
                ...account,
                user_id: this.user.id
            };

            const { data, error } = await this.supabase
                .from('accounts')
                .upsert(accountData, { onConflict: 'id' })
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar cuenta:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Eliminar cuenta
     */
    async deleteAccount(accountId) {
        if (!this.isAuthenticated()) {
            this.syncQueue.push(() => this.deleteAccount(accountId));
            return { success: true, queued: true };
        }

        try {
            const { error } = await this.supabase
                .from('accounts')
                .delete()
                .eq('id', accountId)
                .eq('user_id', this.user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener todas las categorías del usuario
     */
    async getCategories() {
        if (!this.isAuthenticated()) return { success: false, error: 'No autenticado' };

        try {
            const { data, error } = await this.supabase
                .from('categories')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Guardar/actualizar categoría
     */
    async saveCategory(category) {
        if (!this.isAuthenticated()) {
            this.syncQueue.push(() => this.saveCategory(category));
            return { success: true, queued: true };
        }

        try {
            const categoryData = {
                ...category,
                user_id: this.user.id
            };

            const { data, error } = await this.supabase
                .from('categories')
                .upsert(categoryData, { onConflict: 'id' })
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar categoría:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Eliminar categoría
     */
    async deleteCategory(categoryId) {
        if (!this.isAuthenticated()) {
            this.syncQueue.push(() => this.deleteCategory(categoryId));
            return { success: true, queued: true };
        }

        try {
            const { error } = await this.supabase
                .from('categories')
                .delete()
                .eq('id', categoryId)
                .eq('user_id', this.user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener todas las transacciones del usuario
     */
    async getTransactions() {
        if (!this.isAuthenticated()) return { success: false, error: 'No autenticado' };

        try {
            const { data, error } = await this.supabase
                .from('transactions')
                .select('*')
                .eq('user_id', this.user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener transacciones:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Guardar/actualizar transacción
     */
    async saveTransaction(transaction) {
        if (!this.isAuthenticated()) {
            this.syncQueue.push(() => this.saveTransaction(transaction));
            return { success: true, queued: true };
        }

        try {
            const transactionData = {
                ...transaction,
                user_id: this.user.id
            };

            const { data, error } = await this.supabase
                .from('transactions')
                .upsert(transactionData, { onConflict: 'id' })
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar transacción:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Eliminar transacción
     */
    async deleteTransaction(transactionId) {
        if (!this.isAuthenticated()) {
            this.syncQueue.push(() => this.deleteTransaction(transactionId));
            return { success: true, queued: true };
        }

        try {
            const { error } = await this.supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId)
                .eq('user_id', this.user.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener configuración del usuario
     */
    async getUserSettings() {
        if (!this.isAuthenticated()) return { success: false, error: 'No autenticado' };

        try {
            const { data, error } = await this.supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', this.user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return { success: true, data: data || {} };
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Guardar configuración del usuario
     */
    async saveUserSettings(settings) {
        if (!this.isAuthenticated()) {
            this.syncQueue.push(() => this.saveUserSettings(settings));
            return { success: true, queued: true };
        }

        try {
            const { data, error } = await this.supabase
                .from('user_settings')
                .upsert({
                    user_id: this.user.id,
                    ...settings
                }, { onConflict: 'user_id' })
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sincronizar todos los datos locales con la nube
     */
    async syncAllData(localData) {
        if (!this.isAuthenticated()) {
            console.warn('No se puede sincronizar: usuario no autenticado');
            return { success: false, error: 'No autenticado' };
        }

        console.log('🔄 Iniciando sincronización completa...');

        try {
            // Sincronizar cuentas
            if (localData.accounts && localData.accounts.length > 0) {
                for (const account of localData.accounts) {
                    await this.saveAccount(account);
                }
            }

            // Sincronizar categorías
            if (localData.categories) {
                const allCategories = [
                    ...(localData.categories.income || []),
                    ...(localData.categories.expense || [])
                ];
                for (const category of allCategories) {
                    await this.saveCategory(category);
                }
            }

            // Sincronizar transacciones
            if (localData.transactions && localData.transactions.length > 0) {
                for (const transaction of localData.transactions) {
                    await this.saveTransaction(transaction);
                }
            }

            // Sincronizar configuración
            if (localData.settings) {
                await this.saveUserSettings(localData.settings);
            }

            console.log('✅ Sincronización completada exitosamente');
            return { success: true };

        } catch (error) {
            console.error('❌ Error en sincronización:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener todos los datos del usuario desde la nube
     */
    async getAllData() {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'No autenticado' };
        }

        try {
            const [accounts, categories, transactions, settings] = await Promise.all([
                this.getAccounts(),
                this.getCategories(),
                this.getTransactions(),
                this.getUserSettings()
            ]);

            // Organizar categorías por tipo
            const categoriesData = {
                income: categories.data?.filter(c => c.type === 'income') || [],
                expense: categories.data?.filter(c => c.type === 'expense') || []
            };

            return {
                success: true,
                data: {
                    accounts: accounts.data || [],
                    categories: categoriesData,
                    transactions: transactions.data || [],
                    settings: settings.data || {}
                }
            };

        } catch (error) {
            console.error('Error al obtener datos:', error);
            return { success: false, error: error.message };
        }
    }
}

// Exportar instancia única
export const supabaseClient = new SupabaseClient();
