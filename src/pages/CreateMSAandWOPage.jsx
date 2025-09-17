import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateMSAandWOPage = ({ onNavigate }) => {
    const { user } = useAuth();
    const { canManageMSAWO } = usePermissions();
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    const loadCompanies = useCallback(async () => {
        if (!canManageMSAWO) return;
        try {
            const response = await apiService.getMSAWOVendorCompanies(user.userIdentifier);
            if (response.data.success) {
                setCompanies(response.data.companies);
            }
        } catch (err) {
            setError('Failed to load vendor companies.');
        }
    }, [user.userIdentifier, canManageMSAWO]);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredCompanies = searchTerm
        ? companies.filter(c => c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const handleSelectCompany = (company) => {
        setSelectedCompany(company);
        setSearchTerm(company.vendorName);
        setShowDropdown(false);
        // Pre-fill form data from the selected company
        setFormData(prev => ({
            ...prev,
            vendorName: company.vendorName,
            state: company.state,
            federalId: company.federalId,
            companyAddress: company.companyAddress,
            vendorEmail: company.vendorEmail,
            authorizedSignatureName: company.authorizedSignatureName,
            authorizedPersonTitle: company.authorizedPersonTitle,
        }));
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canManageMSAWO || !selectedCompany) {
            setError("Please select a valid vendor company first.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.createMSAandWO(formData, user.userIdentifier);
            if (response.data.success) {
                setSuccess(response.data.message);
                setFormData({});
                setSelectedCompany(null);
                setSearchTerm('');
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

    if (!canManageMSAWO) {
        return <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border"><h3 className="text-lg font-medium">Access Denied</h3></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Create MSA and Work Order</h1>
                <p className="mt-2 text-gray-600">Select a vendor, then fill out the work order details.</p>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border space-y-8">
                    {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
                    {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

                    {/* Step 1: Select Company */}
                    <div ref={searchRef}>
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Step 1: Select Vendor Company</h2>
                        <label htmlFor="companySearch" className="block text-sm font-medium text-gray-700">Vendor Company Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                id="companySearch"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                    setSelectedCompany(null);
                                }}
                                placeholder="Type to search for a vendor..."
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                                autoComplete="off"
                            />
                            {showDropdown && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                                    {filteredCompanies.length > 0 ? (
                                        filteredCompanies.map(c => (
                                            <div key={c.vendorName} onClick={() => handleSelectCompany(c)} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer">
                                                {c.vendorName}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">
                                            <p>No results found for "{searchTerm}".</p>
                                            <button type="button" onClick={() => onNavigate('create_msawo_vendor_company')} className="mt-2 text-sm text-indigo-600 hover:underline font-semibold">
                                                + Add New Vendor Company
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Fill Work Order */}
                    {selectedCompany && (
                        <div className="border-t pt-8">
                            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Step 2: Work Order Details</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Candidate Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="candidateName" value={formData.candidateName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tentative Start Date <span className="text-red-500">*</span></label>
                                    <input type="date" name="tentativeStartDate" value={formData.tentativeStartDate || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></label>
                                    <input type="text" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="clientName" value={formData.clientName || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Client Location <span className="text-red-500">*</span></label>
                                    <input type="text" name="clientLocation" value={formData.clientLocation || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type Of Service <span className="text-red-500">*</span></label>
                                    <select name="typeOfServices" value={formData.typeOfServices || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]">
                                        <option value="">Select Service</option>
                                        <option value="IT Consulting">IT Consulting</option>
                                        <option value="Staffing">Staffing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type Of Subcontract <span className="text-red-500">*</span></label>
                                    <select name="typeOfSubcontract" value={formData.typeOfSubcontract || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]">
                                        <option value="">Select Subcontract</option>
                                        <option value="Time and Materials">Time and Materials</option>
                                        <option value="Fixed Price">Fixed Price</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rate <span className="text-red-500">*</span></label>
                                    <input type="number" name="rate" value={formData.rate || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Per Hour/Day/Month <span className="text-red-500">*</span></label>
                                    <select name="perHour" value={formData.perHour || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]">
                                        <option value="">Select Option</option>
                                        <option value="PER HOUR">Per Hour</option>
                                        <option value="PER DAY">Per Day</option>
                                        <option value="PER MONTH">Per Month</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Payment Terms (NET) <span className="text-red-500">*</span></label>
                                    <select name="net" value={formData.net || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-3 h-[50px]">
                                        <option value="">Select Days</option>
                                        <option value="30">30 Days</option>
                                        <option value="45">45 Days</option>
                                        <option value="60">60 Days</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-48 h-12 disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-lg" disabled={loading || success || !selectedCompany}>
                        {loading ? <Spinner size="6" /> : 'Generate & Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateMSAandWOPage;