import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';
import Spinner from '../Spinner';
import Modal from '../Modal';

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

        // 1. Check Leave
        if (leaveDaysSet.has(dateKey)) return { status: 'On Leave', text: 'L', color: 'bg-purple-100 text-purple-700 border-purple-200' };
        
        // 2. Check Holiday (Higher priority than absent/weekend)
        if (holidays[dateKey]) return { status: 'Holiday', text: 'H', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', description: holidays[dateKey] };

        // 3. Check Weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) return { status: 'Weekend', text: 'W', color: 'bg-gray-100 text-gray-500 border-gray-200' };

        const attendanceRecord = attendanceData[dateKey];
        
        // 4. Check Pending Requests
        if (attendanceRecord && attendanceRecord.status === 'Pending') {
            const requestedText = attendanceRecord.requestedStatus === 'Present' ? 'P?' : 'A?';
            const requestObj = pendingRequestsMap[dateKey] || {};
            return {
                status: 'Pending',
                text: requestedText,
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:ring-2 hover:ring-yellow-400 cursor-pointer',
                description: `Pending ${attendanceRecord.requestedStatus}`,
                isPending: true,
                request: requestObj 
            };
        }
        
        // 5. Check Present/Absent records
        if (attendanceRecord) {
             if (attendanceRecord.status === 'Present') return { status: 'Present', text: 'P', color: 'bg-green-100 text-green-700 border-green-200' };
             if (attendanceRecord.status === 'Absent' || attendanceRecord.status === 'Rejected') return { status: attendanceRecord.status, text: 'A', color: 'bg-red-100 text-red-700 border-red-200' };
        }

        // 6. Unmarked Past Days (Only if NOT a holiday or weekend, which we checked above)
        if (date < today) return { status: 'Absent (Unmarked)', text: 'A', color: 'bg-red-50 text-red-500 border-red-100 italic' };

        return { status: 'Future', text: '', color: 'bg-white border-gray-200' };
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
        <>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarGrid.flat().map((cell, index) => (
                    <div
                        key={index}
                        className={`h-16 flex flex-col items-center justify-center border rounded text-center ${cell.statusInfo.color || 'bg-gray-50 border-gray-100'} ${cell.day === null ? 'invisible' : ''}`}
                        title={cell.statusInfo.description || cell.statusInfo.status}
                        onClick={() => cell.statusInfo.isPending && onDayClick(cell.statusInfo.request)} 
                    >
                        <span className="text-sm">{cell.day}</span>
                        {cell.statusInfo.text && <span className="text-xs font-bold mt-1">{cell.statusInfo.text}</span>}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-100 mr-1 border border-green-200"></span> P</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-100 mr-1 border border-red-200"></span> A/Rejected</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span> P?/A? (Pending)</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-100 mr-1 border border-purple-200"></span> L</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-100 mr-1 border border-gray-200"></span> W</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-100 mr-1 border border-yellow-200"></span> H</span>
                 <span className="flex items-center ml-auto"><span className="w-3 h-3 rounded-full bg-red-50 mr-1 border border-red-100"></span> A (Unmarked)</span>
            </div>
        </>
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance: ${selectedUsername || '...'}`} size="3xl">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-shake">{error}</div>}

            <div className="flex justify-between items-center mb-4 px-1">
                <button onClick={() => changeMonth(-1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium shadow-sm" disabled={loading || actionLoading}>&lt; Prev</button>
                <h3 className="text-xl font-semibold text-gray-800">{monthName}</h3>
                <button onClick={() => changeMonth(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium shadow-sm" disabled={loading || actionLoading}>Next &gt;</button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spinner size="10"/></div>
            ) : actionLoading ? (
                 <div className="flex justify-center items-center h-64"><Spinner size="10"/><p className="ml-3 text-gray-600">Processing...</p></div>
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

             <div className="mt-6 pt-4 border-t flex justify-end">
                <button onClick={onClose} className="px-5 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition shadow-sm">
                    Close
                </button>
             </div>
        </Modal>
    );
};

export default AttendanceApprovalModal;