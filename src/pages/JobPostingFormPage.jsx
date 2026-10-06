import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
    Sparkles: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
        </svg>
    ),
    Briefcase: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    CheckCircle: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    AlertTriangle: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
    ),
    Wand: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m15 4 5 5L8 21l-5-5Z" />
            <path d="m14 5 5 5" /><path d="M6 4v4" /><path d="M4 6h4" /><path d="M19 16v4" /><path d="M17 18h4" />
        </svg>
    ),
    Target: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
    ),
    Layers: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 2 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" />
        </svg>
    ),
    FileText: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
        </svg>
    ),
    Trash: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 15H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" />
        </svg>
    ),
    ChevronDown: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    ),
    Check: ({ className = '' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m20 6-11 11-5-5" />
        </svg>
    ),
};

// ============================================================================
// POSTING OPTIONS & DICTIONARIES (UNTOUCHED)
// ============================================================================

const POSTING_FROM_OPTIONS = [
    'State Of Texas', 'State Of Michigan', 'State of North Carolina', 'State Of New Jersey',
    'State Of Georgia', 'State Of Iowa', 'State Of Connecticut', 'State Of Virginia',
    'State Of Indiana', 'Virtusa', 'Deloitte', 'Other',
];

const SKILL_CATALOG = [
    { name: 'Java', category: 'Languages', aliases: ['Java', 'Core Java'] },
    { name: 'J2EE', category: 'Java', aliases: ['J2EE', 'JEE', 'Java EE', 'Java Enterprise Edition'] },
    { name: 'Spring Boot', category: 'Java', aliases: ['Spring Boot', 'SpringBoot'] },
    { name: 'Spring Framework', category: 'Java', aliases: ['Spring Framework', 'Spring'] },
    { name: 'Spring MVC', category: 'Java', aliases: ['Spring MVC'] },
    { name: 'Spring Security', category: 'Java', aliases: ['Spring Security'] },
    { name: 'Hibernate', category: 'Java', aliases: ['Hibernate'] },
    { name: 'JPA', category: 'Java', aliases: ['JPA', 'Java Persistence API'] },
    { name: 'Maven', category: 'Build Tools', aliases: ['Maven', 'Apache Maven'] },
    { name: 'Gradle', category: 'Build Tools', aliases: ['Gradle'] },
    { name: 'Eclipse', category: 'Development Tools', aliases: ['Eclipse', 'Eclipse IDE'] },
    { name: 'Spring Tool Suite', category: 'Development Tools', aliases: ['Spring Tool Suite', 'Spring Tools', 'STS'] },
    { name: 'IntelliJ IDEA', category: 'Development Tools', aliases: ['IntelliJ IDEA', 'IntelliJ'] },
    { name: 'JavaScript', category: 'Languages', aliases: ['JavaScript', 'Javascript', 'ECMAScript'] },
    { name: 'TypeScript', category: 'Languages', aliases: ['TypeScript', 'Typescript'] },
    { name: 'Node.js', category: 'Backend', aliases: ['Node.js', 'NodeJS', 'Node JS'] },
    { name: 'Express.js', category: 'Backend', aliases: ['Express.js', 'ExpressJS', 'Express JS', 'Express'] },
    { name: 'GraphQL', category: 'API', aliases: ['GraphQL', 'Graph QL'] },
    { name: 'Apollo GraphQL', category: 'API', aliases: ['Apollo GraphQL', 'ApolloGraphQL', 'Apollo Graph QL', 'ApollographQL', 'Apollo Graphql'] },
    { name: 'express-graphql', category: 'API', aliases: ['express-graphql', 'Express-graphQL', 'Express GraphQL'] },
    { name: 'Knex.js', category: 'Backend', aliases: ['Knex.js', 'KnexJS', 'Knex JS', 'Knex'] },
    { name: 'Passport.js', category: 'Security', aliases: ['Passport.js', 'PassportJS', 'Passport JS', 'passport'] },
    { name: 'passport-saml', category: 'Security', aliases: ['passport-saml', 'passport saml'] },
    { name: 'Angular 7', category: 'Frontend', aliases: ['Angular 7', 'Angular7'] },
    { name: 'Angular', category: 'Frontend', aliases: ['Angular'] },
    { name: 'AngularJS', category: 'Frontend', aliases: ['AngularJS', 'Angular JS'] },
    { name: 'React', category: 'Frontend', aliases: ['React', 'ReactJS', 'React.js', 'React UI'] },
    { name: 'Next.js', category: 'Frontend', aliases: ['Next.js', 'NextJS', 'Next JS'] },
    { name: 'Vue.js', category: 'Frontend', aliases: ['Vue.js', 'VueJS', 'Vue JS', 'Vue'] },
    { name: 'HTML', category: 'Frontend', aliases: ['HTML', 'HTML5'] },
    { name: 'CSS', category: 'Frontend', aliases: ['CSS', 'CSS3'] },
    { name: 'Bootstrap', category: 'Frontend', aliases: ['Bootstrap'] },
    { name: 'Tailwind CSS', category: 'Frontend', aliases: ['Tailwind CSS', 'TailwindCSS', 'Tailwind'] },
    { name: 'SASS', category: 'Frontend', aliases: ['SASS', 'SCSS'] },
    { name: 'REST API', category: 'API', aliases: ['REST API', 'REST APIs', 'RESTAPI', 'RESTful API', 'RESTful APIs', 'REST Web Services'] },
    { name: 'SOAP', category: 'API', aliases: ['SOAP', 'SOAP API', 'SOAP Web Services'] },
    { name: 'OpenAPI', category: 'API', aliases: ['OpenAPI', 'Open API'] },
    { name: 'Swagger', category: 'API', aliases: ['Swagger'] },
    { name: 'Postman', category: 'API', aliases: ['Postman'] },
    { name: 'Apigee', category: 'API', aliases: ['Apigee'] },
    { name: 'MuleSoft', category: 'Integration', aliases: ['MuleSoft', 'Mulesoft'] },
    { name: 'Boomi', category: 'Integration', aliases: ['Dell Boomi', 'Boomi'] },
    { name: 'Informatica', category: 'Integration', aliases: ['Informatica'] },
    { name: 'SSIS', category: 'Integration', aliases: ['SSIS', 'SQL Server Integration Services'] },
    { name: 'AWS', category: 'AWS', aliases: ['AWS', 'Amazon Web Services', 'AWS Experience', 'Aws experience'] },
    { name: 'AWS Fargate', category: 'AWS', aliases: ['AWS Fargate', 'Amazon Fargate', 'Fargate'] },
    { name: 'Amazon ECS', category: 'AWS', aliases: ['Amazon ECS', 'AWS ECS', 'Elastic Container Service'] },
    { name: 'Amazon ECR', category: 'AWS', aliases: ['Amazon ECR', 'AWS ECR', 'Elastic Container Registry'] },
    { name: 'Amazon EC2', category: 'AWS', aliases: ['Amazon EC2', 'AWS EC2', 'EC2'] },
    { name: 'Amazon S3', category: 'AWS', aliases: ['Amazon S3', 'AWS S3', 'S3 Bucket', 'S3 Buckets', 'S3'] },
    { name: 'AWS Lambda', category: 'AWS', aliases: ['AWS Lambda', 'Amazon Lambda', 'Amazon Lambda Functions', 'AWS Lambda Functions', 'Lambda Functions'] },
    { name: 'AWS SDK', category: 'AWS', aliases: ['AWS SDK', 'aws-sdk', 'AWS Software Development Kit'] },
    { name: 'AWS CodeCommit', category: 'AWS', aliases: ['AWS CodeCommit', 'Amazon CodeCommit', 'CodeCommit', 'Amazon Commit'] },
    { name: 'Amazon EKS', category: 'AWS', aliases: ['Amazon EKS', 'AWS EKS', 'EKS'] },
    { name: 'Amazon RDS', category: 'AWS', aliases: ['Amazon RDS', 'AWS RDS'] },
    { name: 'Amazon DynamoDB', category: 'AWS', aliases: ['Amazon DynamoDB', 'AWS DynamoDB', 'DynamoDB'] },
    { name: 'AWS CloudFormation', category: 'AWS', aliases: ['AWS CloudFormation', 'Amazon CloudFormation', 'CloudFormation'] },
    { name: 'Amazon CloudWatch', category: 'AWS', aliases: ['Amazon CloudWatch', 'AWS CloudWatch', 'CloudWatch'] },
    { name: 'Amazon SQS', category: 'AWS', aliases: ['Amazon SQS', 'AWS SQS'] },
    { name: 'Amazon SNS', category: 'AWS', aliases: ['Amazon SNS', 'AWS SNS'] },
    { name: 'Microsoft Azure', category: 'Azure', aliases: ['Microsoft Azure', 'Azure'] },
    { name: 'Azure Functions', category: 'Azure', aliases: ['Azure Functions'] },
    { name: 'Azure App Service', category: 'Azure', aliases: ['Azure App Service', 'App Service'] },
    { name: 'Azure Logic Apps', category: 'Azure', aliases: ['Azure Logic Apps', 'Logic Apps'] },
    { name: 'Azure Data Factory', category: 'Azure', aliases: ['Azure Data Factory', 'ADF'] },
    { name: 'Azure OpenAI', category: 'Azure', aliases: ['Azure OpenAI', 'Azure Open AI'] },
    { name: 'Azure DevOps', category: 'DevOps', aliases: ['Azure DevOps'] },
    { name: 'Azure Pipelines', category: 'DevOps', aliases: ['Azure Pipelines'] },
    { name: 'Azure Kubernetes Service', category: 'Azure', aliases: ['Azure Kubernetes Service', 'AKS'] },
    { name: 'Azure Cosmos DB', category: 'Database', aliases: ['Azure Cosmos DB', 'Cosmos DB', 'CosmosDB'] },
    { name: 'Google Cloud Platform', category: 'GCP', aliases: ['Google Cloud Platform', 'Google Cloud', 'GCP'] },
    { name: 'BigQuery', category: 'GCP', aliases: ['BigQuery', 'Google BigQuery'] },
    { name: 'Google Cloud Run', category: 'GCP', aliases: ['Google Cloud Run', 'Cloud Run'] },
    { name: 'Google Vertex AI', category: 'GCP', aliases: ['Google Vertex AI', 'Vertex AI'] },
    { name: 'Docker', category: 'Containers', aliases: ['Docker', 'Docker Containers'] },
    { name: 'Kubernetes', category: 'Containers', aliases: ['Kubernetes', 'K8s'] },
    { name: 'OpenShift', category: 'Containers', aliases: ['OpenShift', 'Open Shift'] },
    { name: 'Helm', category: 'Containers', aliases: ['Helm', 'Helm Charts'] },
    { name: 'Microservices', category: 'Architecture', aliases: ['Microservices', 'Micro Services', 'Microservice Architecture'] },
    { name: 'PostgreSQL', category: 'Database', aliases: ['PostgreSQL', 'Postgre SQL', 'Postgres', 'Amazon Postgres', 'Amazon PostgreSQL', 'Amazon Postgres Database', 'AWS Postgres', 'AWS PostgreSQL'] },
    { name: 'Oracle Database', category: 'Database', aliases: ['Oracle Database', 'Oracle DB'] },
    { name: 'Oracle 19c', category: 'Database', aliases: ['Oracle 19c', 'Oracle Database 19c'] },
    { name: 'Microsoft SQL Server', category: 'Database', aliases: ['Microsoft SQL Server', 'SQL Server', 'MS SQL Server', 'MSSQL'] },
    { name: 'MySQL', category: 'Database', aliases: ['MySQL', 'My SQL'] },
    { name: 'MariaDB', category: 'Database', aliases: ['MariaDB', 'Maria DB'] },
    { name: 'MongoDB', category: 'Database', aliases: ['MongoDB', 'Mongo DB'] },
    { name: 'Redis', category: 'Database', aliases: ['Redis'] },
    { name: 'Cassandra', category: 'Database', aliases: ['Cassandra', 'Apache Cassandra'] },
    { name: 'SQL', category: 'Database', aliases: ['SQL'] },
    { name: 'PL/SQL', category: 'Database', aliases: ['PL/SQL', 'PLSQL'] },
    { name: 'T-SQL', category: 'Database', aliases: ['T-SQL', 'TSQL', 'Transact-SQL'] },
    { name: 'Git', category: 'DevOps', aliases: ['Git'] },
    { name: 'GitHub', category: 'DevOps', aliases: ['GitHub', 'Github'] },
    { name: 'GitLab', category: 'DevOps', aliases: ['GitLab', 'Git Lab'] },
    { name: 'Bitbucket', category: 'DevOps', aliases: ['Bitbucket', 'BitBucket'] },
    { name: 'SVN', category: 'DevOps', aliases: ['SVN', 'Subversion', 'Apache Subversion'] },
    { name: 'Jenkins', category: 'DevOps', aliases: ['Jenkins'] },
    { name: 'GitHub Actions', category: 'DevOps', aliases: ['GitHub Actions', 'Github Actions'] },
    { name: 'CI/CD', category: 'DevOps', aliases: ['CI/CD', 'Continuous Integration', 'Continuous Delivery', 'Continuous Deployment'] },
    { name: 'Terraform', category: 'DevOps', aliases: ['Terraform'] },
    { name: 'Ansible', category: 'DevOps', aliases: ['Ansible'] },
    { name: '.NET', category: '.NET', aliases: ['.NET', 'Dot Net'] },
    { name: '.NET Core', category: '.NET', aliases: ['.NET Core', 'Dot Net Core'] },
    { name: '.NET 8', category: '.NET', aliases: ['.NET 8', 'NET 8'] },
    { name: 'C#', category: 'Languages', aliases: ['C#', 'C-Sharp', 'C Sharp'] },
    { name: 'ASP.NET', category: '.NET', aliases: ['ASP.NET', 'ASP Net'] },
    { name: 'ASP.NET Core', category: '.NET', aliases: ['ASP.NET Core', 'ASP Net Core'] },
    { name: 'Python', category: 'Languages', aliases: ['Python'] },
    { name: 'Django', category: 'Python', aliases: ['Django'] },
    { name: 'Flask', category: 'Python', aliases: ['Flask'] },
    { name: 'FastAPI', category: 'Python', aliases: ['FastAPI', 'Fast API'] },
    { name: 'Pandas', category: 'Python', aliases: ['Pandas'] },
    { name: 'NumPy', category: 'Python', aliases: ['NumPy', 'Numpy'] },
    { name: 'C++', category: 'Languages', aliases: ['C++'] },
    { name: 'Go', category: 'Languages', aliases: ['Golang', 'GoLang'] },
    { name: 'Rust', category: 'Languages', aliases: ['Rust'] },
    { name: 'Scala', category: 'Languages', aliases: ['Scala'] },
    { name: 'Ruby', category: 'Languages', aliases: ['Ruby'] },
    { name: 'Snowflake', category: 'Data', aliases: ['Snowflake'] },
    { name: 'Databricks', category: 'Data', aliases: ['Databricks'] },
    { name: 'Apache Spark', category: 'Data', aliases: ['Apache Spark', 'Spark'] },
    { name: 'Apache Kafka', category: 'Data', aliases: ['Apache Kafka', 'Kafka'] },
    { name: 'Apache Hadoop', category: 'Data', aliases: ['Apache Hadoop', 'Hadoop'] },
    { name: 'Apache Airflow', category: 'Data', aliases: ['Apache Airflow', 'Airflow'] },
    { name: 'ETL', category: 'Data', aliases: ['ETL', 'ETL Pipelines'] },
    { name: 'Data Modeling', category: 'Data', aliases: ['Data Modeling', 'Data Modelling'] },
    { name: 'Power BI', category: 'BI', aliases: ['Power BI', 'PowerBI'] },
    { name: 'Tableau', category: 'BI', aliases: ['Tableau'] },
    { name: 'DAX', category: 'BI', aliases: ['DAX'] },
    { name: 'Power Query', category: 'BI', aliases: ['Power Query'] },
    { name: 'Machine Learning', category: 'AI', aliases: ['Machine Learning'] },
    { name: 'Generative AI', category: 'AI', aliases: ['Generative AI', 'GenAI', 'Gen AI'] },
    { name: 'Large Language Models', category: 'AI', aliases: ['Large Language Models', 'Large Language Model', 'LLMs', 'LLM'] },
    { name: 'Natural Language Processing', category: 'AI', aliases: ['Natural Language Processing', 'NLP'] },
    { name: 'OpenAI API', category: 'AI', aliases: ['OpenAI API', 'OpenAI APIs'] },
    { name: 'TensorFlow', category: 'AI', aliases: ['TensorFlow'] },
    { name: 'PyTorch', category: 'AI', aliases: ['PyTorch', 'Pytorch'] },
    { name: 'Scikit-learn', category: 'AI', aliases: ['Scikit-learn', 'Scikit Learn', 'sklearn'] },
    { name: 'SAML', category: 'Security', aliases: ['SAML', 'SAML 2.0'] },
    { name: 'OAuth', category: 'Security', aliases: ['OAuth', 'OAuth 2.0', 'OAuth2'] },
    { name: 'SSO', category: 'Security', aliases: ['SSO', 'Single Sign-On', 'Single Sign On'] },
    { name: 'IAM', category: 'Security', aliases: ['IAM', 'Identity and Access Management', 'Identity & Access Management'] },
    { name: 'Active Directory', category: 'Security', aliases: ['Active Directory'] },
    { name: 'Microsoft Entra ID', category: 'Security', aliases: ['Microsoft Entra ID', 'Entra ID', 'Azure AD', 'Azure Active Directory'] },
    { name: 'Okta', category: 'Security', aliases: ['Okta'] },
    { name: 'CyberArk', category: 'Security', aliases: ['CyberArk', 'Cyber Ark'] },
    { name: 'SailPoint', category: 'Security', aliases: ['SailPoint', 'Sail Point'] },
    { name: 'Splunk', category: 'Security', aliases: ['Splunk'] },
    { name: 'Microsoft Sentinel', category: 'Security', aliases: ['Microsoft Sentinel', 'Azure Sentinel'] },
    { name: 'SonarQube', category: 'Security', aliases: ['SonarQube', 'Sonar Qube'] },
    { name: 'Selenium', category: 'Testing', aliases: ['Selenium'] },
    { name: 'Cypress', category: 'Testing', aliases: ['Cypress'] },
    { name: 'Playwright', category: 'Testing', aliases: ['Playwright'] },
    { name: 'Cucumber', category: 'Testing', aliases: ['Cucumber'] },
    { name: 'JUnit', category: 'Testing', aliases: ['JUnit'] },
    { name: 'Appium', category: 'Testing', aliases: ['Appium'] },
    { name: 'JMeter', category: 'Testing', aliases: ['JMeter', 'Apache JMeter'] },
    { name: 'Automation Testing', category: 'Testing', aliases: ['Automation Testing', 'QA Automation'] },
    { name: 'Regression Testing', category: 'Testing', aliases: ['Regression Testing'] },
    { name: 'UAT', category: 'Testing', aliases: ['UAT', 'User Acceptance Testing'] },
    { name: 'Agile', category: 'Methodology', aliases: ['Agile', 'Agile Methodology', 'Agile Methodologies'] },
    { name: 'Scrum', category: 'Methodology', aliases: ['Scrum'] },
    { name: 'SAFe', category: 'Methodology', aliases: ['SAFe', 'Scaled Agile Framework'] },
    { name: 'Kanban', category: 'Methodology', aliases: ['Kanban'] },
    { name: 'Jira', category: 'Tools', aliases: ['Jira'] },
    { name: 'Confluence', category: 'Tools', aliases: ['Confluence'] },
    { name: 'MMIS', category: 'Healthcare', aliases: ['MMIS', 'Medicaid Management Information System'] },
    { name: 'FHIR', category: 'Healthcare', aliases: ['FHIR'] },
    { name: 'HL7', category: 'Healthcare', aliases: ['HL7'] },
    { name: 'HL7 v2', category: 'Healthcare', aliases: ['HL7 v2', 'HL7v2'] },
    { name: 'TCP/IP', category: 'Networking', aliases: ['TCP/IP', 'TCP IP'] },
    { name: 'DNS', category: 'Networking', aliases: ['DNS'] },
    { name: 'DHCP', category: 'Networking', aliases: ['DHCP'] },
    { name: 'VPN', category: 'Networking', aliases: ['VPN'] },
    { name: 'F5', category: 'Networking', aliases: ['F5', 'F5 BIG-IP', 'BIG-IP'] },
];

const MASTER_CERTIFICATIONS_DICT = {
    PMP: ['PMP', 'Project Management Professional'],
    'PMI-ACP': ['PMI-ACP', 'Agile Certified Practitioner'],
    'Scrum Master': ['CSM', 'Certified ScrumMaster', 'PSM', 'Scrum Master', 'CSPO', 'Certified Scrum Product Owner'],
    SAFe: ['SAFe Agilist', 'SAFe Practitioner', 'SAFe Certification'],
    ITIL: ['ITIL Foundation', 'ITIL Intermediate', 'ITIL', 'ITIL v3', 'ITIL v4'],
    'Six Sigma': ['Six Sigma Green Belt', 'Six Sigma Black Belt', 'Lean Practitioner'],
    'Business Analysis': ['CBAP', 'Certified Business Analysis Professional'],
    'AWS Certifications': ['AWS Certification', 'AWS Certified', 'AWS Cloud Practitioner', 'AWS Solutions Architect', 'AWS Developer'],
    'Azure Certifications': ['Azure Fundamentals', 'AZ-900', 'Azure Administrator', 'Azure Architect', 'Azure Database Administrator Associate'],
    'GCP Certifications': ['Google Cloud Associate', 'Google Cloud Professional'],
    CompTIA: ['Security+', 'Network+', 'A+'],
    'Cybersecurity Pro': ['CISSP', 'CISM', 'CEH', 'Certified Ethical Hacker', 'CHFI'],
    'Cisco Networking': ['CCNA', 'CCNP', 'CCIE'],
    Salesforce: ['Salesforce Admin', 'Salesforce Administrator', 'Salesforce Developer'],
    'Software Testing': ['ISTQB', 'Certified Tester'],
};

const SKILL_SUPPRESSION_RULES = {
    'Angular 7': ['Angular'],
    'Spring Boot': ['Spring Framework'],
    'Oracle 19c': ['Oracle Database'],
    '.NET Core': ['.NET'],
    '.NET 8': ['.NET'],
    'ASP.NET Core': ['ASP.NET'],
    'HL7 v2': ['HL7'],
};

// ============================================================================
// PARSER LOGIC (UNTOUCHED)
// ============================================================================

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSourceText = (value = '') => {
    if (!value) return '';
    let normalized = String(value);
    normalized = normalized.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
        try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return ' '; }
    });
    normalized = normalized.replace(/&#(\d+);/g, (_, decimal) => {
        try { return String.fromCodePoint(parseInt(decimal, 10)); } catch { return ' '; }
    });
    normalized = normalized
        .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
        .replace(/\u00A0/g, ' ').replace(/\u200B/g, '').replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'").replace(/[–—−]/g, '-').replace(/\r\n?/g, '\n')
        .replace(/[ \t]+/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n');
    return normalized.trim();
};

const TOKEN_CHARACTERS = 'A-Za-z0-9_+#.\\-';

const createAliasRegex = (alias) => {
    const escapedAlias = String(alias).trim().split(/\s+/).map(escapeRegExp).join('\\s+');
    return new RegExp(`(^|[^${TOKEN_CHARACTERS}])(${escapedAlias})(?=$|[^${TOKEN_CHARACTERS}])`, 'gi');
};

const findAllAliasOccurrences = (text, alias) => {
    const regex = createAliasRegex(alias);
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        const leadingBoundary = match[1] || '';
        const actualMatch = match[2] || alias;
        matches.push({
            index: match.index + leadingBoundary.length,
            length: actualMatch.length,
            actualMatch,
        });
        if (regex.lastIndex === match.index) {
            regex.lastIndex += 1;
        }
    }
    return matches;
};

const REQUIRED_SKILL_SECTION_HEADINGS = [
    /following\s+skill\s+set\s+is\s+required[^:\n]*:?\s*/gi,
    /required\s+technical\s+skills?\s*:?\s*/gi,
    /required\s+skills?\s*:?\s*/gi,
    /mandatory\s+skills?\s*:?\s*/gi,
    /must[-\s]+have\s+skills?\s*:?\s*/gi,
    /technical\s+requirements?\s*:?\s*/gi,
    /key\s+skills?\s*:?\s*/gi,
];

const REQUIRED_SKILL_SECTION_ENDINGS = [
    /\n\s*skill\s*\n\s*required\s*\/\s*desired/i,
    /\n\s*skill\s+required\s*\/\s*desired/i,
    /\n\s*required\s*\/\s*desired/i,
    /\n\s*education\s*:?\s*\n/i,
    /\n\s*responsibilities\s*:?\s*\n/i,
    /\n\s*interview process\s*:?\s*\n/i,
    /\n\s*submission details\s*:?\s*\n/i,
];

