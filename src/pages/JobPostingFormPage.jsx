import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

// --- POSTING OPTIONS ---
const POSTING_FROM_OPTIONS = [
    'State Of Texas', 'State Of Michigan', 'State of North Carolina', 
    'State Of New Jersey', 'State Of Georgia', 'State Of Iowa', 
    'State Of Connecticut', 'State Of Virginia', 'State Of Indiana', 
    'Virtusa', 'Deloitte', 'Other'
];

// --- MASTER DICTIONARIES ---
const MASTER_SKILLS_LIST = [
    "RDBMS", "SQL", "Agile/Scrum", "Keylight", "Azure DevOps", "TFS", "Web Services", "ADA compliance", 
    "Regression Testing", ".NET", "HTML", "XML", "SOAP", "REST", "PowerShell", "IaC", "Microsoft Azure", 
    "Function Apps", "PR", "NexSys Platform", "Grant Management Systems (GMS)", "Federal Policy Analysis", 
    "As-Is/To-Be Modeling", "SDLC", "Stakeholder Liaison", "Wireframing (Figma)", "SharePoint", 
    "Requirements Elicitation", "Cross-functional Leadership", "Rhapsody Integration Engine (7.x)", 
    "Rhapsody Developer Kit (RDK)", "JavaScript", "HL7 (v2.x, v3, FHIR)", "CDA/CCDA Standards", 
    "Healthcare Vocabularies (LOINC, SNOMED, RxNorm)", "HIE/IHE Technology", "EDI Message Designer", 
    "API Development", "OAuth", "TLS/Certificate Management", "JSON", "SEM/SUITE Compliance", 
    "Microsoft SQL", "Windows Server", "Linux/Unix", "Shell Scripting", "Python", "SAS", "Machine Learning", 
    "AWS", "GCP", "Azure", "Tableau", "Power BI", "Anomaly Detection", "Behavioral Modeling", "Network Analysis", 
    "DNS", "HTTP", "LDAP", "SMTP", "SNMP", "LVM", "ZFS", "SVM", "Veritas Volume Manager", "HAProxy", 
    "Linux IPVS", "Iptables", "VPC", "Subnets", "VPN", "VLAN", "IPv4/IPv6", "MyInsight EHR", "Netsmart", 
    "ICD-10/CPT Coding", "E/M Documentation Standards", "Electronic Health Records (EHR)", 
    "Health Information Exchange (HIE) platforms", "Clinical Data Systems", "CMS Program Requirements", 
    "Technical Architectures", "Development Platforms", "Oracle CX Sales Performance Management (SPM)", 
    "Incentive Compensation (IC) Cloud", "Plan Modeling", "Credit & Rollup Rules", "Commission Calculation", 
    "Dispute Management", "Territory Management", "Sales Credits", "HCM/ERP Integration", "PingFederate", 
    "PingAccess", "IAM Engineer", "SAML", "OIDC", "SCIM", "PKI", "SSO", "MFA", "Application Onboarding", 
    "PingDirectory", "Identity Management", "Office 365", "Microsoft Teams", "Microsoft Exchange", 
    "Federation", "Active Directory", "Microsoft Entra ID", "Hybrid Exchange Infrastructure", "Cisco IronPort", 
    "Proofpoint", "Conditional Access Policies", "Data Loss Prevention (DLP)", "Microsoft AD Connect", 
    "Windows Clustering", "High Availability (HA) Technology", "Systems Monitoring", "Performance Tuning", 
    "Capacity Planning", "ITIL Methodology", "Project Management", "Core networking", "Arista", "HIPAA", 
    "Medicaid/Healthcare IT", "SAFe Agile", "Jira", "HP ALM", "Medicaid Management Information Systems (MMIS)", 
    "SAFe", "Scrum", "Medicaid", "EDI X12", "Rally", "DevOps", "SP.NET", "C#", ".NET Core/Framework", 
    "RESTful APIs", "CSS", "Angular", "React", "PPM Integration", "Service Fabric", "Micro Focus PPM", "OnBase", 
    "Medicaid technology trends", "Medicaid Long-Term Care (LTC)", "MMIS Data Analysis", "Web Service Testing", 
    "Test Suite/Case Creation", "User Story Decomposition", "Regression & UAT Testing", "Gap Analysis", 
    "Snowflake", "ETL tools", "Cloud Data Services", "Spark BigData", "Geospatial Data", "ESRI", "ArcGIS", 
    "QGIS", "Spatial and Tabular Data Derivation", "Data Integrity", "ArcGIS Online", "GIS Software and Tools", 
    "Data Collection/Manipulation/Visualization", "Geospatial Data Management/Interpretation", 
    "Cartography and Mapping", "Computer Programming", "Database Management", "Spatial Analysis", 
    "Metadata Management", "BFS-Capital Markets", "Google Workspace (Sheets & Slides)", "Revenue Analysis", 
    "Bookings & Variance Analysis", "Utilization Management", "CRM Data Tracking", "Stakeholder Management", 
    "SLA Compliance", "Staffing Strategy", "Resource Acquisition", "GCP Data Plex", "BigQuery", "Apache Iceberg", 
    "Data Lakehouse Architecture", "Data Governance", "Data Catalog", "Data Lineage", "Data Quality", 
    "Dataflow (Apache Beam)", "Pub/Sub", "Cloud Composer", "Infrastructure as Code (Terraform)", "CI/CD", 
    "Adobe Experience Cloud", "Adobe Analytics", "Adobe Target", "Product Management Lifecycle", 
    "Product Strategy & Vision", "Roadmap Prioritization", "PeopleSoft", "STAT", "Linux/RedHat", "Oracle 19c", 
    "Visual Basic Script", "UFT", "PL/SQL", "Agile SDLC", "Test Scripts", "IT SDLC", "Lifecycle Management Tools", 
    "Contact Center Technology", "Application Security", "Microsoft Office", "Outlook", "Microsoft Project", 
    "Word", "Visio", "Excel", "PowerPoint", "DB2 Databases", "DB2 licensing", "Passport Advantage", "AIX", 
    "UNIX", "Linux", "Shell programming", "Robotic Process Automation (RPA)", "Blue Prism", 
    "Microsoft Power Automate", "Power Automate Desktop", "Power Automate Cloud Flows", "Azure Infrastructure", 
    "Azure AI", "Cognitive Search", "Java", "APIs", "PDF/Document Processing Frameworks", "Document Intelligence", 
    "Kanban", "CrowdStrike SIEM", "CrowdStrike Services", "SIEM Detection Engineering", "Alert Optimization", 
    "Log Source Integration", "Data Normalization", "Dashboard Development", "Endpoint Security", "Telemetry", 
    "Log Ingestion", "Data Parsing", "Data Correlation", "Validatar", "WhereScape RED", "WhereScape 3D", 
    "Confluence", "BOX", "Amazon Web Services", "Cloud Architecture", "DDM’s", "Natural Structured Mode language model", 
    "ADABAS Data Access", "JCL Batch Processing", "Online Processing", "Remote Job Entry Processing", 
    "Mainframe Utilities", "SolarWinds", "NPM", "SAM", "NTA", "DPA", "LogicMonitor", "WMI", "NetFlow", "Orion SDK"
];

