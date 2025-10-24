const { app } = require('@azure/functions');
const { odata } = require("@azure/data-tables"); // Import odata helper
const { EmailClient } = require("@azure/communication-email"); // Import Email client
const {
    getTableClient,
    AppScriptError,
    logError,
    logAction,
    getUserPermissions,
    getUserRole, // Import getUserRole for auth check
    TABLE_NAME_USERATTENDANCE,
    TABLE_NAME_HOLIDAYS,
    TABLE_NAME_LEAVEREQUESTS,
    TABLE_NAME_USERS,
    COMMUNICATION_SERVICES_CONNECTION_STRING,
    SENDER_EMAIL_ADDRESS,
} = require('./tableUtils');

// --- Helper: Format Email Body ---
function formatAttendanceEmail(username, displayName, month, summary, details = null) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const [year, monthNum] = month.split('-');
    const monthName = monthNames[parseInt(monthNum, 10) - 1];

    let body = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Monthly Attendance Report</title>
            <style>
                body { font-family: sans-serif; line-height: 1.5; color: #333; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                h1 { color: #4F46E5; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary-table td:first-child { font-weight: bold; width: 40%; }
                .details-table .present { color: green; }
                .details-table .absent { color: red; } /* Includes Rejected */
                .details-table .pending { color: orange; } /* Added Pending */
                .details-table .leave { color: purple; } /* Changed color */
                .details-table .weekend { color: gray; }
                .details-table .holiday { color: brown; } /* Changed color */
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Attendance Report - ${monthName} ${year}</h1>
                <p>Hello ${displayName || username},</p>
                <p>Here is your attendance summary for ${monthName} ${year}:</p>
                <table class="summary-table">
                    <tr><td>Total Days in Month</td><td>${summary.totalDays}</td></tr>
                    <tr><td>Weekends</td><td>${summary.weekends}</td></tr>
                    <tr><td>Holidays</td><td>${summary.holidays}</td></tr>
                    <tr><td>Approved Leave Days</td><td>${summary.leaveDays}</td></tr>
                    <tr><td>Total Working Days</td><td>${summary.workingDays}</td></tr>
                    <tr><td>Days Present (Approved)</td><td>${summary.presentDays}</td></tr>
                    <tr><td>Days Absent (Approved/Rejected)</td><td>${summary.absentDays}</td></tr>
                    <tr><td>Days Pending Approval</td><td>${summary.pendingDays}</td></tr>
                    <tr><td>Days Not Marked (Past Workdays)</td><td>${summary.unmarkedPastDays}</td></tr>
                </table>`;

    if (details && details.length > 0) {
        body += `<h2>Daily Details</h2>
                 <table class="details-table">
                     <thead><tr><th>Date</th><th>Status</th><th>Note</th></tr></thead>
                     <tbody>`;
        details.forEach(day => {
            let statusClass = '';
            let displayStatus = day.status;
            if(day.status === 'Pending') {
                 statusClass = 'pending';
                 displayStatus = `Pending (${day.requestedStatus || 'N/A'})`;
            } else if (day.status === 'Present') statusClass = 'present';
            else if (day.status === 'Absent' || day.status === 'Rejected') statusClass = 'absent';
            else if (day.status === 'On Leave') statusClass = 'leave';
            else if (day.status === 'Weekend') statusClass = 'weekend';
            else if (day.status === 'Holiday') statusClass = 'holiday';

            body += `<tr>
                        <td>${day.date}</td>
                        <td class="${statusClass}">${displayStatus}</td>
                        <td>${day.holiday ? `Holiday: ${day.holiday}` : ''}</td>
                     </tr>`;
        });
        body += `</tbody></table>`;
    }

    body += `<p>Regards,<br>VMS Portal</p></div></body></html>`;
    return body;
}

// --- Helper: Send Email ---
async function sendEmail(context, toEmail, subject, htmlBody) {
    if (!COMMUNICATION_SERVICES_CONNECTION_STRING || !SENDER_EMAIL_ADDRESS) {
        context.log.warn(`Email not sent to ${toEmail}: Email service connection string or sender address not configured.`);
        throw new AppScriptError("Email service is not configured on the server.", "EmailConfigError");
    }

    const emailClient = new EmailClient(COMMUNICATION_SERVICES_CONNECTION_STRING);
    const message = {
        senderAddress: SENDER_EMAIL_ADDRESS,
        content: { subject: subject, html: htmlBody },
        recipients: { to: [{ address: toEmail }] }
    };

    try {
        const poller = await emailClient.beginSend(message);
        const result = await poller.pollUntilDone();
        if (result.status?.toLowerCase() !== "succeeded") {
            throw new Error(`Email sending failed for ${toEmail} with status: ${result.status}, error: ${result.error?.message}`);
        }
        context.log(`Email sent successfully to ${toEmail}`);
        return true;
    } catch (error) {
        await logError(context, error, "sendEmail (calculateMonthlyAttendance)", { toEmail, subject });
        throw new AppScriptError(`Failed to send email: ${error.message}`, "EmailSendError", { originalError: error });
    }
}

// --- Helper: Calculation Logic ---
async function calculateUserAttendance(context, targetUsername, month) {
    const [year, monthNumStr] = month.split('-');
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(monthNumStr, 10);

    const attendanceClient = getTableClient(TABLE_NAME_USERATTENDANCE);
    const holidayClient = getTableClient(TABLE_NAME_HOLIDAYS);
    const leaveClient = getTableClient(TABLE_NAME_LEAVEREQUESTS);

    // --- 1. Fetch Attendance Records ---
    const attendanceFilter = odata`PartitionKey eq ${targetUsername} and date ge '${year}-${monthNumStr}-01' and date le '${year}-${monthNumStr}-31'`;
    const attendanceMap = new Map();
    const attendanceIterator = attendanceClient.listEntities({ queryOptions: { filter: attendanceFilter } });
    for await (const entity of attendanceIterator) {
        attendanceMap.set(entity.dateKey, { status: entity.status, requestedStatus: entity.requestedStatus });
    }

    // --- 2. Fetch Holidays ---
    const holidayFilter = odata`PartitionKey eq 'Holiday' and date ge '${year}-${monthNumStr}-01' and date le '${year}-${monthNumStr}-31'`;
    const holidayMap = new Map();
    const holidayIterator = holidayClient.listEntities({ queryOptions: { filter: holidayFilter } });
    for await (const entity of holidayIterator) {
        holidayMap.set(entity.rowKey, entity.description);
    }

    // --- 3. Fetch Approved Leave Requests ---
    const monthStartDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const monthEndDate = new Date(Date.UTC(yearNum, monthNum, 0));
    const monthStartISO = monthStartDate.toISOString().split('T')[0];
    const monthEndISO = monthEndDate.toISOString().split('T')[0];
    const leaveFilter = odata`PartitionKey eq ${targetUsername} and status eq 'Approved' and startDate le ${monthEndISO} and endDate ge ${monthStartISO}`;
    const leaveDaysSet = new Set();
    const leaveIterator = leaveClient.listEntities({ queryOptions: { filter: leaveFilter } });
    for await (const entity of leaveIterator) {
        const leaveStart = new Date(Date.UTC(parseInt(entity.startDate.substring(0, 4)), parseInt(entity.startDate.substring(5, 7)) - 1, parseInt(entity.startDate.substring(8, 10))));
        const leaveEnd = new Date(Date.UTC(parseInt(entity.endDate.substring(0, 4)), parseInt(entity.endDate.substring(5, 7)) - 1, parseInt(entity.endDate.substring(8, 10))));
        let currentLeaveDay = new Date(leaveStart);
        while (currentLeaveDay <= leaveEnd) {
            if (currentLeaveDay >= monthStartDate && currentLeaveDay <= monthEndDate) {
                 const dateString = currentLeaveDay.toISOString().split('T')[0];
                 leaveDaysSet.add(dateString);
            }
            currentLeaveDay.setUTCDate(currentLeaveDay.getUTCDate() + 1);
        }
    }

    // --- 4. Calculate Summary ---
    const daysInMonth = monthEndDate.getUTCDate();
    let summary = { totalDays: daysInMonth, weekends: 0, holidays: 0, leaveDays: 0, workingDays: 0, presentDays: 0, absentDays: 0, pendingDays: 0, unmarkedPastDays: 0 };
    const details = [];
    const today = new Date();
    today.setUTCHours(0,0,0,0);

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(Date.UTC(yearNum, monthNum - 1, day));
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getUTCDay();
        let dayStatus = 'Unmarked', isWorkingDay = true, holidayDesc = null, requestedStatus = null;

        if (leaveDaysSet.has(dateStr)) {
            dayStatus = 'On Leave'; isWorkingDay = false; summary.leaveDays++;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayStatus = 'Weekend'; isWorkingDay = false; summary.weekends++;
        } else if (holidayMap.has(dateStr)) {
            holidayDesc = holidayMap.get(dateStr); dayStatus = 'Holiday'; isWorkingDay = false; summary.holidays++;
        }

        if (isWorkingDay) {
            summary.workingDays++;
            const attendanceRecord = attendanceMap.get(dateStr);
            if (attendanceRecord) {
                dayStatus = attendanceRecord.status;
                requestedStatus = attendanceRecord.requestedStatus;
                if (dayStatus === 'Present') summary.presentDays++;
                else if (dayStatus === 'Absent' || dayStatus === 'Rejected') summary.absentDays++;
                else if (dayStatus === 'Pending') summary.pendingDays++;
            } else if (currentDate < today) {
                dayStatus = 'Absent';
                summary.absentDays++;
                summary.unmarkedPastDays++;
            } else {
                 dayStatus = 'Future/Unmarked';
            }
        }
        details.push({ date: dateStr, status: dayStatus, requestedStatus: requestedStatus, isWorkingDay, holiday: holidayDesc });
    }
    return { summary, details };
}

// *** MODIFIED: Simplified to GET only ***
app.http('calculateMonthlyAttendance', {
    methods: ['GET'], // Only allow GET
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`calculateMonthlyAttendance HTTP trigger (GET) processed a request.`);

        const authenticatedUsername = request.query.get('authenticatedUsername');
        const targetUsername = request.query.get('username'); // User whose attendance is being calculated
        const month = request.query.get('month'); // Expecting format YYYY-MM
        const includeDetails = request.query.get('details') === 'true';
        const sendEmail = request.query.get('sendEmail') === 'true'; // Check for sendEmail flag

        // --- Validation ---
        if (!authenticatedUsername || !month || !/^\d{4}-\d{2}$/.test(month) || !targetUsername) { // Target username is now required
             await logError(context, new AppScriptError("Missing or invalid parameters.", "ValidationError"), "calculateMonthlyAttendance", { authenticatedUsername, targetUsername, month });
            return { status: 400, jsonBody: { success: false, message: "Missing or invalid parameters: authenticatedUsername, username, and month (YYYY-MM) are required." } };
        }

        // --- Authorization ---
        let permissions;
        let targetUserEntity; // To store user's display name
        try {
            const authUserRole = await getUserRole(context, authenticatedUsername);
            if (!authUserRole) {
                 throw new AppScriptError("Authentication failed or user not found.", "AuthenticationError", { statusCode: 401 });
            }
            permissions = await getUserPermissions(context, authenticatedUsername);
            
            const canViewOwn = authenticatedUsername === targetUsername;
            // Admin permission (using canApproveAttendance)
            const isAdminAction = permissions.canApproveAttendance;

            if (!canViewOwn && !isAdminAction) {
                throw new AppScriptError("Permission denied.", "AuthorizationError", { statusCode: 403 });
            }
            // If sending email, must be admin
            if (sendEmail && !isAdminAction) {
                 throw new AppScriptError("Permission denied to send monthly reports.", "AuthorizationError", { statusCode: 403 });
            }

            // Fetch target user's display name
            try {
                const usersClient = getTableClient(TABLE_NAME_USERS);
                targetUserEntity = await usersClient.getEntity("User", targetUsername);
            } catch (userFetchErr) {
                 if (userFetchErr.statusCode === 404) {
                     throw new AppScriptError("Target user not found.", "NotFoundError", { statusCode: 404 });
                 }
                 throw userFetchErr;
            }

        } catch (permError) {
             await logError(context, permError, "calculateMonthlyAttendance", { authenticatedUsername, targetUsername, method: 'GET' });
             return { status: permError.statusCode || 500, jsonBody: { success: false, message: permError.message || "Server error checking permissions." } };
        }

        // --- Logic ---
        try {
            context.log(`Fetching attendance report for user ${targetUsername}, month ${month}.`);
            const { summary, details } = await calculateUserAttendance(context, targetUsername, month);
            
            const responseBody = { 
                success: true, 
                summary,
                displayName: targetUserEntity.displayName || targetUsername 
            };
            if (includeDetails) {
                responseBody.details = details;
            }

            // --- Send Email if flagged ---
            if (sendEmail) {
                context.log(`Sending email report to ${targetUsername}...`);
                try {
                    const displayName = targetUserEntity.displayName || targetUsername;
                    const emailSubject = `Monthly Attendance Report - ${month} for ${displayName}`;
                    const emailBody = formatAttendanceEmail(targetUsername, displayName, month, summary, details);
                    await sendEmail(context, targetUsername, emailSubject, emailBody); // Assuming targetUsername is the email
                    
                    responseBody.emailStatus = `Email sent successfully to ${targetUsername}.`;
                    await logAction(context, authenticatedUsername, 'Send Monthly Report (Single)', `User: ${targetUsername}, Month: ${month}`, 'Email Service');
                } catch (emailError) {
                     // Log the error but still return the calculated data
                     await logError(context, emailError, "calculateMonthlyAttendance (EmailSend)", { targetUsername, month });
                     responseBody.emailStatus = `Report generated, but failed to send email: ${emailError.message}`;
                }
            }

            return { status: 200, jsonBody: responseBody };

        } catch (error) {
            await logError(context, error, "calculateMonthlyAttendance", { authenticatedUsername, targetUsername, month, sendEmail, method: 'GET', errorMessage: error.message });
            return { status: error.statusCode || 500, jsonBody: { success: false, message: `Failed operation: ${error.message}` } };
        }
    }
});