import React from 'react';

/**
 * A simple, reusable spinner component for indicating loading states.
 * It uses Tailwind CSS for animation and styling.
 * @param {object} props - The component props.
 * @param {string} [props.size='8'] - The size of the spinner (maps to Tailwind's h- and w- classes).
 */
const Spinner = ({ size = '8' }) => {
    return (
        <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-indigo-600`}></div>
    );
};

export default Spinner;