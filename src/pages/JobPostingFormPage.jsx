import React, { useState, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { usePermissions } from './hooks/usePermissions';
import { apiService } from './api/apiService';
import Spinner from './components/Spinner';

const JobPostingFormPage = ({ onFormSubmit }) => {
    const { user } = useAuth();
    const { canAddPosting } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [rawText, setRawText] = useState('');

    const postingFromOptions = ['State Of Texas', 'State Of Michigan', 'State of North Carolina', 'State Of New Jersey', 'State Of Georgia', 'State Of Iowa', 'State Of Connecticut', 'State Of Virginia', 'State Of Indiana', 'Virtusa', 'Deloitte'];

    const formFields = useMemo(() => [
        { name: 'Posting ID', id: 'postingId', type: 'text', required: true, half: true },
        { name: 'Posting Title', id: 'postingTitle', type: 'text', required: true, half: true },
        { name: 'Posting Date', id: 'postingDate', type: 'date', required: true, half: true },
        { name: 'Last Submission Date', id: 'lastSubmissionDate', type: 'date', required: true, half: true },
        { name: 'Max Submissions', id: 'maxSubmissions', type: 'number', required: true, half: true },
        { name: 'Max C2C Rate', id: 'maxC2CRate', type: 'text', required: true, half: true },
        { name: 'Client Name', id: 'clientName', type: 'text', required: true, half: true },
        { name: 'Company Name', id: 'companyName', type: 'select', required: true, options: ['Eclat Solutions LLC', 'Taproot Solutions INC'], half: true },
        { name: 'Posting From', id: 'postingFrom', type: 'select', required: true, options: postingFromOptions, half: true },
        { name: 'Work Location', id: 'workLocation', type: 'text', required: true, half: true },
        { name: 'Work Position Type', id: 'workPositionType', type: 'select', required: true, options: ['Hybrid', 'Remote', 'Onsite'], half: true },
        { name: 'Required Skill Set', id: 'requiredSkillSet', type: 'textarea', required: true, full: true },
        { name: 'Any Required Certificates', id: 'anyRequiredCertificates', type: 'textarea', full: true },
    ], [postingFromOptions]); // Added postingFromOptions as dependency

    const allSkills = [
        'Java', 'SQL', 'P-SQL', 'Git', 'Agile', 'Scrum', 'API testing', 'Postman', 'Rest Client', 
        'Playwright', 'Selenium', 'Cypress', 'Gherkin', 'JMeter', 'LoadRunner', 'Oracle', 
        'SQL Server', 'Azure DevOps', 'ADA Compliance', 'AccVerify', 'JAWS', 'SADLC', 
        'Mobile App testing', 'iOS', 'Android', 'Eclipse', 'Selenium WebDriver', 'TestNG', 
        'RESTAssured', 'APIRequestContext'
    ];

    const handleParseText = () => {
        let text = rawText;
        let parsedData = {};

        const extract = (regex) => (text.match(regex) || [])[1]?.trim() || '';

        parsedData['Posting ID'] = extract(/(?:Job Id:|\()\s*(\d{6,})[)\s]/i);
        parsedData['Posting Title'] = extract(/(.+?)\s*\(\d{6,}\)/i);
        parsedData['Client Name'] = extract(/State Name:\s*(.+)/i);
        parsedData['Max Submissions'] = extract(/Max Submittals by Vendor:\s*(\d+)/i);
        parsedData['Work Location'] = extract(/Worksite Address:\s*(.+)/i);

        const workArrangement = extract(/Work Arrangement:\s*(Hybrid|Remote|Onsite)/i);
        if (workArrangement) {
            parsedData['Work Position Type'] = workArrangement;
        }

        const rateMatch = text.match(/(?:C 2 C|C2C)\s*(\d+(\.\d{1,2})?)/i);
        if (rateMatch) {
            parsedData['Max C2C Rate'] = `$${rateMatch[1]}/hr`;
        }

        const dateMatch = text.match(/Last Date For Submission\s*(\d{2}-\d{2}-\d{4})/i);
        if (dateMatch) {
            try {
                const [m, d, y] = dateMatch[1].split('-');
                parsedData['Last Submission Date'] = `${y}-${m}-${d}`;
            } catch (e) {
                console.error("Could not parse date: ", dateMatch[1]);
            }
        }

        if (parsedData['Client Name']) {
            const clientName = parsedData['Client Name'].toLowerCase();
            const matchedOption = postingFromOptions.find(option => 
                clientName.includes(option.toLowerCase())
            );
            if (matchedOption) {
                parsedData['Posting From'] = matchedOption;
            }
        }

        const mustHaveText = (text.split(/Must Have/i)[1] || '').split(/Nice to Have/i)[0] || '';
        const niceToHaveText = (text.split(/Nice to Have/i)[1] || '');

        const findSkills = (skillText, skillList) => {
            const found = new Set();
            if (!skillText) return [];
            for (const skill of skillList) {
                const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'gi');
                if (skillText.match(regex)) {
                    found.add(skill);
                }
            }
            return [...found];
        };

        const mustHaveSkills = findSkills(mustHaveText, allSkills).join(', ');
        const niceToHaveSkills = findSkills(niceToHaveText, allSkills).join(', ');

        let skillSetString = '';
        if (mustHaveSkills.length > 0) {
            skillSetString += `> **Must Have:** ${mustHaveSkills}`;
        }
        if (niceToHaveSkills.length > 0) {
            skillSetString += `\n\n> **Nice to Have:** ${niceToHaveSkills}`;
        }
        if (skillSetString) {
            parsedData['Required Skill Set'] = skillSetString;
        }

        parsedData['Posting Date'] = new Date().toISOString().split('T')[0];

        setFormData(prev => ({ ...prev, ...parsedData }));
    };

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
            // Using the REAL apiService
            const response = await apiService.processJobPosting(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({}); // Clear the form
                setRawText(''); // Clear the parser textarea
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

            {/* --- Job Description Parser --- */}
            {canAddPosting && (
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Paste to Parse</h2>
                    <p className="text-sm text-gray-600">
                        Paste the full job description text below and click "Parse" to automatically fill the form fields.
                    </p>
                    <textarea
                        rows="8"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Paste full job description here..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleParseText}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-5 rounded-lg"
                        >
                            Parse & Fill Form
                        </button>
                    </div>
                </div>
            )}
            {/* --- END: Job Description Parser --- */}


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
                                        <textarea name={field.name} id={field.id} value={formData[field.name] || ''} onChange={handleChange} required={field.required} rows="4" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
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
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-indigo-400" disabled={loading || !!success}>
                            {loading ? <Spinner size="6" /> : 'Submit Job Posting'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default JobPostingFormPage;