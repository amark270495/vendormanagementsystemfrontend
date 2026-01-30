import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal';

// Inline SVGs for UI controls to ensure no external dependency issues
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

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

        // Modern UI Classes Mapping
        const baseClasses = "transition-all duration-200 ease-in-out border";
        
        // 1. Check Leave
        if (leaveDaysSet.has(dateKey)) {
            return { 
                status: 'On Leave', 
                text: 'L', 
                color: `${baseClasses} bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100` 
            };
        }
        
        // 2. Check Holiday (Higher priority than absent/weekend)
        if (holidays[dateKey]) {
            return { 
                status: 'Holiday', 
                text: 'H', 
                color: `${baseClasses} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`, 
                description: holidays[dateKey] 
            };
        }

        // 3. Check Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { 
                status: 'Weekend', 
                text: 'W', 
                color: `${baseClasses} bg-slate-50 text-slate-400 border-slate-100` 
            };
        }

        const attendanceRecord = attendanceData[dateKey];
        
        // 4. Check Pending Requests
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestedText = attendanceRecord.requestedStatus === 'Present' ? 'P?' : 'A?';
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                status: 'Pending',
                text: requestedText,
                // Modernized: Amber color with a dashed border interaction for pending items
                color: `${baseClasses} bg-amber-50 text-amber-700 border-amber-300 border-dashed cursor-pointer hover:bg-amber-100 hover:shadow-sm hover:scale-[1.02] hover:border-amber-400 font-medium`,
                description: `Pending ${attendanceRecord.requestedStatus}`,
                isPending: true,
                request: requestObj 
            };
        }
        
        // 5. Check Present/Absent records
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') {
                return { 
                    status: 'Present', 
                    text: 'P', 
                    color: `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100` 
                };
             }
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') {
                return { 
                    status: attendanceRecord.status, 
                    text: 'A', 
                    color: `${baseClasses} bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100` 
                };
             }
        }

        // 6. Unmarked Past Days
        if (date < today) {
            return { 
                status: 'Absent (Unmarked)', 
                text: 'A', 
                color: `${baseClasses} bg-rose-50/50 text-rose-400 border-rose-100 italic` 
            };
        }

        // Future / Empty
        return { 
            status: 'Future', 
            text: '', 
            color: `${baseClasses} bg-white border-slate-100 text-slate-300` 
        };
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
        <div className="select-none">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {calendarGrid.flat().map((cell, index) => (
                    <div
                        key={index}
                        // Preserving h-16 as requested, but adding rounded corners and modern styling
                        className={`
                            h-16 relative flex flex-col items-center justify-center 
                            rounded-lg
                            ${cell.day === null ? 'invisible' : cell.statusInfo.color}
                        `}
                        title={cell.statusInfo.description || cell.statusInfo.status}
                        onClick={() => cell.statusInfo.isPending && onDayClick(cell.statusInfo.request)} 
                    >
                        {cell.day !== null && (
                            <>
                                <span className={`text-sm ${cell.statusInfo.isPending ? 'font-semibold' : 'font-medium'}`}>
                                    {cell.day}
                                </span>
                                {cell.statusInfo.text && (
                                    <span className="text-[10px] font-bold mt-0.5 uppercase tracking-tight opacity-90">
                                        {cell.statusInfo.text}
                                    </span>
                                )}
                                {/* Indicator Dot for Pending actions */}
                                {cell.statusInfo.isPending && (
                                    <span className="absolute top-1 right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Modern Legend */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs text-slate-600">
                <LegendItem color="bg-emerald-100 border-emerald-200 text-emerald-700" label="Present" />
                <LegendItem color="bg-rose-100 border-rose-200 text-rose-700" label="Absent/Rejected" />
                <LegendItem color="bg-amber-100 border-amber-300 text-amber-800 border-dashed" label="Pending (Click to Action)" />
                <LegendItem color="bg-violet-100 border-violet-200 text-violet-700" label="Leave" />
                <LegendItem color="bg-orange-100 border-orange-200 text-orange-700" label="Holiday" />
                <LegendItem color="bg-slate-100 border-slate-200 text-slate-500" label="Weekend" />
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
        <span className={`w-3 h-3 rounded-full border ${color}`}></span>
        <span>{label}</span>
    </div>
);

const AttendanceApprovalModal = ({ isOpen, onClose, selectedUsername, onApprovalComplete }) => {
    const { user } = useAuth(); 
    const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)));
    const [attendanceData, setAttendanceData] = useState({});
    const [holidays, setHolidays] = useState({});
    const [leaveDaysSet, setLeaveDaysSet] = useState(new Set());
    const [pendingRequestsMap, setPendingRequestsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString + 'T00:00:00Z');
            return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    const fetchDataForUserAndMonth = useCallback(async (monthDate) => {
        if (!user?.userIdentifier || !selectedUsername) {
             setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
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
                    const record = {
                        ...att,
                        username: att.username || selectedUsername,
                        date: att.date || att.rowKey,
                    };
                    attMap[record.date] = record;
                    if (record.status === 'Pending') {
                        pendingMap[record.date] = record;
                    }
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

        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load calendar data.');
        } finally {
            setLoading(false);
        }
    }, [user?.userIdentifier, selectedUsername]);

    useEffect(() => {
        if (isOpen && selectedUsername) {
            const initialMonth = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1));
            setCurrentMonthDate(initialMonth);
            fetchDataForUserAndMonth(initialMonth);
        }
    }, [isOpen, selectedUsername]);

     useEffect(() => {
        if (isOpen && selectedUsername) {
             fetchDataForUserAndMonth(currentMonthDate);
        }
     }, [currentMonthDate]);

    const changeMonth = (offset) => {
        setCurrentMonthDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 1);
            return newDate;
        });
    };

    const handleDayClick = (request) => {
        if (request && request.status === 'Pending') {
            if (!request.username || !request.date) {
                setError("Internal error: Request data missing.");
                return;
            }
             const actionConfirmed = window.confirm(
                 `Request Details:\nUser: ${request.username}\nDate: ${formatDate(request.date)}\nRequested: ${request.requestedStatus}\n\nClick OK to Approve, Cancel to Reject.`
             );
            const action = actionConfirmed ? 'Approved' : 'Rejected';
             handleConfirmAction(request, action, '');
        }
    };

    const handleConfirmAction = async (req, action, comments) => {
        setActionLoading(true);
        setError('');
        try {
            const payload = {
                targetUsername: req.username, 
                attendanceDate: req.date,     
                action: action,               
                approverComments: comments,
                authenticatedUsername: user.userIdentifier
            };

            const response = await apiService.approveAttendance(payload);

            if (response.data.success) {
                await fetchDataForUserAndMonth(currentMonthDate); 
                const remainingPendingInMonth = Object.values(pendingRequestsMap).some(p => 
                    p.date !== req.date && p.status === 'Pending'
                );
                if (!remainingPendingInMonth && onApprovalComplete) {
                    onApprovalComplete(); 
                }
            } else {
                throw new Error(response.data.message);
            }
        } catch (err) {
            setError(err.message || "Error processing request.");
        } finally {
            setActionLoading(false);
        }
    };

    const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Review: ${selectedUsername || 'Unknown'}`} size="3xl">
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {error}
                </div>
            )}

            {/* Header Controls */}
            <div className="flex justify-between items-center mb-6 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <button 
                    onClick={() => changeMonth(-1)} 
                    className="p-2 bg-white text-slate-600 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-50 border border-transparent hover:border-slate-100" 
                    disabled={loading || actionLoading}
                    aria-label="Previous Month"
                >
                    <ChevronLeftIcon />
                </button>
                
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">{monthName}</h3>
                
                <button 
                    onClick={() => changeMonth(1)} 
                    className="p-2 bg-white text-slate-600 rounded-lg hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all disabled:opacity-50 border border-transparent hover:border-slate-100" 
                    disabled={loading || actionLoading}
                    aria-label="Next Month"
                >
                    <ChevronRightIcon />
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col justify-center items-center h-[28rem] text-slate-400">
                    <Spinner size="10"/>
                    <p className="mt-3 text-sm font-medium animate-pulse">Loading calendar data...</p>
                </div>
            ) : actionLoading ? (
                 <div className="flex flex-col justify-center items-center h-[28rem] text-slate-400">
                    <Spinner size="10"/>
                    <p className="mt-3 text-sm font-medium animate-pulse text-indigo-500">Processing approval...</p>
                </div>
            ) : (
                <div className="min-h-[28rem]">
                    <CalendarDisplay
                        monthDate={currentMonthDate}
                        attendanceData={attendanceData}
                        holidays={holidays}
                        leaveDaysSet={leaveDaysSet}
                        onDayClick={handleDayClick} 
                        pendingRequestsMap={pendingRequestsMap} 
                    />
                </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                <button 
                    onClick={onClose} 
                    className="px-6 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition shadow-lg hover:shadow-xl focus:ring-4 focus:ring-slate-200"
                >
                    Close Review
                </button>
            </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;