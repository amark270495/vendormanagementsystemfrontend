import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Palmtree, Calendar } from 'lucide-react';

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

        if (leaveDaysSet.has(dateKey)) return { status: 'On Leave', text: 'LEAVE', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: <Palmtree size={14} /> };
        if (holidays[dateKey]) return { status: 'Holiday', text: 'HOLIDAY', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Calendar size={14} /> };
        if (dayOfWeek === 0 || dayOfWeek === 6) return { status: 'Weekend', text: 'WEEKEND', color: 'bg-slate-50 text-slate-400 border-slate-100', icon: null };

        const attendanceRecord = attendanceData[dateKey];
        
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestedText = attendanceRecord.requestedStatus === 'Present' ? 'REQ: P' : 'REQ: A';
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                status: 'Pending',
                text: requestedText,
                color: 'bg-amber-50 text-amber-600 border-amber-200 ring-2 ring-amber-100 ring-offset-1 cursor-pointer hover:bg-amber-100',
                isPending: true,
                request: requestObj,
                icon: <Clock size={14} className="animate-pulse" />
            };
        }
        
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') return { status: 'Present', text: 'PRESENT', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={14} /> };
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { status: 'Absent', text: 'ABSENT', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: <XCircle size={14} /> };
        }

        if (date < today) return { status: 'Unmarked', text: 'UNMARKED', color: 'bg-slate-50 text-slate-400 border-slate-200 border-dashed', icon: null };

        return { status: 'Future', text: '', color: 'bg-white border-slate-100', icon: null };
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
                if (i === 0 && j < firstDayOfMonth) week.push({ day: null, statusInfo: { status: 'Empty' } });
                else if (dayCounter <= daysInMonth) { week.push({ day: dayCounter, statusInfo: getDayStatus(dayCounter++) }); }
                else week.push({ day: null, statusInfo: { status: 'Empty' } });
            }
            if (week.some(cell => cell.day !== null)) grid.push(week);
            if (dayCounter > daysInMonth) break;
        }
        return grid;
    }, [monthDate, attendanceData, holidays, leaveDaysSet, pendingRequestsMap]);

    return (
        <div className="w-full">
            <div className="grid grid-cols-7 gap-3 text-center mb-4">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                    <div key={d} className="text-[10px] font-black text-slate-400 tracking-widest">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
                {calendarGrid.flat().map((cell, index) => {
                    const { color, text, icon, isPending, request } = cell.statusInfo;
                    return (
                        <div
                            key={index}
                            onClick={() => isPending && onDayClick(request)}
                            className={`
                                h-[96px] p-2 rounded-2xl border flex flex-col items-center justify-between transition-all duration-200
                                ${cell.day === null ? 'invisible' : color}
                                ${isPending ? 'hover:scale-105 shadow-md shadow-amber-100' : 'hover:shadow-sm'}
                            `}
                        >
                            {!cell.day ? null : (
                                <>
                                    <span className="text-xs font-bold self-start opacity-60">{cell.day}</span>
                                    <div className="flex flex-col items-center gap-1">
                                        {icon}
                                        {text && <span className="text-[9px] font-black uppercase tracking-tighter">{text}</span>}
                                    </div>
                                    <div className="h-1 w-4 rounded-full bg-current opacity-20" />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 border-t border-slate-100">
                {['Present', 'Absent', 'Pending', 'Leave', 'Holiday', 'Unmarked'].map((label) => (
                    <div key={label} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={`w-2 h-2 rounded-full ${label === 'Present' ? 'bg-emerald-400' : label === 'Absent' ? 'bg-rose-400' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AttendanceApprovalModal = ({ isOpen, onClose, selectedUsername, onApprovalComplete }) => {
    const { user } = useAuth(); 
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set());
    const [pendingRequestsMap, setPendingRequestsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) return;
        setLoading(true);
        try {
            const year = monthDate.getUTCFullYear();
            const month = (monthDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const monthString = `${year}-${month}`;
            const monthEndDay = new Date(Date.UTC(year, monthDate.getUTCMonth() + 1, 0)).getUTCDate();

            const [attendanceRes, holidaysRes, leaveRes] = await Promise.all([
                apiService.getAttendance({ authenticatedUsername: user.userIdentifier, username: selectedUsername, month: monthString }),
                apiService.getHolidays({ authenticatedUsername: user.userIdentifier, year: year.toString() }),
                apiService.getLeaveRequests({ authenticatedUsername: user.userIdentifier, targetUsername: selectedUsername, statusFilter: 'Approved', startDateFilter: `${monthString}-01`, endDateFilter: `${monthString}-${monthEndDay.toString().padStart(2,'0')}` })
            ]);

            const attMap = {};
            const pendingMap = {};
            if (attendanceRes?.data?.success && Array.isArray(attendanceRes.data.attendanceRecords)) {
                attendanceRes.data.attendanceRecords.forEach(att => {
                    const record = { ...att, username: att.username || selectedUsername, date: att.date || att.rowKey };
                    attMap[record.date] = record;
                    if (record.status === 'Pending') pendingMap[record.date] = record;
                });
            }
            setAttendanceData(attMap);
            setPendingRequestsMap(pendingMap);

            const holMap = {};
            if (holidaysRes?.data?.success && Array.isArray(holidaysRes.data.holidays)) {
                holidaysRes.data.holidays.forEach(h => holMap[h.date] = h.description);
            }
            setHolidays(holMap);

            const leaveSet = new Set();
            if (leaveRes?.data?.success && Array.isArray(leaveRes.data.requests)) {
                leaveRes.data.requests.forEach(req => {
                    const start = new Date(req.startDate + 'T00:00:00Z');
                    const end = new Date(req.endDate + 'T00:00:00Z');
                    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                        if (d.getUTCFullYear() === year && d.getUTCMonth() === monthDate.getUTCMonth()) {
                            leaveSet.add(d.toISOString().split('T')[0]);
                        }
                    }
                });
            }
            setLeaveDaysSet(leaveSet);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, [user?.userIdentifier, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) fetchDataForUserAndMonth(currentMonthDate);
    }, [isOpen, selectedUsername, currentMonthDate, fetchDataForUserAndMonth]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const d = new Date(prev);
            d.setUTCMonth(d.getUTCMonth() + offset, 1);
            return d;
        });
    };

    const handleDayClick = async (request) => {
        const confirmAction = window.confirm(`Approve attendance for ${request.username} on ${request.date}?`);
        setActionLoading(true);
        try {
            const action = confirmAction ? 'Approved' : 'Rejected';
            const response = await apiService.approveAttendance({
                targetUsername: request.username,
                attendanceDate: request.date,
                action: action,
                authenticatedUsername: user.userIdentifier
            });
            if (response.data.success) {
                await fetchDataForUserAndMonth(currentMonthDate);
                if (onApprovalComplete) onApprovalComplete();
            }
        } finally { setActionLoading(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reviewing: ${selectedUsername}`} size="4xl">
            <div className="p-4 flex flex-col h-full bg-white">
                <div className="flex justify-between items-center mb-8 bg-slate-50 p-3 rounded-2xl">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><ChevronLeft size={20}/></button>
                    <h3 className="text-lg font-black text-slate-700 tracking-tight uppercase">
                        {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><ChevronRight size={20}/></button>
                </div>

                {loading || actionLoading ? (
                    <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                        <Spinner size="12" />
                        <span className="mt-4 text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Syncing Records</span>
                    </div>
                ) : (
                    <CalendarDisplay
                        monthDate={currentMonthDate}
                        attendanceData={attendanceData}
                        holidays={holidays}
                        leaveDaysSet={leaveDaysSet}
                        onDayClick={handleDayClick}
                        pendingRequestsMap={pendingRequestsMap}
                    />
                )}

                <div className="mt-10 flex justify-end">
                    <button onClick={onClose} className="px-10 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all active:scale-95">
                        Close Panel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;