const MASTER_CERTIFICATIONS_LIST = [
    "CBAP", "ISTQB", "SAFe", "Scrum", "Certified ScrumMaster", "PMI-ACP", "SAFe Agilist", 
    "Azure Database Administrator Associate", "Microsoft SQL Server", "CSM", "PSM", "Scrum Master", 
    "BluePrism", "RHCT", "RHCE", "LPIC", "Linux", "Web Design/Graphic Design Certification", "CISSP", "PMP"
];

// Helper to escape regex characters in strings (like C# or .NET)
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const JobPostingFormPage = ({ onFormSubmit }) => {
    const { user } = useAuth();
    const { canAddPosting } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
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
        { name: 'Company Name', id: 'companyName', type: 'select', required: true, options: ['Eclat Solutions LLC', 'Taproot Solutions INC', 'TSI - BDM Openings'], half: true },
        { name: 'Posting From', id: 'postingFrom', type: 'select', required: true, options: postingFromOptions, half: true },
        { name: 'Work Location', id: 'workLocation', type: 'text', required: true, half: true },
        { name: 'Work Position Type', id: 'workPositionType', type: 'select', required: true, options: ['Hybrid', 'Remote', 'Onsite', 'Telework'], half: true },
        { name: 'Required Skill Set', id: 'requiredSkillSet', type: 'textarea', required: true, full: true },
        { name: 'Any Required Certificates', id: 'anyRequiredCertificates', type: 'textarea', full: true },
    ], [postingFromOptions]);

    const handleParseText = () => {
        let text = rawText;
        if (!text) return;

        let parsedData = {};

        const extract = (patterns) => {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    return (match[1] || match[0]).trim();
                }
            }
            return '';
        };

        // --- 1. PARSE STANDARD FIELDS ---
        
        // Exact targeting for Solicitation numbers and (ID) formats
        parsedData['Posting ID'] = extract([
            /Solicitation Reference Number:\s*([A-Z0-9]+)/i,
            /Job Id:?\s*(?:[\r\n]+)?.*?\(\s*([A-Z0-9]+)\s*\)/i, // Matches: Specialist Expert - (800826)
            /\b([A-Z0-9]{6,})\b/ // Fallback for any 6+ char alphanumeric
        ]);

        // Exact targeting for Titles before the ID parenthesis
        parsedData['Posting Title'] = extract([
            /Working Title:\s*(.+)/i,
            /Job Id:?\s*(?:[\r\n]+)?(.*?)\s*(?:-\s*\([^)]+\)|\([^)]+\))/i, // Captures text before - (ID) or (ID)
            /Title\s*:\s*(.+)/i
        ]);

        parsedData['Client Name'] = extract([
            /Client Info\s*(?:[\r\n]+)?(.+)/i,
            /State Name:\s*(?:[\r\n]+)?(.+?)(?:\r|\n|$)/i,
            /Client Name:\s*(?:[\r\n]+)?(.+)/i
        ]);

        parsedData['Max Submissions'] = extract([
            /Max Submittals by Vendor:\s*(\d+)/i, 
            /^Max(?:[\r\n]+)?(\d+)/im
        ]);

        parsedData['Work Location'] = extract([
            /Work Location\s*(?:[\r\n]+)?(.+)/i,
            /Worksite Address:?\s*(?:[\r\n]+)?(.+)/i
        ]);

        parsedData['Work Position Type'] = extract([
            /Work Arrangement:?\s*(?:[\r\n]+)?(Hybrid|Remote|Onsite|Telework)/i
        ]);

        const rateMatch = text.match(/(?:C\s*2\s*C|NTE Rate:?)\s*(?:[\r\n]+)?\$?(\d+(\.\d{1,2})?)/i);
        if (rateMatch) {
            parsedData['Max C2C Rate'] = `$${rateMatch[1]}/hr`;
        }

        const dateMatch = text.match(/(?:Last Date For Submission|Dead Line)\s*(?:[\r\n]+)?(\d{2})[-/](\d{2})[-/](\d{4})/i);
        if (dateMatch) {
            const m = dateMatch[1];
            const d = dateMatch[2];
            const y = dateMatch[3];
            parsedData['Last Submission Date'] = `${y}-${m}-${d}`;
        }

        if (parsedData['Client Name']) {
            const clientName = parsedData['Client Name'].toLowerCase();
            const matchedOption = postingFromOptions.find(option => 
                clientName.includes(option.toLowerCase().replace('state of ', ''))
            );
            if (matchedOption) {
                parsedData['Posting From'] = matchedOption;
            }
        }
        
        parsedData['Posting Date'] = new Date().toISOString().split('T')[0];

        // --- 2. DICTIONARY SKILL EXTRACTION ---
        const foundSkills = new Set();
        const foundCerts = new Set();
        
        // Find Skills using word boundaries so "IT" doesn't match inside "WITH"
        MASTER_SKILLS_LIST.forEach(skill => {
            const regex = new RegExp(`(?:^|\\W)${escapeRegExp(skill)}(?:$|\\W)`, 'i');
            if (regex.test(text)) {
                foundSkills.add(skill);
            }
        });

        // Find Certifications
        MASTER_CERTIFICATIONS_LIST.forEach(cert => {
            const regex = new RegExp(`(?:^|\\W)${escapeRegExp(cert)}(?:$|\\W)`, 'i');
            if (regex.test(text)) {
                foundCerts.add(cert);
            }
        });

        if (foundSkills.size > 0) {
            parsedData['Required Skill Set'] = Array.from(foundSkills).join(', ');
        } else {
            parsedData['Required Skill Set'] = 'Could not auto-detect skills. Please review manually.';
        }

        if (foundCerts.size > 0) {
            parsedData['Any Required Certificates'] = Array.from(foundCerts).join('; ');
        }

        setFormData(prev => ({ ...prev, ...parsedData }));
        setSuccess("Parsed successfully via Smart Dictionary!");
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
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border space-y-4 relative">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        ⚡ Smart Dictionary Parser
                    </h2>
                    <p className="text-sm text-gray-600">
                        Paste the full job description. The system will scan the text against your master dictionary of IT skills and certifications to extract all required fields locally.
                    </p>
                    <textarea
                        rows="8"
                        className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="Paste full job description here..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleParseText}
                            disabled={!rawText.trim()}
                            className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center min-w-[160px] transition-colors"
                        >
                            Parse Data
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