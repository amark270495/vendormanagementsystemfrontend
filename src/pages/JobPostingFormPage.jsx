import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

// --- Premium UI Icons ---
const Icons = {
    Sparkles: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
    CheckCircle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    AlertTriangle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    Briefcase: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
};

// --- POSTING OPTIONS ---
const POSTING_FROM_OPTIONS = [
    'State Of Texas', 'State Of Michigan', 'State of North Carolina', 
    'State Of New Jersey', 'State Of Georgia', 'State Of Iowa', 
    'State Of Connecticut', 'State Of Virginia', 'State Of Indiana', 
    'Virtusa', 'Deloitte', 'Other'
];

// --- ULTIMATE DYNAMIC MASTER DICTIONARIES ---
const MASTER_SKILLS_DICT = {
    "Project/Program Management": ["Project Management", "Program Management", "Portfolio Management", "PMO", "PMO Governance", "Waterfall", "Hybrid Delivery", "Project Coordinator"],
    "Agile/Scrum": ["Agile", "Scrum", "SAFe", "Kanban", "Agile Methodologies", "Sprint Planning", "Scrum Ceremonies"],
    "Business Analysis": ["Business Analysis", "Requirements Engineering", "Requirements Gathering", "BRD", "FRD", "User Stories", "Use Cases", "Gap Analysis", "Process Mapping", "BPMN", "UML"],
    "Process Improvement": ["Lean Six Sigma", "Change Management", "Risk Management", "Compliance", "Business Process Reengineering"],
    "ITSM & Collaboration": ["ITIL", "ITSM", "ServiceNow", "SNOW", "Remedy", "BMC Helix", "Jira", "Jira Service Management", "Confluence", "SharePoint", "Visio", "Teams", "Slack"],
    "ERP Systems": ["ERP", "SAP", "SAP HANA", "SAP FICO", "Oracle ERP", "Oracle Fusion", "PeopleSoft", "Workday", "Workday HCM", "Dynamics 365"],
    "CRM Systems": ["CRM Systems", "Salesforce", "SFDC", "Salesforce Lightning", "Apex", "HubSpot", "Zoho"],
    "DevOps & CI/CD": ["DevOps", "DevSecOps", "CI/CD", "Azure DevOps", "Azure Pipelines", "Git", "GitHub", "GitLab", "Bitbucket", "Jenkins", "GitHub Actions", "Release Management", "TFS"],
    "Infrastructure as Code (IaC)": ["Terraform", "Ansible", "Puppet", "Chef", "CloudFormation"],
    "Containerization": ["Kubernetes", "K8s", "Docker", "Helm", "OpenShift", "GKE", "Microservices", "EKS", "AKS"],
    "OS & Environments": ["Windows Server", "Linux", "RedHat", "RHEL", "Ubuntu", "CentOS", "Unix", "VMware", "Hyper-V", "Citrix"],
    "Scripting & Shell": ["Bash", "PowerShell", "Shell Scripting", "Regex", "VBScript"],
    "AWS Cloud Services": ["AWS", "Amazon Web Services", "S3", "EC2", "Lambda", "CloudFront", "AWS IoT Core", "Route 53", "VPC"],
    "Azure Cloud Services": ["Azure", "Microsoft Azure", "Azure Functions", "Logic Apps", "App Service", "Storage Accounts", "VNet", "Azure IoT Hub", "Azure Data Factory"],
    "GCP Cloud Services": ["GCP", "Google Cloud", "BigQuery", "Cloud Run", "Google Workspace"],
    "Java Technologies": ["Java", "J2EE", "Core Java", "Spring", "Spring Boot", "Hibernate"],
    ".NET Technologies": [".NET", ".NET Core", ".NET Framework", "C#", "C-Sharp", "ASP.NET", ".NET 8"],
    "Python": ["Python", "Pandas", "NumPy", "Django", "Flask"],
    "C++/System Languages": ["C++", "C", "GoLang", "Go", "Rust", "Scala", "Ruby"],
    "JavaScript/Node.js": ["JavaScript", "JS", "TypeScript", "TS", "Node.js", "NodeJS", "Express.js"],
    "Frontend Frameworks": ["Angular", "AngularJS", "React", "ReactJS", "Next.js", "Vue.js", "Vue"],
    "Web Fundamentals": ["HTML", "CSS", "Bootstrap", "Tailwind", "SASS", "Webpack", "NPM"],
    "API Development": ["API Development", "REST", "RESTful APIs", "SOAP", "GraphQL", "API Gateway", "Web Services"],
    "Integration Tools": ["MuleSoft", "Dell Boomi", "Informatica", "SSIS", "Talend", "Postman", "Swagger", "Apigee", "Rhapsody Integration Engine"],
    "Data Formats": ["JSON", "XML", "YAML", "CSV", "EDI", "EDI X12"],
    "Relational Databases (SQL)": ["SQL", "PL/SQL", "T-SQL", "Oracle Database", "Oracle 19c", "SQL Server", "Microsoft SQL", "PostgreSQL", "MySQL", "MariaDB", "DB2"],
    "NoSQL Databases": ["MongoDB", "Cassandra", "Redis", "DynamoDB", "Cosmos DB"],
    "Data Warehousing/Lakes": ["Snowflake", "Redshift", "BigQuery", "Synapse", "Databricks"],
    "Big Data & Pipelines": ["Hadoop", "Spark", "Apache Spark", "Kafka", "Flink", "Airflow", "NiFi", "ETL", "ETL Pipelines", "Data Engineering", "Data Modeling"],
    "Business Intelligence (BI)": ["Power BI", "Tableau", "Qlik", "Looker", "Excel Advanced", "DAX", "Power Query", "Data Visualization"],
    "AI & Machine Learning": ["AI", "Artificial Intelligence", "Machine Learning", "ML", "Deep Learning", "NLP", "LLMs", "GenAI", "TensorFlow", "PyTorch", "Scikit-Learn", "Keras"],
    "Enterprise AI Platforms": ["OpenAI APIs", "Azure OpenAI", "Vertex AI", "SageMaker", "MLOps", "Cognitive Search"],
    "Data Analysis & Governance": ["Data Analysis", "Data Warehouse Analysis", "Data Governance", "Data Catalog", "Data Lineage", "Data Quality", "Master Data Management"],
    "Cybersecurity & Compliance": ["Cybersecurity", "NIST", "NIST 800-53", "NIST CSF", "SOC 2", "ISO 27001", "FedRAMP", "HIPAA", "CJIS", "Zero Trust", "FISMA"],
    "Identity & Access (IAM)": ["IAM", "Active Directory", "Azure AD", "Entra ID", "MFA", "SSO", "OAuth", "SAML", "Okta", "Ping Identity", "SailPoint", "CyberArk", "LDAP"],
    "Security Operations": ["Firewalls", "Palo Alto", "Fortinet", "Cisco ASA", "CrowdStrike", "SentinelOne", "SIEM", "Microsoft Sentinel", "Splunk", "Splunk Enterprise Security", "DLP", "Endpoint Security"],
    "Vulnerability & AppSec": ["Vulnerability Management", "Nessus", "Qualys", "Penetration Testing", "Ethical Hacking", "SAST", "DAST", "SonarQube", "Checkmarx", "Veracode", "Application Security"],
    "Networking": ["Network Engineering", "TCP/IP", "DNS", "DHCP", "VPN", "SD-WAN", "Load Balancers", "F5", "VLAN", "Arista"],
    "Endpoint & Device Mgmt": ["Intune", "JAMF", "SCCM", "Mobile Device Management", "MDM"],
    "Mainframe & Legacy": ["Mainframe", "COBOL", "CICS", "JCL", "JCL Batch Processing", "ADABAS"],
    "Healthcare/Gov Systems": ["EHR Systems", "Electronic Health Records", "MMIS", "Medicaid MMIS", "Medicaid", "CMS Systems", "State Eligibility Systems", "Unemployment Insurance Systems", "Child Welfare Systems", "Grants Management Systems", "FHIR", "HL7", "HL7 v2", "LOINC", "SNOMED", "ICD-10", "CPT Coding"],
    "GIS & Mapping": ["GIS", "ESRI ArcGIS", "ArcGIS", "QGIS", "Geospatial Data", "Cartography"],
    "Procurement": ["Procurement Tools", "eProcurement", "VMS", "Vendor Management Systems"],
    "Accessibility": ["Accessibility WCAG", "Section 508", "WCAG", "ADA compliance"],
    "Test Automation": ["Automation Testing", "QA Automation", "Selenium", "Cypress", "Playwright", "Cucumber", "JUnit"],
    "Performance/Mobile Testing": ["JMeter", "LoadRunner", "Performance Testing", "Load Testing", "Mobile Testing", "Appium"],
    "Manual/Core Testing": ["QA Testing", "Manual Testing", "UAT", "Regression Testing", "Test Scripts", "Defect Tracking"],
    "Enterprise Architecture": ["Enterprise Architecture", "Solution Architecture", "Data Architecture", "TOGAF", "Zachman", "Cloud Architecture"],
    "Robotics & Edge": ["Blockchain", "Web3", "Solidity", "Smart Contracts", "IoT", "Robotics", "Embedded Systems", "Firmware", "MATLAB", "Simulink", "RPA", "UiPath", "Blue Prism"]
};

const MASTER_CERTIFICATIONS_DICT = {
    "PMP": ["PMP", "Project Management Professional"],
    "PMI-ACP": ["PMI-ACP", "Agile Certified Practitioner"],
    "Scrum Master": ["CSM", "Certified ScrumMaster", "PSM", "Scrum Master", "CSPO", "Certified Scrum Product Owner"],
    "SAFe": ["SAFe Agilist", "SAFe Practitioner", "SAFe Certification"],
    "ITIL": ["ITIL Foundation", "ITIL Intermediate", "ITIL", "ITIL v3", "ITIL v4"],
    "Six Sigma": ["Six Sigma Green Belt", "Six Sigma Black Belt", "Lean Practitioner"],
    "Business Analysis": ["CBAP", "Certified Business Analysis Professional"],
    "AWS Certifications": ["AWS Cloud Practitioner", "AWS Solutions Architect", "AWS Developer", "AWS Certified"],
    "Azure Certifications": ["Azure Fundamentals", "AZ-900", "Azure Administrator", "Azure Architect", "Azure Database Administrator Associate"],
    "GCP Certifications": ["Google Cloud Associate", "Google Cloud Professional"],
    "CompTIA": ["Security+", "Network+", "A+"],
    "Cybersecurity Pro": ["CISSP", "CISM", "CEH", "Certified Ethical Hacker", "CHFI"],
    "Cisco Networking": ["CCNA", "CCNP", "CCIE"],
    "Salesforce": ["Salesforce Admin", "Salesforce Administrator", "Salesforce Developer"],
    "Software Testing": ["ISTQB", "Certified Tester"]
};

