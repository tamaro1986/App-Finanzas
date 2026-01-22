// ============================================================================
// IMPORTS: React, iconos y utilidades
// ============================================================================
import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Calendar, Stethoscope, User, Pill, ArrowRight, Clock, Clipboard, Search, X, FileText, CalendarCheck, Users, Ruler, Weight, Info, Camera, Mic, Square, Play, Paperclip, MessageSquare } from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: MedicalHistory
// PROPÓSITO: Gestionar historial médico y pacientes
// CONECTADO A: Supabase tablas 'medical_records' y 'patients'
// ============================================================================
const MedicalHistory = () => {
    const [activeTab, setActiveTab] = useState('records')
    // Estados - se cargan desde Supabase
    const [records, setRecords] = useState([])
    const [patients, setPatients] = useState([])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorder = useRef(null)
    const audioChunks = useRef([])

    const [newRecord, setNewRecord] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        personName: '',
        reason: '',
        medications: '',
        hasFollowUp: false,
        followUpDate: '',
        doctorName: '',
        doctorComments: '',
        height: '',
        weight: '',
        recipeImage: '',
        audioNote: ''
    })

    const [newPatient, setNewPatient] = useState({ name: '', age: '', bloodType: '', allergies: '', notes: '' })

    // ============================================================================
    // EFFECT: Cargar datos desde Supabase
    // ============================================================================
    useEffect(() => {
        const loadData = async () => {
            const recordsData = await initializeData('medical_records', 'finanzas_medical_records')
            setRecords(recordsData)
            const patientsData = await initializeData('patients', 'finanzas_patients')
            setPatients(patientsData)
        }
        loadData()
    }, [])

    // ============================================================================
    // EFFECT: Sincronizar con Supabase
    // ============================================================================
    useEffect(() => {
        const sync = async () => {
            localStorage.setItem('finanzas_medical_records', JSON.stringify(records))
            if (records.length > 0) {
                for (const record of records) {
                    await saveToSupabase('medical_records', 'finanzas_medical_records', record, records)
                }
            }
        }
        sync()
    }, [records])

    useEffect(() => {
        const sync = async () => {
            localStorage.setItem('finanzas_patients', JSON.stringify(patients))
            if (patients.length > 0) {
                for (const patient of patients) {
                    await saveToSupabase('patients', 'finanzas_patients', patient, patients)
                }
            }
        }
        sync()
    }, [patients])

    // --- Audio Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorder.current = new MediaRecorder(stream)
            audioChunks.current = []

            mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data)
            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
                const reader = new FileReader()
                reader.readAsDataURL(audioBlob)
                reader.onloadend = () => {
                    setNewRecord(prev => ({ ...prev, audioNote: reader.result }))
                }
            }

            mediaRecorder.current.start()
            setIsRecording(true)
        } catch (err) {
            alert('No se pudo acceder al micrófono: ' + err.message)
        }
    }

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop()
            setIsRecording(false)
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
        }
    }

    // --- Image Logic ---
    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setNewRecord(prev => ({ ...prev, recipeImage: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAddRecord = (e) => {
        e.preventDefault()
        const record = {
            id: crypto.randomUUID(),
            ...newRecord,
            medicationsList: newRecord.medications.split(',').map(m => m.trim()).filter(m => m !== '')
        }
        setRecords([record, ...records])

        if (!patients.find(p => p.name.toLowerCase() === newRecord.personName.toLowerCase()) && newRecord.personName !== '__new__') {
            const autoPatient = { id: crypto.randomUUID(), name: newRecord.personName, age: '', bloodType: '', allergies: '', notes: 'Paciente agregado desde consulta' }
            setPatients([...patients, autoPatient])
        }

        setIsModalOpen(false)
        setNewRecord({
            date: format(new Date(), 'yyyy-MM-dd'), personName: '', reason: '', medications: '',
            hasFollowUp: false, followUpDate: '', doctorName: '', doctorComments: '',
            height: '', weight: '', recipeImage: '', audioNote: ''
        })
    }

    const handleAddPatient = (e) => {
        e.preventDefault()
        const patient = { id: crypto.randomUUID(), ...newPatient }
        setPatients([...patients, patient])
        setIsPatientModalOpen(false)
        setNewPatient({ name: '', age: '', bloodType: '', allergies: '', notes: '' })
    }

    const deleteRecord = async (id) => {
        if (window.confirm('¿Eliminar este registro médico?')) {
            const updated = records.filter(r => r.id !== id)
            setRecords(updated)
            await deleteFromSupabase('medical_records', 'finanzas_medical_records', id, updated)
        }
    }

    const deletePatient = async (id) => {
        if (window.confirm('¿Eliminar este paciente?')) {
            const updated = patients.filter(p => p.id !== id)
            setPatients(updated)
            await deleteFromSupabase('patients', 'finanzas_patients', id, updated)
        }
    }

    const filteredRecords = records.filter(r =>
        r.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const nextAppointment = records
        .filter(r => r.hasFollowUp && r.followUpDate && isAfter(parseISO(r.followUpDate), new Date()))
        .sort((a, b) => parseISO(a.followUpDate) - parseISO(b.followUpDate))[0]

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Tabs & Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
                        <button onClick={() => setActiveTab('records')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'records' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Stethoscope size={18} /> Consultas
                        </button>
                        <button onClick={() => setActiveTab('patients')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'patients' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Users size={18} /> Pacientes
                        </button>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{activeTab === 'records' ? 'Historial Médico' : 'Gestión de Pacientes'}</h2>
                        <p className="text-slate-500 font-medium">{activeTab === 'records' ? 'Control de consultas, diagnósticos y recetas.' : 'Directorio de personas y perfiles clínicos.'}</p>
                    </div>
                </div>
                <button onClick={() => activeTab === 'records' ? setIsModalOpen(true) : setIsPatientModalOpen(true)} className="btn-primary">
                    <Plus size={18} /> <span>{activeTab === 'records' ? 'Nueva Consulta' : 'Nuevo Paciente'}</span>
                </button>
            </div>

            {activeTab === 'records' ? (
                <>
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-blue-200">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md"><CalendarCheck size={24} /></div>
                                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Próxima Cita</span>
                            </div>
                            {nextAppointment ? (
                                <div><p className="text-lg font-bold">{nextAppointment.personName}</p><p className="text-sm opacity-90">{format(parseISO(nextAppointment.followUpDate), "d 'de' MMMM", { locale: es })}</p></div>
                            ) : (<p className="text-sm font-medium opacity-80">No hay citas programadas.</p>)}
                        </div>
                        <div className="card bg-white border-slate-200">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Stethoscope size={24} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Consultas</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{records.length}</div>
                        </div>
                        <div className="card bg-white border-slate-200">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Search size={24} /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Buscar</span>
                            </div>
                            <input type="text" placeholder="Nombre o motivo..." className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                    </div>

                    {/* Records List */}
                    <div className="space-y-6">
                        {filteredRecords.length === 0 ? (
                            <div className="card py-20 text-center border-dashed border-2">
                                <Clipboard className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-400 font-medium">No hay registros médicos.</p>
                            </div>
                        ) : (
                            filteredRecords.map((r) => (
                                <div key={r.id} className="card bg-white border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                    <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <time className="text-xs font-bold text-blue-600 uppercase tracking-widest">{format(parseISO(r.date), 'dd MMMM, yyyy', { locale: es })}</time>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                            {/* Column 1: Patient & Reason */}
                                            <div className="lg:col-span-4 space-y-4">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-xl flex items-center gap-2 mb-1"><User size={20} className="text-blue-500" /> {r.personName}</h4>
                                                    <p className="text-sm text-slate-500 font-medium italic">{r.reason}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {r.height && <div className="px-3 py-1.5 bg-blue-50 rounded-xl text-blue-600 text-[10px] font-bold border border-blue-100 flex items-center gap-1"><Ruler size={14} />{r.height} cm</div>}
                                                    {r.weight && <div className="px-3 py-1.5 bg-indigo-50 rounded-xl text-indigo-600 text-[10px] font-bold border border-indigo-100 flex items-center gap-1"><Weight size={14} />{r.weight} kg</div>}
                                                </div>
                                                {r.medicationsList?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {r.medicationsList.map((m, i) => <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 flex items-center gap-1"><Pill size={12} />{m}</span>)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 2: Comments & Audio */}
                                            <div className="lg:col-span-5 space-y-4">
                                                {r.doctorComments && (
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                                                        <MessageSquare className="absolute -top-3 -left-3 text-blue-500 bg-white rounded-full p-1 border shadow-sm" size={24} />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Comentarios del Doctor</span>
                                                        <p className="text-sm text-slate-700 leading-relaxed italic">"{r.doctorComments}"</p>
                                                    </div>
                                                )}
                                                {r.audioNote && (
                                                    <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white"><Play size={14} /></div>
                                                        <div className="flex-1">
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase block leading-none">Nota de Audio</span>
                                                            <audio controls src={r.audioNote} className="h-8 w-full mt-1" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 3: Recipe Image */}
                                            <div className="lg:col-span-3">
                                                {r.recipeImage ? (
                                                    <div className="relative group/img rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                                        <img src={r.recipeImage} alt="Receta" className="w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(r.recipeImage)} />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                            <span className="text-[10px] text-white font-bold uppercase">Ver Receta</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                                                        <Camera size={24} />
                                                        <span className="text-[10px] font-bold mt-1 uppercase">Sin Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {patients.length === 0 ? (
                        <div className="card py-20 text-center border-dashed border-2 col-span-full"><Users className="mx-auto text-slate-200 mb-4" size={64} /><p className="text-slate-400 font-medium">No hay pacientes.</p></div>
                    ) : (
                        patients.map(p => (
                            <div key={p.id} className="card bg-white transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl uppercase">{p.name.charAt(0)}</div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 uppercase tracking-tight">{p.name}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.age ? `${p.age} años` : 'Sin edad'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => deletePatient(p.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold"><span className="text-slate-400 uppercase tracking-widest">Tipo Sangre</span><span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{p.bloodType || '-'}</span></div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Alergias</span><p className="text-[11px] text-slate-600 font-medium italic truncate">{p.allergies || 'Ninguna'}</p></div>
                                    <div className="pt-2 flex justify-center"><button onClick={() => { setSearchQuery(p.name); setActiveTab('records'); }} className="text-[10px] font-bold text-blue-600 hover:underline uppercase flex items-center gap-1">Ver Historial <ArrowRight size={10} /></button></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* NEW CONSULTATION MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Stethoscope className="text-blue-600" /> Nueva Consulta Médica</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddRecord} className="p-8 max-h-[85vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                                {/* Section 1: Basic Info */}
                                <div className="space-y-4">
                                    <h5 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-blue-600">Paciente y Vitales</h5>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Nombre</label>
                                        <select required className="input-field" value={newRecord.personName} onChange={e => setNewRecord({ ...newRecord, personName: e.target.value })}>
                                            <option value="">Seleccionar...</option>
                                            {patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                            <option value="__new__">+ Nuevo Paciente (Escribir abajo)</option>
                                        </select>
                                        {newRecord.personName === '__new__' && <input type="text" required className="input-field mt-2" placeholder="Nombre completo" autoFocus onChange={e => setNewRecord({ ...newRecord, personName: e.target.value })} />}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-bold text-slate-400 uppercase pl-1 mb-1 block">Altura (cm)</label><input type="number" className="input-field" value={newRecord.height} onChange={e => setNewRecord({ ...newRecord, height: e.target.value })} /></div>
                                        <div><label className="text-[10px] font-bold text-slate-400 uppercase pl-1 mb-1 block">Peso (kg)</label><input type="number" step="0.1" className="input-field" value={newRecord.weight} onChange={e => setNewRecord({ ...newRecord, weight: e.target.value })} /></div>
                                    </div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase pl-1 mb-1 block">Motivo</label><input type="text" required className="input-field" value={newRecord.reason} onChange={e => setNewRecord({ ...newRecord, reason: e.target.value })} /></div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase pl-1 mb-1 block">Fecha</label><input type="date" required className="input-field" value={newRecord.date} onChange={e => setNewRecord({ ...newRecord, date: e.target.value })} /></div>
                                </div>

                                {/* Section 2: Medical Details */}
                                <div className="space-y-4">
                                    <h5 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-600">Diagnóstico y Recetas</h5>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Medicamentos (Comas)</label><textarea className="input-field min-h-[80px]" value={newRecord.medications} onChange={e => setNewRecord({ ...newRecord, medications: e.target.value })} /></div>
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Comentarios del Doctor</label><textarea className="input-field min-h-[80px]" placeholder="Instrucciones especiales..." value={newRecord.doctorComments} onChange={e => setNewRecord({ ...newRecord, doctorComments: e.target.value })} /></div>
                                </div>

                                {/* Section 3: Evidence (Photo & Audio) */}
                                <div className="space-y-4">
                                    <h5 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-600">Multimedia / Evidencia</h5>

                                    {/* Capture Photo */}
                                    <div className="relative">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Foto de la Receta</label>
                                        <div className="flex gap-2">
                                            <label className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                                                <Camera className="text-slate-400 mb-1" size={24} />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Subir Foto</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            </label>
                                            {newRecord.recipeImage && <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0"><img src={newRecord.recipeImage} className="w-full h-full object-cover" /></div>}
                                        </div>
                                    </div>

                                    {/* Capture Audio */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nota de Voz (Doctor)</label>
                                        <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-2xl border border-blue-100">
                                            {!isRecording ? (
                                                <button type="button" onClick={startRecording} className="w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-md"><Mic size={20} /></button>
                                            ) : (
                                                <button type="button" onClick={stopRecording} className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center animate-pulse shadow-md relative">
                                                    <Square size={18} fill="currentColor" />
                                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                                                </button>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">{isRecording ? 'Grabando Audio...' : newRecord.audioNote ? '¡Audio Grabado!' : 'Pulsa para grabar'}</p>
                                                {newRecord.audioNote && <audio src={newRecord.audioNote} className="h-4 w-full mt-1" controls />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" className="sr-only" checked={newRecord.hasFollowUp} onChange={e => setNewRecord({ ...newRecord, hasFollowUp: e.target.checked })} />
                                            <div className={`w-10 h-6 rounded-full transition-colors ${newRecord.hasFollowUp ? 'bg-blue-600' : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full mt-1 ml-1 transition-transform ${newRecord.hasFollowUp ? 'translate-x-4' : ''}`}></div></div>
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">¿Hay Seguimiento?</span>
                                        </label>
                                        {newRecord.hasFollowUp && <input type="date" required className="input-field mt-3 border-blue-100" value={newRecord.followUpDate} onChange={e => setNewRecord({ ...newRecord, followUpDate: e.target.value })} />}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary !py-3 !rounded-2xl shadow-lg shadow-blue-200">Guardar Historial</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Nuevo Paciente (Simplified) */}
            {isPatientModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPatientModalOpen(false)} />
                    <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><User size={20} className="text-blue-600" /> Nuevo Perfil</h3>
                            <button onClick={() => setIsPatientModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddPatient} className="p-8 space-y-4">
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nombre Completo</label><input type="text" required className="input-field" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Edad</label><input type="number" className="input-field" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Sangre</label><input type="text" className="input-field" placeholder="O+" value={newPatient.bloodType} onChange={e => setNewPatient({ ...newPatient, bloodType: e.target.value })} /></div>
                            </div>
                            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Alergias</label><textarea className="input-field" value={newPatient.allergies} onChange={e => setNewPatient({ ...newPatient, allergies: e.target.value })} /></div>
                            <button type="submit" className="w-full btn-primary mt-2">Crear Perfil</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MedicalHistory
