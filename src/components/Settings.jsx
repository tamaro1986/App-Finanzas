import React, { useState } from 'react';
import { supabase, updateSupabaseConfig } from '../lib/supabase';
import { Save, Trash2, Download, Upload, CheckCircle, AlertCircle, RefreshCw, Sparkles, Brain } from 'lucide-react';
import * as XLSX from 'xlsx';

const Settings = () => {
    const [url, setUrl] = useState(localStorage.getItem('supabase_url') || '');
    const [key, setKey] = useState(localStorage.getItem('supabase_key') || '');
    const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSaveConfig = () => {
        if (!url || !key) {
            setStatus({ type: 'error', message: 'Por favor completa ambos campos.' });
            return;
        }
        updateSupabaseConfig(url, key);
        setStatus({ type: 'success', message: 'Configuración guardada. Recargando...' });
    };

    const handleSaveGeminiConfig = () => {
        if (!geminiKey) {
            setStatus({ type: 'error', message: 'Por favor pega una clave de API válida.' });
            return;
        }
        localStorage.setItem('gemini_api_key', geminiKey);
        setStatus({ type: 'success', message: '¡IA Activada con éxito!' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    };

    const handleClearData = () => {
        const password = window.prompt('Introduce la contraseña para borrar todos los datos:');

        // Puedes cambiar 'admin123' por la contraseña que prefieras
        if (password === 'admin123') {
            if (window.confirm('¿ESTÁS TOTALMENTE SEGURO? Esta acción borrará permanentemente todos tus registros locales.')) {
                localStorage.clear();
                window.location.reload();
            }
        } else if (password !== null) {
            alert('Contraseña incorrecta. Acción cancelada.');
        }
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Basic validation and transformation
                const transactions = data.map(row => ({
                    id: crypto.randomUUID(),
                    date: row.Fecha || new Date().toISOString().split('T')[0],
                    accountId: row.CuentaID || 'default',
                    type: row.Tipo === 'Ingreso' ? 'income' : 'expense',
                    amount: parseFloat(row.Monto) || 0,
                    note: row.Nota || '',
                    categoryId: row.CategoriaID || 'other'
                }));

                const existing = JSON.parse(localStorage.getItem('finanzas_transactions') || '[]');
                localStorage.setItem('finanzas_transactions', JSON.stringify([...existing, ...transactions]));

                setStatus({ type: 'success', message: `¡Se importaron ${transactions.length} registros con éxito!` });
            } catch (error) {
                console.error('Error importing Excel:', error);
                setStatus({ type: 'error', message: 'Error al procesar el archivo Excel.' });
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold text-slate-900">Configuración</h2>
                <p className="text-slate-500 mt-1">Gestiona tu conexión a la nube y tus datos locales.</p>
            </header>

            {status.message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-medium">{status.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Configuration */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                            <Sparkles size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-800">IA de Bienestar (Gratis)</h3>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">
                            Usa la IA de Google para refutar tus pensamientos. Puedes obtener una clave
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-violet-600 font-bold hover:underline ml-1">GRATIS aquí</a>.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
                            <input
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                                placeholder="Pega tu clave de Google AI Studio"
                            />
                        </div>
                        <button
                            onClick={handleSaveGeminiConfig}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2 text-sm"
                        >
                            <Save size={18} />
                            Activar IA Refutadora
                        </button>
                    </div>
                </div>

                {/* Supabase Config */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <RefreshCw size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-800">Conexión Supabase</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">URL del Proyecto</label>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="https://your-project.supabase.co"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Anon Key</label>
                            <input
                                type="password"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                placeholder="your-anon-key"
                            />
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm"
                        >
                            <Save size={18} />
                            Guardar Configuración Supabase
                        </button>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <Trash2 size={20} />
                        </div>
                        <h3 className="font-semibold text-slate-800">Gestión de Datos</h3>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm text-slate-500">Importa tus registros desde un archivo Excel o limpia la base de datos local para empezar de cero.</p>

                        <div className="relative group">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleImportExcel}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <button className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                                <Upload size={18} />
                                Importar desde Excel
                            </button>
                        </div>

                        <button
                            onClick={handleClearData}
                            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-rose-200"
                        >
                            <Trash2 size={18} />
                            Limpiar Base de Datos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
