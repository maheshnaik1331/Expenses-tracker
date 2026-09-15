"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    Loader2, Plus, CheckCircle2, Circle, Clock,
    Sparkles, X, Edit2, Trash2, Calendar as CalIcon, Flag,
    ChevronDown, Check, LayoutGrid, CalendarDays, ArrowRight, ArrowLeft, Search, CheckCircle, Timer
} from "lucide-react";

// --- ULTRA-PREMIUM INTERACTIVE DROPDOWN FOR MODALS ---
const PremiumDropdown = ({ value, options, onChange, icon: Icon, label, placeholder = "Select..." }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 cursor-pointer flex justify-between items-center transition-all shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10"
            >
                <div className="flex items-center gap-3 truncate">
                    {Icon && <Icon className="w-4 h-4 text-slate-400 font-bold" />}
                    <span className="truncate">{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden z-50"
                    >
                        <div className="max-h-56 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                            {options.map((opt: any) => (
                                <div
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {opt.iconNode}
                                        <span className={`text-sm ${value === opt.value ? 'font-black text-blue-600' : 'font-bold text-slate-700'}`}>{opt.label}</span>
                                    </div>
                                    {value === opt.value && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- CUSTOM STATUS CHANGER FOR CARDS (NO SYSTEM SELECT) ---
const StatusDropdown = ({ currentStatus, onStatusChange }: { currentStatus: string, onStatusChange: (status: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const statuses = [
        { id: "PENDING", label: "Not Started", color: "text-slate-600 bg-slate-100" },
        { id: "IN_PROGRESS", label: "In Progress", color: "text-blue-600 bg-blue-50" },
        { id: "COMPLETED", label: "Completed", color: "text-emerald-600 bg-emerald-50" },
    ];

    const current = statuses.find(s => s.id === currentStatus) || statuses[0];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm ${current.color} hover:opacity-90`}
            >
                {current.label} <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        className="absolute bottom-[calc(100%+6px)] right-0 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 overflow-hidden"
                    >
                        {statuses.map(s => (
                            <button
                                key={s.id}
                                onClick={(e) => { e.stopPropagation(); onStatusChange(s.id); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-black transition-colors flex items-center justify-between ${currentStatus === s.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                                {s.label}
                                {currentStatus === s.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function PlannerPage() {
    const { user, loading: authLoading } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // View & Filter State
    const [activeView, setActiveView] = useState<"kanban" | "calendar">("kanban");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        try {
            const res = await api.get("/tasks");
            setTasks(res.data);
        } catch (error) {
            toast.error("Failed to sync your tasks.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) fetchData();
    }, [authLoading, user]);

    const resetForm = () => {
        setForm({ title: "", description: "", priority: "MEDIUM", status: "PENDING", dueDate: new Date().toISOString().split('T')[0] });
        setEditingId(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (task: any) => {
        setForm({
            title: task.title,
            description: task.description || "",
            priority: task.priority || "MEDIUM",
            status: task.status || "PENDING",
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""
        });
        setEditingId(task.id);
        setIsFormOpen(true);
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            await api.patch(`/tasks/${taskId}`, { status: newStatus });
            toast.success(`Task status updated`);
        } catch (err) {
            fetchData();
            toast.error("Couldn't update task status.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) return toast.error("Title required.");
        setSubmitting(true);
        try {
            const payload = { ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null };
            if (editingId) {
                await api.patch(`/tasks/${editingId}`, payload);
                toast.success("Task updated.");
            } else {
                await api.post("/tasks", payload);
                toast.success("New task added.");
            }
            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to save task.");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await api.delete(`/tasks/${id}`);
            toast.success("Task removed.");
            fetchData();
        } catch (err) {
            toast.error("Couldn't remove task.");
        }
    };

    const priorityOptions = [
        { label: "Low", value: "LOW", iconNode: <Flag className="w-4 h-4 text-slate-400" /> },
        { label: "Medium", value: "MEDIUM", iconNode: <Flag className="w-4 h-4 text-blue-500" /> },
        { label: "High", value: "HIGH", iconNode: <Flag className="w-4 h-4 text-amber-500" /> },
        { label: "Urgent", value: "URGENT", iconNode: <Flag className="w-4 h-4 text-rose-600" /> }
    ];

    const statusOptions = [
        { label: "Not Started", value: "PENDING" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Completed", value: "COMPLETED" }
    ];

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [tasks, searchTerm]);

    const notStartedTasks = filteredTasks.filter(t => t.status === "PENDING");
    const inProgressTasks = filteredTasks.filter(t => t.status === "IN_PROGRESS");
    const completedTasks = filteredTasks.filter(t => t.status === "COMPLETED");

    // Calendar Calculations
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", damping: 25 } } };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-blue-600" strokeWidth={3} /></div>;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-100 relative">
                <Navbar />

                <style dangerouslySetInnerHTML={{
                    __html: `
        .premium-date-input::-webkit-calendar-picker-indicator {
          background: transparent; bottom: 0; color: transparent; cursor: pointer;
          height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto;
        }
      `}} />

                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-12 relative overflow-x-hidden">

                    {/* Header */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-200/80 pb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Task Matrix & Planner</h1>
                            <p className="text-slate-500 text-sm mt-2 font-bold tracking-wide">Classify by progress, manage timelines, and execute your objectives.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button onClick={resetForm} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">
                                <Plus className="w-4 h-4 font-bold" strokeWidth={3} /> Establish Task
                            </button>
                        </div>
                    </motion.div>

                    {/* Controls & View Switcher */}
                    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 font-bold" strokeWidth={3} />
                            <input
                                type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm w-full md:w-auto shrink-0">
                            <button onClick={() => setActiveView("kanban")} className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeView === "kanban" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>
                                <LayoutGrid className="w-4 h-4" /> Kanban Board
                            </button>
                            <button onClick={() => setActiveView("calendar")} className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${activeView === "calendar" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>
                                <CalendarDays className="w-4 h-4" /> Calendar View
                            </button>
                        </div>
                    </motion.div>

                    {/* --- DYNAMIC KANBAN BOARD VIEW (CARDS ONLY, NO EMPTY BOXES) --- */}
                    {activeView === "kanban" && (
                        <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

                            {/* Column 1: Not Started */}
                            <div className="bg-slate-50/60 border border-slate-200/60 rounded-[2rem] p-5 flex flex-col shadow-sm">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Not Started ({notStartedTasks.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {notStartedTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={handleEditClick} onDelete={deleteTask} onMove={updateTaskStatus} />
                                    ))}
                                    {notStartedTasks.length === 0 && (
                                        <p className="text-center text-xs font-bold text-slate-400 py-6">No tasks in queue</p>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: In Progress */}
                            <div className="bg-blue-50/30 border border-blue-100/80 rounded-[2rem] p-5 flex flex-col shadow-sm">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span> In Progress ({inProgressTasks.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {inProgressTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={handleEditClick} onDelete={deleteTask} onMove={updateTaskStatus} />
                                    ))}
                                    {inProgressTasks.length === 0 && (
                                        <p className="text-center text-xs font-bold text-blue-300 py-6">No active execution</p>
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Completed */}
                            <div className="bg-emerald-50/30 border border-emerald-100/80 rounded-[2rem] p-5 flex flex-col shadow-sm">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed ({completedTasks.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {completedTasks.map(task => (
                                        <TaskCard key={task.id} task={task} onEdit={handleEditClick} onDelete={deleteTask} onMove={updateTaskStatus} />
                                    ))}
                                    {completedTasks.length === 0 && (
                                        <p className="text-center text-xs font-bold text-emerald-300 py-6">No completed items</p>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {/* --- CALENDAR VIEW --- */}
                    {activeView === "calendar" && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-slate-900">
                                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ArrowLeft className="w-4 h-4 font-bold" /></button>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><ArrowRight className="w-4 h-4 font-bold" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 text-center mb-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <span key={d} className="text-xs font-black text-slate-400 uppercase tracking-wider">{d}</span>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/30 rounded-2xl" />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));

                                    return (
                                        <div key={day} className="min-h-[110px] bg-slate-50/70 border border-slate-100 rounded-2xl p-2.5 flex flex-col gap-1.5 overflow-hidden">
                                            <span className="text-xs font-black text-slate-700">{day}</span>
                                            <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                                                {dayTasks.map(t => (
                                                    <div key={t.id} onClick={() => handleEditClick(t)} className={`text-[10px] font-bold p-1.5 rounded-lg truncate cursor-pointer transition-transform hover:scale-[1.02] ${t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 line-through' : 'bg-blue-100 text-blue-800'}`}>
                                                        {t.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </main>

                {/* --- TASK MODAL FORM --- */}
                <AnimatePresence>
                    {isFormOpen && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />

                            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="relative bg-white border border-slate-200 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col mt-auto sm:mt-0">

                                <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? "Refine Task" : "Define Task"}</h2>
                                    <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 font-bold" /></button>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <form id="taskForm" onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Objective</label>
                                            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Parameters (Optional)</label>
                                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add specifics..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm resize-none" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <PremiumDropdown label="Priority Status" value={form.priority} options={priorityOptions} onChange={(val: any) => setForm({ ...form, priority: val })} icon={Flag} />
                                            </div>
                                            <div>
                                                <PremiumDropdown label="Progress State" value={form.status} options={statusOptions} onChange={(val: any) => setForm({ ...form, status: val })} icon={CheckCircle2} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">Target Date</label>
                                            <div className="relative w-full">
                                                <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 font-bold pointer-events-none" />
                                                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm premium-date-input cursor-pointer" />
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="p-6 sm:p-8 pt-0 flex justify-end">
                                    <button form="taskForm" type="submit" disabled={submitting} className="w-full bg-blue-600 text-white text-sm font-black py-4 rounded-xl flex justify-center items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all">
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" strokeWidth={3} />} Commit Action
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

// --- REUSABLE ULTRA-PREMIUM KANBAN TASK CARD ---
function TaskCard({ task, onEdit, onDelete, onMove }: { task: any, onEdit: any, onDelete: any, onMove: any }) {
    return (
        <motion.div layout layoutId={task.id} className="bg-white border border-slate-200/80 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col gap-3 group relative">
            <div className="flex justify-between items-start gap-2">
                <h4 className="text-sm font-black text-slate-900 leading-tight pr-12">{task.title}</h4>
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-100">
                    <button onClick={() => onEdit(task)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"><Edit2 className="w-3.5 h-3.5 font-bold" /></button>
                    <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5 font-bold" /></button>
                </div>
            </div>

            {task.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100/80 text-[10px] font-bold">
                {task.dueDate ? (
                    <span className="text-slate-400 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3 text-slate-500" /> {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                ) : <span></span>}

                {/* Custom Animated Status Changer */}
                <StatusDropdown currentStatus={task.status} onStatusChange={(newStatus: string) => onMove(task.id, newStatus)} />
            </div>
        </motion.div>
    );
}