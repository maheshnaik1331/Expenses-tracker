"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Loader2, Moon, Droplets, Flower2, Edit2,
    Heart, X, Trash2, CalendarHeart, Wind,
    Sparkles, Star, Calendar as CalIcon, Clock,
    Sun, Feather, Smile, ChevronLeft, ChevronRight
} from "lucide-react";

// --- MAGICAL, FEMININE FLOATING BACKGROUND ANIMATION ---
const FloatingElements = () => {
    const elements = [
        { id: 1, Icon: Flower2, color: "text-pink-300", size: "w-10 h-10", left: "5%", duration: 18, delay: 0 },
        { id: 2, Icon: Sparkles, color: "text-rose-200", size: "w-8 h-8", left: "85%", duration: 22, delay: 2 },
        { id: 3, Icon: Sun, color: "text-amber-200", size: "w-14 h-14", left: "40%", duration: 25, delay: 5 },
        { id: 4, Icon: Moon, color: "text-pink-200", size: "w-12 h-12", left: "70%", duration: 20, delay: 1 },
        { id: 5, Icon: Heart, color: "text-rose-300", size: "w-6 h-6", left: "20%", duration: 15, delay: 4 },
        { id: 6, Icon: Feather, color: "text-purple-200", size: "w-8 h-8", left: "55%", duration: 19, delay: 3 },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-white">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-pink-50/20 to-white"></div>
            {elements.map((el) => (
                <motion.div
                    key={el.id}
                    className={`absolute bottom-[-10%] ${el.color}`}
                    style={{ left: el.left }}
                    animate={{
                        y: ["0vh", "-120vh"],
                        x: [0, Math.random() * 60 - 30, 0],
                        rotate: [0, 360]
                    }}
                    transition={{
                        duration: el.duration,
                        repeat: Infinity,
                        delay: el.delay,
                        ease: "linear"
                    }}
                >
                    <el.Icon className={`${el.size} opacity-30`} />
                </motion.div>
            ))}
        </div>
    );
};

