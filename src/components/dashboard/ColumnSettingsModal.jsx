import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';

const ColumnSettingsModal = ({ isOpen, onClose, allHeaders, userPrefs, onSave }) => {
    const [orderedHeaders, setOrderedHeaders] = useState([]); 
    const [visibility, setVisibility] = useState({}); 
    
    // Refs for drag-and-drop functionality
    const dragItem = useRef(); 
    const dragOverItem = useRef();

    // Initialize state when the modal is opened
    useEffect(() => {
        if (!isOpen) return;

        // Start with the user's preferred order, or the default order if none exists
        const currentOrder = userPrefs.order.length > 0 
            ? userPrefs.order.filter(h => allHeaders.includes(h)) 
            : allHeaders;
        
        // Add any new headers that might not be in the saved preferences
        const remainingHeaders = allHeaders.filter(h => !currentOrder.includes(h));
        const finalOrder = [...currentOrder, ...remainingHeaders];
        setOrderedHeaders(finalOrder);

        // Set the initial visibility based on user preferences
        const initialVisibility = finalOrder.reduce((acc, header) => {
            acc[header] = !userPrefs.visibility.includes(header);
            return acc;
        }, {});
        setVisibility(initialVisibility);

    }, [isOpen, allHeaders, userPrefs]);

    // Handles the end of a drag event to reorder the headers
    const handleDrop = () => {
        const newOrder = [...orderedHeaders];
        const draggedItemContent = newOrder.splice(dragItem.current, 1)[0];
        newOrder.splice(dragOverItem.current, 0, draggedItemContent);
        setOrderedHeaders(newOrder);
        // Clear refs
        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    // Calls the onSave prop with the new settings
    const handleSave = () => { 
        const hiddenColumns = Object.entries(visibility)
            .filter(([, isVisible]) => !isVisible)
            .map(([header]) => header); 
        onSave({ order: orderedHeaders, visibility: hiddenColumns }); 
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Column Settings" size="lg">
            <p className="text-gray-600 mb-4">Drag and drop to reorder. Check/uncheck to show/hide columns.</p>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {orderedHeaders.map((header, index) => (
                    <div 
                        key={header} 
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md border cursor-grab" 
                        draggable 
                        onDragStart={() => dragItem.current = index} 
                        onDragEnter={() => dragOverItem.current = index} 
                        onDragEnd={handleDrop} 
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <span>{header}</span>
                        <input 
                            type="checkbox" 
                            checked={visibility[header] || false} 
                            onChange={() => setVisibility(prev => ({...prev, [header]: !prev[header]}))} 
                            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-6 space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Settings</button>
            </div>
        </Modal>
    );
};

export default ColumnSettingsModal;