import React, { useState, useEffect } from 'react';

const AddCommentModal = ({ isOpen, onClose, onSave, job }) => {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) setComment('');
    }, [isOpen]);

    if (!isOpen || !job) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (comment.trim()) {
            onSave(job, comment.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-xl font-extrabold text-slate-800">Add Comment</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</p>
                        <p className="text-sm font-semibold text-slate-800">{job['Posting Title']}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Remarks / Comment</label>
                        <textarea
                            autoFocus
                            required
                            rows="4"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border-slate-300 rounded-xl p-3 shadow-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none"
                            placeholder="Type your comment here..."
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={!comment.trim()} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors">
                            Add Comment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCommentModal;