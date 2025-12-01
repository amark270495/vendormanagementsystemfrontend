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
    ], [postingFromOptions]);

    // --- NEW: Heuristic Skill Parser ---

    // 1. A small list of common lowercase/simple skills to explicitly look for
    const CORE_SKILLS = new Set([
        'sql', 'p-sql', 'pl/sql', 'git', 'agile', 'scrum', 'java', 'ios', 'android',
        'oracle', 'medicaid', 'pems', 'toad', 'api', 'saas'
    ]);

    // 2. A list of common English/fluff words to ignore
    const SKILL_BLOCK_LIST = new Set([
        'Description', 'Services', 'Required', 'Desired', 'Experience', 'Years', 'Client',
        'State', 'Vendor', 'Project', 'Management', 'Process', 'System', 'Systems', 'Software',
        'Applications', 'Development', 'Skills', 'Skillset', 'Skill', 'Sets', 'Test', 'Testing',
        'Analyst', 'Analysis', 'Business', 'Support', 'Address', 'Submission', 'Submittals',
        'Date', 'Name', 'Title', 'Work', 'Level', 'Category', 'Full', 'Time', 'Rate', 'Info',
        'Arrangement', 'Location', 'Interview', 'Type', 'Phone', 'Through', 'Microsoft', 'Teams',
        'Max', 'Dead', 'Line', 'Commission', 'Candidate', 'Candidates', 'General', 'Qualifications',
        'Document', 'Products', 'Hire', 'Property', 'Texas', 'May', 'Include', 'Pre-selection',
        'Requirements', 'Potential', 'Vendors', 'Their', 'Submit', 'Satisfy', 'Criminal',
        'Background', 'Checks', 'Authorized', 'Law', 'Will', 'Pay', 'Fees', 'Interviews',
        'Discussions', 'Which', 'Occur', 'During', 'Selecting', 'Reviews', 'Analyzes',
        'Evaluates', 'User', 'Needs', 'Formulates', 'Parallel', 'Overall', 'Strategies',
        'Experienced', 'Reengineering', 'Identifying', 'New', 'Technology', 'Problems', 'Make',
        'More', 'Effective', 'Familiar', 'Industry', 'Standard', 'Mapping', 'Prepares',
        'Solution', 'Options', 'Risk', 'Identification', 'Financial', 'Analyses', 'Such',
        'Cost/Benefit', 'Roi', 'Buy/Build', 'Etc', 'Writes', 'Detailed', 'Functions',
        'Steps', 'Modify', 'Computer', 'Programs', 'Automation', 'Unit', 'Within', 'Medicaid',
        'Chip', 'Department', 'Oversees', 'Partnership', 'Tmhp', 'Related', 'Activities',
        'Provides', 'Oversight', 'Ltc', 'Program', 'Supports', 'Providers', 'Delivered',
        'Individuals', 'Modifications', 'Updates', 'Encounter', 'Data', 'Mco', 'File',
        'Coordination', 'Needed', 'Legislatively', 'Approved', 'Provider', 'Enrollment',
        'Pems', 'Centralized', 'Electronic', 'Method', 'Non-medicaid', 'Interested', 'Enrolling',
        'Single', 'Web', 'Portal', 'Accepted', 'Processed', 'Entity', 'Based', 'National',
        'Identifier', 'Npi', 'Hhsc', 'Would', 'Like', 'Make', 'Significant', 'Changes',
        'Improve', 'Functionality', 'Worker', 'Will', 'Serve', 'Owner', 'Internal', 'Units',
        'Technical', 'Sprint', 'Teams', 'Users', 'Provide', 'Subject', 'Matter', 'Expertise',
        'Perform', 'Critical', 'Ensure', 'Gathered', 'Meet', 'Functional', 'Assist',
        'Creating', 'Maintaining', 'Prioritized', 'Healthy', 'Backlog', 'Directed',
        'Legislative', 'Mandate', 'Responsible', 'Delivering', 'Quality', 'Meet', 'State\'s',
        'Desired', 'Operational', 'Considerable', 'Latitude', 'Use', 'Judgement',
        'Successful', 'Completion', 'Assigned', 'Tasks', 'Required', 'Multi-task',
        'Analyze', 'Priorities', 'Communicate', 'Clearly', 'Set', 'Expectations', 'Phases',
        'Communicating', 'Multiple', 'Internal', 'External', 'Stakeholders', 'Including',
        'Program', 'Staff', 'Contracted', 'Vendor', 'Resources', 'Participate', 'Meetings',
        'Track', 'Deliverables', 'Schedules', 'Alert', 'Any', 'Issues', 'Impact',
        'Following', 'Policies', 'Procedures', 'Determine', 'Impact', 'Areas',
        'Design', 'Plans', 'Assessment', 'Solicit', 'Document', 'Processes', 'Acts',
        'Liaison', 'Between', 'Staff', 'Translate', 'Serves', 'Agile', 'Team',
        'Working', 'Scrum', 'Implement', 'Changes', 'Writes', 'User', 'Stories',
        'Acceptance', 'Criteria', 'According', 'Methodology', 'Develops', 'Maintains',
        'Scenarios', 'Participates', 'Acceptance', 'Creates', 'Use', 'Case',
        'Accurately', 'Map', 'Back', 'Documented', 'Executes', 'Cases', 'Formal',
        'Tool', 'Tracks', 'Reports', 'Status', 'Evaluates', 'Proposed', 'Strategies',
        'Ensure', 'Appropriate', 'Coverage', 'Identifies', 'Mitigation', 'Reports',
        'Established', 'Timelines', 'Action', 'Items', 'Decisions', 'Conducts',
        'Presentation', 'Manages', 'Schedule', 'Other', 'Duties', 'Assigned', 'Related',
        'Minimum', 'Exceed', 'Stated', 'Displayed', 'Customers', 'Chosen', 'Opportunity',
        'Oral', 'Interacting', 'End', 'Gather', 'Validate', 'Solutions', 'Satisfy',
        'Performing', 'Review', 'Approval', 'Complex', 'Technical', 'User', 'System',
        'Requirements', 'Written', 'Coordinating', 'Developing', 'Exit', 'Executing',
        'Detailed', 'Within', 'Environment', 'Using', 'Similar', 'Approving',
        'Prioritizing', 'Based', 'Stakeholder', 'Feedback', 'Knowledge', 'Claims',
        'Processing', 'From', 'And', 'The', 'For', 'With', 'In', 'On', 'An', 'Or',
        'As', 'Be', 'Of', 'To', 'Is', 'It'
    ]);


    const handleParseText = () => {
        let text = rawText;
        if (!text) return;

        let parsedData = {};

        // --- Step 1: Parse simple fields (same as before) ---
        const extract = (patterns) => {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && (match[1] || match[2])) { // Check group 1 or 2
                    return (match[1] || match[2]).trim();
                }
            }
            return '';
        };

        parsedData['Posting ID'] = extract([/(?:Job Id:|\()\s*(\d{6,})[)\s]/i, /Solicitation Reference Number:\s*(\d+)/i]);
        parsedData['Posting Title'] = extract([/(.+?)\s*\(\d{6,}\)/i, /Working Title:\s*(.+)/i]);
        parsedData['Client Name'] = extract([/State Name:\s*(.+)/i, /Client Info\s*(.+)/i]);
        parsedData['Max Submissions'] = extract([/Max Submittals by Vendor:\s*(\d+)/i, /^Max\s+(\d+)\s*$/im]);
        parsedData['Work Location'] = extract([/Worksite Address:\s*(.+)/i, /Work Location\s*(.+)/i]);
        parsedData['Work Position Type'] = extract([/Work Arrangement:?\s*(Hybrid|Remote|Onsite)/i]);

        const rateMatch = text.match(/(?:C 2 C|C2C)\s*(\d+(\.\d{1,2})?)\s*\$ Per Hr/i) || text.match(/NTE Rate:?\s*(\d+(\.\d{1,2})?)/i);
        if (rateMatch) {
            parsedData['Max C2C Rate'] = `$${rateMatch[1] || rateMatch[3]}/hr`;
        }

        const dateMatch = text.match(/(?:Last Date For Submission|Dead Line)\s*(\d{2}-\d{2}-\d{4})/i);
        if (dateMatch) {
            try {
                const [m, d, y] = dateMatch[1].split('-');
                parsedData['Last Submission Date'] = `${y}-${m}-${d}`;
            } catch (e) { console.error("Could not parse date: ", dateMatch[1]); }
        }

        if (parsedData['Client Name']) {
            const clientName = parsedData['Client Name'].toLowerCase();
            const matchedOption = postingFromOptions.find(option => clientName.includes(option.toLowerCase().replace('state of ', '')));
            if (matchedOption) {
                parsedData['Posting From'] = matchedOption;
            }
        }
        
        parsedData['Posting Date'] = new Date().toISOString().split('T')[0];

        // --- Step 2: Heuristic Skill Extraction ---
        try {
            // This regex finds:
            // 1. Multi-word capitalized phrases (e.g., "SAP BusinessObjects", "Microsoft Graph API")
            // 2. Single capitalized words ("Genesys", "Java")
            // 3. Acronyms ("SADLC", "CME")
            // 4. Skills with dots or hyphens ("Node.js", "On-Prem")
            const skillRegex = /\b([A-Z][a-zA-Z\d\.-]+(?:\s+[A-Z][a-zA-Z\d\.-]+)*)\b/g;
            let foundSkills = new Set();
            
            // Add all regex matches
            const matches = text.match(skillRegex) || [];
            matches.forEach(skill => {
                // Clean suffixes like 's' or ',' or ':'
                const cleanSkill = skill.replace(/[s,:()]$/, '').trim();
                if (cleanSkill.length > 1 && !SKILL_BLOCK_LIST.has(cleanSkill)) {
                    foundSkills.add(cleanSkill);
                }
            });

            // Add all core (lowercase) skills
            CORE_SKILLS.forEach(skill => {
                // Find core skills as whole words, case-insensitive
                const coreRegex = new RegExp(`\\b${skill}\\b`, 'gi');
                if (text.match(coreRegex)) {
                    // Find the capitalized version first if it exists
                    const capitalizedVersion = [...foundSkills].find(s => s.toLowerCase() === skill);
                    if (!capitalizedVersion) {
                        foundSkills.add(skill);
                    }
                }
            });

            // Filter out any remaining block list items (case-insensitive)
            let finalSkills = [...foundSkills].filter(skill => {
                return !SKILL_BLOCK_LIST.has(skill.toLowerCase()) && skill.length > 1;
            });

            if (finalSkills.length > 0) {
                parsedData['Required Skill Set'] = finalSkills.join(', ');
            } else {
                parsedData['Required Skill Set'] = 'Could not auto-detect skills. Please review manually.';
            }
        } catch (e) {
            console.error("Skill parsing error:", e);
            parsedData['Required Skill Set'] = 'Error parsing skills. Please review manually.';
        }

        // --- Step 3: Set all data ---
        setFormData(prev => ({ ...prev, ...parsedData }));
    };
    // --- END: Heuristic Skill Parser ---


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
                    <h2 className="text-xl font-semibold text-gray-800">Paste to Parse (Smart)</h2>
                    <p className="text-sm text-gray-600">
                        Paste the full job description text below. The parser will attempt to find all fields and technical skills automatically.
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