// --- CUSTOM BESPOKE CALENDAR PICKER ---
const PremiumDatePicker = ({ value, onChange, label }: { value: string, onChange: (date: string) => void, label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Format to YYYY-MM-DD safely
        const offset = newDate.getTimezoneOffset();
        const localDate = new Date(newDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
        onChange(localDate);
        setIsOpen(false);
    };

    const displayDate = value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "Select a date";

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block mb-2 px-1">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-pink-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer shadow-sm focus-within:ring-4 focus-within:ring-pink-100 transition-all hover:border-pink-400"
            >
                <CalIcon className="w-4 h-4 text-pink-400 font-bold" />
                <span className="text-sm font-bold text-rose-900">{displayDate}</span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] bg-white border border-pink-100 rounded-3xl shadow-2xl z-[9999] p-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <button type="button" onClick={handlePrevMonth} className="p-2 text-rose-400 hover:bg-pink-50 rounded-full transition-colors focus:outline-none"><ChevronLeft className="w-5 h-5" /></button>
                            <span className="text-sm font-black text-rose-900">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            <button type="button" onClick={handleNextMonth} className="p-2 text-rose-400 hover:bg-pink-50 rounded-full transition-colors focus:outline-none"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d} className="text-[10px] font-black text-pink-300">{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const isSelected = value && new Date(value).getDate() === day && new Date(value).getMonth() === currentMonth.getMonth() && new Date(value).getFullYear() === currentMonth.getFullYear();
                                return (
                                    <button
                                        type="button" key={day} onClick={() => handleDateSelect(day)}
                                        className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-bold transition-all focus:outline-none ${isSelected ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md shadow-pink-400/30' : 'text-rose-900 hover:bg-pink-50'}`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- INTERACTIVE ANALOG TIME SELECTOR ---
const PremiumTimeSelector = ({ value, onChange, label }: { value: string, onChange: (time: string) => void, label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<'hour' | 'minute'>('hour');

    // Parse incoming HH:mm
    const [hr24, min] = value ? value.split(':') : ["12", "00"];
    const [hour, setHour] = useState(parseInt(hr24) % 12 === 0 ? 12 : parseInt(hr24) % 12);
    const [minute, setMinute] = useState(parseInt(min) || 0);
    const [period, setPeriod] = useState(parseInt(hr24) >= 12 ? 'PM' : 'AM');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setMode('hour');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync to parent format (HH:mm)
    useEffect(() => {
        let h24 = hour;
        if (period === 'PM' && hour !== 12) h24 = hour + 12;
        if (period === 'AM' && hour === 12) h24 = 0;

        const finalH = h24.toString().padStart(2, '0');
        const finalM = minute.toString().padStart(2, '0');
        onChange(`${finalH}:${finalM}`);
    }, [hour, minute, period]);

    const displayTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;

    // Analog Dial Coordinates Logic
    const getDialItems = () => {
        if (mode === 'hour') return Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
        // For minutes, show increments of 5 for a clean dial
        return Array.from({ length: 12 }, (_, i) => i * 5);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block mb-2 px-1">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-pink-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer shadow-sm focus-within:ring-4 focus-within:ring-pink-100 transition-all hover:border-pink-400"
            >
                <Clock className="w-4 h-4 text-pink-400 font-bold" />
                <span className="text-sm font-bold text-rose-900">{displayTime}</span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] bg-white border border-pink-100 rounded-3xl shadow-2xl z-[9999] p-6 flex flex-col items-center"
                    >
                        {/* Time Display Header */}
                        <div className="flex items-baseline gap-2 mb-6">
                            <button type="button" onClick={() => setMode('hour')} className={`text-3xl font-black focus:outline-none transition-colors ${mode === 'hour' ? 'text-rose-500' : 'text-rose-200 hover:text-rose-400'}`}>
                                {hour.toString().padStart(2, '0')}
                            </button>
                            <span className="text-3xl font-black text-rose-200">:</span>
                            <button type="button" onClick={() => setMode('minute')} className={`text-3xl font-black focus:outline-none transition-colors ${mode === 'minute' ? 'text-rose-500' : 'text-rose-200 hover:text-rose-400'}`}>
                                {minute.toString().padStart(2, '0')}
                            </button>
                        </div>

                        {/* Analog Circular Dial */}
                        <div className="relative w-48 h-48 rounded-full bg-pink-50/50 border border-pink-100 mb-6 flex items-center justify-center">
                            <div className="w-2 h-2 bg-rose-400 rounded-full absolute z-10" />
                            {getDialItems().map((item, i) => {
                                const angle = ((i * 30) - 90) * (Math.PI / 180);
                                const radius = 72;
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                const isSelected = mode === 'hour' ? hour === item : minute === item;

                                return (
                                    <button
                                        key={item} type="button"
                                        onClick={() => {
                                            if (mode === 'hour') { setHour(item); setMode('minute'); }
                                            else { setMinute(item); setIsOpen(false); } // close on minute select
                                        }}
                                        className={`absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-black transition-all z-20 focus:outline-none ${isSelected ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-110' : 'text-rose-800 hover:bg-rose-200'}`}
                                        style={{ transform: `translate(${x}px, ${y}px)` }}
                                    >
                                        {mode === 'minute' ? item.toString().padStart(2, '0') : item}
                                    </button>
                                );
                            })}
                        </div>

                        {/* AM / PM Toggles */}
                        <div className="flex bg-rose-50 p-1.5 rounded-2xl border border-rose-100 w-full">
                            <button type="button" onClick={() => setPeriod('AM')} className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${period === 'AM' ? 'bg-white text-rose-600 shadow-sm border border-rose-200/50' : 'text-rose-400 hover:text-rose-600'}`}>AM</button>
                            <button type="button" onClick={() => setPeriod('PM')} className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${period === 'PM' ? 'bg-white text-rose-600 shadow-sm border border-rose-200/50' : 'text-rose-400 hover:text-rose-600'}`}>PM</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SYMPTOMS = ["Cramps", "Headache", "Fatigue", "Bloating", "Cravings", "Mood Swings", "Backache", "Acne", "Tender Breasts", "Insomnia"];

export default function TrackerPage() {
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toTimeString().slice(0, 5),
        endDate: "",
        endTime: "",
        flow: "MEDIUM",
        symptoms: [] as string[],
        notes: ""
    });

    const fetchData = async () => {
        try {
            const res = await api.get("/cycles");
            setLogs(res.data);
        } catch (error) {
            toast.error("Failed to sync your beautiful data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) fetchData();
    }, [authLoading, user]);

    const resetForm = () => {
        setForm({
            startDate: new Date().toISOString().split('T')[0],
            startTime: new Date().toTimeString().slice(0, 5),
            endDate: "",
            endTime: "",
            flow: "MEDIUM",
            symptoms: [],
            notes: ""
        });
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (log: any) => {
        const sDate = new Date(log.startDate);
        const eDate = log.endDate ? new Date(log.endDate) : null;

        setForm({
            startDate: sDate.toISOString().split('T')[0],
            startTime: sDate.toTimeString().slice(0, 5), // HH:mm
            endDate: eDate ? eDate.toISOString().split('T')[0] : "",
            endTime: eDate ? eDate.toTimeString().slice(0, 5) : "",
            flow: log.flow || "MEDIUM",
            symptoms: log.symptoms || [],
            notes: log.notes || ""
        });
        setEditingId(log.id);
        setIsFormOpen(true);
    };

    const toggleSymptom = (sym: string) => {
        setForm(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(sym) ? prev.symptoms.filter(s => s !== sym) : [...prev.symptoms, sym]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const startDateTime = new Date(`${form.startDate}T${form.startTime}:00`).toISOString();
            const endDateTime = (form.endDate && form.endTime) ? new Date(`${form.endDate}T${form.endTime}:00`).toISOString() : null;

            const payload = {
                startDate: startDateTime,
                endDate: endDateTime,
                flow: form.flow,
                symptoms: form.symptoms,
                notes: form.notes
            };

            if (editingId) {
                await api.patch(`/cycles/${editingId}`, payload);
                toast.success("Your journal has been beautifully updated. ✨");
            } else {
                await api.post("/cycles", payload);
                toast.success("Wellness log perfectly recorded. 🌸");
            }

            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to save your log.");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteLog = async (id: string) => {
        try {
            await api.delete(`/cycles/${id}`);
            toast.success("Log gently removed.");
            fetchData();
        } catch (err) {
            toast.error("Couldn't remove the log.");
        }
    };

    const formatDateTime = (dateString: string) => {
        const d = new Date(dateString);
        return {
            date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
    };

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-pink-400" strokeWidth={3} /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 antialiased selection:bg-pink-100 relative">

                <FloatingElements />

                <div className="relative z-10">
                    <Navbar />
                </div>

                <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 py-12 relative z-10 overflow-x-hidden">

                    {/* Header */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="text-center mb-12">
                        <div className="w-20 h-20 bg-pink-50 rounded-full mx-auto mb-6 flex items-center justify-center shadow-sm border border-pink-100">
                            <Sparkles className="w-10 h-10 text-pink-500" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-rose-950 tracking-tight">Your Rhythms</h1>
                        <p className="text-pink-600/80 text-base mt-4 font-bold max-w-lg mx-auto leading-relaxed">
                            Honor your body's natural phases. Track your feelings, flow, and self-care moments in absolute privacy.
                        </p>
                        <button onClick={resetForm} className="mt-8 mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black text-sm px-8 py-4 rounded-full shadow-[0_8px_30px_rgb(244,114,182,0.3)] hover:shadow-[0_8px_40px_rgb(244,114,182,0.4)] hover:-translate-y-1 transition-all">
                            <Heart className="w-5 h-5 fill-white" /> Log Today's Feelings
                        </button>
                    </motion.div>

                    {/* Historical Logs */}
                    <div className="space-y-8">
                        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
                            {logs.length === 0 ? (
                                <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-[2rem] p-12 text-center shadow-sm relative overflow-hidden">
                                    <Smile className="w-12 h-12 text-pink-200 mx-auto mb-4" />
                                    <p className="text-rose-950 font-black text-lg">Your journal is waiting, beautiful.</p>
                                    <p className="text-pink-500 font-semibold mt-1">Start tracking your cycle whenever you feel ready.</p>
                                </motion.div>
                            ) : (
                                logs.map((log) => {
                                    const start = formatDateTime(log.startDate);
                                    const end = log.endDate ? formatDateTime(log.endDate) : null;

                                    return (
                                        <motion.div key={log.id} variants={fadeUp} className="bg-white/90 backdrop-blur-xl border border-pink-100 rounded-[2.5rem] shadow-[0_8px_30px_rgb(244,114,182,0.06)] hover:shadow-[0_8px_30px_rgb(244,114,182,0.12)] transition-all relative overflow-hidden group mb-8 flex flex-col">

                                            <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8">
                                                <div className="md:w-1/3 shrink-0">
                                                    <div className="flex items-center gap-2 text-rose-950 mb-1">
                                                        <CalendarHeart className="w-6 h-6 text-pink-500" strokeWidth={2.5} />
                                                        <span className="font-black text-xl">{start.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-pink-500 font-bold text-xs pl-8 mb-4">
                                                        <Clock className="w-3.5 h-3.5" /> Started at {start.time}
                                                    </div>

                                                    {end && (
                                                        <div className="mb-4 pl-8 border-l-2 border-pink-100 py-1 ml-[11px]">
                                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-0.5">Ended On</span>
                                                            <span className="font-bold text-sm text-rose-900">{end.date}</span>
                                                            <div className="flex items-center gap-1 text-pink-400 font-semibold text-xs mt-0.5">
                                                                <Clock className="w-3 h-3" /> {end.time}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-2 bg-pink-50 px-4 py-2.5 rounded-2xl w-max border border-pink-100">
                                                        <Droplets className={`w-5 h-5 ${log.flow === 'HEAVY' ? 'text-rose-600 fill-rose-600' : log.flow === 'MEDIUM' ? 'text-pink-400 fill-pink-400' : 'text-pink-200 fill-pink-200'}`} />
                                                        <span className="text-sm font-black text-rose-800 tracking-wider uppercase">{log.flow} Flow</span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 md:border-l md:border-pink-50 md:pl-8 space-y-5">
                                                    {log.symptoms.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2.5">Symptoms Felt</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {log.symptoms.map((sym: string) => (
                                                                    <span key={sym} className="bg-white border border-pink-200 text-rose-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">{sym}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {log.notes && (
                                                        <div>
                                                            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Wind className="w-3.5 h-3.5" /> Dear Diary</p>
                                                            <p className="text-sm font-semibold text-rose-900 leading-relaxed italic bg-pink-50/50 p-5 rounded-[1.5rem] border border-pink-100">{log.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Bar (Edit & Delete) */}
                                            <div className="bg-pink-50/50 border-t border-pink-100 px-6 py-4 flex justify-end gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(log)} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-pink-600 bg-white hover:bg-pink-100 px-4 py-2 rounded-full transition-colors border border-pink-200 shadow-sm focus:outline-none">
                                                    <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Edit Entry
                                                </button>
                                                <button onClick={() => deleteLog(log.id)} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-500 bg-white hover:bg-red-50 px-4 py-2 rounded-full transition-colors border border-red-100 shadow-sm focus:outline-none">
                                                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Remove
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    </div>
                </main>

                <AnimatePresence>
                    {isFormOpen && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-rose-950/20 backdrop-blur-md" onClick={() => setIsFormOpen(false)} />

                            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="relative bg-white/95 backdrop-blur-3xl border border-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-2xl shadow-[0_0_50px_rgb(244,114,182,0.2)] flex flex-col mt-auto sm:mt-0 my-0 sm:my-8 max-h-[90vh]">

                                <div className="p-6 sm:p-8 flex items-center justify-between border-b border-pink-50 shrink-0">
                                    <h2 className="text-2xl font-black text-rose-950 tracking-tight flex items-center gap-2">
                                        <Moon className="w-6 h-6 text-pink-400 fill-pink-100" />
                                        {editingId ? "Refine Your Thoughts" : "Log Your Rhythm"}
                                    </h2>
                                    <button onClick={() => setIsFormOpen(false)} className="p-2 bg-pink-50 text-pink-400 hover:text-rose-600 rounded-full transition-colors focus:outline-none"><X className="w-5 h-5 font-bold" /></button>
                                </div>

                                <div className="p-6 sm:p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200">
                                    <form id="cycleForm" onSubmit={handleSubmit} className="space-y-8">

                                        {/* Precision Custom Date & Time Selectors */}
                                        <div className="bg-pink-50/30 p-5 rounded-[2rem] border border-pink-100 space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <PremiumDatePicker label="Started On" value={form.startDate} onChange={(val) => setForm({ ...form, startDate: val })} />
                                                <PremiumTimeSelector label="Start Time" value={form.startTime} onChange={(val) => setForm({ ...form, startTime: val })} />
                                            </div>

                                            <div className="border-t border-pink-100 pt-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <PremiumDatePicker label="Ended On (Optional)" value={form.endDate} onChange={(val) => setForm({ ...form, endDate: val })} />
                                                    <PremiumTimeSelector label="End Time" value={form.endTime} onChange={(val) => setForm({ ...form, endTime: val })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block mb-3 text-center">Flow Intensity</label>
                                            <div className="flex bg-pink-50/50 p-1.5 rounded-2xl border border-pink-100">
                                                {["SPOTTING", "LIGHT", "MEDIUM", "HEAVY"].map((f) => (
                                                    <button type="button" key={f} onClick={() => setForm({ ...form, flow: f })} className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex flex-col items-center gap-1.5 ${form.flow === f ? "bg-white text-rose-600 shadow-md border border-pink-200/50 scale-105" : "text-pink-400/70 hover:text-rose-500"}`}>
                                                        <Droplets className={`w-6 h-6 ${form.flow === f ? 'fill-rose-500 text-rose-500' : ''}`} strokeWidth={form.flow === f ? 2 : 1.5} /> {f}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block mb-3 px-1">How are you feeling?</label>
                                            <div className="flex flex-wrap gap-2.5">
                                                {SYMPTOMS.map(sym => {
                                                    const isSelected = form.symptoms.includes(sym);
                                                    return (
                                                        <button type="button" key={sym} onClick={() => toggleSymptom(sym)} className={`px-5 py-3 rounded-full text-xs font-bold transition-all border ${isSelected ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white border-transparent shadow-[0_4px_15px_rgb(244,114,182,0.3)] scale-105' : 'bg-white text-rose-600 border-pink-200 hover:border-pink-300 shadow-sm'}`}>
                                                            {sym}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block mb-2 px-1">Personal Notes</label>
                                            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Write down your cravings, mood, or anything you want to remember..." rows={3} className="w-full bg-white border border-pink-200 rounded-[1.5rem] px-5 py-5 text-sm font-bold text-rose-900 placeholder:text-pink-300 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all resize-none shadow-sm" />
                                        </div>

                                    </form>
                                </div>
                                <div className="p-6 sm:p-8 pt-0 flex justify-end shrink-0 border-t border-pink-50">
                                    <button form="cycleForm" type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white text-base font-black py-4.5 rounded-2xl flex justify-center items-center gap-2 shadow-[0_8px_30px_rgb(244,114,182,0.3)] active:scale-95 transition-all focus:outline-none">
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5 fill-white" />}
                                        {editingId ? "Update Journal" : "Save Entry"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </ProtectedRoute>
    );
}