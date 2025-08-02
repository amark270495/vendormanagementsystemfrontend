import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

const JobPostingFormPage = ({ onFormSubmit }) => {
    const { user } = useAuth();
    const { canAddPosting } = usePermissions();
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const postingFromOptions = ['State Of Texas', 'State Of Michigan', 'State of North Carolina', 'State Of New Jersey', 'State Of Georgia', 'State Of Iowa', 'State Of Connecticut', 'State Of Virginia', 'State Of Indiana', 'Virtusa', 'Deloitte'];
    
    // useMemo ensures the formFields array is not recreated on every render.
    const formFields = useMemo(() => [
        { name: 'Posting ID', type: 'text', required: true },
        { name: 'Posting Title', type: 'text', required: true },
        { name: 'Posting Date', type: 'date', required: true },
        { name: 'Last Submission Date', type: 'date', required: true },
        { name: 'Max Submissions', type: 'number', required: true },
        { name: 'Max C2C Rate', type: 'text', required: true },
        { name: 'Client Name', type: 'text', required: true },
        { name: 'Company Name', type: 'select', required: true, options: ['Eclat Solutions LLC', 'Taproot Solutions INC'] },
        { name: 'Posting From', type: 'select', required: true, options: postingFromOptions },
        { name: 'Work Location', type: 'text', required: true },
        { name: 'Work Position Type', type: 'select', required: true, options: ['Hybrid', 'Remote', 'Onsite'] },
        { name: 'Required Skill Set', type: 'textarea', required: true },
        { name: 'Any Required Certificates', type: 'textarea' },
    ], []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canAddPosting) {
            return setError("You do not have permission to add new job postings.");
        }
        
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await apiService.processJobPosting(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({}); // Clear the form on success
                if (onFormSubmit) {
                    // This callback will navigate the user away after successful submission.
                    setTimeout(() => onFormSubmit(), 2000);
                }
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Add New Job Posting</h1>
            <div className="bg-white p-8 rounded-lg shadow-lg">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formFields.map(field => (
                        <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700">
                                {field.name} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.required} rows="4" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
                            ) : field.type === 'select' ? (
                                <select name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.required} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                    <option value="">Select an option</option>
                                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input type={field.type} name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.required} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            )}
                        </div>
                    ))}
                    <div className="md:col-span-2 flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center w-36 h-10" disabled={loading || success}>
                            {loading ? <Spinner size="5" /> : 'Submit Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobPostingFormPage;