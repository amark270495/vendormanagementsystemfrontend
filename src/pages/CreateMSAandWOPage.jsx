import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateMSAandWOPage = ({ onNavigate }) => {
    const { user } = useAuth();
    const { canManageMSAWO } = usePermissions(); 
    const searchRef = useRef(null);

    const initialFormData = {
        vendorName: '', state: '', federalId: '', companyAddress: '', vendorEmail: '',
        authorizedSignatureName: '', authorizedPersonTitle: '', candidateName: '', tentativeStartDate: '',
        jobTitle: '', clientName: '', clientLocation: '', typeOfServices: '',
        typeOfSubcontract: '', rate: '', perHour: '', net: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [companySearch, setCompanySearch] = useState('');
    const [allCompanies, setAllCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showAddCompanyBtn, setShowAddCompanyBtn] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const fetchCompanies = useCallback(async () => {
        if (!canManageMSAWO) return;
        try {
            const response = await apiService.getMSAWOVendorCompanies(user.userIdentifier);
            if (response.data.success) {
                setAllCompanies(response.data.companies);
            }
        } catch (err) {
            console.error("Failed to fetch vendor companies", err);
            setError("Could not load vendor company list.");
        }
    }, [user.userIdentifier, canManageMSAWO]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleCompanySearch = (e) => {
        const query = e.target.value;
        setCompanySearch(query);
        setSelectedCompany(null); // Clear selection when user types
        setFormData(initialFormData); // Reset form data
        setIsDropdownOpen(true);

        if (query) {
            const filtered = allCompanies.filter(c => c.companyName.toLowerCase().includes(query.toLowerCase()));
            setFilteredCompanies(filtered);
            setShowAddCompanyBtn(filtered.length === 0);
        } else {
            setFilteredCompanies([]);
            setShowAddCompanyBtn(false);
        }
    };

    const handleCompanySelect = (company) => {
        setCompanySearch(company.companyName);
        setSelectedCompany(company);
        setFormData(prev => ({
            ...prev,
            vendorName: company.companyName,
            state: company.state || '',
            federalId: company.federalId || '',
            companyAddress: company.companyAddress || '',
            vendorEmail: company.companyEmail || '',
            authorizedSignatureName: company.authorizedSignatureName || '',
            authorizedPersonTitle: company.authorizedPersonTitle || '',
        }));
        setIsDropdownOpen(false);
        setFilteredCompanies([]);
        setShowAddCompanyBtn(false);
    };


    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageMSAWO) {
            setError("You do not have permission to create MSA and Work Order documents.");
            return;
        }
        if (!selectedCompany) {
            setError("Please select a valid vendor company from the list before submitting.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.createMSAandWO(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData(initialFormData);
                setCompanySearch('');
                setSelectedCompany(null);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const VendorInfoDisplay = ({ company }) => (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
             <h3 className="text-md font-semibold text-slate-700 mb-2">Selected Vendor Details:</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="font-medium text-slate-500">Address:</span> {company.companyAddress}</p>
                <p><span className="font-medium text-slate-500">Email:</span> {company.companyEmail}</p>
                <p><span className="font-medium text-slate-500">Auth. Person:</span> {company.authorizedSignatureName}</p>
                <p><span className="font-medium text-slate-500">Title:</span> {company.authorizedPersonTitle}</p>
             </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Create MSA and Work Order</h1>
                <p className="mt-1 text-gray-600">Search for a vendor to auto-fill their details, then complete the work order specifics.</p>
            </div>
            {!canManageMSAWO && !loading && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to create these documents.</p>
                </div>
            )}
            {canManageMSAWO && (
                <form onSubmit={handleSubmit}>
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                        {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}
                        {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>}
                        
                        <div className="border-b pb-6 mb-6">
                             <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Select Vendor Company</h2>
                             <div className="relative" ref={searchRef}>
                                <label htmlFor="companySearch" className="block text-sm font-medium text-gray-700">Vendor Company Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    id="companySearch"
                                    value={companySearch} 
                                    onChange={handleCompanySearch} 
                                    placeholder="Type to search for a vendor company..."
                                    className="form-input mt-1" 
                                    autoComplete="off"
                                />
                                {isDropdownOpen && (filteredCompanies.length > 0) && (
                                     <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                        {filteredCompanies.map(comp => (
                                            <li key={comp.companyName} onClick={() => handleCompanySelect(comp)} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer">
                                                {comp.companyName}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {showAddCompanyBtn && (
                                    <div className="absolute z-10 w-full p-4 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg text-center">
                                        <p className="text-sm text-gray-600 mb-2">Vendor not found.</p>
                                        <button type="button" onClick={() => onNavigate('create_msawo_vendor_company')} className="btn-primary">
                                            Add New Vendor Company
                                        </button>
                                    </div>
                                )}
                                {selectedCompany && <VendorInfoDisplay company={selectedCompany} />}
                             </div>
                        </div>

                         <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Complete Work Order Details</h2>
                        <fieldset disabled={!selectedCompany}>
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 transition-opacity duration-500 ${!selectedCompany ? 'opacity-50' : 'opacity-100'}`}>
                                <div>
                                    <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700">Candidate Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="candidateName" id="candidateName" value={formData.candidateName} onChange={handleChange} required className="form-input mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="tentativeStartDate" className="block text-sm font-medium text-gray-700">Tentative Start Date <span className="text-red-500">*</span></label>
                                    <input type="date" name="tentativeStartDate" id="tentativeStartDate" value={formData.tentativeStartDate} onChange={handleChange} required className="form-input mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></label>
                                    <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleChange} required className="form-input mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="clientName" id="clientName" value={formData.clientName} onChange={handleChange} required className="form-input mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="clientLocation" className="block text-sm font-medium text-gray-700">Client Location <span className="text-red-500">*</span></label>
                                    <input type="text" name="clientLocation" id="clientLocation" value={formData.clientLocation} onChange={handleChange} required className="form-input mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="typeOfServices" className="block text-sm font-medium text-gray-700">Type Of Service <span className="text-red-500">*</span></label>
                                    <select name="typeOfServices" id="typeOfServices" value={formData.typeOfServices} onChange={handleChange} required className="form-input mt-1 h-[46px]">
                                        <option value="">Select Service</option>
                                        <option value="IT Consulting">IT Consulting</option>
                                        <option value="Staffing">Staffing</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="typeOfSubcontract" className="block text-sm font-medium text-gray-700">Type Of Subcontract <span className="text-red-500">*</span></label>
                                    <select name="typeOfSubcontract" id="typeOfSubcontract" value={formData.typeOfSubcontract} onChange={handleChange} required className="form-input mt-1 h-[46px]">
                                        <option value="">Select Subcontract</option>
                                        <option value="Time and Materials">Time and Materials</option>
                                        <option value="Fixed Price">Fixed Price</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Rate <span className="text-red-500">*</span></label>
                                    <input type="number" name="rate" id="rate" value={formData.rate} onChange={handleChange} required className="form-input mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="perHour" className="block text-sm font-medium text-gray-700">Per Hour/Day/Month <span className="text-red-500">*</span></label>
                                    <select name="perHour" id="perHour" value={formData.perHour} onChange={handleChange} required className="form-input mt-1 h-[46px]">
                                        <option value="">Select Option</option>
                                        <option value="PER HOUR">Per Hour</option>
                                        <option value="PER DAY">Per Day</option>
                                        <option value="PER MONTH">Per Month</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="net" className="block text-sm font-medium text-gray-700">Payment Terms (NET) <span className="text-red-500">*</span></label>
                                    <select name="net" id="net" value={formData.net} onChange={handleChange} required className="form-input mt-1 h-[46px]">
                                        <option value="">Select Days</option>
                                        <option value="30">30 Days</option>
                                        <option value="45">45 Days</option>
                                        <option value="60">60 Days</option>
                                    </select>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="btn-primary w-48 h-12 disabled:opacity-50 flex items-center justify-center" disabled={loading || success || !selectedCompany}>
                            {loading ? <Spinner size="6" /> : 'Generate & Send'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateMSAandWOPage;