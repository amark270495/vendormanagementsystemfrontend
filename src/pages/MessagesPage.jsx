import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';

const MessagesPage = () => {
    const { user } = useAuth();
    const { canMessage } = usePermissions();

    const [users, setUsers] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    // --- FIX: Mark messages as read when the page is viewed ---
    useEffect(() => {
        if (user?.userIdentifier) {
            sessionStorage.setItem(`lastRead_${user.userIdentifier}`, new Date().getTime());
        }
    }, [user?.userIdentifier, messages]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user?.userIdentifier) return;
            setLoadingUsers(true);
            setError('');
            if (!canMessage) {
                setLoadingUsers(false);
                setError("You do not have permission to view messages.");
                return;
            }
            try {
                const response = await apiService.getUsers(user.userIdentifier); 
                if (response.data.success) {
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
    }, [user?.userIdentifier, canMessage]);

    useEffect(() => {
        if (!selectedRecipient) {
            setMessages([]);
            return;
        }
        
        const fetchMessages = async () => {
            setLoadingMessages(true);
            setError('');
            if (!canMessage) {
                setLoadingMessages(false);
                setError("You do not have permission to view messages.");
                return;
            }
            try {
                const response = await apiService.getMessages(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
                if (response.data.success) {
                    setMessages(response.data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
                    // Mark as read after fetching
                    sessionStorage.setItem(`lastRead_${user.userIdentifier}`, new Date().getTime());
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
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [selectedRecipient, user.userIdentifier, canMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRecipient) return;
        if (!canMessage) {
            setError("You do not have permission to send messages.");
            return;
        }

        const tempMessageId = Date.now();
        const tempMessage = {
            sender: user.userIdentifier,
            recipient: selectedRecipient.username,
            messageContent: newMessage.trim(),
            timestamp: new Date().toISOString(),
            id: tempMessageId
        };
        
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setError('');

        try {
            const response = await apiService.saveMessage(user.userIdentifier, selectedRecipient.username, tempMessage.messageContent, user.userIdentifier);
            if (!response.data.success) {
                setError(response.data.message);
                setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
            }
        } catch (err) {
            setError(`Failed to send message: ${err.response?.data?.message || err.message}`);
            setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Internal Messaging</h1>
                <p className="mt-1 text-gray-600">Communicate with other users in the system.</p>
            </div>
            
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">Error: {error}</div>}

            {loadingUsers && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            
            {!loadingUsers && !error && !canMessage && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border flex-grow flex flex-col justify-center items-center">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view messages.</p>
                </div>
            )}

            {!loadingUsers && !error && canMessage && (
                <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-gray-200 flex-grow" style={{ minHeight: '70vh' }}>
                    <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">Users</h2>
                        </div>
                        <div className="p-2 overflow-y-auto flex-grow">
                            {users.length === 0 && <p className="text-gray-500 text-sm text-center p-4">No other users found.</p>}
                            <ul className="space-y-1">
                                {users.map(u => (
                                    <li key={u.username}>
                                        <button onClick={() => setSelectedRecipient(u)} className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${selectedRecipient?.username === u.username ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-700'}`}>
                                            <span className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">{u.displayName.charAt(0)}</span>
                                            <div className="flex-grow overflow-hidden">
                                                 <p className="font-semibold truncate">{u.displayName}</p>
                                                 <p className="text-xs text-gray-500 truncate">{u.username}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-gray-50">
                        {selectedRecipient ? (
                            <>
                                <div className="p-4 border-b border-gray-200 bg-white flex items-center space-x-3">
                                    <span className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">{selectedRecipient.displayName.charAt(0)}</span>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">{selectedRecipient.displayName}</h2>
                                        <p className="text-sm text-gray-500">Online</p>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {loadingMessages && <div className="flex justify-center h-full items-center"><Spinner size="8" /></div>}
                                    {messages.map((msg, index) => (
                                        <div key={msg.id || index} className={`flex items-end gap-2 ${msg.sender === user.userIdentifier ? 'justify-end' : 'justify-start'}`}>
                                            {msg.sender !== user.userIdentifier && <span className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">{selectedRecipient.displayName.charAt(0)}</span>}
                                            <div className={`max-w-md p-3 rounded-2xl shadow-sm ${msg.sender === user.userIdentifier ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-white text-slate-800 border border-gray-200 rounded-bl-lg'}`}>
                                                <p>{msg.messageContent}</p>
                                                <p className="text-right text-xs mt-1 opacity-60">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex items-center space-x-3">
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" disabled={loadingMessages || !canMessage}/>
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg disabled:bg-gray-400 flex-shrink-0" disabled={!newMessage.trim() || loadingMessages || !canMessage}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-4">
                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-gray-300 mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                               <h3 className="text-lg font-semibold text-gray-800">Select a Conversation</h3>
                               <p>Choose a user from the list to start messaging.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;