import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions';
import { CalendarDays, FileText, Send, AlertCircle, ChevronRight, Check } from 'lucide-react';

const LeaveRequestForm = ({ onLeaveRequested }) => {
    const { user } = useAuth();
    const { canRequestLeave } = usePermissions();

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave (SL)',
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false // Added Half-Day Tracking
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
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const newState = { ...prev, [name]: val };
            
            // Logic 1: If Half Day is toggled ON, force endDate to match startDate
            if (name === 'isHalfDay' && val === true) {
                newState.endDate = newState.startDate;
            }
            
            // Logic 2: If a Start Date is selected while Half Day is ON, sync the endDate
            if (name === 'startDate' && newState.isHalfDay) {
                newState.endDate = value;
            }
            
            // Logic 3: Normal multi-day date bounds checking
            if (name === 'startDate' && !newState.isHalfDay && newState.endDate && newState.endDate < value) {
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
                
                // Reset form to defaults
                setFormData({ 
                    leaveType: 'Sick Leave (SL)', 
                    startDate: '', 
                    endDate: '', 
                    reason: '',
                    isHalfDay: false
                });
                
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

    if (!canRequestLeave) return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-sm font-medium text-gray-500">Leave requests are currently disabled for your account.</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white">
            
            {/* Enterprise Standard Alerts */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-md text-sm font-medium flex items-start gap-2 shadow-sm">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" /> 
                    <p>{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded-r-md text-sm font-medium flex items-start gap-2 shadow-sm">
                    <Check size={18} className="mt-0.5 shrink-0" /> 
                    <p>{success}</p>
                </div>
            )}

            {/* Leave Type Select & Half Day Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Type of Leave
                    </label>
                    <div className="relative">
                        <select
                            name="leaveType"
                            value={formData.leaveType}
                            onChange={handleChange}
                            className="w-full bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-md px-3 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
                        >
                            {leaveTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronRight size={16} className="rotate-90" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center h-[42px] px-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isHalfDay"
                            checked={formData.isHalfDay}
                            onChange={handleChange}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">Half Day Request</span>
                    </label>
                </div>
            </div>

            {/* Dates Grid - Adapts based on isHalfDay status */}
            <div className={`grid grid-cols-1 ${formData.isHalfDay ? '' : 'sm:grid-cols-2'} gap-5`}>
                <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {formData.isHalfDay ? 'Date' : 'Start Date'}
                    </label>
                    <div className="flex items-center gap-2.5 bg-white border border-gray-300 px-3 py-2.5 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm group">
                        <CalendarDays size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            className="bg-transparent text-sm font-medium text-gray-900 outline-none w-full"
                        />
                    </div>
                </div>
                
                {/* Hide End Date if requesting a Half Day */}
                {!formData.isHalfDay && (
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            End Date
                        </label>
                        <div className="flex items-center gap-2.5 bg-white border border-gray-300 px-3 py-2.5 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm group">
                            <CalendarDays size={16} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                min={formData.startDate}
                                required
                                className="bg-transparent text-sm font-medium text-gray-900 outline-none w-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Reason Textarea */}
            <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Business Justification
                </label>
                <div className="flex items-start gap-2.5 bg-white border border-gray-300 px-3 py-2.5 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm group">
                    <FileText size={16} className="text-gray-400 mt-0.5 group-focus-within:text-blue-500 transition-colors shrink-0" />
                    <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        required
                        rows="3"
                        placeholder="Provide a reason for your leave request..."
                        className="bg-transparent text-sm font-medium text-gray-900 outline-none w-full resize-y placeholder-gray-400"
                    ></textarea>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all flex items-center gap-2 justify-center min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? <Spinner size="4" /> : <><Send size={14} /> Submit Leave Request</>}
                </button>
            </div>
        </form>
    );
};

export default LeaveRequestForm;