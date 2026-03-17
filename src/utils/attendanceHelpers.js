export const getISTShiftDateString = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (5.5 * 60 * 60 * 1000));

    if (ist.getHours() < 12) ist.setDate(ist.getDate() - 1);

    return ist.toISOString().split('T')[0];
};

export const formatMsToTime = (ms) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

export const formatLogTime = (isoString) => {
    if (!isoString) return '-';
    try {
        return new Date(isoString).toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

// 🔥 FINAL PRODUCTION-GRADE LOGIC
export const calculateTotalWorkTime = (logs, shiftDateStr) => {
    if (!logs || logs.length === 0 || !shiftDateStr) {
        return { standard: "0h 0m", extra: null, activeStr: "" };
    }

    const [year, month, day] = shiftDateStr.split('-');

    const shiftStartIST = new Date(`${year}-${month}-${day}T19:00:00.000+05:30`);
    const nextDayUTC = new Date(Date.UTC(year, month - 1, parseInt(day) + 1));
    const nextDayStr = nextDayUTC.toISOString().split('T')[0];
    const shiftEndIST = new Date(`${nextDayStr}T04:00:00.000+05:30`);

    const sortedLogs = [...logs].sort((a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp));

    let standardMs = 0;
    let extraMs = 0;
    let sessionStart = null;
    let lastHeartbeat = null;
    let activeString = "";

    const processBlock = (start, end) => {
        if (!start || !end || end <= start) return;

        const blockTotal = end - start;

        const overlapStart = start > shiftStartIST ? start : shiftStartIST;
        const overlapEnd = end < shiftEndIST ? end : shiftEndIST;

        let standard = 0;

        if (overlapStart < overlapEnd) {
            standard = overlapEnd - overlapStart;
        }

        standardMs += standard;
        extraMs += (blockTotal - standard);
    };

    const startActions = ['login', 'unlock', 'resume', 'active', 'wake', 'heartbeat', 'usage update'];
    const stopActions = ['logout', 'logoff', 'lock', 'idle', 'sleep', 'hibernate', 'shutdown', 'restartaccepted', 'shiftendenforced', 'agentcrash'];

    sortedLogs.forEach(log => {
        const act = log.actionType.toLowerCase();
        const logTime = new Date(log.eventTimestamp);
        const notes = (log.workDoneNotes || "").toLowerCase();

        if (act === 'heartbeat' || act.includes('usage')) {
            lastHeartbeat = logTime;
        }

        if (startActions.includes(act) && !sessionStart) {
            sessionStart = logTime;
            lastHeartbeat = logTime;
        } else if (stopActions.includes(act) && sessionStart) {

            if (notes.includes("previous shutdown detected")) {
                if (lastHeartbeat && lastHeartbeat > sessionStart) {
                    processBlock(sessionStart, lastHeartbeat);
                }
            } else {
                processBlock(sessionStart, logTime);
            }

            sessionStart = null;
        }
    });

    // 🔥 Handle open session
    if (sessionStart) {
        const now = new Date();

        if (lastHeartbeat && lastHeartbeat > sessionStart) {
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
        extra: extraMs > 60000 ? formatMsToTime(extraMs) : null,
        activeStr: activeString
    };
};