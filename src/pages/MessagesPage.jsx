import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';

const MessagesPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // Fetch the list of users to chat with
    useEffect(() => {
        const fetchUsers = async () => {
            if (!user?.userIdentifier) return;
            setLoadingUsers(true);
            try {
                const response = await apiService.getUsers(user.userIdentifier);
                if (response.data.success) {
                    // Filter out the current user from the list
                    setUsers(response.data.users.filter(u => u.username !== user.userIdentifier));
                } else {
                    setError(response.data.message);
                }
            } catch (err) {
                setError(`Failed to fetch users: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, [user?.userIdentifier]);

    // Fetch messages for the selected conversation and poll for new ones
    useEffect(() => {
        if (!selectedRecipient) {
            setMessages([]);
            return;
        }
        
        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const response = await apiService.getMessages(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
                if (response.data.success) {
                    setMessages(response.data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
                } else {
                    setError(response.data.message);
                }
            } catch (err) {
                setError(`Failed to fetch messages: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
        return () => clearInterval(interval); // Cleanup on component unmount or recipient change
    }, [selectedRecipient, user.userIdentifier]);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRecipient) return;

        const tempMessageId = Date.now();
        const tempMessage = {
            sender: user.userIdentifier,
            recipient: selectedRecipient.username,
            messageContent: newMessage.trim(),
            timestamp: new Date().toISOString(),
            id: tempMessageId
        };
        
        // Optimistically update the UI
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');

        try {
            const response = await apiService.saveMessage(user.userIdentifier, selectedRecipient.username, tempMessage.messageContent, user.userIdentifier);
            if (!response.data.success) {
                setError(response.data.message);
                // Revert optimistic update on failure
                setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
            }
        } catch (err) {
            setError(`Failed to send message: ${err.response?.data?.message || err.message}`);
            // Revert optimistic update on failure
            setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Internal Messaging</h1>
            <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg h-[70vh]">
                {/* User List Panel */}
                <div className="w-full md:w-1/4 border-r border-gray-200 p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Users</h2>
                    {loadingUsers && <Spinner size="6" />}
                    {error && <div className="text-red-500 text-sm p-2">{error}</div>}
                    {!loadingUsers && users.length === 0 && <p className="text-gray-500 text-sm">No other users found.</p>}
                    <ul className="space-y-2">
                        {users.map(u => (
                            <li key={u.username}>
                                <button onClick={() => setSelectedRecipient(u)} className={`w-full text-left p-3 rounded-md transition-colors ${selectedRecipient?.username === u.username ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}>
                                    <p className="font-medium">{u.displayName}</p>
                                    <p className="text-xs text-gray-500 break-all">{u.username}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col">
                    {selectedRecipient ? (
                        <>
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-800">Chat with {selectedRecipient.displayName}</h2>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                                {loadingMessages && <div className="flex justify-center"><Spinner size="6" /></div>}
                                {messages.map((msg, index) => (
                                    <div key={msg.id || index} className={`flex ${msg.sender === user.userIdentifier ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${msg.sender === user.userIdentifier ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                            <p className="text-xs font-semibold mb-1">{msg.sender === user.userIdentifier ? 'You' : selectedRecipient.displayName}</p>
                                            <p>{msg.messageContent}</p>
                                            <p className="text-right text-xs mt-1 opacity-75">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex items-center space-x-2">
                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" disabled={loadingMessages}/>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400" disabled={!newMessage.trim() || loadingMessages}>Send</button>
                            </form>
                        </>
                    ) : <div className="flex-1 flex items-center justify-center text-gray-500">Select a user to start a conversation.</div>}
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;