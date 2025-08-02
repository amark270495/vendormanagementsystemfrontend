/**
 * Formats an ISO date string to a more readable MM/DD/YYYY format.
 * @param {string} isoString - The date string to format.
 * @returns {string} The formatted date or the original string if invalid.
 */
export const formatDate = (isoString) => {
    if (!isoString || isoString === 'Need To Update') return isoString;
    try {
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? isoString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return isoString;
    }
};

/**
 * Determines the CSS class for a deadline based on its proximity to the current date.
 * @param {string} dateString - The deadline date string.
 * @returns {string} Tailwind CSS classes for color and font weight.
 */
export const getDeadlineClass = (dateString) => {
    if (!dateString || dateString === 'Need To Update') return '';
    
    let parsableDateString = dateString;
    // Regex to match MM/DD/YY or MM/DD/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
    const match = dateString.match(dateRegex);

    if (match) {
        const [, month, day, year] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        parsableDateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const deadline = new Date(parsableDateString);
    if (isNaN(deadline.getTime())) {
        console.warn("Invalid date format for deadline:", dateString);
        return ''; // Return empty if the date is invalid
    }

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Set hours to 0 for accurate date-only comparison.
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (deadline < today) return 'text-red-600 font-bold'; // Past deadline
    if (deadline <= sevenDaysFromNow) return 'text-orange-500 font-semibold'; // Deadline within 7 days
    return 'text-green-600'; // Deadline more than 7 days away
};