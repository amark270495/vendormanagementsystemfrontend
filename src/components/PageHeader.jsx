import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Reusable PageHeader Component
 * * @param {string} title - The main heading for the page
 * @param {string} description - (Optional) Subtitle below the heading
 * @param {Array} breadcrumbs - (Optional) Array of objects { label: 'String', path: '/string' }
 * @param {ReactNode} actionElement - (Optional) Button or element to render on the right side
 */
const PageHeader = ({ title, description, breadcrumbs, actionElement }) => {
    return (
        <div className="mb-8 md:flex md:items-center md:justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="min-w-0 flex-1">
                {/* Breadcrumbs Navigation */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex mb-3" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 text-sm text-slate-500">
                            <li>
                                <Link to="/home" className="hover:text-slate-800 transition-colors flex items-center">
                                    <Home className="h-4 w-4" />
                                    <span className="sr-only">Home</span>
                                </Link>
                            </li>
                            {breadcrumbs.map((item, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                    {item.path ? (
                                        <Link 
                                            to={item.path} 
                                            className="hover:text-indigo-600 transition-colors font-medium"
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-900 font-medium">
                                            {item.label}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}

                {/* Page Title & Description */}
                <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    {title}
                </h2>
                {description && (
                    <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>

            {/* Action Button Slot (Renders on the right on Desktop, bottom on Mobile) */}
            {actionElement && (
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    {actionElement}
                </div>
            )}
        </div>
    );
};

export default PageHeader;