import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions';
import { CalendarDays, FileText, Send, AlertCircle } from 'lucide-react';

const LeaveRequestForm = ({ onLeaveRequested }) => {
    const { user } = useAuth();
    const { canRequestLeave } = usePermissions();

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave (SL)',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const leaveTypes = [
        { value: 'Sick Leave (SL)', label: 'Sick Leave (SL)' },
        { value: 'Casual Leave (CL)', label: 'Casual Leave (CL)' },
        { value: 'Earned Leave (EL)', label: 'Earned Leave (EL)' },
        { value: 'Leave Without Pay (LWP)', label: 'Leave Without Pay (LWP)' },
        { value: 'Loss of Pay (LOP)', label: 'Loss of Pay (LOP)' },
        { value: 'Maternity Leave', label: 'Maternity Leave' },
        { value: 'Paternity Leave', label: 'Paternity Leave' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'startDate' && newState.endDate && newState.endDate < value) {
                newState.endDate = value;
            }
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!canRequestLeave) return setError("Permission denied.");
        if (!formData.startDate || !formData.endDate || !formData.reason.trim()) return setError("Missing required fields.");

        setLoading(true);
        try {
            const response = await apiService.requestLeave(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({ leaveType: 'Sick Leave (SL)', startDate: '', endDate: '', reason: '' });
                if (onLeaveRequested) onLeaveRequested();
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Server error.");
        } finally {
            setLoading(false);
        }
    };

    if (!canRequestLeave) return <p className="text-sm text-slate-400 italic">Leave requests are currently disabled for your account.</p>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
                    <AlertCircle size={14} /> {error}
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <Check size={14} /> {success}
                </div>
            )}

            {/* Leave Type Select */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Type of Leave</label>
                <div className="relative">
                    <select
                        name="leaveType"
                        value={formData.leaveType}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        {leaveTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={16} className="rotate-90" />
                    </div>
                </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl focus-within:ring-2 focus:ring-indigo-500 transition-all">
                        <CalendarDays size={18} className="text-indigo-400" />
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none w-full"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date</label>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl focus-within:ring-2 focus:ring-indigo-500 transition-all">
                        <CalendarDays size={18} className="text-indigo-400" />
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            min={formData.startDate}
                            required
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Reason Textarea */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Business Justification</label>
                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl focus-within:ring-2 focus:ring-indigo-500 transition-all">
                    <FileText size={18} className="text-indigo-400 mt-1" />
                    <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        required
                        rows="3"
                        placeholder="Why are you requesting this leave?"
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none w-full resize-none"
                    ></textarea>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Spinner size="4" /> : <><Send size={14} /> SUBMIT APPLICATION</>}
                </button>
            </div>
        </form>
    );
};

export default LeaveRequestForm;