const getRequiredSkillRanges = (text) => {
    const ranges = [];
    REQUIRED_SKILL_SECTION_HEADINGS.forEach(headingPattern => {
        headingPattern.lastIndex = 0;
        let headingMatch;
        while ((headingMatch = headingPattern.exec(text)) !== null) {
            const start = headingMatch.index + headingMatch[0].length;
            const remaining = text.slice(start);
            let end = text.length;
            REQUIRED_SKILL_SECTION_ENDINGS.forEach(endingPattern => {
                const endingMatch = endingPattern.exec(remaining);
                if (endingMatch) {
                    const candidateEnd = start + endingMatch.index;
                    if (candidateEnd < end) end = candidateEnd;
                }
            });
            ranges.push({ start, end });
            if (headingPattern.lastIndex === headingMatch.index) {
                headingPattern.lastIndex += 1;
            }
        }
    });
    return ranges;
};

const isIndexInRanges = (index, ranges) => ranges.some(range => index >= range.start && index <= range.end);

const getRequirementContextScore = (text, matchIndex) => {
    const beforeStart = Math.max(0, matchIndex - 280);
    const afterEnd = Math.min(text.length, matchIndex + 280);
    const context = text.slice(beforeStart, afterEnd);
    if (/\brequired\b/i.test(context)) return { score: 28, reason: 'Required' };
    if (/\bhighly desired\b/i.test(context)) return { score: 18, reason: 'Highly desired' };
    if (/\bpreferred\b|\bdesired\b/i.test(context)) return { score: 12, reason: 'Desired' };
    return { score: 0, reason: 'Mentioned' };
};

const detectKnownSkills = (text) => {
    const requiredRanges = getRequiredSkillRanges(text);
    const results = [];
    SKILL_CATALOG.forEach((skill, catalogIndex) => {
        let allOccurrences = [];
        skill.aliases.forEach(alias => {
            const occurrences = findAllAliasOccurrences(text, alias).map(occurrence => ({ ...occurrence, alias }));
            allOccurrences = [...allOccurrences, ...occurrences];
        });
        if (!allOccurrences.length) return;
        allOccurrences.sort((a, b) => a.index - b.index || b.length - a.length);
        const first = allOccurrences[0];
        let score = 50;
        const explicitRequired = allOccurrences.some(occurrence => isIndexInRanges(occurrence.index, requiredRanges));
        if (explicitRequired) score += 35;
        let strongestContext = { score: 0, reason: 'Mentioned' };
        allOccurrences.forEach(occurrence => {
            const requirementContext = getRequirementContextScore(text, occurrence.index);
            if (requirementContext.score > strongestContext.score) {
                strongestContext = requirementContext;
            }
        });
        score += strongestContext.score;
        score += Math.min(12, Math.max(0, allOccurrences.length - 1) * 3);
        let reason = 'Mentioned';
        if (explicitRequired) {
            reason = 'Explicit skill section';
        } else if (strongestContext.reason !== 'Mentioned') {
            reason = strongestContext.reason;
        }
        results.push({ name: skill.name, category: skill.category, index: first.index, count: allOccurrences.length, score: Math.min(score, 100), reason, catalogIndex, matchedAlias: first.alias });
    });
    return results;
};

const GENERIC_SKILL_LINES = [
    /^database$/i, /^databases$/i, /^skills?$/i, /^technical skills?$/i, /^required skills?$/i,
    /^preferred skills?$/i, /^required$/i, /^desired$/i, /^highly desired$/i, /^years?$/i,
    /^amount$/i, /^years? of experience$/i, /^required\s*\/\s*desired$/i, /^aws skills?$/i,
    /^amazon aws skills?$/i, /^serverless container orchestration service$/i,
];

const cleanSkillLine = (line = '') => line.replace(/^[\s•●▪◦*-]+/, '').replace(/^\d+[.)]\s*/, '').replace(/\s+/g, ' ').replace(/[;,]+$/g, '').trim();

const isGenericSkillLine = (line) => {
    if (!line) return true;
    if (GENERIC_SKILL_LINES.some(pattern => pattern.test(line))) return true;
    if (/:$/.test(line)) return true;
    if (/\b(certification|certificate|certified)\b/i.test(line)) return true;
    if (line.length > 80) return true;
    if (line.split(/\s+/).length > 8) return true;
    return false;
};

