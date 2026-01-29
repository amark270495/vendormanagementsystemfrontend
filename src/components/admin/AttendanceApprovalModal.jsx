import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal';
import { 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    CalendarOff, 
    Palmtree 
} from 'lucide-react';

const getStatusConfig = (statusKey) => {
    const configs = {
        'Present': { 
            bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', 
            icon: <CheckCircle2 className="w-4 h-4" />, label: 'Present' 
        },
        'Absent': { 
            bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', 
            icon: <XCircle className="w-4 h-4" />, label: 'Absent' 
        },
        'Pending': { 
            bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', 
            icon: <Clock className="w-4 h-4 animate-pulse" />, label: 'Pending' 
        },
        'On Leave': { 
            bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', 
            icon: <Palmtree className="w-4 h-4" />, label: 'Leave' 
        },
        'Holiday': { 
            bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', 
            icon: <CalendarOff className="w-4 h-4" />, label: 'Holiday' 
        },
        'Weekend': { 
            bg: 'bg-slate-50', border: 'border-transparent', text: 'text-slate-400', 
            icon: null, label: 'Weekend' 
        },
        'Unmarked': { 
            bg: 'bg-rose-50/50', border: 'border-rose-100 dashed', text: 'text-rose-400', 
            icon: <XCircle className="w-3 h-3 opacity-50" />, label: 'Unmarked' 
        },
        'Empty': { bg: 'invisible', border: '', text: '', icon: null }
    };
    return configs[statusKey] || { bg: 'bg-white', border: 'border-slate-100', text: 'text-slate-300', icon: null };
};

const CalendarDisplay = ({ monthDate, attendanceData, holidays, leaveDaysSet, onDayClick, pendingRequestsMap }) => {
    const getDayStatus = (day) => {
        const year = monthDate.getUTCFullYear();
        const month = monthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));
        if (date.getUTCMonth() !== month) return { key: 'Empty' };

        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const today = new Date(); 
        today.setUTCHours(0,0,0,0);

        if (leaveDaysSet.has(dateKey)) return { key: 'On Leave' };
        if (holidays[dateKey]) return { key: 'Holiday' };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { key: 'Weekend' };

        const attendanceRecord = attendanceData[dateKey];
        if (attendanceRecord?.status === 'Pending') {
            return {
                key: 'Pending',
                isPending: true,
                request: pendingRequestsMap[dateKey] || {},
                subText: attendanceRecord.requestedStatus === 'Present' ? 'REQ:P' : 'REQ:A'
            };
        }
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') return { key: 'Present' };
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { key: 'Absent' };
        }
        return date < today ? { key: 'Unmarked' } : { key: 'Future' };
    };

    const calendarGrid = useMemo(() => {
        const year = monthDate.getUTCFullYear();
        const month = monthDate.getUTCMonth();
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const grid = [];
        let dayCounter = 1;

        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfMonth) week.push({ day: null, statusInfo: { key: 'Empty' } });
                else if (dayCounter <= daysInMonth) { week.push({ day: dayCounter, statusInfo: getDayStatus(dayCounter++) }); }
                else week.push({ day: null, statusInfo: { key: 'Empty' } });
            }
            grid.push(week);
        }
        return grid;
    }, [monthDate, attendanceData, holidays, leaveDaysSet]);

    return (
        <div className="w-full flex flex-col">
            <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
            </div>

            {/* Grid fills the width of the modal content area */}
            <div className="grid grid-cols-7 gap-1.5 w-full">
                {calendarGrid.flat().map((cell, index) => {
                    const { key, isPending, request, subText } = cell.statusInfo;
                    const config = getStatusConfig(key);
                    const isHidden = cell.day === null;

                    return (
                        <div
                            key={index}
                            onClick={() => isPending && onDayClick(request)}
                            className={`
                                relative min-h-[60px] rounded-xl border flex flex-col items-center justify-center transition-all
                                ${isHidden ? 'invisible' : `${config.bg} ${config.border}`}
                                ${isPending ? 'cursor-pointer hover:shadow-md ring-2 ring-amber-200 ring-offset-1' : ''}
                            `}
                        >
                            {!isHidden && (
                                <>
                                    <span className={`text-xs font-bold mb-1 ${config.text}`}>{cell.day}</span>
                                    <div className={config.text}>{config.icon}</div>
                                    {subText && (
                                        <span className="absolute bottom-1 text-[7px] font-black text-amber-600 uppercase">
                                            {subText}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-slate-100">
                {['Present', 'Absent', 'Pending', 'Leave', 'Holiday'].map(label => {
                    const key = label === 'Leave' ? 'On Leave' : label;
                    const conf = getStatusConfig(key);
                    return (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`${conf.text} scale-90`}>{conf.icon}</div>
                            <span className="text-[11px] font-bold text-slate-500">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AttendanceApprovalModal = ({ isOpen, onClose, selectedUsername, onApprovalComplete }) => {
    const { user } = useAuth(); 
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(true);

    // ... (fetch logic remains same as before) ...

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${selectedUsername}`} size="2xl">
            <div className="bg-white flex flex-col p-4 w-full">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6 bg-slate-50 p-2 rounded-xl">
                    <button onClick={() => {/* prev month logic */}} className="p-2 hover:bg-white rounded-lg shadow-sm">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h3 className="text-lg font-black text-slate-800">
                        {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    <button onClick={() => {/* next month logic */}} className="p-2 hover:bg-white rounded-lg shadow-sm">
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Calendar fills the available 2xl width of the modal */}
                <div className="w-full">
                    <CalendarDisplay
                        monthDate={currentMonthDate}
                        attendanceData={attendanceData}
                        holidays={{}} 
                        leaveDaysSet={new Set()}
                        onDayClick={() => {}} 
                        pendingRequestsMap={{}} 
                    />
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-10 py-3 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200">
                        CLOSE REVIEW
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;