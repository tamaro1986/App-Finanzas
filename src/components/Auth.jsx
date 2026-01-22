// ============================================================================
// COMPONENTE: Auth
// PROPÓSITO: Pantalla de login/signup con Supabase Auth
// ============================================================================
import React, { useState } from 'react'
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

const Auth = ({ onAuthSuccess }) => {
    // Estado para alternar entre login y signup
    const [isLogin, setIsLogin] = useState(true)
    // Estado del formulario
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    // Estados de UI
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // ============================================================================
    // FUNCIÓN: handleLogin
    // PROPÓSITO: Autenticar usuario existente
    // ============================================================================
    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            // Intentar login con Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Login exitoso
            setMessage('¡Inicio de sesión exitoso!')
            setTimeout(() => {
                onAuthSuccess(data.user)
            }, 500)
        } catch (error) {
            setError(error.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    // ============================================================================
    // FUNCIÓN: handleSignup
    // PROPÓSITO: Registrar nuevo usuario
    // ============================================================================
    const handleSignup = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        // Validar longitud mínima de contraseña
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            setLoading(false)
            return
        }

        try {
            // Registrar usuario en Supabase
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })

            if (error) throw error

            // Registro exitoso
            setMessage('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.')
            setEmail('')
            setPassword('')
            setConfirmPassword('')

            // Si el email está confirmado automáticamente, hacer login
            if (data.user && data.session) {
                setTimeout(() => {
                    onAuthSuccess(data.user)
                }, 1500)
            }
        } catch (error) {
            setError(error.message || 'Error al crear cuenta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-violet-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl shadow-2xl shadow-blue-200 mb-4">
                        <span className="text-4xl font-black text-white">₱</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">FinanzasPro</h1>
                    <p className="text-slate-500 font-medium">Control total de tus finanzas</p>
                </div>

                {/* Card de autenticación */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 border border-slate-100">
                    {/* Tabs Login/Signup */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-8">
                        <button
                            onClick={() => {
                                setIsLogin(true)
                                setError('')
                                setMessage('')
                            }}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isLogin
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LogIn size={18} className="inline mr-2" />
                            Iniciar Sesión
                        </button>
                        <button
                            onClick={() => {
                                setIsLogin(false)
                                setError('')
                                setMessage('')
                            }}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isLogin
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <UserPlus size={18} className="inline mr-2" />
                            Registrarse
                        </button>
                    </div>

                    {/* Mensajes de error/éxito */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                            <p className="text-sm font-bold text-rose-900">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                            <p className="text-sm font-bold text-emerald-900">{message}</p>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input
                                    type="email"
                                    required
                                    placeholder="tu@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar contraseña (solo en signup) */}
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-violet-500 focus:bg-white transition-all outline-none"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Botón de submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl transition-all ${isLogin
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                                    : 'bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 shadow-violet-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    Procesando...
                                </>
                            ) : isLogin ? (
                                <>
                                    <LogIn size={20} />
                                    Iniciar Sesión
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    Crear Cuenta
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-400 mt-6">
                    Tus datos están protegidos con encriptación de extremo a extremo
                </p>
            </div>
        </div>
    )
}

export default Auth
