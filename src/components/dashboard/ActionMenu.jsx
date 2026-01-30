import React from 'react';
import Dropdown from '../Dropdown';
import { 
    MoreVertical, 
    Eye, 
    Archive, 
    XCircle, 
    Trash2,
    ChevronRight
} from 'lucide-react';

const ActionMenu = ({ job, onAction }) => {
    // Helper to style the menu items consistently
    const menuItems = [
        { 
            id: 'details', 
            label: 'View Details', 
            icon: <Eye size={16} />, 
            color: 'text-slate-700' 
        },
        { 
            id: 'close', 
            label: 'Close Job', 
            icon: <XCircle size={16} />, 
            color: 'text-slate-700' 
        },
        { 
            id: 'archive', 
            label: 'Archive Job', 
            icon: <Archive size={16} />, 
            color: 'text-slate-700' 
        },
        { 
            id: 'delete', 
            label: 'Delete Job', 
            icon: <Trash2 size={16} />, 
            color: 'text-rose-600',
            hover: 'hover:bg-rose-50' 
        },
    ];

    return (
        <Dropdown 
            trigger={
                <button 
                    className="flex items-center justify-center text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 transition-all duration-200 active:scale-90"
                    aria-label="Job actions"
                >
                    <MoreVertical size={20} />
                </button>
            }
        >
            <div className="min-w-[180px] p-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 mb-1 border-b border-slate-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Job Options
                    </p>
                </div>

                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={(e) => {
                            e.preventDefault();
                            onAction(item.id, job);
                        }}
                        className={`
                            w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                            ${item.hover || 'hover:bg-slate-50'}
                            ${item.color}
                            group
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`${item.id === 'delete' ? 'text-rose-500' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </div>
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                    </button>
                ))}
            </div>
        </Dropdown>
    );
};

export default ActionMenu;