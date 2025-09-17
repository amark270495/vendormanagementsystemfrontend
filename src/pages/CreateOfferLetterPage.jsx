import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const CreateOfferLetterPage = () => {
    const { canManageOfferLetters } = usePermissions();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Offer Letter</h1>
                <p className="mt-1 text-gray-600">This feature is coming soon.</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border text-center text-gray-500">
                {!canManageOfferLetters ? (
                     <div className="p-10">
                        <h3 className="text-lg font-medium">Access Denied</h3>
                        <p className="mt-1 text-sm">You do not have the necessary permissions to create offer letters.</p>
                    </div>
                ) : (
                    <div className="p-10">
                        <h3 className="text-lg font-medium">Under Construction</h3>
                        <p className="mt-1 text-sm ">The functionality to create and send offer letters will be available here shortly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateOfferLetterPage;