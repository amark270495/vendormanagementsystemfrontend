import React from 'react';
import Modal from '../Modal';
import { formatDate } from '../../utils/helpers';
import { usePermissions } from '../../hooks/usePermissions'; // <-- NEW: Import usePermissions

const ViewDetailsModal = ({ isOpen, onClose, job }) => {
    // NEW: Destructure canViewDashboards from usePermissions
    const { canViewDashboards } = usePermissions(); 

    // Define which columns should be formatted as dates.
    const DATE_COLUMNS = ['Posting Date', 'Deadline'];

    // Only render the modal content if the user has permission
    if (!canViewDashboards) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Access Denied" size="md">
                <div className="text-center text-red-500 p-4">
                    <h3 className="text-lg font-medium">Permission Denied</h3>
                    <p className="text-sm">You do not have the necessary permissions to view job details.</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Job Details" size="lg">
            {job && (
                <div className="space-y-4">
                    {Object.entries(job).map(([key, value]) => (
                        <div key={key}>
                            <h4 className="text-sm font-medium text-gray-500 capitalize">{key}</h4>
                            <p className="text-gray-800 break-words">
                                {String(DATE_COLUMNS.includes(key) ? formatDate(value) : value)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};

export default ViewDetailsModal;