const looksLikeTechnology = (line) => {
    if (!line) return false;
    const containsNumber = /\d/.test(line);
    const containsTechnicalPunctuation = /[+#._/-]/.test(line);
    const containsAcronym = /\b[A-Z]{2,}\b/.test(line);
    const containsCamelCase = /[a-z][A-Z]/.test(line);
    const techWord = /\b(api|sdk|framework|server|database|cloud|engine|studio|platform|runtime|library|service|tool|ui|js)\b/i.test(line);
    return (containsNumber || containsTechnicalPunctuation || containsAcronym || containsCamelCase || techWord);
};

const extractUnknownSkillsFromRequiredSections = (text, knownSkills) => {
    const ranges = getRequiredSkillRanges(text);
    if (!ranges.length) return [];
    const knownNames = new Set(knownSkills.map(skill => skill.name.toLowerCase()));
    const results = [];
    ranges.forEach(range => {
        const sectionText = text.slice(range.start, range.end);
        let localOffset = 0;
        sectionText.split('\n').forEach(rawLine => {
            const linePosition = sectionText.indexOf(rawLine, localOffset);
            localOffset = Math.max(linePosition, localOffset) + rawLine.length + 1;
            const cleaned = cleanSkillLine(rawLine);
            if (isGenericSkillLine(cleaned)) return;
            const knownOnLine = detectKnownSkills(cleaned);
            if (knownOnLine.length) return;
            if (!looksLikeTechnology(cleaned)) return;
            const duplicate = knownNames.has(cleaned.toLowerCase());
            if (duplicate) return;
            results.push({
                name: cleaned, category: 'Detected', index: range.start + Math.max(linePosition, 0),
                count: 1, score: 82, reason: 'Explicit skill section', catalogIndex: Number.MAX_SAFE_INTEGER, matchedAlias: cleaned,
            });
            knownNames.add(cleaned.toLowerCase());
        });
    });
    return results;
};

const applySkillSuppressionRules = (skills) => {
    const names = new Set(skills.map(skill => skill.name));
    Object.entries(SKILL_SUPPRESSION_RULES).forEach(([specificSkill, genericSkills]) => {
        if (!names.has(specificSkill)) return;
        genericSkills.forEach(genericSkill => { names.delete(genericSkill); });
    });
    return skills.filter(skill => names.has(skill.name));
};

const removeObviousAliasArtifacts = (skills, normalizedText) => {
    const skillMap = new Map(skills.map(skill => [skill.name, skill]));
    if (skillMap.has('passport-saml') && skillMap.has('SAML')) {
        const independentSaml = normalizedText.replace(/passport[\s-]+saml/gi, '').match(/(^|[^A-Za-z0-9_+#.\-])SAML(?=$|[^A-Za-z0-9_+#.\-])/i);
        if (!independentSaml) skillMap.delete('SAML');
    }
    if (skillMap.has('Apollo GraphQL') && skillMap.has('GraphQL')) {
        const stripped = normalizedText.replace(/Apollo\s*Graph\s*QL|ApolloGraphQL|ApollographQL/gi, '');
        const independentGraphql = stripped.match(/(^|[^A-Za-z0-9_+#.\-])GraphQL(?=$|[^A-Za-z0-9_+#.\-])/i);
        if (!independentGraphql) skillMap.delete('GraphQL');
    }
    if (skillMap.has('express-graphql') && skillMap.has('GraphQL')) {
        const stripped = normalizedText.replace(/express[\s-]*graphql/gi, '');
        const independentGraphql = stripped.match(/(^|[^A-Za-z0-9_+#.\-])GraphQL(?=$|[^A-Za-z0-9_+#.\-])/i);
        if (!independentGraphql) skillMap.delete('GraphQL');
    }
    return Array.from(skillMap.values());
};

const extractRequiredSkills = (sourceText) => {
    const normalizedText = normalizeSourceText(sourceText);
    if (!normalizedText) return [];
    let knownSkills = detectKnownSkills(normalizedText);
    const unknownSkills = extractUnknownSkillsFromRequiredSections(normalizedText, knownSkills);
    let combined = [...knownSkills, ...unknownSkills];
    combined = applySkillSuppressionRules(combined);
    combined = removeObviousAliasArtifacts(combined, normalizedText);
    const deduplicated = [];
    const seen = new Set();
    combined.forEach(skill => {
        const key = skill.name.trim().toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        deduplicated.push(skill);
    });
    deduplicated.sort((a, b) => a.index - b.index || b.score - a.score || a.catalogIndex - b.catalogIndex);
    return deduplicated;
};

const extractCertifications = (sourceText) => {
    const text = normalizeSourceText(sourceText);
    const found = new Set();
    Object.entries(MASTER_CERTIFICATIONS_DICT).forEach(([standardName, aliases]) => {
        const hasMatch = aliases.some(alias => {
            const regex = createAliasRegex(alias);
            return regex.test(text);
        });
        if (hasMatch) found.add(standardName);
    });
    return Array.from(found);
};

// ============================================================================
// COMPONENT
// ============================================================================

const JobPostingFormPage = ({ onFormSubmit }) => {
    const { user } = useAuth();
    const { canAddPosting } = usePermissions();

    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [parseSuccess, setParseSuccess] = useState('');
    const [rawText, setRawText] = useState('');
    const [detectedSkills, setDetectedSkills] = useState([]);
    const [parserMeta, setParserMeta] = useState({ skillCount: 0, strongCount: 0, categoryCount: 0, certificateCount: 0 });

    const postingFromOptions = useMemo(() => POSTING_FROM_OPTIONS, []);

    // ========================================================================
    // FORM FIELDS
    // ========================================================================
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

    const skillPreview = useMemo(() => {
        const value = formData['Required Skill Set'];
        if (!value || value.startsWith('Could not auto-detect')) return [];
        return value.split(',').map(item => item.trim()).filter(Boolean);
    }, [formData]);

    // ========================================================================
    // STANDARD FIELD EXTRACTION & PARSER
    // ========================================================================
    const extractStandardFields = (originalText) => {
        const text = normalizeSourceText(originalText);
        const parsedData = {};
        const extract = patterns => {
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) return (match[1] || match[0]).trim();
            }
            return '';
        };

        parsedData['Posting ID'] = extract([/Solicitation Reference Number:\s*([A-Z0-9-]+)/i, /Job Id:?\s*(?:\n+)?[\s\S]*?\(\s*([A-Z0-9-]{5,})\s*\)/i, /\b([0-9]{6,})\b/]);
        parsedData['Posting Title'] = extract([/Working Title:\s*(.+)/i, /Job Id:?\s*(?:\n+)?(.+?)\s*\(\s*[A-Z0-9-]{5,}\s*\)/i, /Title\s*:\s*(.+)/i]);
        parsedData['Client Name'] = extract([/Client Info\s*(?:\n+)?(.+)/i, /State Name:\s*(?:\n+)?(.+?)(?:\n|$)/i, /Client Name:\s*(?:\n+)?(.+)/i]);
        parsedData['Max Submissions'] = extract([/Max Submittals by Vendor:\s*(?:\n+)?\s*(\d+)/i, /Max Submissions?:\s*(?:\n+)?\s*(\d+)/i]);
        parsedData['Work Location'] = extract([/Work Location\s*:?\s*(?:\n+)?(.+)/i, /Worksite Address:?\s*(?:\n+)?(.+)/i]);
        parsedData['Work Position Type'] = extract([/Work Arrangement:?\s*(?:\n+)?(Hybrid|Remote|Onsite|On-site|Telework)/i]);
        
        if (parsedData['Work Position Type'] === 'On-site') parsedData['Work Position Type'] = 'Onsite';

        const ratePatterns = [/(?:C\s*2\s*C|C2C|NTE Rate:?)[\s\n]*\$?\s*(\d+(?:\.\d{1,2})?)\s*\$?\s*(?:Per\s*(?:Hr|Hour)|\/?\s*Hr)?/i, /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/\s*hr|per\s*hour|per\s*hr)/i];
        for (const pattern of ratePatterns) {
            const match = text.match(pattern);
            if (match) { parsedData['Max C2C Rate'] = `$${match[1]}/hr`; break; }
        }

        const dateMatch = text.match(/(?:Last Date For Submission|Last Submission Date|Dead Line|Deadline)\s*:?\s*(?:\n+)?(\d{1,2})[-/](\d{1,2})[-/](\d{4})/i);
        if (dateMatch) {
            const month = String(dateMatch[1]).padStart(2, '0');
            const day = String(dateMatch[2]).padStart(2, '0');
            const year = dateMatch[3];
            parsedData['Last Submission Date'] = `${year}-${month}-${day}`;
        }

        if (parsedData['Client Name']) {
            const clientName = parsedData['Client Name'].toLowerCase();
            const matchedOption = postingFromOptions.find(option => {
                const normalizedOption = option.toLowerCase().replace('state of ', '');
                return clientName.includes(normalizedOption);
            });
            if (matchedOption) parsedData['Posting From'] = matchedOption;
        }

        parsedData['Posting Date'] = new Date().toISOString().split('T')[0];
        return parsedData;
    };

    const handleParseText = () => {
        if (!rawText.trim()) return;
        setError('');
        setParseSuccess('');

        const parsedData = extractStandardFields(rawText);
        const skills = extractRequiredSkills(rawText);

        if (skills.length) {
            parsedData['Required Skill Set'] = skills.map(skill => skill.name).join(', ');
        } else {
            parsedData['Required Skill Set'] = 'Could not auto-detect skills. Please review manually.';
        }

        const certifications = extractCertifications(rawText);
        if (certifications.length) parsedData['Any Required Certificates'] = certifications.join('; ');

        const categories = new Set(skills.map(skill => skill.category));
        const strongSkills = skills.filter(skill => skill.score >= 80);

        setDetectedSkills(skills);
        setParserMeta({ skillCount: skills.length, strongCount: strongSkills.length, categoryCount: categories.size, certificateCount: certifications.length });
        setFormData(prev => ({ ...prev, ...parsedData }));
        setParseSuccess(skills.length ? `${skills.length} exact normalized skill${skills.length === 1 ? '' : 's'} detected and mapped successfully.` : 'Requisition data extracted. Required Skill Set needs manual review.');
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClearParser = () => {
        setRawText('');
        setDetectedSkills([]);
        setParseSuccess('');
        setParserMeta({ skillCount: 0, strongCount: 0, categoryCount: 0, certificateCount: 0 });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!canAddPosting) { setError('You do not have permission to add new job postings.'); return; }
        
        const payloadToSubmit = { ...formData };
        if (payloadToSubmit['Posting From'] === 'Other') {
            payloadToSubmit['Posting From'] = payloadToSubmit['Client Name'] || '';
        }

        setError(''); setSubmitSuccess(''); setParseSuccess(''); setLoading(true);

        try {
            const response = await apiService.processJobPosting(payloadToSubmit, user.userIdentifier);
            if (response.data.success) {
                setSubmitSuccess(response.data.message);
                setFormData({}); setRawText(''); setDetectedSkills([]);
                setParserMeta({ skillCount: 0, strongCount: 0, categoryCount: 0, certificateCount: 0 });
                if (onFormSubmit) setTimeout(() => onFormSubmit(), 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // REFINED STYLING SYSTEM
    // ========================================================================
    const inputClass = `w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-sm`;
    const labelClass = `mb-1.5 block text-[13px] font-semibold text-slate-700`;

    if (!canAddPosting && !loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <Icons.AlertTriangle className="h-7 w-7 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                    <p className="mt-2 text-sm text-slate-500">You do not have the necessary security clearance to create new job requisitions.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1280px] pb-32">
            
            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Requisition</h1>
                    <p className="mt-2 text-sm text-slate-500">Parse a job description to extract intelligence, or build a requisition manually.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <HeaderMetric label="Extracted Skills" value={parserMeta.skillCount} />
                    <HeaderMetric label="Certifications" value={parserMeta.certificateCount} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Parser Workspace - Split View */}
                <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
                    
                    {/* Left Pane: Input */}
                    <div className="flex flex-col border-b border-slate-200 bg-slate-50/50 p-6 lg:border-b-0 lg:border-r">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-700">
                                <Icons.FileText className="h-5 w-5 text-indigo-500" />
                                <h3 className="text-sm font-semibold">Source Description</h3>
                            </div>
                            {rawText.trim() && (
                                <button type="button" onClick={handleClearParser} className="text-[12px] font-medium text-slate-400 hover:text-slate-600 transition-colors">
                                    Clear Text
                                </button>
                            )}
                        </div>

                        <textarea
                            rows="14"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder="Paste the raw job description from a portal, email, or document..."
                            className="w-full flex-grow resize-y rounded-xl border border-slate-200 bg-white p-4 font-mono text-[13px] leading-relaxed text-slate-700 shadow-inner outline-none transition-all placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 custom-scrollbar"
                        />

                        <div className="mt-5 flex items-center justify-between">
                            <span className="text-[12px] text-slate-400">
                                {rawText.length.toLocaleString()} chars
                            </span>
                            <button
                                type="button"
                                onClick={handleParseText}
                                disabled={!rawText.trim()}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icons.Wand className="h-4 w-4" />
                                Analyze & Auto-Fill
                            </button>
                        </div>
                    </div>

                    {/* Right Pane: Intelligence Output */}
                    <div className="flex flex-col bg-white p-6">
                        <div className="mb-4 flex items-center gap-2 text-slate-700">
                            <Icons.Target className="h-5 w-5 text-emerald-500" />
                            <h3 className="text-sm font-semibold">Intelligence Output</h3>
                        </div>

                        {!detectedSkills.length ? (
                            <div className="flex flex-grow flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center px-6 py-12">
                                <Icons.Sparkles className="mb-3 h-8 w-8 text-slate-300" />
                                <p className="text-sm font-medium text-slate-500">No data extracted yet.</p>
                                <p className="mt-1 text-[12px] text-slate-400">Paste text and run analysis to populate skills.</p>
                            </div>
                        ) : (
                            <div className="flex-grow space-y-2.5 overflow-y-auto pr-2 custom-scrollbar max-h-[360px]">
                                {detectedSkills.map((skill, index) => (
                                    <SkillDetectionRow key={`${skill.name}-${index}`} skill={skill} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Alerts */}
                {(error || submitSuccess || parseSuccess) && (
                    <div className="space-y-3">
                        {error && <StatusAlert tone="error" icon={<Icons.AlertTriangle className="h-5 w-5" />}>{error}</StatusAlert>}
                        {submitSuccess && <StatusAlert tone="success" icon={<Icons.CheckCircle className="h-5 w-5" />}>{submitSuccess}</StatusAlert>}
                        {parseSuccess && !submitSuccess && <StatusAlert tone="info" icon={<Icons.Sparkles className="h-5 w-5" />}>{parseSuccess}</StatusAlert>}
                    </div>
                )}

                {/* Form Fields Card */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="text-base font-semibold text-slate-900">Requisition Details</h2>
                        <p className="text-[13px] text-slate-500">Review mapped fields and adjust as necessary.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 md:grid-cols-2 lg:p-8">
                        {formFields.map(field => (
                            <div key={field.id} className={field.full ? 'md:col-span-2' : ''}>
                                <label htmlFor={field.id} className={labelClass}>
                                    {field.name} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.name === 'Required Skill Set' && skillPreview.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        {skillPreview.map((skill, index) => (
                                            <span key={`${skill}-${index}`} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'textarea' ? (
                                    <textarea
                                        name={field.name} id={field.id} value={formData[field.name] || ''} onChange={handleChange} required={field.required}
                                        rows={field.name === 'Required Skill Set' ? 6 : 3}
                                        className={`${inputClass} custom-scrollbar`}
                                    />
                                ) : field.type === 'select' ? (
                                    <div className="relative">
                                        <select
                                            name={field.name} id={field.id} value={formData[field.name] || ''} onChange={handleChange} required={field.required}
                                            className={`${inputClass} appearance-none cursor-pointer pr-10`}
                                        >
                                            <option value="" disabled>Select an option...</option>
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <Icons.ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                ) : (
                                    <input type={field.type} name={field.name} id={field.id} value={formData[field.name] || ''} onChange={handleChange} required={field.required} className={inputClass} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="fixed bottom-6 left-0 right-0 z-40 mx-auto flex max-w-4xl items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all">
                    <div>
                        <p className="text-[13px] font-semibold text-slate-900">Ready to publish?</p>
                        <p className="hidden text-[12px] text-slate-500 sm:block">Please ensure all required fields are filled correctly.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !!submitSuccess}
                        className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                        {loading ? <Spinner size="5" /> : 'Publish Requisition'}
                    </button>
                </div>

            </form>
        </div>
    );
};

// ============================================================================
// MICRO COMPONENTS
// ============================================================================

const HeaderMetric = ({ label, value }) => (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white px-4 py-2 shadow-sm border border-slate-200 min-w-[90px]">
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
);

const SkillDetectionRow = ({ skill }) => {
    const isStrong = skill.score >= 80;
    const badgeBg = isStrong ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-slate-500/20';

    return (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-900">{skill.name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium uppercase text-slate-500">{skill.category}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{skill.reason}</span>
                    {skill.count > 1 && <span>• {skill.count} Mentions</span>}
                </div>
            </div>
            <div className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${badgeBg}`}>
                {skill.score}%
            </div>
        </div>
    );
};

const StatusAlert = ({ tone, icon, children }) => {
    const tones = {
        error: 'border-red-200 bg-red-50 text-red-800',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    };
    return (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${tones[tone]}`}>
            <div className="mt-0.5 shrink-0">{icon}</div>
            <p className="text-sm font-medium leading-5">{children}</p>
        </div>
    );
};

export default JobPostingFormPage;