/**
 * Authentication UI Module
 * Maneja la interfaz de usuario para login, registro y recuperación de contraseña
 */

export class AuthUI {
    constructor(supabaseClient) {
        this.client = supabaseClient;
        this.createAuthModal();
    }

    /**
     * Crear el modal de autenticación
     */
    createAuthModal() {
        const modalHTML = `
            <div id="auth-modal" class="modal" style="display: none;">
                <div class="modal-content auth-modal-content">
                    <div class="auth-header">
                        <h2 id="auth-title">Iniciar Sesión</h2>
                        <p id="auth-subtitle">Accede a tus finanzas desde cualquier dispositivo</p>
                    </div>

                    <!-- Formulario de Login -->
                    <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <label for="login-email">
                                <i class="fas fa-envelope"></i> Correo Electrónico
                            </label>
                            <input 
                                type="email" 
                                id="login-email" 
                                required 
                                placeholder="tu@email.com"
                                autocomplete="email"
                            >
                        </div>

                        <div class="form-group">
                            <label for="login-password">
                                <i class="fas fa-lock"></i> Contraseña
                            </label>
                            <input 
                                type="password" 
                                id="login-password" 
                                required 
                                placeholder="••••••••"
                                autocomplete="current-password"
                            >
                        </div>

                        <div class="form-actions">
                            <button type="button" id="forgot-password-btn" class="link-button">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                        </button>

                        <div class="auth-divider">
                            <span>o</span>
                        </div>

                        <button type="button" id="show-signup-btn" class="btn btn-secondary btn-block">
                            <i class="fas fa-user-plus"></i> Crear Cuenta Nueva
                        </button>

                        <button type="button" id="continue-offline-btn" class="btn btn-outline btn-block">
                            <i class="fas fa-laptop"></i> Continuar sin cuenta (Solo local)
                        </button>
                    </form>

                    <!-- Formulario de Registro -->
                    <form id="signup-form" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label for="signup-name">
                                <i class="fas fa-user"></i> Nombre Completo
                            </label>
                            <input 
                                type="text" 
                                id="signup-name" 
                                placeholder="Tu nombre"
                                autocomplete="name"
                            >
                        </div>

                        <div class="form-group">
                            <label for="signup-email">
                                <i class="fas fa-envelope"></i> Correo Electrónico
                            </label>
                            <input 
                                type="email" 
                                id="signup-email" 
                                required 
                                placeholder="tu@email.com"
                                autocomplete="email"
                            >
                        </div>

                        <div class="form-group">
                            <label for="signup-password">
                                <i class="fas fa-lock"></i> Contraseña
                            </label>
                            <input 
                                type="password" 
                                id="signup-password" 
                                required 
                                placeholder="Mínimo 6 caracteres"
                                autocomplete="new-password"
                                minlength="6"
                            >
                        </div>

                        <div class="form-group">
                            <label for="signup-password-confirm">
                                <i class="fas fa-lock"></i> Confirmar Contraseña
                            </label>
                            <input 
                                type="password" 
                                id="signup-password-confirm" 
                                required 
                                placeholder="Repite tu contraseña"
                                autocomplete="new-password"
                                minlength="6"
                            >
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-user-plus"></i> Crear Cuenta
                        </button>

                        <button type="button" id="show-login-btn" class="btn btn-secondary btn-block">
                            <i class="fas fa-arrow-left"></i> Volver a Iniciar Sesión
                        </button>
                    </form>

                    <!-- Formulario de Recuperación de Contraseña -->
                    <form id="reset-password-form" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label for="reset-email">
                                <i class="fas fa-envelope"></i> Correo Electrónico
                            </label>
                            <input 
                                type="email" 
                                id="reset-email" 
                                required 
                                placeholder="tu@email.com"
                                autocomplete="email"
                            >
                            <small>Te enviaremos un enlace para restablecer tu contraseña</small>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">
                            <i class="fas fa-paper-plane"></i> Enviar Enlace
                        </button>

                        <button type="button" id="back-to-login-btn" class="btn btn-secondary btn-block">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </form>

                    <!-- Indicador de carga -->
                    <div id="auth-loading" class="auth-loading" style="display: none;">
                        <div class="spinner"></div>
                        <p>Procesando...</p>
                    </div>

                    <!-- Mensajes -->
                    <div id="auth-message" class="auth-message" style="display: none;"></div>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar event listeners
        this.setupEventListeners();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botones de navegación entre formularios
        document.getElementById('show-signup-btn').addEventListener('click', () => {
            this.showSignupForm();
        });

        document.getElementById('show-login-btn').addEventListener('click', () => {
            this.showLoginForm();
        });

        document.getElementById('forgot-password-btn').addEventListener('click', () => {
            this.showResetPasswordForm();
        });

        document.getElementById('back-to-login-btn').addEventListener('click', () => {
            this.showLoginForm();
        });

        document.getElementById('continue-offline-btn').addEventListener('click', () => {
            this.continueOffline();
        });

        // Formularios
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        document.getElementById('reset-password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleResetPassword();
        });
    }

    /**
     * Mostrar modal de autenticación
     */
    show() {
        document.getElementById('auth-modal').style.display = 'flex';
        this.showLoginForm();
    }

    /**
     * Ocultar modal de autenticación
     */
    hide() {
        document.getElementById('auth-modal').style.display = 'none';
        this.clearForms();
        this.hideMessage();
    }

    /**
     * Mostrar formulario de login
     */
    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('reset-password-form').style.display = 'none';
        document.getElementById('auth-title').textContent = 'Iniciar Sesión';
        document.getElementById('auth-subtitle').textContent = 'Accede a tus finanzas desde cualquier dispositivo';
        this.hideMessage();
    }

    /**
     * Mostrar formulario de registro
     */
    showSignupForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
        document.getElementById('reset-password-form').style.display = 'none';
        document.getElementById('auth-title').textContent = 'Crear Cuenta';
        document.getElementById('auth-subtitle').textContent = 'Únete y sincroniza tus datos en la nube';
        this.hideMessage();
    }

    /**
     * Mostrar formulario de recuperación de contraseña
     */
    showResetPasswordForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('reset-password-form').style.display = 'block';
        document.getElementById('auth-title').textContent = 'Recuperar Contraseña';
        document.getElementById('auth-subtitle').textContent = 'Te enviaremos instrucciones a tu correo';
        this.hideMessage();
    }

    /**
     * Manejar inicio de sesión
     */
    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }

        this.showLoading();

        const result = await this.client.signIn(email, password);

        this.hideLoading();

        if (result.success) {
            this.showMessage('¡Bienvenido! Sincronizando datos...', 'success');
            setTimeout(() => {
                this.hide();
                if (window.app) {
                    window.app.onUserAuthenticated();
                }
            }, 1500);
        } else {
            this.showMessage(this.getErrorMessage(result.error), 'error');
        }
    }

    /**
     * Manejar registro
     */
    async handleSignup() {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-password-confirm').value;

        if (!email || !password) {
            this.showMessage('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            this.showMessage('Las contraseñas no coinciden', 'error');
            return;
        }

        this.showLoading();

        const result = await this.client.signUp(email, password, name);

        this.hideLoading();

        if (result.success) {
            this.showMessage(
                '¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.',
                'success'
            );
            setTimeout(() => {
                this.showLoginForm();
            }, 3000);
        } else {
            this.showMessage(this.getErrorMessage(result.error), 'error');
        }
    }

    /**
     * Manejar recuperación de contraseña
     */
    async handleResetPassword() {
        const email = document.getElementById('reset-email').value.trim();

        if (!email) {
            this.showMessage('Por favor ingresa tu correo electrónico', 'error');
            return;
        }

        this.showLoading();

        const result = await this.client.resetPassword(email);

        this.hideLoading();

        if (result.success) {
            this.showMessage(
                '¡Correo enviado! Revisa tu bandeja de entrada.',
                'success'
            );
            setTimeout(() => {
                this.showLoginForm();
            }, 3000);
        } else {
            this.showMessage(this.getErrorMessage(result.error), 'error');
        }
    }

    /**
     * Continuar sin cuenta (modo offline)
     */
    continueOffline() {
        this.hide();
        if (window.app) {
            window.app.showNotification('⚠️ Trabajando en modo local. Los datos no se sincronizarán.');
        }
    }

    /**
     * Mostrar indicador de carga
     */
    showLoading() {
        document.getElementById('auth-loading').style.display = 'flex';
    }

    /**
     * Ocultar indicador de carga
     */
    hideLoading() {
        document.getElementById('auth-loading').style.display = 'none';
    }

    /**
     * Mostrar mensaje
     */
    showMessage(message, type = 'info') {
        const messageEl = document.getElementById('auth-message');
        messageEl.textContent = message;
        messageEl.className = `auth-message auth-message-${type}`;
        messageEl.style.display = 'block';
    }

    /**
     * Ocultar mensaje
     */
    hideMessage() {
        document.getElementById('auth-message').style.display = 'none';
    }

    /**
     * Limpiar formularios
     */
    clearForms() {
        document.getElementById('login-form').reset();
        document.getElementById('signup-form').reset();
        document.getElementById('reset-password-form').reset();
    }

    /**
     * Obtener mensaje de error amigable
     */
    getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'Correo o contraseña incorrectos',
            'Email not confirmed': 'Por favor confirma tu correo electrónico',
            'User already registered': 'Este correo ya está registrado',
            'Invalid email': 'Correo electrónico inválido',
            'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
            'Unable to validate email address': 'No se pudo validar el correo electrónico',
            'Email rate limit exceeded': 'Demasiados intentos. Espera un momento.',
        };

        return errorMessages[error] || `Error: ${error}`;
    }

    /**
     * Crear botón de perfil de usuario en la barra de navegación
     */
    createUserProfileButton() {
        const userButtonHTML = `
            <div id="user-profile-btn" class="user-profile-btn" style="display: none;">
                <button class="btn-icon" title="Perfil de usuario">
                    <i class="fas fa-user-circle"></i>
                    <span id="user-email-display"></span>
                </button>
                <div class="user-dropdown" id="user-dropdown">
                    <div class="user-info">
                        <i class="fas fa-user"></i>
                        <span id="user-name-display">Usuario</span>
                    </div>
                    <div class="dropdown-divider"></div>
                    <button id="sync-now-btn" class="dropdown-item">
                        <i class="fas fa-sync"></i> Sincronizar Ahora
                    </button>
                    <button id="logout-btn" class="dropdown-item">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>
        `;

        // Buscar la barra de herramientas y agregar el botón
        const toolbar = document.querySelector('.toolbar');
        if (toolbar) {
            toolbar.insertAdjacentHTML('beforeend', userButtonHTML);

            // Event listeners
            document.getElementById('user-profile-btn').addEventListener('click', () => {
                document.getElementById('user-dropdown').classList.toggle('show');
            });

            document.getElementById('logout-btn').addEventListener('click', async () => {
                await this.handleLogout();
            });

            document.getElementById('sync-now-btn').addEventListener('click', async () => {
                if (window.app) {
                    await window.app.syncWithCloud();
                }
                document.getElementById('user-dropdown').classList.remove('show');
            });

            // Cerrar dropdown al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#user-profile-btn')) {
                    document.getElementById('user-dropdown').classList.remove('show');
                }
            });
        }
    }

    /**
     * Actualizar UI cuando el usuario inicia sesión
     */
    updateUIForAuthenticatedUser(user) {
        const profileBtn = document.getElementById('user-profile-btn');
        if (profileBtn) {
            profileBtn.style.display = 'flex';
            document.getElementById('user-email-display').textContent = user.email;
            document.getElementById('user-name-display').textContent =
                user.user_metadata?.full_name || user.email.split('@')[0];
        }
    }

    /**
     * Actualizar UI cuando el usuario cierra sesión
     */
    updateUIForUnauthenticatedUser() {
        const profileBtn = document.getElementById('user-profile-btn');
        if (profileBtn) {
            profileBtn.style.display = 'none';
        }
    }

    /**
     * Manejar cierre de sesión
     */
    async handleLogout() {
        if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            return;
        }

        const result = await this.client.signOut();

        if (result.success) {
            localStorage.removeItem('finanzas_cloud_sync_initialized');
            this.updateUIForUnauthenticatedUser();
            if (window.app) {
                window.app.showNotification('Sesión cerrada. Trabajando en modo local.');
            }
            // Opcional: mostrar modal de login nuevamente
            // this.show();
        }
    }
}
