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
    Palmtree, 
    CalendarDays, 
    AlertCircle 
} from 'lucide-react';

const CalendarDisplay = ({ monthDate, attendanceData, holidays, leaveDaysSet, onDayClick, pendingRequestsMap }) => {
    const getDayStatus = (day) => {
        const year = monthDate.getUTCFullYear();
        const month = monthDate.getUTCMonth();
        const date = new Date(Date.UTC(year, month, day));
        if (date.getUTCMonth() !== month) return { status: 'Empty' };

        const dateKey = date.toISOString().split('T')[0];
        const dayOfWeek = date.getUTCDay();
        const today = new Date(); 
        today.setUTCHours(0,0,0,0);

        // Styling Configs
        if (leaveDaysSet.has(dateKey)) return { 
            status: 'On Leave', label: 'LEAVE', icon: <Palmtree size={16}/>, 
            style: 'bg-purple-50 text-purple-600 border-purple-100' 
        };
        if (holidays[dateKey]) return { 
            status: 'Holiday', label: 'HOLIDAY', icon: <CalendarDays size={16}/>, 
            style: 'bg-blue-50 text-blue-600 border-blue-100', description: holidays[dateKey] 
        };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { 
            status: 'Weekend', label: 'WEEKEND', icon: null, 
            style: 'bg-slate-50 text-slate-400 border-slate-100' 
        };

        const attendanceRecord = attendanceData[dateKey];
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                status: 'Pending', label: attendanceRecord.requestedStatus === 'Present' ? 'REQ: P' : 'REQ: A',
                icon: <Clock size={16} className="animate-pulse" />,
                style: 'bg-amber-50 text-amber-600 border-amber-200 ring-2 ring-amber-100 ring-offset-1 cursor-pointer hover:bg-amber-100',
                isPending: true, request: requestObj 
            };
        }
        
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') return { 
                 status: 'Present', label: 'PRESENT', icon: <CheckCircle2 size={16}/>, 
                 style: 'bg-emerald-50 text-emerald-600 border-emerald-100' 
             };
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { 
                 status: 'Absent', label: 'ABSENT', icon: <XCircle size={16}/>, 
                 style: 'bg-rose-50 text-rose-600 border-rose-100' 
             };
        }

        if (date < today) return { 
            status: 'Unmarked', label: 'UNMARKED', icon: <AlertCircle size={14}/>, 
            style: 'bg-slate-50 text-slate-400 border-slate-200 border-dashed italic' 
        };

        return { status: 'Future', label: '', style: 'bg-white border-slate-100', icon: null };
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
                if (i === 0 && j < firstDayOfMonth) week.push({ day: null, info: { status: 'Empty' } });
                else if (dayCounter <= daysInMonth) week.push({ day: dayCounter, info: getDayStatus(dayCounter++) });
                else week.push({ day: null, info: { status: 'Empty' } });
            }
            if (week.some(c => c.day !== null)) grid.push(week);
        }
        return grid;
    }, [monthDate, attendanceData, holidays, leaveDaysSet, pendingRequestsMap]);

    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            <div className="grid grid-cols-7 gap-3 mb-3 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <span key={d} className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-3 flex-1">
                {calendarGrid.flat().map((cell, idx) => (
                    <div
                        key={idx}
                        onClick={() => cell.info.isPending && onDayClick(cell.info.request)}
                        className={`
                            h-[90px] p-2 rounded-2xl border flex flex-col items-center justify-between transition-all duration-300
                            ${cell.day === null ? 'invisible' : cell.info.style}
                            ${cell.info.isPending ? 'hover:scale-[1.03] hover:shadow-xl shadow-amber-100' : 'hover:shadow-md'}
                        `}
                    >
                        {cell.day && (
                            <>
                                <span className="text-xs font-bold self-start opacity-70">{cell.day}</span>
                                <div className="flex flex-col items-center gap-1">
                                    {cell.info.icon}
                                    <span className="text-[9px] font-black leading-none">{cell.info.label}</span>
                                </div>
                                <div className="h-1 w-4 rounded-full bg-current opacity-10" />
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Modern Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 py-4 border-t border-slate-100">
                {[
                    { c: 'bg-emerald-400', l: 'Present' }, { c: 'bg-rose-400', l: 'Absent' },
                    { c: 'bg-amber-400', l: 'Pending' }, { c: 'bg-purple-400', l: 'Leave' },
                    { c: 'bg-blue-400', l: 'Holiday' }, { c: 'bg-slate-300', l: 'Unmarked' }
                ].map(item => (
                    <div key={item.l} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.c}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AttendanceApprovalModal = ({ isOpen, onClose, selectedUsername, onApprovalComplete }) => {
    const { user } = useAuth();
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [data, setData] = useState({ attendance: {}, holidays: {}, leave: new Set(), pending: {} });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async (monthDate) => {
        if (!selectedUsername) return;
        setLoading(true);
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;

            const [attRes, holRes, leaveRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: selectedUsername, month: monthString }),
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: selectedUsername, statusFilter: 'Approved', startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-31` })
            ]);

            const attMap = {};
            const pendMap = {};
            attRes?.data?.attendanceRecords?.forEach(r => {
                const date = r.date || r.rowKey;
                attMap[date] = r;
                if (r.status === 'Pending') pendMap[date] = r;
            });

            const holMap = {};
            holRes?.data?.holidays?.forEach(h => holMap[h.date] = h.description);

            const leaveSet = new Set();
            leaveRes?.data?.requests?.forEach(req => {
                let d = new Date(req.startDate + 'T00:00:00Z');
                let end = new Date(req.endDate + 'T00:00:00Z');
                while (d <= end) {
                    leaveSet.add(d.toISOString().split('T')[0]);
                    d.setUTCDate(d.getUTCDate() + 1);
                }
            });

            setData({ attendance: attMap, holidays: holMap, leave: leaveSet, pending: pendMap });
        } finally { setLoading(false); }
    }, [selectedUsername, user.userIdentifier]);

    useEffect(() => { if (isOpen) fetchData(currentMonthDate); }, [isOpen, currentMonthDate, fetchData]);

    const handleAction = async (req) => {
        const confirmed = window.confirm(`Reviewing request for ${req.date}. OK to Approve, Cancel to Reject.`);
        setActionLoading(true);
        try {
            await apiService.approveAttendance({
                targetUsername: selectedUsername,
                attendanceDate: req.date,
                action: confirmed ? 'Approved' : 'Rejected',
                authenticatedUsername: user.userIdentifier
            });
            await fetchData(currentMonthDate);
            if (onApprovalComplete) onApprovalComplete();
        } finally { setActionLoading(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Insight: ${selectedUsername}`} size="4xl">
            <div className="flex flex-col bg-white p-6 min-h-[600px]">
                <div className="flex justify-between items-center mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() - 1)))} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><ChevronLeft size={20}/></button>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                        {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setUTCMonth(currentMonthDate.getUTCMonth() + 1)))} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><ChevronRight size={20}/></button>
                </div>

                {loading || actionLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <Spinner size="12" />
                        <span className="mt-4 text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase animate-pulse">Synchronizing Records</span>
                    </div>
                ) : (
                    <CalendarDisplay 
                        monthDate={currentMonthDate} 
                        attendanceData={data.attendance} 
                        holidays={data.holidays} 
                        leaveDaysSet={data.leave} 
                        pendingRequestsMap={data.pending} 
                        onDayClick={handleAction} 
                    />
                )}

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-12 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95 transition-all">
                        Exit Review
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;