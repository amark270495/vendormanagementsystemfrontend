import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

const POSTING_FROM_OPTIONS = [
    'State Of Texas', 'State Of Michigan', 'State of North Carolina', 
    'State Of New Jersey', 'State Of Georgia', 'State Of Iowa', 
    'State Of Connecticut', 'State Of Virginia', 'State Of Indiana', 
    'Virtusa', 'Deloitte', 'Other'
];

const JobPostingFormPage = ({ onFormSubmit }) => {
    const { user } = useAuth();
    const { canAddPosting } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false); // Separated loading state for the AI
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rawText, setRawText] = useState('');

    const postingFromOptions = useMemo(() => POSTING_FROM_OPTIONS, []);

    const formFields = useMemo(() => [
        { name: 'Posting ID', id: 'postingId', type: 'text', required: true, half: true },
        { name: 'Posting Title', id: 'postingTitle', type: 'text', required: true, half: true },
        { name: 'Posting Date', id: 'postingDate', type: 'date', required: true, half: true },
        { name: 'Last Submission Date', id: 'lastSubmissionDate', type: 'date', required: true, half: true },
        { name: 'Max Submissions', id: 'maxSubmissions', type: 'number', required: true, half: true },
        { name: 'Max C2C Rate', id: 'maxC2CRate', type: 'text', required: true, half: true },
        { name: 'Client Name', id: 'clientName', type: 'text', required: true, half: true },
        { name: 'Company Name', id: 'companyName', type: 'select', required: true, options: ['Eclat Solutions LLC', 'Taproot Solutions INC', 'Rent Excel', 'TSI - BDM Openings'], half: true },
        { name: 'Posting From', id: 'postingFrom', type: 'select', required: true, options: postingFromOptions, half: true },
        { name: 'Work Location', id: 'workLocation', type: 'text', required: true, half: true },
        { name: 'Work Position Type', id: 'workPositionType', type: 'select', required: true, options: ['Hybrid', 'Remote', 'Onsite', 'Telework'], half: true },
        { name: 'Required Skill Set', id: 'requiredSkillSet', type: 'textarea', required: true, full: true },
        { name: 'Any Required Certificates', id: 'anyRequiredCertificates', type: 'textarea', full: true },
    ], [postingFromOptions]);

    const handleParseText = async () => {
        if (!rawText) return;
        
        setIsParsing(true);
        setError('');
        setSuccess('');

        try {
            // Call the backend API we just created
            const response = await apiService.parseJobDescriptionUsingAI(rawText, user.userIdentifier);
            
            if (response.data.success) {
                let parsedData = response.data.data;
                
                // Auto-detect "Posting From" based on the AI's returned Client Name
                if (parsedData['Client Name']) {
                    const clientName = parsedData['Client Name'].toLowerCase();
                    const matchedOption = postingFromOptions.find(option => 
                        clientName.includes(option.toLowerCase().replace('state of ', ''))
                    );
                    if (matchedOption) {
                        parsedData['Posting From'] = matchedOption;
                    }
                }
                
                // Set today's date automatically
                parsedData['Posting Date'] = new Date().toISOString().split('T')[0];

                setFormData(prev => ({ ...prev, ...parsedData }));
                setSuccess("Job description parsed successfully!");
            } else {
                setError(response.data.message || "Failed to parse job description.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error communicating with AI parser endpoint.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canAddPosting) {
            return setError("You do not have permission to add new job postings.");
        }

        const payloadToSubmit = { ...formData };
        if (payloadToSubmit['Posting From'] === 'Other') {
            payloadToSubmit['Posting From'] = payloadToSubmit['Client Name'] || '';
        }

        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await apiService.processJobPosting(payloadToSubmit, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({}); 
                setRawText(''); 
                if (onFormSubmit) {
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Job Posting</h1>
                <p className="mt-1 text-gray-600">Fill out the details below to create a new job entry.</p>
            </div>

            {canAddPosting && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 md:p-8 rounded-xl shadow-sm border border-indigo-100 space-y-4 relative">
                    <h2 className="text-xl font-semibold text-indigo-900 flex items-center gap-2">
                        ✨ Parse with Gemini AI
                    </h2>
                    <p className="text-sm text-indigo-700">
                        Paste the full job description. The AI will instantly read and extract all required fields, skills, and certifications.
                    </p>
                    <textarea
                        rows="8"
                        className="mt-1 block w-full border border-indigo-200 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="Paste full job description here..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        disabled={isParsing}
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleParseText}
                            disabled={isParsing || !rawText.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center min-w-[160px] transition-colors"
                        >
                            {isParsing ? <Spinner size="5" color="text-white" /> : 'Parse with AI'}
                        </button>
                    </div>
                </div>
            )}

            {!canAddPosting && !loading && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to add new job postings.</p>
                </div>
            )}
            
            {canAddPosting && (
                <form onSubmit={handleSubmit}>
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                        {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                        {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            {formFields.map(field => (
                                <div key={field.id} className={field.full ? 'md:col-span-2' : ''}>
                                    <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                                        {field.name} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea name={field.name} id={field.id} value={formData[field.name] || ''} onChange={handleChange} required={field.required} rows={field.name === 'Required Skill Set' ? 8 : 4} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                                    ) : field.type === 'select' ? (
                                        <select name={field.name} id={field.id} value={formData[field.name] || ''} onChange={handleChange} required={field.required} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                            <option value="">Select an option</option>
                                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input type={field.type} name={field.name} id={field.id} value={formData[field.name] || ''} onChange={handleChange} required={field.required} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-green-400" disabled={loading || !!success}>
                            {loading ? <Spinner size="6" /> : 'Submit Job Posting'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default JobPostingFormPage;