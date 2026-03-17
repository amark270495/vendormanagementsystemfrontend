export const getISTShiftDateString = () => {
    const browserNow = new Date();
    const utcTime = browserNow.getTime() + (browserNow.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (5.5 * 60 * 60 * 1000));
    
    if (istTime.getHours() < 12) {
        istTime.setDate(istTime.getDate() - 1);
    }
    
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

export const formatMsToTime = (ms) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

export const formatLogTime = (isoString) => {
    if (!isoString) return '-';
    try {
        const dateObj = new Date(isoString);
        return dateObj.toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Kolkata', 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (e) { return '-'; }
};

/**
 * BULLETPROOF TIME CALCULATION
 * RESTORED: Standard vs Extra calculation from Old Code
 */
export const calculateTotalWorkTime = (logs, shiftDateStr) => {
    if (!logs || logs.length === 0 || !shiftDateStr) 
        return { standard: "0h 0m", extra: null, activeStr: "" };

    let year, month, day;
    const parts = shiftDateStr.split('-');
    
    // Exact parsing logic from old code to handle both YYYY-MM-DD and DD-MM-YYYY
    if (parts[0].length === 4) {
        [year, month, day] = parts;
    } else {
        [day, month, year] = parts;
    }

    // EXACT Shift Bounds Construction from old code
    // Standard window: 19:00 (7 PM) to 04:00 (4 AM next day)
    const shiftStartIST = new Date(`${year}-${month}-${day}T19:00:00.000+05:30`);
    const nextDayUTC = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10) + 1));
    const nextDayStr = nextDayUTC.toISOString().split('T')[0];
    const shiftEndIST = new Date(`${nextDayStr}T04:00:00.000+05:30`);

    const sortedLogs = [...logs].sort((a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp));
    
    let standardMs = 0;
    let extraMs = 0; // Tracks "Outside Shift"
    let sessionStart = null;
    let lastHeartbeat = null;
    let activeString = "";

    /**
     * processBlock: The core logic that separates shift time from extra time
     */
    const processBlock = (start, end) => {
        const blockTotal = end - start;
        if (blockTotal <= 0) return;

        const overlapStart = start > shiftStartIST ? start : shiftStartIST;
        const overlapEnd = end < shiftEndIST ? end : shiftEndIST;

        let blockStandard = 0;
        if (overlapStart < overlapEnd) {
            blockStandard = overlapEnd - overlapStart;
        }

        // Logic restored: blockStandard is within 7PM-4AM, the rest is Extra
        standardMs += blockStandard;
        extraMs += (blockTotal - blockStandard);
    };

    const startActions = ['login', 'unlock', 'resume', 'active', 'wake', 'heartbeat', 'usage update'];
    const stopActions = ['logout', 'logoff', 'lock', 'idle', 'sleep', 'hibernate', 'shutdown', 'restartaccepted', 'shiftendenforced', 'agentcrash'];

    sortedLogs.forEach(log => {
        const act = log.actionType.toLowerCase();
        const logTime = new Date(log.eventTimestamp);
        const notes = (log.workDoneNotes || "").toLowerCase();
        
        if (act === 'heartbeat' || act.includes('usage')) lastHeartbeat = logTime;
        
        if (startActions.includes(act) && !sessionStart) {
            sessionStart = logTime;
            lastHeartbeat = logTime; 
        } else if (stopActions.includes(act) && sessionStart) {
            // Logic restored: handle unexpected shutdowns via last known heartbeat
            if (notes.includes("previous shutdown detected")) {
                if (lastHeartbeat && lastHeartbeat > sessionStart) {
                    processBlock(sessionStart, lastHeartbeat);
                }
                sessionStart = null;
            } else {
                processBlock(sessionStart, logTime);
                sessionStart = null;
            }
        }
    });

    // Handle Active Sessions or Missing Logouts
    if (sessionStart) {
        const now = new Date();
        if (lastHeartbeat && lastHeartbeat > sessionStart) {
            // Within 15 mins of last heartbeat is considered "Active Now"
            if (now - lastHeartbeat < 15 * 60000 && now < shiftEndIST) {
                processBlock(sessionStart, now);
                activeString = " (Active Now)";
            } else {
                processBlock(sessionStart, lastHeartbeat); 
                activeString = " (Missing Logout)";
            }
        } else {
            if (now < shiftEndIST) {
                 processBlock(sessionStart, now);
                 activeString = " (Active Now)";
            } else {
                 processBlock(sessionStart, shiftEndIST); 
                 activeString = " (Missing Logout)";
            }
        }
    }

    return { 
        standard: formatMsToTime(standardMs), 
        // Logic restored: Extra time only returned if > 1 minute
        extra: extraMs > 60000 ? formatMsToTime(extraMs) : null,
        activeStr: activeString 
    };
};