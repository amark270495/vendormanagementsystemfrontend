import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../api/apiService';

// 1. FIXED: Move InputField OUTSIDE of the main component
// It receives formData and handleChange as props now to maintain functionality
const InputField = ({ label, name, type = "text", required = false, placeholder = "", value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
    </div>
);

const CreateAsset = () => {
    const { user } = useAuth();
    const { canManageAssets } = usePermissions();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // State for the 24 Asset Fields
    const [formData, setFormData] = useState({
        // General Information
        AssetType: 'Laptop', 
        AssetBrandName: '',
        AssetModelName: '',
        SerialNumber: '',
        
        // Hardware Specifications
        AssetCPUBrand: '',
        AssetCPUModel: '',
        AssetRamType: 'DDR5',
        AssetRamSize: '',
        AssetStorageType: 'NVMe SSD',
        AssetStorageSize: '',
        AssetGPUMake: '',
        AssetGPUModel: '',
        AssetGPUVram: '',
        DisplaySize: '',
        
        // Network & Software
        AssetOSName: 'Windows 11 Pro',
        AssetOSVersion: '',
        MacAddressWifi: '',
        MacAddressEthernet: '',
        IpAddress: '',
        
        // Purchase & Lifecycle Details
        VendorName: '',
        InvoiceNumber: '',
        PurchaseCost: '',
        PurchaseDate: '',
        WarrantyExpiryDate: '',
        Notes: ''
    });

    // Enforce Access Control
    if (!canManageAssets) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center text-slate-500 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
                    <p>You do not have permission to create hardware assets.</p>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await apiService.createAsset(formData, user.userIdentifier);
            setSuccessMessage(`Asset successfully created with Tag ID: ${response.data?.assetId}`);
            
            // Reset form on success (keep defaults)
            setFormData({
                AssetType: 'Laptop', AssetBrandName: '', AssetModelName: '', SerialNumber: '',
                AssetCPUBrand: '', AssetCPUModel: '', AssetRamType: 'DDR5', AssetRamSize: '', 
                AssetStorageType: 'NVMe SSD', AssetStorageSize: '', AssetGPUMake: '', AssetGPUModel: '', 
                AssetGPUVram: '', DisplaySize: '', AssetOSName: 'Windows 11 Pro', AssetOSVersion: '', 
                MacAddressWifi: '', MacAddressEthernet: '', IpAddress: '', VendorName: '', 
                InvoiceNumber: '', PurchaseCost: '', PurchaseDate: '', WarrantyExpiryDate: '', Notes: ''
            });

            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            setErrorMessage(error.response?.data?.error || error.message || 'Failed to create asset.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-slate-800">Add New Hardware Asset</h2>
                    <p className="text-sm text-slate-500">Register newly purchased equipment into the inventory.</p>
                </div>

                {/* Alerts */}
                {successMessage && (
                    <div className="m-6 p-4 bg-green-50 text-green-800 rounded-md border border-green-200 font-medium">
                        ✅ {successMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="m-6 p-4 bg-red-50 text-red-800 rounded-md border border-red-200 font-medium">
                        ❌ {errorMessage}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
                    
                    {/* Section 1: General Info */}
                    <section>
                        <h3 className="text-md font-semibold text-indigo-700 mb-4 border-b pb-2">1. General Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Asset Type <span className="text-red-500">*</span></label>
                                <select name="AssetType" value={formData.AssetType} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm" required>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Desktop">Desktop</option>
                                    <option value="Monitor">Monitor</option>
                                    <option value="Server/NAS">Server / NAS</option>
                                    <option value="Accessory">Accessory</option>
                                </select>
                            </div>
                            {/* 2. FIXED: Pass value and onChange to the separated component */}
                            <InputField label="Brand Name" name="AssetBrandName" placeholder="e.g., Lenovo, Dell" required value={formData.AssetBrandName} onChange={handleChange} />
                            <InputField label="Model Name" name="AssetModelName" placeholder="e.g., ThinkPad T14" required value={formData.AssetModelName} onChange={handleChange} />
                            <InputField label="Serial Number / Tag" name="SerialNumber" required value={formData.SerialNumber} onChange={handleChange} />
                        </div>
                    </section>

                    {/* Section 2: Hardware Specs */}
                    <section>
                        <h3 className="text-md font-semibold text-indigo-700 mb-4 border-b pb-2">2. Hardware Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InputField label="CPU Brand" name="AssetCPUBrand" placeholder="e.g., Intel, AMD, Apple" value={formData.AssetCPUBrand} onChange={handleChange} />
                            <InputField label="CPU Model" name="AssetCPUModel" placeholder="e.g., i9-14900K, M3 Max" value={formData.AssetCPUModel} onChange={handleChange} />
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">RAM Type</label>
                                <select name="AssetRamType" value={formData.AssetRamType} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm">
                                    <option value="DDR4">DDR4</option>
                                    <option value="DDR5">DDR5</option>
                                    <option value="Unified Memory">Unified Memory</option>
                                </select>
                            </div>
                            <InputField label="RAM Size" name="AssetRamSize" placeholder="e.g., 32GB, 64GB" value={formData.AssetRamSize} onChange={handleChange} />
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Storage Type</label>
                                <select name="AssetStorageType" value={formData.AssetStorageType} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm">
                                    <option value="NVMe SSD">NVMe SSD</option>
                                    <option value="SATA SSD">SATA SSD</option>
                                    <option value="HDD">HDD</option>
                                </select>
                            </div>
                            <InputField label="Storage Size" name="AssetStorageSize" placeholder="e.g., 1TB, 2TB" value={formData.AssetStorageSize} onChange={handleChange} />
                            
                            <InputField label="GPU Make" name="AssetGPUMake" placeholder="e.g., NVIDIA, AMD" value={formData.AssetGPUMake} onChange={handleChange} />
                            <InputField label="GPU Model" name="AssetGPUModel" placeholder="e.g., RTX 5090" value={formData.AssetGPUModel} onChange={handleChange} />
                            <InputField label="GPU VRAM" name="AssetGPUVram" placeholder="e.g., 16GB, 24GB" value={formData.AssetGPUVram} onChange={handleChange} />
                            <InputField label="Display Size/Res" name="DisplaySize" placeholder="e.g., 16-inch 4K" value={formData.DisplaySize} onChange={handleChange} />
                        </div>
                    </section>

                    {/* Section 3: Network & Software */}
                    <section>
                        <h3 className="text-md font-semibold text-indigo-700 mb-4 border-b pb-2">3. Network & Software</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">OS Name</label>
                                <select name="AssetOSName" value={formData.AssetOSName} onChange={handleChange} className="w-full border-slate-300 rounded-md shadow-sm p-2 border text-sm">
                                    <option value="Windows 11 Pro">Windows 11 Pro</option>
                                    <option value="Windows 11 Home">Windows 11 Home</option>
                                    <option value="macOS Sonoma">macOS Sonoma</option>
                                    <option value="Ubuntu Linux">Ubuntu Linux</option>
                                    <option value="None/Other">None / Other</option>
                                </select>
                            </div>
                            <InputField label="OS Version/Build" name="AssetOSVersion" placeholder="e.g., 23H2" value={formData.AssetOSVersion} onChange={handleChange} />
                            <InputField label="MAC Address (Wi-Fi)" name="MacAddressWifi" placeholder="00:00:00:00:00:00" value={formData.MacAddressWifi} onChange={handleChange} />
                            <InputField label="MAC Address (Ethernet)" name="MacAddressEthernet" placeholder="00:00:00:00:00:00" value={formData.MacAddressEthernet} onChange={handleChange} />
                            <InputField label="Static IP (If any)" name="IpAddress" placeholder="e.g., 192.168.1.50" value={formData.IpAddress} onChange={handleChange} />
                        </div>
                    </section>

                    {/* Section 4: Purchase Lifecycle */}
                    <section>
                        <h3 className="text-md font-semibold text-indigo-700 mb-4 border-b pb-2">4. Purchase Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InputField label="Vendor / Supplier" name="VendorName" required value={formData.VendorName} onChange={handleChange} />
                            <InputField label="Invoice Number" name="InvoiceNumber" value={formData.InvoiceNumber} onChange={handleChange} />
                            <InputField label="Purchase Cost ($/₹)" name="PurchaseCost" type="number" value={formData.PurchaseCost} onChange={handleChange} />
                            <InputField label="Purchase Date" name="PurchaseDate" type="date" required value={formData.PurchaseDate} onChange={handleChange} />
                            <InputField label="Warranty Expiry Date" name="WarrantyExpiryDate" type="date" value={formData.WarrantyExpiryDate} onChange={handleChange} />
                        </div>
                    </section>

                    {/* Section 5: Notes */}
                    <section>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                        <textarea 
                            name="Notes"
                            rows="3"
                            value={formData.Notes}
                            onChange={handleChange}
                            className="w-full border-slate-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="Enter any accessories included (e.g., charger, mouse) or special instructions..."
                        />
                    </section>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors shadow-sm"
                        >
                            {isSubmitting ? 'Registering Asset...' : 'Save New Asset'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CreateAsset;