// Helper function to escape special characters like +, *, ., # in skills
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const JobPostingFormPage = ({ onFormSubmit }) => {
    const { user } = useAuth();
    const { canAddPosting } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [parseSuccess, setParseSuccess] = useState('');
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

        setParseSuccess('');
        setError('');
        
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
        parsedData['Posting ID'] = extract([
            /Solicitation Reference Number:\s*([A-Z0-9]+)/i,
            /Job Id:?\s*(?:[\r\n]+)?.*?\(\s*([A-Z0-9]+)\s*\)/i, 
            /\b([A-Z0-9]{6,})\b/ 
        ]);

        parsedData['Posting Title'] = extract([
            /Working Title:\s*(.+)/i,
            /Job Id:?\s*(?:[\r\n]+)?(.*?)\s*(?:-\s*\([^)]+\)|\([^)]+\))/i, 
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
            parsedData['Last Submission Date'] = `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`;
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

        // --- 2. DYNAMIC SKILL & CERTIFICATE EXTRACTION ---
        const foundSkills = new Set();
        const foundCerts = new Set();
        
        Object.entries(MASTER_SKILLS_DICT).forEach(([standardName, aliases]) => {
            const hasMatch = aliases.some(alias => {
                const regex = new RegExp(`(?:^|\\W)${escapeRegExp(alias)}(?:$|\\W)`, 'i');
                return regex.test(text);
            });
            if (hasMatch) foundSkills.add(standardName);
        });

        Object.entries(MASTER_CERTIFICATIONS_DICT).forEach(([standardName, aliases]) => {
            const hasMatch = aliases.some(alias => {
                const regex = new RegExp(`(?:^|\\W)${escapeRegExp(alias)}(?:$|\\W)`, 'i');
                return regex.test(text);
            });
            if (hasMatch) foundCerts.add(standardName);
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
        setParseSuccess("Data extracted successfully! Skills and Certifications have been mapped to standardized categories.");
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canAddPosting) return setError("You do not have permission to add new job postings.");

        const payloadToSubmit = { ...formData };
        if (payloadToSubmit['Posting From'] === 'Other') {
            payloadToSubmit['Posting From'] = payloadToSubmit['Client Name'] || '';
        }

        setError('');
        setSubmitSuccess('');
        setParseSuccess(''); 
        setLoading(true);
        
        try {
            const response = await apiService.processJobPosting(payloadToSubmit, user.userIdentifier);
            if (response.data.success) {
                setSubmitSuccess(response.data.message);
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

    // --- Dynamic Input Styling Helper ---
    const inputClass = "w-full bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none";
    const labelClass = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2";

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
            
            {/* Page Header */}
            <div className="flex items-end justify-between border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Icons.Briefcase className="w-8 h-8 text-blue-600" />
                        New Job Requisition
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                        Parse a description automatically or enter the requisition details manually below.
                    </p>
                </div>
            </div>

            {!canAddPosting && !loading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-xl border border-slate-100 text-center">
                    <Icons.AlertTriangle className="w-12 h-12 text-red-500 mb-4 opacity-80" />
                    <h3 className="text-xl font-bold text-slate-900">Access Denied</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">You do not have the necessary security clearance to author new job postings in the VMS.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    
                    {/* Smart Dictionary Parser Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 md:p-8 rounded-3xl shadow-xl border border-blue-100/50">
                        {/* Decorative Background Blob */}
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-400/10 blur-3xl rounded-full pointer-events-none"></div>

                        <div className="relative z-10">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2">
                                <Icons.Sparkles className="w-5 h-5 text-blue-600" />
                                Smart JD Parser
                            </h2>
                            <p className="text-[13px] font-medium text-slate-600 mb-5 max-w-3xl leading-relaxed">
                                Paste the raw job description from Dice, LinkedIn, or an email. Our dictionary engine will map variations and abbreviations into standard enterprise categories.
                            </p>
                            
                            <textarea
                                rows="6"
                                className="w-full bg-white border border-blue-200/60 rounded-2xl p-4 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none shadow-inner custom-scrollbar"
                                placeholder="Paste the raw job description here..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            
                            <div className="flex justify-end gap-3 mt-4">
                                {rawText.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => setRawText('')}
                                        className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                                    >
                                        Clear Text
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleParseText}
                                    disabled={!rawText.trim()}
                                    className="bg-slate-900 hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-2.5 px-8 rounded-xl flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                                >
                                    <Icons.Sparkles className="w-4 h-4 mr-2" />
                                    Auto-Fill Form
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Manual Form Entry Card */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-100 relative">
                        <h3 className="text-lg font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">Requisition Details</h3>

                        {/* Status Alerts */}
                        <div className="mb-8 space-y-3">
                            {error && (
                                <div className="flex items-center gap-3 bg-red-50/80 border border-red-200 text-red-700 px-5 py-4 rounded-2xl">
                                    <Icons.AlertTriangle className="w-5 h-5 shrink-0" />
                                    <p className="text-[13px] font-bold">{error}</p>
                                </div>
                            )}
                            {submitSuccess && (
                                <div className="flex items-center gap-3 bg-green-50/80 border border-green-200 text-green-700 px-5 py-4 rounded-2xl">
                                    <Icons.CheckCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-[13px] font-bold">{submitSuccess}</p>
                                </div>
                            )}
                            {parseSuccess && !submitSuccess && (
                                <div className="flex items-center gap-3 bg-blue-50/80 border border-blue-200 text-blue-700 px-5 py-4 rounded-2xl">
                                    <Icons.Sparkles className="w-5 h-5 shrink-0" />
                                    <p className="text-[13px] font-bold">{parseSuccess}</p>
                                </div>
                            )}
                        </div>

                        {/* Grid Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
                            {formFields.map(field => (
                                <div key={field.id} className={field.full ? 'md:col-span-2' : ''}>
                                    <label htmlFor={field.id} className={labelClass}>
                                        {field.name} {field.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
                                    </label>
                                    
                                    {field.type === 'textarea' ? (
                                        <textarea 
                                            name={field.name} 
                                            id={field.id} 
                                            value={formData[field.name] || ''} 
                                            onChange={handleChange} 
                                            required={field.required} 
                                            rows={field.name === 'Required Skill Set' ? 6 : 4} 
                                            className={`${inputClass} custom-scrollbar`}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select 
                                            name={field.name} 
                                            id={field.id} 
                                            value={formData[field.name] || ''} 
                                            onChange={handleChange} 
                                            required={field.required} 
                                            className={`${inputClass} appearance-none cursor-pointer`}
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em 1.2em' }}
                                        >
                                            <option value="" disabled className="text-slate-400">Select an option...</option>
                                            {field.options.map(opt => <option key={opt} value={opt} className="text-slate-900 font-medium">{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input 
                                            type={field.type} 
                                            name={field.name} 
                                            id={field.id} 
                                            value={formData[field.name] || ''} 
                                            onChange={handleChange} 
                                            required={field.required} 
                                            className={inputClass} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Submit Actions */}
                        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                            <button 
                                type="submit" 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center min-w-[200px] transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:bg-blue-400 disabled:shadow-none disabled:transform-none" 
                                disabled={loading || !!submitSuccess}
                            >
                                {loading ? <Spinner size="6" /> : 'Publish Requisition'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default JobPostingFormPage;