import React from 'react';

/**
 * Reusable StatCard Component for Dashboards
 * * @param {string} title - The title of the stat (e.g., "Total Employees")
 * @param {string|number} value - The main large number/value to display
 * @param {ReactNode} icon - (Optional) An icon element, ideally from lucide-react
 * @param {Object} trend - (Optional) { value: '5%', label: 'vs last month', isPositive: true }
 * @param {Function} onClick - (Optional) Makes the card clickable with hover effects
 */
const StatCard = ({ title, value, icon, trend, onClick }) => {
    const isClickable = !!onClick;

    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col ${
                isClickable 
                    ? 'cursor-pointer hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200 ease-in-out' 
                    : ''
            }`}
        >
            {/* Header: Title and Icon */}
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500 line-clamp-1">
                    {title}
                </h3>
                {icon && (
                    <div className="p-2.5 bg-indigo-50/50 text-indigo-600 rounded-lg shrink-0">
                        {icon}
                    </div>
                )}
            </div>

            {/* Body: Value and Trend */}
            <div className="mt-auto">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </span>
                    
                    {trend && (
                        <span className={`text-sm font-semibold flex items-center ${
                            trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}
                        </span>
                    )}
                </div>
                
                {/* Optional Trend Context Label */}
                {trend?.label && (
                    <p className="text-xs font-medium text-slate-400 mt-1">
                        {trend.label}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;