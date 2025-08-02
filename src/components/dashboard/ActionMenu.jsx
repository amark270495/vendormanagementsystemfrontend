import React from 'react';
import Dropdown from '../Dropdown';

const ActionMenu = ({ job, onAction }) => (
    <Dropdown 
        trigger={
            <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" aria-label="Job actions">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
        }
    >
        <a href="#" onClick={(e) => { e.preventDefault(); onAction('details', job); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Details</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onAction('close', job); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Close Job</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onAction('archive', job); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Archive Job</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onAction('delete', job); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Delete Job</a>
    </Dropdown>
);

export default ActionMenu;