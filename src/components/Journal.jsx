// ============================================================================
// IMPORTS: React, iconos, animaciones y utilidades
// ============================================================================
import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Brain, Calendar, X, Edit3, Sparkles, MessageCircle, AlertCircle, RefreshCw, Heart, Smile, Star, Search, Filter, ShieldCheck, ChevronRight, TrendingUp, Pill, Wind, Stethoscope, Activity, Moon, Settings2, Timer } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: Journal
// PROPÓSITO: Diario de salud mental con TCC y bitácora médica
// CONECTADO A: Supabase tablas 'journal_tcc', 'journal_health_log', 'medications'
// ============================================================================
const Journal = ({ tccEntries, setTccEntries, logEntries, setLogEntries, medicationList, setMedicationList }) => {
    const [activeTab, setActiveTab] = useState('tcc')
    const [searchQuery, setSearchQuery] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newMedName, setNewMedName] = useState('')

    const [editingId, setEditingId] = useState(null)

    // States for New Entries
    const [newTccEntry, setNewTccEntry] = useState({
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        situation: '',
        emotions: '',
        automaticThought: '',
        distortion: '',
        refutation: '',
        reevaluation: ''
    })

    const [newLogEntry, setNewLogEntry] = useState({
        date: format(new Date(), "yyyy-MM-dd"),
        anxietyLevel: 5,
        insomniaLevel: 0,
        medications: {},
        meditation: { morning: 0, afternoon: 0, night: 0 },
        diary_note: '',
        symptoms: ''
    })

    // Función para abrir el modal en modo edición
    const openEditModal = (entry, type) => {
        setEditingId(entry.id)
        if (type === 'tcc') {
            setNewTccEntry({ ...entry })
        } else {
            setNewLogEntry({ ...entry })
        }
        setActiveTab(type)
        setIsModalOpen(true)
    }

    // Resetear formularios al cerrar modal
    const closeModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setNewTccEntry({
            date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            situation: '',
            emotions: '',
            automaticThought: '',
            distortion: '',
            refutation: '',
            reevaluation: ''
        })
        const resetMeds = {}
        medicationList.forEach(m => { resetMeds[m] = false })
        setNewLogEntry({
            date: format(new Date(), "yyyy-MM-dd"),
            anxietyLevel: 5,
            insomniaLevel: 0,
            medications: resetMeds,
            meditation: { morning: 0, afternoon: 0, night: 0 },
            diary_note: '',
            symptoms: ''
        })
    }

    // Initialize newLogEntry medications when medicationList changes or on mount
    useEffect(() => {
        if (!editingId) {
            const initialMeds = {}
            medicationList.forEach(m => {
                initialMeds[m] = false
            })
            setNewLogEntry(prev => ({ ...prev, medications: initialMeds }))
        }
    }, [medicationList, editingId])

    const handleAddMedication = async () => {
        if (!newMedName.trim()) return
        if (medicationList.includes(newMedName.trim())) return
        const updatedList = [...medicationList, newMedName.trim()]
        setMedicationList(updatedList)

        // Guardar en Supabase (como un solo registro con array)
        const medRecord = { id: 'medications-list', list: updatedList }
        await saveToSupabase('journal_med_list', 'journal_med_list', medRecord, [medRecord])

        setNewMedName('')
    }

    const removeMedication = (med) => {
        if (confirm(`¿Eliminar "${med}" del catálogo?`)) {
            setMedicationList(medicationList.filter(m => m !== med))
        }
    }

    const simulateAIResponse = async (thought, situation, emotions) => {
        // API Key hardcodeada para conexión automática
        const GEMINI_API_KEY = 'AIzaSyBHeE525Uh0Crk31DahsNd-Vtd4MHp7nSI'

        setIsThinking(true)

        // Prompt profesional basado en las 9 técnicas de manejo de pensamientos intrusos
        const professionalPrompt = `Eres un terapeuta cognitivo-conductual (TCC) experto especializado en el manejo de pensamientos intrusos. 

CONTEXTO DEL PACIENTE:
- Situación: "${situation || 'No especificada'}"
- Emociones experimentadas: "${emotions || 'No especificadas'}"
- Pensamiento automático/intruso: "${thought}"

INSTRUCCIONES:
Analiza este pensamiento usando las siguientes técnicas de TCC y responde con el formato EXACTO especificado:

🔍 **DISTORSIONES COGNITIVAS IDENTIFICADAS**
(Identifica las distorsiones presentes: Catastrofismo, Pensamiento todo-o-nada, Sobregeneralización, Filtro mental, Descalificar lo positivo, Lectura de mente, Adivinación del futuro, Magnificación/Minimización, Razonamiento emocional, Etiquetado, Personalización, Debería)

📝 **RECONOCIMIENTO Y ACEPTACIÓN** (Técnicas 1-2)
(Valida que el pensamiento es normal y no define al paciente. El paciente debe saber que los pensamientos intrusos son comunes y no reflejan su valor como persona)

⚖️ **EVALUACIÓN DE EVIDENCIA** (Técnica 3)
(¿Hay evidencia real que respalde este pensamiento? ¿Está exagerado o distorsionado? Desafía el pensamiento con preguntas socráticas)

💭 **TÉCNICA DE DESCONEXIÓN** (Técnica 4)
(Sugiere cómo el paciente puede distanciarse del pensamiento: visualizarlo como una nube que pasa, decirlo en voz alta para hacerlo mundano, observarlo sin involucrarse)

🎯 **REDIRECCIÓN Y ACCIÓN** (Técnica 5)
(Sugiere una actividad concreta para cambiar el foco: lectura, ejercicio, meditación, lista de gratitud)

🧘 **TÉCNICA DE RELAJACIÓN** (Técnica 6)
(Proporciona un ejercicio breve: respiración 4-7-8, relajación muscular progresiva, visualización calmante)

✨ **RESPUESTA ADAPTATIVA** (Técnica 8)
(Crea 2-3 afirmaciones positivas específicas que el paciente puede usar cuando surja este pensamiento)

🌱 **NUEVA PERSPECTIVA**
(Una frase corta y poderosa que reencuadre el pensamiento de forma saludable)

Responde de forma empática, profesional y esperanzadora. El objetivo es que el paciente se sienta comprendido y equipado con herramientas prácticas.`

        // Lista de modelos disponibles (verificados via ListModels API)
        const modelsToTry = [
            { version: 'v1beta', model: 'gemini-2.5-flash' },
            { version: 'v1beta', model: 'gemini-2.0-flash-lite' },
            { version: 'v1beta', model: 'gemini-flash-latest' },
            { version: 'v1beta', model: 'gemini-pro-latest' }
        ]

        // Función helper para hacer fetch con timeout
        const fetchWithTimeout = async (url, options, timeoutMs = 20000) => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
            try {
                const response = await fetch(url, { ...options, signal: controller.signal })
                clearTimeout(timeoutId)
                return response
            } catch (error) {
                clearTimeout(timeoutId)
                throw error
            }
        }

        // Intentar con cada modelo
        for (const { version, model } of modelsToTry) {
            try {
                console.log(`🤖 Intentando con ${model}...`)

                const response = await fetchWithTimeout(
                    `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: professionalPrompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 2048
                            }
                        })
                    },
                    20000 // 20 segundos timeout
                )

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    console.warn(`⚠️ Error con ${model}:`, response.status, errorData)
                    continue // Intentar siguiente modelo
                }

                const data = await response.json()

                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    console.log(`✅ Respuesta exitosa de ${model}`)
                    setIsThinking(false)
                    return data.candidates[0].content.parts[0].text
                }

                // Si no hay contenido, intentar siguiente modelo
                console.warn(`⚠️ ${model} no devolvió contenido válido`)

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.warn(`⏱️ Timeout con ${model}`)
                } else {
                    console.error(`❌ Error con ${model}:`, error.message)
                }
                // Continuar con siguiente modelo
            }
        }

        // Si todos los modelos fallaron, devolver análisis de fallback útil
        setIsThinking(false)
        console.error('❌ Todos los modelos fallaron')

        return `🔍 **ANÁLISIS OFFLINE**

⚠️ No se pudo conectar con la IA en este momento, pero aquí tienes un análisis guiado:

📝 **RECONOCIMIENTO**
Tu pensamiento "${thought.substring(0, 50)}..." es solo un pensamiento, no un hecho. Los pensamientos intrusos son normales y no te definen.

⚖️ **PREGÚNTATE**
- ¿Hay evidencia real de que esto es verdad?
- ¿Estoy exagerando o anticipando lo peor?
- ¿Qué le diría a un amigo con este pensamiento?

🧘 **TÉCNICA DE RELAJACIÓN**
Respira profundo: inhala 4 segundos, mantén 7, exhala 8. Repite 3 veces.

✨ **AFIRMACIÓN**
"Este pensamiento no me controla. Tengo el poder de elegir cómo respondo."

🌱 **RECUERDA**
Los pensamientos son como nubes en el cielo: vienen y van. No tienes que aferrarte a ellos.

💡 *Vuelve a intentar en unos minutos para obtener un análisis personalizado con IA.*`
    }

    const handleAddTccEntry = async (e) => {
        e.preventDefault()
        let finalRefutation = newTccEntry.refutation

        // Generar análisis de IA con contexto completo (situación, emociones y pensamiento)
        if (!editingId || !finalRefutation) {
            finalRefutation = await simulateAIResponse(
                newTccEntry.automaticThought,
                newTccEntry.situation,
                newTccEntry.emotions
            )
        }

        const entry = editingId
            ? { ...newTccEntry, updated_at: new Date().toISOString() }
            : { id: crypto.randomUUID(), ...newTccEntry, refutation: finalRefutation, created_at: new Date().toISOString() }

        const updatedEntries = editingId
            ? tccEntries.map(e => e.id === editingId ? entry : e)
            : [entry, ...tccEntries]

        setTccEntries(updatedEntries)

        // Guardar en Supabase
        await saveToSupabase('journal_tcc', 'journal_tcc', entry, updatedEntries)

        closeModal()
    }

    const handleAddLogEntry = async (e) => {
        e.preventDefault()
        const entry = editingId
            ? { ...newLogEntry, updated_at: new Date().toISOString() }
            : { id: crypto.randomUUID(), ...newLogEntry, created_at: new Date().toISOString() }

        const updatedEntries = editingId
            ? logEntries.map(e => e.id === editingId ? entry : e)
            : [entry, ...logEntries]

        setLogEntries(updatedEntries)

        // Guardar en Supabase
        await saveToSupabase('journal_health_log', 'journal_health_log', entry, updatedEntries)

        closeModal()
    }

    const deleteTccEntry = async (id) => {
        if (confirm('¿Eliminar este registro TCC?')) {
            const updated = tccEntries.filter(e => e.id !== id)
            setTccEntries(updated)
            await deleteFromSupabase('journal_tcc', 'journal_tcc', id, updated)
        }
    }

    const deleteLogEntry = async (id) => {
        if (confirm('¿Eliminar este registro de bitácora?')) {
            const updated = logEntries.filter(e => e.id !== id)
            setLogEntries(updated)
            await deleteFromSupabase('journal_health_log', 'journal_health_log', id, updated)
        }
    }

    const handleUpdateTccReevaluation = (id, text) => {
        setTccEntries(tccEntries.map(e => e.id === id ? { ...e, reevaluation: text } : e))
    }

    const filteredTcc = tccEntries.filter(e =>
        (e.situation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.automaticThought || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredLog = logEntries.filter(e =>
        (e.diary_note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.symptoms || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const AnxietyTrendChart = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - i)
            return format(d, 'yyyy-MM-dd')
        }).reverse()

        const chartData = last7Days.map(day => {
            const entry = logEntries.find(e => e.date === day)
            return { label: format(parseISO(day), 'EEE', { locale: es }), value: entry ? entry.anxietyLevel : null }
        })

        return (
            <div className="flex items-end justify-between h-20 gap-2 px-1">
                {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="w-full bg-slate-50/50 rounded-lg relative h-16 flex items-end overflow-hidden border border-slate-100/30">
                            {d.value !== null && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(d.value / 10) * 100}%` }}
                                    className={`w-full transition-all duration-700 rounded-t-sm shadow-sm ${d.value >= 7 ? 'bg-rose-500' : d.value >= 4 ? 'bg-orange-400' : 'bg-emerald-400'}`}
                                />
                            )}
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{d.label}</span>
                    </div>
                ))}
            </div>
        )
    }

    const DISTORTIONS = [
        "Pensamiento Todo o Nada", "Sobregeneralización", "Filtro Mental", "Descalificar lo Positivo",
        "Conclusión Precipitada", "Magnificación (Catastrofismo)", "Razonamiento Emocional",
        "Enunciaciones 'Debería'", "Etiquetado", "Personalización"
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {activeTab === 'tcc' ? 'Registro de Pensamientos' : 'Bitácora de Salud'} <Brain className="text-violet-500" />
                    </h2>
                    <p className="text-slate-500 font-medium italic">Gestión profesional de bienestar mental y salud.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('tcc')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'tcc' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <ShieldCheck size={18} />
                            <span>TCC</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('log')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'log' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Activity size={18} />
                            <span>Bitácora</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary !p-3 flex items-center gap-2 shadow-xl shadow-blue-200"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Nuevo Registro</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <div className="card shadow-sm border-slate-100 bg-white">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={12} className="text-rose-500" /> Tendencia Ansiedad</h4>
                        <AnxietyTrendChart />
                    </div>
                </div>
                <div className="lg:col-span-3 flex items-end">
                    <div className="relative group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar en mis registros..."
                            className="input-field pl-16 py-5 bg-white border-slate-100 shadow-sm text-lg font-bold"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'tcc' ? (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        className="space-y-8" key="tcc-view"
                    >
                        {filteredTcc.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <Brain className="mx-auto text-violet-100 mb-4" size={64} />
                                <p className="text-slate-400 font-bold text-lg">No hay registros cognitivos aún.</p>
                            </div>
                        ) : (
                            filteredTcc.map(entry => (
                                <div key={entry.id} className="bg-white rounded-[3rem] border-none shadow-xl shadow-slate-100 overflow-hidden group">
                                    <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-violet-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-violet-200"><ShieldCheck size={24} /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">{format(parseISO(entry.date), "EEEE d 'de' MMMM", { locale: es })}</p>
                                                <h4 className="font-black text-slate-800 text-base">Reestructuración Cognitiva</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEditModal(entry, 'tcc')} className="p-3 text-slate-400 hover:text-blue-600 transition-colors bg-white rounded-2xl shadow-sm border border-slate-50"><Edit3 size={20} /></button>
                                            <button onClick={() => deleteTccEntry(entry.id)} className="p-3 text-slate-400 hover:text-rose-500 transition-colors bg-white rounded-2xl shadow-sm border border-slate-50"><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-50">
                                        <div className="p-10 space-y-8">
                                            <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Situación</span><p className="text-sm text-slate-900 font-black">{entry.situation}</p></div>
                                            <div><span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block mb-1 italic">Sentir</span><p className="text-xs text-slate-600 font-bold italic">"{entry.emotions}"</p></div>
                                        </div>
                                        <div className="p-10 bg-rose-50/10">
                                            <div className="flex items-center gap-2 mb-4"><AlertCircle className="text-rose-500" size={18} /><span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Pensamiento</span></div>
                                            <p className="text-base text-rose-950 font-black italic">"{entry.automaticThought}"</p>
                                            {entry.distortion && <div className="mt-4 p-3 bg-white/50 rounded-xl border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-tighter shadow-inner">{entry.distortion}</div>}
                                        </div>
                                        <div className="p-10">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-4 italic">Reevaluación</span>
                                            {entry.reevaluation ? (
                                                <div className="p-6 bg-emerald-500 text-white rounded-[2rem] shadow-xl shadow-emerald-100"><p className="text-sm font-black italic">"{entry.reevaluation}"</p></div>
                                            ) : (
                                                <textarea placeholder="Conclusión..." className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-xs font-black outline-none focus:ring-4 focus:ring-emerald-100 transition-all shadow-inner" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdateTccReevaluation(entry.id, e.target.value); } }} />
                                            )}
                                        </div>
                                    </div>
                                    {/* Análisis de IA - Sección completa abajo */}
                                    <div className="p-8 bg-gradient-to-r from-indigo-50/50 via-violet-50/30 to-purple-50/50 border-t border-slate-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                                <Sparkles className="text-white" size={20} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Análisis de IA</span>
                                                <p className="text-[10px] text-indigo-400 font-medium">Basado en técnicas de TCC</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-inner border border-indigo-100/50">
                                            <div className="prose prose-sm max-w-none text-indigo-900 font-medium whitespace-pre-line leading-relaxed">
                                                {entry.refutation}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="space-y-8 w-full" key="log-view"
                    >
                        <div className="card !p-0 overflow-hidden shadow-xl border-none bg-white rounded-[2.5rem] w-full">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                        <tr>
                                            <th className="px-8 py-6 border-r border-white/10 sticky left-0 bg-slate-900 z-10 min-w-[180px]">Fecha</th>
                                            <th className="px-6 py-6 border-r border-white/10 text-center bg-rose-600">Ansiedad</th>
                                            <th className="px-6 py-6 border-r border-white/10 text-center bg-rose-800">Insomnio</th>
                                            {medicationList.map(med => (
                                                <th key={typeof med === 'string' ? med : Math.random()} className="px-6 py-6 border-r border-white/10 text-center bg-blue-600 min-w-[120px]">
                                                    {typeof med === 'string' ? med : 'Med.'}
                                                </th>
                                            ))}
                                            <th className="px-6 py-6 border-r border-white/10 text-center bg-amber-500">M. MAÑANA</th>
                                            <th className="px-6 py-6 border-r border-white/10 text-center bg-amber-500">M. TARDE</th>
                                            <th className="px-6 py-6 border-r border-white/10 text-center bg-amber-500">M. NOCHE</th>
                                            <th className="px-8 py-6 font-black bg-slate-800 min-w-[300px]">Registros y Síntomas</th>
                                            <th className="px-4 py-6"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 italic font-bold text-slate-800">
                                        {filteredLog.length === 0 ? (
                                            <tr><td colSpan={10 + medicationList.length} className="px-8 py-20 text-center text-slate-400 italic font-bold">Sin bitácora registrada.</td></tr>
                                        ) : (
                                            filteredLog.map(entry => (
                                                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors text-xs whitespace-nowrap">
                                                    <td className="px-8 py-5 border-r border-slate-100 capitalize sticky left-0 bg-white group-hover:bg-slate-50 z-10 font-black">{format(parseISO(entry.date), "EEEE d MMM, yyyy", { locale: es })}</td>
                                                    <td className="px-6 py-5 border-r border-slate-100 text-center"><span className={`px-2 py-1 rounded-md ${entry.anxietyLevel >= 7 ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50'}`}>{entry.anxietyLevel}</span></td>
                                                    <td className="px-6 py-5 border-r border-slate-100 text-center"><span className={`px-2 py-1 rounded-md ${entry.insomniaLevel >= 7 ? 'text-rose-800 bg-slate-100' : 'text-slate-400 bg-slate-50'}`}>{entry.insomniaLevel}</span></td>
                                                    {medicationList.map(med => (
                                                        <td key={typeof med === 'string' ? med : Math.random()} className="px-6 py-5 border-r border-slate-100 text-center font-black text-blue-600">
                                                            {entry.medications?.[typeof med === 'string' ? med : ''] ? '1' : '-'}
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-5 border-r border-slate-100 text-center bg-amber-50/20">{entry.meditation?.morning > 0 ? `${entry.meditation.morning}'` : '-'}</td>
                                                    <td className="px-6 py-5 border-r border-slate-100 text-center bg-amber-50/20">{entry.meditation?.afternoon > 0 ? `${entry.meditation.afternoon}'` : '-'}</td>
                                                    <td className="px-6 py-5 border-r border-slate-100 text-center bg-amber-50/20">{entry.meditation?.night > 0 ? `${entry.meditation.night}'` : '-'}</td>
                                                    <td className="px-8 py-5 whitespace-normal min-w-[300px]">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="italic text-slate-500 font-medium leading-relaxed">"{typeof entry.diary_note === 'string' ? entry.diary_note : 'Sin notas.'}"</p>
                                                            {entry.symptoms && <p className="text-rose-400 text-[10px] font-black uppercase tracking-tighter mt-1">{typeof entry.symptoms === 'string' ? entry.symptoms : ''}</p>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => openEditModal(entry, 'log')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white rounded-xl shadow-sm border border-slate-50"><Edit3 size={16} /></button>
                                                            <button onClick={() => deleteLogEntry(entry.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-50"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={closeModal} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }} className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="px-12 py-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/50">
                                <div className="flex flex-col">
                                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">
                                        {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                                    </h3>
                                    <div className="flex gap-4 mt-4 p-2 bg-slate-200/50 rounded-[2rem] w-fit">
                                        <button onClick={() => setActiveTab('tcc')} className={`px-10 py-3 rounded-[1.5rem] text-sm font-black transition-all ${activeTab === 'tcc' ? 'bg-white shadow-lg text-violet-600' : 'text-slate-500'}`}>Desafío TCC</button>
                                        <button onClick={() => setActiveTab('log')} className={`px-10 py-3 rounded-[1.5rem] text-sm font-black transition-all ${activeTab === 'log' ? 'bg-white shadow-lg text-emerald-600' : 'text-slate-500'}`}>Bitácora Médica</button>
                                    </div>
                                </div>
                                <button onClick={closeModal} className="p-4 text-slate-400 hover:bg-white rounded-full transition-all shadow-sm"><X size={32} /></button>
                            </div>

                            <div className="p-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
                                {activeTab === 'tcc' ? (
                                    <form onSubmit={handleAddTccEntry} className="space-y-10">
                                        {/* Indicador de IA Procesando */}
                                        {isThinking && (
                                            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-6 rounded-[2rem] text-white shadow-xl animate-pulse">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <Brain size={32} className="animate-bounce" />
                                                        <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-ping" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg">Analizando con IA...</p>
                                                        <p className="text-white/80 text-sm font-medium">Aplicando técnicas TCC profesionales a tu pensamiento</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-white/50 rounded-full animate-shimmer" style={{ width: '60%', animation: 'shimmer 1.5s infinite linear' }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Selector de Fecha y Hora */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-r from-slate-50 to-violet-50/30 rounded-[2rem] border border-slate-100">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase px-2 flex items-center gap-2">
                                                    <Calendar size={14} className="text-violet-500" />
                                                    Fecha del Registro
                                                </label>
                                                <input
                                                    type="date"
                                                    className="input-field !bg-white !border-2 !border-slate-100 !font-bold !py-4 !px-6 !rounded-[1.5rem] focus:!border-violet-400 transition-all w-full"
                                                    value={newTccEntry.date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')}
                                                    onChange={e => {
                                                        const time = newTccEntry.date?.split('T')[1] || format(new Date(), 'HH:mm')
                                                        setNewTccEntry({ ...newTccEntry, date: `${e.target.value}T${time}` })
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase px-2 flex items-center gap-2">
                                                    <Timer size={14} className="text-violet-500" />
                                                    Hora del Pensamiento
                                                </label>
                                                <input
                                                    type="time"
                                                    className="input-field !bg-white !border-2 !border-slate-100 !font-bold !py-4 !px-6 !rounded-[1.5rem] focus:!border-violet-400 transition-all w-full"
                                                    value={newTccEntry.date?.split('T')[1] || format(new Date(), 'HH:mm')}
                                                    onChange={e => {
                                                        const date = newTccEntry.date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')
                                                        setNewTccEntry({ ...newTccEntry, date: `${date}T${e.target.value}` })
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                            <div className="space-y-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Situación Desencadenante</label>
                                                    <input type="text" required placeholder="Ej: Mi jefe me pidió una reunión a última hora sin decir el motivo..." className="input-field !bg-slate-50 !border-none !font-black !py-6 !px-8 !rounded-[2.5rem] !text-base shadow-inner" value={newTccEntry.situation} onChange={e => setNewTccEntry({ ...newTccEntry, situation: e.target.value })} />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-violet-500 uppercase px-2 italic">Afectación Emocional (0-10)</label>
                                                    <textarea required placeholder="Ej: Ansiedad (9/10), taquicardia y mucha presión en el pecho..." className="input-field !bg-violet-50/30 !border-none !min-h-[160px] !font-black !py-8 !px-10 !rounded-[3rem] shadow-inner" value={newTccEntry.emotions} onChange={e => setNewTccEntry({ ...newTccEntry, emotions: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-rose-500 uppercase px-2 italic flex items-center gap-2">
                                                        <AlertCircle size={14} />
                                                        Pensamiento Automático/Intruso
                                                    </label>
                                                    <textarea required placeholder="Ej: Seguro me van a despedir por el error del martes, soy un fracaso total..." className="input-field !bg-rose-50/30 !border-none !min-h-[160px] !font-black !py-8 !px-10 !rounded-[3rem] italic shadow-inner" value={newTccEntry.automaticThought} onChange={e => setNewTccEntry({ ...newTccEntry, automaticThought: e.target.value })} />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase px-2 italic">Distorsión Cognitiva (Opcional)</label>
                                                    <select className="input-field !bg-slate-50 !border-none !font-black !py-5 !px-8 !rounded-[2rem] shadow-inner" value={newTccEntry.distortion} onChange={e => setNewTccEntry({ ...newTccEntry, distortion: e.target.value })}>
                                                        <option value="">¿Cuál detectas? (La IA también identificará)</option>
                                                        {DISTORTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mensaje informativo sobre la IA */}
                                        <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-[2rem] border border-indigo-100">
                                            <Sparkles className="text-indigo-500 shrink-0 mt-1" size={20} />
                                            <div>
                                                <p className="font-bold text-indigo-900 text-sm">Análisis con Inteligencia Artificial</p>
                                                <p className="text-indigo-700/70 text-xs mt-1">Al guardar, la IA analizará tu pensamiento usando 9 técnicas profesionales de TCC: reconocimiento, aceptación, evaluación de evidencia, desconexión, redirección, relajación, rutina de revisión, respuesta adaptativa y exposición gradual.</p>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isThinking}
                                            className={`w-full font-black py-8 rounded-[3rem] shadow-2xl transition-all text-2xl flex items-center justify-center gap-4 ${isThinking ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hover:scale-[1.02]'}`}
                                        >
                                            {isThinking ? (
                                                <>
                                                    <RefreshCw className="animate-spin" size={28} />
                                                    <span>Analizando con IA...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Brain size={28} />
                                                    <span>{editingId ? 'Actualizar Registro' : 'Guardar y Analizar con IA'}</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleAddLogEntry} className="space-y-12">
                                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                                            {/* Indicators */}
                                            <div className="card shadow-lg border-none bg-rose-50/10 p-10 space-y-10 lg:col-span-1 rounded-[3rem]">
                                                <div className="flex items-center gap-3"><Activity className="text-rose-600" size={24} /><h4 className="font-black text-base uppercase tracking-widest text-rose-900 italic">Escala Salud</h4></div>
                                                <div className="space-y-10">
                                                    <div className="space-y-4"> <label className="text-xs font-black text-rose-600 uppercase block italic">Ansiedad</label> <input type="range" min="0" max="10" className="w-full h-3 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-600" value={newLogEntry.anxietyLevel} onChange={e => setNewLogEntry({ ...newLogEntry, anxietyLevel: parseInt(e.target.value) })} /><div className="flex justify-between items-center"><span className="text-rose-600 text-5xl font-black">{newLogEntry.anxietyLevel}</span></div> </div>
                                                    <div className="space-y-4"> <label className="text-xs font-black text-slate-700 uppercase block italic">Insomnio</label> <input type="range" min="0" max="10" className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800" value={newLogEntry.insomniaLevel} onChange={e => setNewLogEntry({ ...newLogEntry, insomniaLevel: parseInt(e.target.value) })} /><div className="flex justify-between items-center"><span className="text-slate-900 text-5xl font-black">{newLogEntry.insomniaLevel}</span></div> </div>
                                                </div>
                                            </div>

                                            {/* Medications */}
                                            <div className="card shadow-lg border-none bg-blue-50/10 p-10 space-y-8 lg:col-span-2 rounded-[3rem]">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3"><Pill className="text-blue-600" size={24} /><h4 className="font-black text-base uppercase tracking-widest text-blue-900 italic">Farmacología</h4></div>
                                                    <div className="flex items-center gap-2 bg-white/80 p-1 rounded-2xl shadow-sm border border-blue-50 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                                        <input
                                                            type="text" placeholder="Nuevo medica..."
                                                            className="bg-transparent border-none text-[10px] font-bold px-3 py-2 outline-none w-24"
                                                            value={newMedName} onChange={e => setNewMedName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMedication())}
                                                        />
                                                        <button type="button" onClick={handleAddMedication} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-colors"><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                                                    {medicationList.map(med => (
                                                        <div key={med} className="relative group">
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewLogEntry({ ...newLogEntry, medications: { ...newLogEntry.medications, [med]: !newLogEntry.medications[med] } })}
                                                                className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase transition-all border-4 ${newLogEntry.medications[med] ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-blue-200 border-slate-50'}`}
                                                            >
                                                                {typeof med === 'string' ? med : 'Desconocido'}
                                                            </button>
                                                            <button
                                                                type="button" onClick={() => removeMedication(med)}
                                                                className="absolute -top-2 -right-2 p-1 bg-white shadow-md text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 border border-slate-50"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Meditations - Now with Minutes */}
                                            <div className="card shadow-lg border-none bg-amber-50/10 p-10 space-y-10 lg:col-span-1 rounded-[3rem]">
                                                <div className="flex items-center gap-3"><Wind className="text-amber-600" size={24} /><h4 className="font-black text-base uppercase tracking-widest text-amber-900 italic">Mente (min)</h4></div>
                                                <div className="space-y-6">
                                                    {['morning', 'afternoon', 'night'].map(time => (
                                                        <div key={time} className="space-y-2">
                                                            <div className="flex justify-between items-center px-2">
                                                                <span className="text-[9px] font-black uppercase text-amber-700 italic">{time === 'morning' ? 'Mañana' : time === 'afternoon' ? 'Tarde' : 'Noche'}</span>
                                                                <Timer size={12} className="text-amber-400" />
                                                            </div>
                                                            <input
                                                                type="number" min="0" placeholder="0 min"
                                                                className="w-full bg-white border-4 border-slate-50 rounded-[1.5rem] py-4 px-6 text-sm font-black text-amber-900 outline-none focus:border-amber-400 transition-all shadow-inner"
                                                                value={newLogEntry.meditation[time] || ''}
                                                                onChange={e => setNewLogEntry({ ...newLogEntry, meditation: { ...newLogEntry.meditation, [time]: parseInt(e.target.value) || 0 } })}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-10 rounded-[4rem]">
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 p-1"><Edit3 size={20} className="text-slate-400" /><span className="text-[10px] font-black uppercase italic">Notas del Día</span></div>
                                                    <textarea placeholder="Anotaciones diarias o resumen emocional..." className="input-field !bg-white !shadow-none !rounded-[2rem] !min-h-[180px] !py-6 font-medium" value={newLogEntry.diary_note} onChange={e => setNewLogEntry({ ...newLogEntry, diary_note: e.target.value })} />
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-3 p-1"><Activity size={20} className="text-rose-400" /><span className="text-[10px] font-black uppercase italic">Sintomatología Física</span></div>
                                                    <textarea placeholder="Síntomas detectados hoy (ej: taquicardia, mareos)..." className="input-field !bg-white border-rose-100 !shadow-none !rounded-[2rem] !min-h-[180px] !py-6 text-rose-600 font-black italic" value={newLogEntry.symptoms} onChange={e => setNewLogEntry({ ...newLogEntry, symptoms: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="flex items-center gap-4 bg-slate-900 p-6 rounded-[3rem] text-white">
                                                <Calendar className="text-slate-500" size={24} />
                                                <input type="date" className="bg-transparent font-black text-xl outline-none w-full cursor-pointer invert" value={newLogEntry.date} onChange={e => setNewLogEntry({ ...newLogEntry, date: e.target.value })} />
                                            </div>
                                            <button type="submit" className="w-full bg-emerald-600 text-white py-8 text-2xl font-black rounded-[4rem] shadow-2xl hover:scale-[1.02] transition-all duration-700">
                                                {editingId ? 'Actualizar Registro Médico' : 'Guardar Registro Médico'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Journal
