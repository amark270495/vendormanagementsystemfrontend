import React from 'react';
import Modal from '../Modal';
import { formatDate } from '../../utils/helpers';

const ViewDetailsModal = ({ isOpen, onClose, job }) => {
    // Define which columns should be formatted as dates.
    const DATE_COLUMNS = ['Posting Date', 'Deadline'];

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