import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import Spinner from '../Spinner';
import { usePermissions } from '../../hooks/usePermissions';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const EditMSAWOVendorCompanyModal = ({ isOpen, onClose, onSave, companyToEdit }) => {
  const { canManageMSAWO } = usePermissions();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && companyToEdit) {
      setFormData(companyToEdit);
      setError('');
      setSuccess('');
    }
  }, [isOpen, companyToEdit]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageMSAWO) {
      setError("Permission denied.");
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await onSave(formData);
      setSuccess("Vendor company updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to save details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Vendor Company" size="lg">
      <div className="relative p-6">
        {/* Notifications */}
        {error && (
          <div className="flex items-center bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <XCircleIcon className="h-5 w-5 mr-2" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">✕</button>
          </div>
        )}
        {success && (
          <div className="flex items-center bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-2 text-green-600 hover:text-green-800">✕</button>
          </div>
        )}

        {/* Form */}
        {canManageMSAWO && companyToEdit && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Vendor Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ''}
                  readOnly
                  className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Federal Id/EIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="federalId"
                  value={formData.federalId || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Vendor Company Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress || ''}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Vendor Email Id <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Vendor Authorized Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="authorizedSignatureName"
                  value={formData.authorizedSignatureName || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Vendor Authorized Person Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="authorizedPersonTitle"
                  value={formData.authorizedPersonTitle || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white pt-4 flex justify-end space-x-3 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-100">
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 flex items-center justify-center w-28"
                disabled={loading}
              >
                {loading ? <Spinner size="5" /> : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default EditMSAWOVendorCompanyModal