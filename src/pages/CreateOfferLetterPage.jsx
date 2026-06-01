import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const CreateOfferLetterPage = () => {
    const { user } = useAuth();
    const { canManageOfferLetters } = usePermissions();

    // UI View State
    const [viewState, setViewState] = useState('form'); // 'form' or 'preview'
    const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

    const [formData, setFormData] = useState({
        employeeName: '',
        jobTitle: '',
        startDate: '',
        offerAcceptanceDate: '',
        clientName: '',
        vendorName: '',
        billingRate: '',
        term: 'per hour',
        workLocation: '',
        rolesResponsibilities: '',
        employeeEmail: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Step 1: Generate the Preview
    const handlePreview = async (e) => {
        e.preventDefault();
        if (!canManageOfferLetters) {
            setError("You do not have permission to create offer letters.");
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // *** FIXED: Passing true as the third explicit argument for isPreview ***
            const response = await apiService.createOfferLetter(formData, user.userIdentifier, true);
            
            if (response.data.success && response.data.pdfBase64) {
                // Convert Base64 back to a Blob URL for local viewing
                const byteCharacters = atob(response.data.pdfBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                
                setPreviewPdfUrl(blobUrl);
                setViewState('preview'); // Switch UI to Preview mode
            } else {
                setError(response.data.message || "Failed to generate preview.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred while generating the preview.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Confirm and Send Final
    const handleConfirmAndSend = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // *** FIXED: Passing false as the third explicit argument for isPreview ***
            const response = await apiService.createOfferLetter(formData, user.userIdentifier, false);
            
            if (response.data.success) {
                setSuccess(response.data.message);
                
                // Clear form and reset UI
                setFormData({
                    employeeName: '',
                    jobTitle: '',
                    startDate: '',
                    offerAcceptanceDate: '',
                    clientName: '',
                    vendorName: '',
                    billingRate: '',
                    term: 'per hour',
                    workLocation: '',
                    rolesResponsibilities: '',
                    employeeEmail: ''
                });
                setViewState('form');
                
                // Cleanup Blob URL to prevent memory leaks
                if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
                setPreviewPdfUrl(null);

                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An unexpected error occurred while sending the offer letter.");
        } finally {
            setLoading(false);
        }
    };
    
    if (!canManageOfferLetters) {
        return (
            <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border">
                <h3 className="text-lg font-medium">Access Denied</h3>
                <p className="mt-1 text-sm">You do not have the necessary permissions to create offer letters.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Offer Letter</h1>
                    <p className="mt-1 text-gray-600">Fill out the details below to generate and send a new employment offer letter.</p>
                </div>
            </div>
            
            {error && <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
            {success && <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

            {viewState === 'form' ? (
                // --- STEP 1: DATA ENTRY FORM ---
                <form onSubmit={handlePreview}>
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div className="md:col-span-2">
                                <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700">Employee Full Name <span className="text-red-500">*</span></label>
                                <input type="text" name="employeeName" id="employeeName" value={formData.employeeName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div>
                                <label htmlFor="employeeEmail" className="block text-sm font-medium text-gray-700">Employee Email <span className="text-red-500">*</span></label>
                                <input type="email" name="employeeEmail" id="employeeEmail" value={formData.employeeEmail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                             <div>
                                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title <span className="text-red-500">*</span></label>
                                <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                                <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div>
                                <label htmlFor="offerAcceptanceDate" className="block text-sm font-medium text-gray-700">Offer Acceptance Deadline <span className="text-red-500">*</span></label>
                                <input type="date" name="offerAcceptanceDate" id="offerAcceptanceDate" value={formData.offerAcceptanceDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                                <input type="text" name="clientName" id="clientName" value={formData.clientName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div>
                                <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">Vendor Name <span className="text-red-500">*</span></label>
                                <input type="text" name="vendorName" id="vendorName" value={formData.vendorName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div>
                                <label htmlFor="billingRate" className="block text-sm font-medium text-gray-700">Billing Rate ($) <span className="text-red-500">*</span></label>
                                <input type="number" name="billingRate" id="billingRate" value={formData.billingRate} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div>
                                <label htmlFor="term" className="block text-sm font-medium text-gray-700">Term <span className="text-red-500">*</span></label>
                                <select name="term" id="term" value={formData.term} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 h-[42px] focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="per hour">Per Hour</option>
                                    <option value="per day">Per Day</option>
                                    <option value="per month">Per Month</option>
                                    <option value="annually">Annually</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700">Work Location <span className="text-red-500">*</span></label>
                                <input type="text" name="workLocation" id="workLocation" value={formData.workLocation} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="rolesResponsibilities" className="block text-sm font-medium text-gray-700">Roles & Responsibilities <span className="text-red-500">*</span></label>
                                <textarea name="rolesResponsibilities" id="rolesResponsibilities" value={formData.rolesResponsibilities} onChange={handleChange} required rows="6" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center w-52 h-12 disabled:bg-indigo-400" disabled={loading}>
                            {loading ? <Spinner size="6" /> : 'Review Document'}
                        </button>
                    </div>
                </form>
            ) : (
                // --- STEP 2: PREVIEW & CONFIRM ---
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Document Preview</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">Draft Mode</span>
                    </div>
                    
                    {/* Embedded PDF Viewer */}
                    <div className="w-full bg-gray-100 rounded-lg border border-gray-300 overflow-hidden shadow-inner h-[600px]">
                        {previewPdfUrl ? (
                            <iframe 
                                src={`${previewPdfUrl}#toolbar=0&navpanes=0`} 
                                className="w-full h-full"
                                title="Offer Letter Preview"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                Loading preview...
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row gap-4 w-full justify-end">
                        <button 
                            type="button" 
                            onClick={() => setViewState('form')}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
                            disabled={loading}
                        >
                            Back to Edit
                        </button>
                        <button 
                            type="button" 
                            onClick={handleConfirmAndSend}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center min-w-[200px] disabled:bg-green-400 transition-colors shadow-sm"
                            disabled={loading}
                        >
                            {loading ? <Spinner size="6" /> : 'Confirm & Send Email'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateOfferLetterPage;