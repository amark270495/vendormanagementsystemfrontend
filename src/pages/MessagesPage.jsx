import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import { useMediaQuery } from 'react-responsive';

// Memoized component for the message input form to prevent re-renders
const MessageInputForm = memo(({ onSendMessage, disabled }) => {
    const [newMessage, setNewMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage.trim());
        setNewMessage('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white flex items-center space-x-3">
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                disabled={disabled}
                autoComplete="off"
            />
            <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg disabled:bg-slate-400 flex-shrink-0 transition-colors"
                disabled={!newMessage.trim() || disabled}
                aria-label="Send Message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
        </form>
    );
});


// Main MessagesPage component
const MessagesPage = () => {
    const { user } = useAuth();
    const { canMessage } = usePermissions();
    const [users, setUsers] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const [isUserListVisible, setUserListVisible] = useState(!isMobile);
    
    // Helper function to play notification sounds
    const playSound = (soundFile) => {
        const audio = new Audio(`/sounds/${soundFile}`);
        audio.play().catch(e => console.error("Error playing sound:", e));
    };

    // Fetch the list of users to chat with
    const fetchUsers = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) {
            setLoadingUsers(false);
            if (!canMessage) setError("You do not have permission to view messages.");
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
    }, [user?.userIdentifier, canMessage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Fetch messages for the selected conversation and poll for new ones
    const fetchAndMarkMessages = useCallback(async (isPolling = false) => {
        if (!selectedRecipient || !canMessage || !user?.userIdentifier) return;

        try {
            if (!isPolling) {
                setLoadingMessages(true);
            }
            
            // Mark messages as read immediately when a conversation is opened
            if (!isPolling) {
                await apiService.markMessagesAsRead(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
            }
            
            const response = await apiService.getMessages(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
            
            if (response.data.success) {
                const newMessages = response.data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                setMessages(prevMessages => {
                    // Check if a new message has arrived from the other user
                    if (newMessages.length > prevMessages.length) {
                        const latestMessage = newMessages[newMessages.length - 1];
                        if (latestMessage.sender !== user.userIdentifier) {
                            playSound('message.mp3');
                        }
                    }
                    return newMessages;
                });
            } else if (!isPolling) {
                setError(`Failed to fetch messages: ${response.data.message}`);
            }
        } catch (err) {
            if (!isPolling) {
                setError(`Failed to fetch messages: ${err.response?.data?.message || err.message}`);
            } else {
                console.error("Polling failed:", err);
            }
        } finally {
            if (!isPolling) {
                setLoadingMessages(false);
            }
        }
    }, [selectedRecipient, user?.userIdentifier, canMessage]);


    useEffect(() => {
        if (!selectedRecipient) {
            setMessages([]);
            return;
        }
        
        fetchAndMarkMessages(false);
        const interval = setInterval(() => fetchAndMarkMessages(true), 5000);
        
        return () => clearInterval(interval);
    }, [fetchAndMarkMessages, selectedRecipient]);


    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = useCallback(async (messageContent) => {
        if (!selectedRecipient) return;

        const tempMessage = {
            sender: user.userIdentifier,
            recipient: selectedRecipient.username,
            messageContent: messageContent,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        
        setMessages(prev => [...prev, tempMessage]);

        try {
            await apiService.saveMessage(user.userIdentifier, selectedRecipient.username, messageContent, user.userIdentifier);
        } catch (err) {
            setError(`Failed to send message: ${err.response?.data?.message || err.message}`);
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        }
    }, [selectedRecipient, user.userIdentifier]);

    const handleRecipientSelect = (recipient) => {
        setSelectedRecipient(recipient);
        if (isMobile) {
            setUserListVisible(false);
        }
    };
    
    // Define the component structure.
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Internal Messaging</h1>
                    <p className="mt-1 text-gray-600">Communicate with other users in the system.</p>
                </div>
                {isMobile && selectedRecipient && (
                    <button onClick={() => setUserListVisible(true)} className="md:hidden text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        Back to Users
                    </button>
                )}
            </div>
            
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">Error: {error}</div>}

            {loadingUsers && <div className="flex justify-center items-center h-64"><Spinner /></div>}
            
            {!loadingUsers && !canMessage && !error && (
                <div className="text-center text-gray-500 p-10 bg-white rounded-xl shadow-sm border flex-grow flex flex-col justify-center items-center">
                    <h3 className="text-lg font-medium">Access Denied</h3>
                    <p className="mt-1 text-sm text-gray-500">You do not have the necessary permissions to view messages.</p>
                </div>
            )}

            {!loadingUsers && canMessage && (
                <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-slate-200 flex-grow" style={{ minHeight: '70vh' }}>
                    {/* User List Panel */}
                    <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-slate-200 flex-col ${isMobile && !isUserListVisible ? 'hidden' : 'flex'}`}>
                        <div className="p-4 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800">Users</h2>
                        </div>
                        <div className="p-2 overflow-y-auto flex-grow">
                            {users.length > 0 ? (
                                <ul className="space-y-1">
                                    {users.map(u => (
                                        <li key={u.username}>
                                            <button onClick={() => handleRecipientSelect(u)} className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${selectedRecipient?.username === u.username ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-slate-700'}`}>
                                                <span className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">{u.displayName.charAt(0)}</span>
                                                <div className="flex-grow overflow-hidden">
                                                     <p className="font-semibold truncate">{u.displayName}</p>
                                                     <p className="text-xs text-slate-500 truncate">{u.username}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-sm text-center p-4">No other users found.</p>
                            )}
                        </div>
                    </div>

                    {/* Chat Panel */}
                    <div className={`flex-1 flex-col bg-slate-50 ${isMobile && isUserListVisible ? 'hidden' : 'flex'}`}>
                        {selectedRecipient ? (
                            <>
                                <div className="p-4 border-b border-slate-200 bg-white flex items-center space-x-3">
                                    <span className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">{selectedRecipient.displayName.charAt(0)}</span>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{selectedRecipient.displayName}</h2>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {loadingMessages && <div className="flex justify-center h-full items-center"><Spinner size="8" /></div>}
                                    {!loadingMessages && messages.map((msg, index) => (
                                        <div key={msg.id || index} className={`flex items-end gap-2 ${msg.sender === user.userIdentifier ? 'justify-end' : 'justify-start'}`}>
                                            {msg.sender !== user.userIdentifier && <span className="flex-shrink-0 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">{selectedRecipient.displayName.charAt(0)}</span>}
                                            <div className={`max-w-md p-3 rounded-2xl shadow-sm ${msg.sender === user.userIdentifier ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-lg'}`}>
                                                <p className="break-words">{msg.messageContent}</p>
                                                <p className="text-right text-xs mt-1 opacity-60">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <MessageInputForm onSendMessage={handleSendMessage} disabled={loadingMessages || !canMessage} />
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-4">
                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-slate-300 mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                               <h3 className="text-lg font-semibold text-slate-800">Select a Conversation</h3>
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