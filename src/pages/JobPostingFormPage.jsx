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

// --- ULTIMATE DYNAMIC MASTER DICTIONARIES ---
// Covers LinkedIn, Dice, Monster, State Gov, and Enterprise Integrators
const MASTER_SKILLS_DICT = {
    // --- 1. Project, Program & Agile Methodologies ---
    "Project/Program Management": ["Project Management", "Program Management", "Portfolio Management", "PMO", "PMO Governance", "Waterfall", "Hybrid Delivery", "Project Coordinator"],
    "Agile/Scrum": ["Agile", "Scrum", "SAFe", "Kanban", "Agile Methodologies", "Sprint Planning", "Scrum Ceremonies"],
    "Business Analysis": ["Business Analysis", "Requirements Engineering", "Requirements Gathering", "BRD", "FRD", "User Stories", "Use Cases", "Gap Analysis", "Process Mapping", "BPMN", "UML"],
    "Process Improvement": ["Lean Six Sigma", "Change Management", "Risk Management", "Compliance", "Business Process Reengineering"],

    // --- 2. ITSM, ERP & CRM Systems ---
    "ITSM & Collaboration": ["ITIL", "ITSM", "ServiceNow", "SNOW", "Remedy", "BMC Helix", "Jira", "Jira Service Management", "Confluence", "SharePoint", "Visio", "Teams", "Slack"],
    "ERP Systems": ["ERP", "SAP", "SAP HANA", "SAP FICO", "Oracle ERP", "Oracle Fusion", "PeopleSoft", "Workday", "Workday HCM", "Dynamics 365"],
    "CRM Systems": ["CRM Systems", "Salesforce", "SFDC", "Salesforce Lightning", "Apex", "HubSpot", "Zoho"],

    // --- 3. DevOps, CI/CD & Infrastructure ---
    "DevOps & CI/CD": ["DevOps", "DevSecOps", "CI/CD", "Azure DevOps", "Azure Pipelines", "Git", "GitHub", "GitLab", "Bitbucket", "Jenkins", "GitHub Actions", "Release Management", "TFS"],
    "Infrastructure as Code (IaC)": ["Terraform", "Ansible", "Puppet", "Chef", "CloudFormation"],
    "Containerization": ["Kubernetes", "K8s", "Docker", "Helm", "OpenShift", "GKE", "Microservices", "EKS", "AKS"],
    "OS & Environments": ["Windows Server", "Linux", "RedHat", "RHEL", "Ubuntu", "CentOS", "Unix", "VMware", "Hyper-V", "Citrix"],
    "Scripting & Shell": ["Bash", "PowerShell", "Shell Scripting", "Regex", "VBScript"],

    // --- 4. Cloud Platforms ---
    "AWS Cloud Services": ["AWS", "Amazon Web Services", "S3", "EC2", "Lambda", "CloudFront", "AWS IoT Core", "Route 53", "VPC"],
    "Azure Cloud Services": ["Azure", "Microsoft Azure", "Azure Functions", "Logic Apps", "App Service", "Storage Accounts", "VNet", "Azure IoT Hub", "Azure Data Factory"],
    "GCP Cloud Services": ["GCP", "Google Cloud", "BigQuery", "Cloud Run", "Google Workspace"],

    // --- 5. Programming Languages & Web Dev ---
    "Java Technologies": ["Java", "J2EE", "Core Java", "Spring", "Spring Boot", "Hibernate"],
    ".NET Technologies": [".NET", ".NET Core", ".NET Framework", "C#", "C-Sharp", "ASP.NET", ".NET 8"],
    "Python": ["Python", "Pandas", "NumPy", "Django", "Flask"],
    "C++/System Languages": ["C++", "C", "GoLang", "Go", "Rust", "Scala", "Ruby"],
    "JavaScript/Node.js": ["JavaScript", "JS", "TypeScript", "TS", "Node.js", "NodeJS", "Express.js"],
    "Frontend Frameworks": ["Angular", "AngularJS", "React", "ReactJS", "Next.js", "Vue.js", "Vue"],
    "Web Fundamentals": ["HTML", "CSS", "Bootstrap", "Tailwind", "SASS", "Webpack", "NPM"],

    // --- 6. Integration, APIs & Formats ---
    "API Development": ["API Development", "REST", "RESTful APIs", "SOAP", "GraphQL", "API Gateway", "Web Services"],
    "Integration Tools": ["MuleSoft", "Dell Boomi", "Informatica", "SSIS", "Talend", "Postman", "Swagger", "Apigee", "Rhapsody Integration Engine"],
    "Data Formats": ["JSON", "XML", "YAML", "CSV", "EDI", "EDI X12"],

    // --- 7. Databases & Data Engineering ---
    "Relational Databases (SQL)": ["SQL", "PL/SQL", "T-SQL", "Oracle Database", "Oracle 19c", "SQL Server", "Microsoft SQL", "PostgreSQL", "MySQL", "MariaDB", "DB2"],
    "NoSQL Databases": ["MongoDB", "Cassandra", "Redis", "DynamoDB", "Cosmos DB"],
    "Data Warehousing/Lakes": ["Snowflake", "Redshift", "BigQuery", "Synapse", "Databricks"],
    "Big Data & Pipelines": ["Hadoop", "Spark", "Apache Spark", "Kafka", "Flink", "Airflow", "NiFi", "ETL", "ETL Pipelines", "Data Engineering", "Data Modeling"],

    // --- 8. Analytics, BI & AI/ML ---
    "Business Intelligence (BI)": ["Power BI", "Tableau", "Qlik", "Looker", "Excel Advanced", "DAX", "Power Query", "Data Visualization"],
    "AI & Machine Learning": ["AI", "Artificial Intelligence", "Machine Learning", "ML", "Deep Learning", "NLP", "LLMs", "GenAI", "TensorFlow", "PyTorch", "Scikit-Learn", "Keras"],
    "Enterprise AI Platforms": ["OpenAI APIs", "Azure OpenAI", "Vertex AI", "SageMaker", "MLOps", "Cognitive Search"],
    "Data Analysis & Governance": ["Data Analysis", "Data Warehouse Analysis", "Data Governance", "Data Catalog", "Data Lineage", "Data Quality", "Master Data Management"],

    // --- 9. Cybersecurity & Identity ---
    "Cybersecurity & Compliance": ["Cybersecurity", "NIST", "NIST 800-53", "NIST CSF", "SOC 2", "ISO 27001", "FedRAMP", "HIPAA", "CJIS", "Zero Trust", "FISMA"],
    "Identity & Access (IAM)": ["IAM", "Active Directory", "Azure AD", "Entra ID", "MFA", "SSO", "OAuth", "SAML", "Okta", "Ping Identity", "SailPoint", "CyberArk", "LDAP"],
    "Security Operations": ["Firewalls", "Palo Alto", "Fortinet", "Cisco ASA", "CrowdStrike", "SentinelOne", "SIEM", "Microsoft Sentinel", "Splunk", "Splunk Enterprise Security", "DLP", "Endpoint Security"],
    "Vulnerability & AppSec": ["Vulnerability Management", "Nessus", "Qualys", "Penetration Testing", "Ethical Hacking", "SAST", "DAST", "SonarQube", "Checkmarx", "Veracode", "Application Security"],

    // --- 10. Networking & Infrastructure ---
    "Networking": ["Network Engineering", "TCP/IP", "DNS", "DHCP", "VPN", "SD-WAN", "Load Balancers", "F5", "VLAN", "Arista"],
    "Endpoint & Device Mgmt": ["Intune", "JAMF", "SCCM", "Mobile Device Management", "MDM"],
    "Mainframe & Legacy": ["Mainframe", "COBOL", "CICS", "JCL", "JCL Batch Processing", "ADABAS"],

    // --- 11. State Gov Specific ---
    "Healthcare/Gov Systems": ["EHR Systems", "Electronic Health Records", "MMIS", "Medicaid MMIS", "Medicaid", "CMS Systems", "State Eligibility Systems", "Unemployment Insurance Systems", "Child Welfare Systems", "Grants Management Systems", "FHIR", "HL7", "HL7 v2", "LOINC", "SNOMED", "ICD-10", "CPT Coding"],
    "GIS & Mapping": ["GIS", "ESRI ArcGIS", "ArcGIS", "QGIS", "Geospatial Data", "Cartography"],
    "Procurement": ["Procurement Tools", "eProcurement", "VMS", "Vendor Management Systems"],
    "Accessibility": ["Accessibility WCAG", "Section 508", "WCAG", "ADA compliance"],

    // --- 12. QA & Testing ---
    "Test Automation": ["Automation Testing", "QA Automation", "Selenium", "Cypress", "Playwright", "Cucumber", "JUnit"],
    "Performance/Mobile Testing": ["JMeter", "LoadRunner", "Performance Testing", "Load Testing", "Mobile Testing", "Appium"],
    "Manual/Core Testing": ["QA Testing", "Manual Testing", "UAT", "Regression Testing", "Test Scripts", "Defect Tracking"],

    // --- 13. Architecture & Advanced Concepts ---
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
                    return (match || match).trim();
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
            parsedData['Max C2C Rate'] = `$${rateMatch}/hr`;
        }

        const dateMatch = text.match(/(?:Last Date For Submission|Dead Line)\s*(?:[\r\n]+)?(\d{2})[-/](\d{2})[-/](\d{4})/i);
        if (dateMatch) {
            parsedData['Last Submission Date'] = `${dateMatch}-${dateMatch}-${dateMatch}`;
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
        
        parsedData['Posting Date'] = new Date().toISOString().split('T');

        // --- 2. DYNAMIC SKILL & CERTIFICATE EXTRACTION ---
        const foundSkills = new Set();
        const foundCerts = new Set();
        
        // Loop through the mapped Dictionary for Skills
        Object.entries(MASTER_SKILLS_DICT).forEach(([standardName, aliases]) => {
            const hasMatch = aliases.some(alias => {
                const regex = new RegExp(`(?:^|\\W)${escapeRegExp(alias)}(?:$|\\W)`, 'i');
                return regex.test(text);
            });

            if (hasMatch) {
                foundSkills.add(standardName);
            }
        });

        // Loop through the mapped Dictionary for Certs
        Object.entries(MASTER_CERTIFICATIONS_DICT).forEach(([standardName, aliases]) => {
            const hasMatch = aliases.some(alias => {
                const regex = new RegExp(`(?:^|\\W)${escapeRegExp(alias)}(?:$|\\W)`, 'i');
                return regex.test(text);
            });

            if (hasMatch) {
                foundCerts.add(standardName);
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
                        Paste the full job description. The system maps variations, abbreviations, and full forms from Dice, Monster, LinkedIn, and Government systems into your standardized skill categories.
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
                        {submitSuccess && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{submitSuccess}</div>}
                        {parseSuccess && !submitSuccess && <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-6">{parseSuccess}</div>}

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
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-green-400" disabled={loading || !!submitSuccess}>
                            {loading ? <Spinner size="6" /> : 'Submit Job Posting'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default JobPostingFormPage;