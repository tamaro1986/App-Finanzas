// ============================================================================
// IMPORTS: React, iconos y utilidades
// ============================================================================
import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Calendar, Stethoscope, User, Pill, ArrowRight, Clock, Clipboard, Search, X, FileText, CalendarCheck, Users, Ruler, Weight, Info, Camera, Mic, Square, Play, Paperclip, MessageSquare, Pencil, Check, Activity } from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
// Importar funciones de sincronización con Supabase
import { initializeData, saveToSupabase, deleteFromSupabase } from '../lib/supabaseSync'

// ============================================================================
// COMPONENTE: MedicalHistory
// PROPÓSITO: Gestionar historial médico y pacientes
// CONECTADO A: Supabase tablas 'medical_records' y 'patients'
// ============================================================================
const MedicalHistory = ({ records, setRecords, patients, setPatients }) => {
    const [activeTab, setActiveTab] = useState('records')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorder = useRef(null)
    const audioChunks = useRef([])
    const [medInput, setMedInput] = useState({ name: '', frequency: 'Cada 8 horas', doseValue: '', doseUnit: 'mg', days: '' })
    const [editIndex, setEditIndex] = useState(null)

    const [newRecord, setNewRecord] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        personName: '',
        reason: '',
        medicationsList: [], // Cambio para coincidir con la columna 'medications_list' en DB
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

    // --- Medications Logic ---
    const addMed = () => {
        if (!medInput.name.trim()) return
        const fullDose = medInput.doseValue ? `${medInput.doseValue} ${medInput.doseUnit}` : ''
        const newMed = {
            ...medInput,
            dose: fullDose,
            doseValue: medInput.doseValue,
            doseUnit: medInput.doseUnit
        }

        if (editIndex !== null) {
            setNewRecord(prev => {
                const updated = [...prev.medicationsList]
                updated[editIndex] = newMed
                return { ...prev, medicationsList: updated }
            })
            setEditIndex(null)
        } else {
            setNewRecord(prev => ({
                ...prev,
                medicationsList: [...prev.medicationsList, newMed]
            }))
        }
        setMedInput({ name: '', frequency: 'Cada 8 horas', doseValue: '', doseUnit: 'mg', days: '' })
    }

    const editMed = (index) => {
        const med = newRecord.medicationsList[index]
        setMedInput({
            name: med.name || '',
            frequency: med.frequency || 'Cada 8 horas',
            doseValue: med.doseValue || '',
            doseUnit: med.doseUnit || 'mg',
            days: med.days || ''
        })
        setEditIndex(index)
    }

    const cancelEditMed = () => {
        setEditIndex(null)
        setMedInput({ name: '', frequency: 'Cada 8 horas', doseValue: '', doseUnit: 'mg', days: '' })
    }

    const removeMed = (index) => {
        setNewRecord(prev => ({
            ...prev,
            medicationsList: prev.medicationsList.filter((_, i) => i !== index)
        }))
    }

    const handleAddRecord = async (e) => {
        e.preventDefault()

        // Auto-añadir medicamento si el usuario olvidó darle al botón "+"
        let currentMeds = [...newRecord.medicationsList]
        if (medInput.name.trim()) {
            const fullDose = medInput.doseValue ? `${medInput.doseValue} ${medInput.doseUnit}` : ''
            currentMeds.push({
                ...medInput,
                dose: fullDose
            })
        }

        // Encontrar si el paciente ya existe para vincular su ID real
        const existingPatient = (patients || []).find(p =>
            p && (p.name?.toLowerCase() || '') === (newRecord.personName?.toLowerCase() || '')
        )

        const recordId = crypto.randomUUID()
        const record = {
            ...newRecord,
            id: recordId,
            medicationsList: currentMeds, // Array estructurado (se convierte a medications_list)
            type: newRecord.reason || 'Consulta', // Campo obligatorio en Supabase
            patient_id: existingPatient ? existingPatient.id : null
        }

        const updatedRecords = [record, ...records]
        setRecords(updatedRecords)

        // Guardar registro en Supabase
        await saveToSupabase('medical_records', 'finanzas_medical_records', record, updatedRecords)

        if (!patients.find(p => (p.name?.toLowerCase() || '') === (newRecord.personName?.toLowerCase() || '')) && newRecord.personName !== '__new__') {
            const autoPatient = { id: crypto.randomUUID(), name: newRecord.personName, age: '', bloodType: '', allergies: '', notes: 'Paciente agregado desde consulta' }
            const updatedPatients = [...patients, autoPatient]
            setPatients(updatedPatients)

            // Guardar paciente auto-creado en Supabase
            await saveToSupabase('patients', 'finanzas_patients', autoPatient, updatedPatients)
        }

        setIsModalOpen(false)
        setEditIndex(null)
        setMedInput({ name: '', frequency: 'Cada 8 horas', doseValue: '', doseUnit: 'mg', days: '' })
        setNewRecord({
            date: format(new Date(), 'yyyy-MM-dd'), personName: '', reason: '', medicationsList: [],
            hasFollowUp: false, followUpDate: '', doctorName: '', doctorComments: '',
            height: '', weight: '', recipeImage: '', audioNote: ''
        })
    }

    const handleAddPatient = async (e) => {
        e.preventDefault()
        const patient = { id: crypto.randomUUID(), ...newPatient }
        const updatedPatients = [...patients, patient]
        setPatients(updatedPatients)

        // Guardar en Supabase
        await saveToSupabase('patients', 'finanzas_patients', patient, updatedPatients)

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

    const filteredRecords = (records || [])
        .filter(r => r && typeof r === 'object') // Asegurar que r existe y es objeto
        .filter(r =>
            (r.personName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (r.reason?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )

    const nextAppointment = (records || [])
        .filter(r => r && r.hasFollowUp && r.followUpDate)
        .filter(r => {
            try {
                return isAfter(parseISO(r.followUpDate), new Date())
            } catch (e) {
                return false
            }
        })
        .sort((a, b) => {
            try {
                return parseISO(a.followUpDate) - parseISO(b.followUpDate)
            } catch (e) {
                return 0
            }
        })[0]

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
                                            <time className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                                {r.date ? format(parseISO(r.date), 'dd MMMM, yyyy', { locale: es }) : 'Sin fecha'}
                                            </time>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                className="p-1.5 text-slate-300 hover:text-blue-500 transition-all shadow-sm bg-white border border-slate-100 rounded-lg"
                                                title="Editar Consulta"
                                                onClick={() => {
                                                    // Sanitizar los datos: buscar en todos los nombres de campo posibles
                                                    const rawMeds = r.medicationsList || r.medications || r.medications_list || [];
                                                    const sanitizedRecord = {
                                                        ...r,
                                                        medicationsList: Array.isArray(rawMeds) ? rawMeds : []
                                                    };
                                                    setNewRecord(sanitizedRecord);
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => deleteRecord(r.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-all shadow-sm bg-white border border-slate-100 rounded-lg" title="Eliminar Consulta">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                            {/* Columna 1: Info Principal y Signos Vitales */}
                                            <div className="lg:col-span-4 space-y-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-blue-50">
                                                            {r.personName?.charAt(0) || <User size={24} />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-900 text-lg uppercase leading-tight tracking-tight">{r.personName || "Sin Nombre"}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{r.reason || "Consulta General"}</p>
                                                        </div>
                                                    </div>
                                                    {r.doctorName && (
                                                        <div className="flex items-center gap-2 pl-2 text-slate-500">
                                                            <Stethoscope size={14} className="text-blue-400" />
                                                            <span className="text-[11px] font-bold italic">Dr. {r.doctorName}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {r.height && (
                                                        <div className="px-4 py-2 bg-slate-50 rounded-2xl text-slate-600 text-[10px] font-black border border-slate-100 flex items-center gap-2 shadow-sm">
                                                            <Ruler size={14} className="text-blue-500" /> {r.height} CM
                                                        </div>
                                                    )}
                                                    {r.weight && (
                                                        <div className="px-4 py-2 bg-slate-50 rounded-2xl text-slate-600 text-[10px] font-black border border-slate-100 flex items-center gap-2 shadow-sm">
                                                            <Weight size={14} className="text-indigo-500" /> {r.weight} KG
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Plan de Medicamentos */}
                                                <div className="space-y-3 pt-4">
                                                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Plan Terapéutico</h6>
                                                    <div className="flex flex-col gap-3">
                                                        {(() => {
                                                            let rawMeds = r.medications || r.medicationsList || [];
                                                            let medsArray = [];
                                                            try {
                                                                if (Array.isArray(rawMeds)) medsArray = rawMeds;
                                                                else if (typeof rawMeds === 'string' && rawMeds.trim()) {
                                                                    if (rawMeds.trim().startsWith('[') || rawMeds.trim().startsWith('{')) medsArray = JSON.parse(rawMeds);
                                                                    else medsArray = rawMeds.split(',').filter(m => m.trim()).map(m => m.trim());
                                                                }
                                                            } catch (err) { medsArray = []; }

                                                            if (!medsArray || medsArray.length === 0) {
                                                                return <div className="p-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center py-6">
                                                                    <Pill size={20} className="mx-auto text-slate-200 mb-1" />
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Sin medicamentos</p>
                                                                </div>;
                                                            }

                                                            return medsArray.map((m, i) => {
                                                                const isObj = m && typeof m === 'object';
                                                                const name = isObj ? m.name : m;
                                                                const freq = isObj ? m.frequency : '';
                                                                const dose = isObj ? (m.dose || `${m.doseValue} ${m.doseUnit}`) : '';
                                                                const days = isObj ? m.days : '';

                                                                let endDateTooltip = null;
                                                                if (isObj && days && r.date) {
                                                                    try {
                                                                        const consultDate = parseISO(r.date);
                                                                        const duration = parseInt(days);
                                                                        if (!isNaN(duration)) {
                                                                            const fin = new Date(consultDate);
                                                                            fin.setDate(fin.getDate() + duration);
                                                                            endDateTooltip = format(fin, "d 'de' MMMM", { locale: es });
                                                                        }
                                                                    } catch (e) { }
                                                                }

                                                                return (
                                                                    <div key={i} className="group/med bg-white rounded-[1.75rem] border border-slate-100 p-4 shadow-sm hover:border-blue-100 hover:shadow-md transition-all">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover/med:bg-blue-600 group-hover/med:text-white transition-colors">
                                                                                <Pill size={14} />
                                                                            </div>
                                                                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{name}</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <div className="bg-slate-50/50 rounded-xl p-2 px-3 border border-slate-50">
                                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 leading-none">Dosis</p>
                                                                                <p className="text-[10px] font-black text-slate-700 leading-none">{dose || "N/A"}</p>
                                                                            </div>
                                                                            <div className="bg-slate-50/50 rounded-xl p-2 px-3 border border-slate-50">
                                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 leading-none">Frecuencia</p>
                                                                                <p className="text-[10px] font-black text-slate-700 leading-none">{freq || "A demanda"}</p>
                                                                            </div>
                                                                        </div>
                                                                        {endDateTooltip && (
                                                                            <div className="mt-3 py-1.5 px-3 bg-rose-50/50 rounded-xl flex items-center gap-2 border border-rose-50">
                                                                                <Clock size={10} className="text-rose-500" />
                                                                                <p className="text-[9px] font-black text-rose-600 uppercase">Finaliza: <span className="text-rose-700">{endDateTooltip}</span></p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Columna 2: Comentarios y Multimedia */}
                                            <div className="lg:col-span-8 flex flex-col gap-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Comentarios */}
                                                    <div className="bg-slate-50/30 rounded-[2.5rem] p-6 border border-slate-100/50 flex flex-col min-h-[160px]">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><MessageSquare size={16} /></div>
                                                            <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observaciones</h6>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed font-medium flex-1 italic">
                                                            {r.doctorComments ? `"${r.doctorComments}"` : "Sin observaciones adicionales registradas."}
                                                        </p>
                                                    </div>

                                                    {/* Multimedia Preview */}
                                                    <div className="bg-slate-50/30 rounded-[2.5rem] p-6 border border-slate-100/50 flex flex-col gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Camera size={16} /></div>
                                                            <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidencia Multimedia</h6>
                                                        </div>
                                                        <div className="flex gap-4 items-center">
                                                            {r.recipeImage ? (
                                                                <div className="relative group/pic w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-slate-100 shrink-0">
                                                                    <img src={r.recipeImage} className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(r.recipeImage)} />
                                                                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/pic:opacity-100 transition-opacity" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 shrink-0">
                                                                    <Camera size={20} />
                                                                    <span className="text-[8px] font-black mt-1 uppercase">Sin Foto</span>
                                                                </div>
                                                            )}

                                                            <div className="flex-1 space-y-3">
                                                                {r.audioNote ? (
                                                                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-50">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                                                            <span className="text-[9px] font-black text-slate-500 uppercase">Nota de Voz</span>
                                                                        </div>
                                                                        <audio controls src={r.audioNote} className="h-6 w-full opacity-70 hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-slate-100/50 p-4 rounded-2xl border border-dashed border-slate-200 text-center">
                                                                        <Mic size={16} className="mx-auto text-slate-300" />
                                                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Sin audio</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Meta Info Footer inside Card */}
                                                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between opacity-50 grayscale hover:grayscale-0 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                                            <Calendar size={12} /> Creado el {format(parseISO(r.date), 'dd/MM/yyyy')}
                                                        </div>
                                                        {r.hasFollowUp && (
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase">
                                                                <CalendarCheck size={12} /> Seguimiento: {format(parseISO(r.followUpDate), 'dd/MM/yyyy')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
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
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Stethoscope className="text-blue-600" /> Nueva Consulta Médica</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddRecord} className="p-8 max-h-[85vh] overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-12 mb-8">
                                {/* Section 1: Basic Info */}
                                <div className="space-y-4">
                                    <h5 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-blue-600">Paciente y Vitales</h5>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Paciente</label>
                                        <div className="space-y-3">
                                            <select
                                                required
                                                className="input-field cursor-pointer"
                                                value={patients.some(p => p.name === newRecord.personName) ? newRecord.personName : (newRecord.personName === '' ? '' : '__new__')}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === '__new__') setNewRecord(prev => ({ ...prev, personName: ' ' })); // Espacio para forzar visibilidad del input
                                                    else setNewRecord(prev => ({ ...prev, personName: val }));
                                                }}
                                            >
                                                <option value="">Seleccionar...</option>
                                                {patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                <option value="__new__">+ Registrar Nuevo Paciente</option>
                                            </select>

                                            {(newRecord.personName !== '' && !patients.some(p => p.name === newRecord.personName)) && (
                                                <div className="relative animate-in zoom-in-95 duration-200">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                    <input
                                                        type="text"
                                                        required
                                                        className="input-field !pl-10 !py-4 font-bold border-blue-100 ring-2 ring-blue-50/50"
                                                        placeholder="Nombre del paciente..."
                                                        value={newRecord.personName === ' ' ? '' : newRecord.personName}
                                                        onChange={e => setNewRecord(prev => ({ ...prev, personName: e.target.value }))}
                                                        autoFocus
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase pl-2 mb-2 block flex items-center gap-1.5"><Ruler size={12} className="text-blue-500" /> Altura (cm)</label>
                                            <input type="number" placeholder="Ej: 175" className="input-field !py-4 font-bold !bg-white !shadow-sm" value={newRecord.height} onChange={e => setNewRecord({ ...newRecord, height: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase pl-2 mb-2 block flex items-center gap-1.5"><Weight size={12} className="text-blue-500" /> Peso (kg)</label>
                                            <input type="number" step="0.1" placeholder="Ej: 70" className="input-field !py-4 font-bold !bg-white !shadow-sm" value={newRecord.weight} onChange={e => setNewRecord({ ...newRecord, weight: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase pl-2 mb-2 block flex items-center gap-1.5"><Stethoscope size={12} className="text-blue-500" /> Motivo de Consulta</label>
                                        <input type="text" required placeholder="Ej: Dolor de garganta y fiebre" className="input-field !py-4 font-bold !bg-white !shadow-sm" value={newRecord.reason} onChange={e => setNewRecord({ ...newRecord, reason: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase pl-2 mb-2 block flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> Fecha</label>
                                        <input type="date" required className="input-field !py-4 font-bold !bg-white !shadow-sm cursor-pointer" value={newRecord.date} onChange={e => setNewRecord({ ...newRecord, date: e.target.value })} />
                                    </div>
                                </div>

                                {/* Section 2: Medical Details */}
                                <div className="space-y-4">
                                    <h5 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-600">Diagnóstico y Recetas</h5>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Plan de Medicamentos</label>
                                        <div className={`flex flex-col gap-5 p-6 rounded-[2.5rem] border transition-all ${editIndex !== null ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-100/50 border-slate-200'} shadow-inner`}>
                                            <div className="space-y-6">
                                                {/* Nombre */}
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block flex items-center gap-1.5">
                                                        <Pill size={12} className="text-blue-500" /> Nombre del Medicamento
                                                    </label>
                                                    <div className="relative group">
                                                        <Pill className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                                        <input type="text" placeholder="Ej: Amoxicilina" className="input-field !py-4 !pl-12 !bg-white !shadow-sm !text-base" value={medInput.name} onChange={e => setMedInput({ ...medInput, name: e.target.value })} />
                                                    </div>
                                                </div>

                                                {/* Frecuencia (Chips) - Ahora en su propia fila para legibilidad */}
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block flex items-center gap-1.5">
                                                        <Clock size={12} className="text-blue-500" /> Frecuencia de Toma
                                                    </label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {[
                                                            { l: '6h', v: 'Cada 6 horas' },
                                                            { l: '8h', v: 'Cada 8 horas' },
                                                            { l: '12h', v: 'Cada 12 horas' },
                                                            { l: 'Diario', v: 'Diario' },
                                                            { l: 'Noche', v: 'Antes de dormir' },
                                                            { l: 'Única', v: 'Única dosis' }
                                                        ].map(f => (
                                                            <button
                                                                key={f.v}
                                                                type="button"
                                                                onClick={() => setMedInput({ ...medInput, frequency: f.v })}
                                                                className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${medInput.frequency === f.v ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                                            >
                                                                {f.l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Dosis y Duración */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block flex items-center gap-1.5">
                                                            <Activity size={12} className="text-emerald-500" /> Dosis (Cant. + Unidad)
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Cant."
                                                                className="flex-1 min-w-0 px-4 py-4 text-sm bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm font-bold"
                                                                value={medInput.doseValue}
                                                                onChange={e => setMedInput({ ...medInput, doseValue: e.target.value })}
                                                            />
                                                            <select
                                                                className="w-24 px-2 py-4 text-[11px] font-black bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none uppercase cursor-pointer hover:bg-slate-100 transition-all text-slate-700 shadow-sm"
                                                                value={medInput.doseUnit}
                                                                onChange={e => setMedInput({ ...medInput, doseUnit: e.target.value })}
                                                            >
                                                                <option value="mg">mg</option>
                                                                <option value="g">g</option>
                                                                <option value="ml">ml</option>
                                                                <option value="Tableta">Tab</option>
                                                                <option value="Cápsula">Cáp</option>
                                                                <option value="Gotas">Got</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 mb-2 block flex items-center gap-1.5">
                                                            <Calendar size={12} className="text-amber-500" /> Duración (Días)
                                                        </label>
                                                        <input type="number" placeholder="Días" className="input-field !py-4 !bg-white !shadow-sm font-bold" value={medInput.days} onChange={e => setMedInput({ ...medInput, days: e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMed())} />
                                                    </div>
                                                </div>

                                                {/* Botón Acción */}
                                                <div className="flex gap-3 pt-2">
                                                    {editIndex !== null && (
                                                        <button type="button" onClick={cancelEditMed} className="flex-1 h-[56px] bg-rose-50 text-rose-600 font-black rounded-[1.5rem] hover:bg-rose-100 transition-all text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 border border-rose-100 shadow-sm">
                                                            <X size={16} /> Cancelar
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={addMed} className={`flex-[2] h-[56px] ${editIndex !== null ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'} text-white font-black rounded-[1.5rem] transition-all shadow-lg flex items-center justify-center gap-3 text-xs uppercase italic tracking-wider active:scale-95`}>
                                                        {editIndex !== null ? <Check size={20} /> : <Plus size={20} />}
                                                        {editIndex !== null ? 'Actualizar Medicamento' : 'Añadir al Plan'}
                                                    </button>
                                                </div>
                                            </div>

                                            {Array.isArray(newRecord.medicationsList) && newRecord.medicationsList.length > 0 && (
                                                <div className="mt-4 space-y-3 border-t border-slate-200 pt-6">
                                                    {newRecord.medicationsList.map((m, i) => (
                                                        <div key={i} className={`flex items-center justify-between px-6 py-4 rounded-[2rem] border transition-all shadow-sm ${editIndex === i ? 'bg-amber-50 border-amber-200 scale-102 ring-4 ring-amber-100/50' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-3 rounded-xl ${editIndex === i ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}><Pill size={18} /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-slate-900 uppercase text-sm tracking-tight leading-tight">{m.name}</span>
                                                                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest italic leading-none mt-1">
                                                                        {m.dose} • {m.frequency} • {m.days} días
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button type="button" onClick={() => editMed(i)} className="text-slate-300 hover:text-blue-500 transition-colors p-2" title="Editar"><Pencil size={14} /></button>
                                                                <button type="button" onClick={() => removeMed(i)} className="text-slate-300 hover:text-rose-500 transition-colors p-2" title="Eliminar"><X size={16} /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                    <div className="relative bg-white rounded-3xl w-full max-md auto overflow-hidden animate-in zoom-in-95 duration-300">
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
