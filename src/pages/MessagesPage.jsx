import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import { useMediaQuery } from 'react-responsive';

// Message input
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
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                disabled={disabled}
                autoComplete="off"
            />
            <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full disabled:bg-slate-400 flex-shrink-0 transition-colors"
                disabled={!newMessage.trim() || disabled}
                aria-label="Send Message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-5 h-5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </form>
    );
});

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

    // 🔊 Messenger-like sound preload
    const messageSoundRef = useRef(null);
    useEffect(() => {
        messageSoundRef.current = new Audio('/sounds/message.mp3');
        messageSoundRef.current.preload = 'auto';
    }, []);
    const playSound = () => {
        if (messageSoundRef.current) {
            messageSoundRef.current.currentTime = 0;
            messageSoundRef.current.play().catch(err => console.error("Sound play error:", err));
        }
    };

    // Fetch users
    const fetchUsers = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) {
            setLoadingUsers(false);
            if (!canMessage) setError("You do not have permission to view messages.");
            return;
        }
        try {
            const res = await apiService.getUsers(user.userIdentifier);
            if (res.data.success) {
                setUsers(res.data.users.filter(u => u.username !== user.userIdentifier));
            } else setError(res.data.message);
        } catch (err) {
            setError(`Failed to fetch users: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoadingUsers(false);
        }
    }, [user?.userIdentifier, canMessage]);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Fetch messages (with polling)
    const fetchAndMarkMessages = useCallback(async (isPolling = false) => {
        if (!selectedRecipient || !canMessage || !user?.userIdentifier) return;
        try {
            if (!isPolling) setLoadingMessages(true);
            if (!isPolling) {
                await apiService.markMessagesAsRead(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
            }
            const res = await apiService.getMessages(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
            if (res.data.success) {
                const newMessages = res.data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                setMessages(prev => {
                    if (newMessages.length > prev.length) {
                        const latest = newMessages[newMessages.length - 1];
                        if (latest.sender !== user.userIdentifier) playSound();
                    }
                    return newMessages;
                });
            } else if (!isPolling) setError(res.data.message);
        } catch (err) {
            if (!isPolling) setError(`Failed to fetch messages: ${err.response?.data?.message || err.message}`);
        } finally {
            if (!isPolling) setLoadingMessages(false);
        }
    }, [selectedRecipient, user?.userIdentifier, canMessage]);
    useEffect(() => {
        if (!selectedRecipient) { setMessages([]); return; }
        fetchAndMarkMessages(false);
        const interval = setInterval(() => fetchAndMarkMessages(true), 5000);
        return () => clearInterval(interval);
    }, [fetchAndMarkMessages, selectedRecipient]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send
    const handleSendMessage = useCallback(async (msgContent) => {
        if (!selectedRecipient) return;
        const temp = {
            sender: user.userIdentifier,
            recipient: selectedRecipient.username,
            messageContent: msgContent,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        setMessages(prev => [...prev, temp]);
        try {
            await apiService.saveMessage(user.userIdentifier, selectedRecipient.username, msgContent, user.userIdentifier);
        } catch (err) {
            setError(`Failed to send: ${err.response?.data?.message || err.message}`);
            setMessages(prev => prev.filter(m => m.id !== temp.id));
        }
    }, [selectedRecipient, user.userIdentifier]);

    const handleRecipientSelect = (recipient) => {
        setSelectedRecipient(recipient);
        if (isMobile) setUserListVisible(false);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <p className="text-gray-600">Chat with colleagues in real-time</p>
                </div>
                {isMobile && selectedRecipient && (
                    <button onClick={() => setUserListVisible(true)} className="md:hidden text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1">
                        ← Back
                    </button>
                )}
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>}
            {loadingUsers && <div className="flex justify-center h-64"><Spinner /></div>}

            {!loadingUsers && canMessage && (
                <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-sm border flex-grow min-h-[70vh]">
                    {/* User list */}
                    <div className={`w-full md:w-1/3 lg:w-1/4 border-r ${isMobile && !isUserListVisible ? 'hidden' : 'flex'} flex-col`}>
                        <div className="p-4 border-b font-semibold text-slate-800">Users</div>
                        <div className="flex-1 overflow-y-auto">
                            {users.map(u => (
                                <button key={u.username}
                                    onClick={() => handleRecipientSelect(u)}
                                    className={`w-full flex items-center p-3 space-x-3 hover:bg-slate-100 transition ${selectedRecipient?.username === u.username ? 'bg-indigo-50 text-indigo-700' : ''}`}>
                                    <span className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-800">
                                        {u.displayName.charAt(0)}
                                    </span>
                                    <div className="text-left">
                                        <p className="font-semibold">{u.displayName}</p>
                                        <p className="text-xs text-slate-500">{u.username}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat panel */}
                    <div className={`flex-1 flex flex-col bg-slate-50 ${isMobile && isUserListVisible ? 'hidden' : 'flex'}`}>
                        {selectedRecipient ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b bg-white flex items-center space-x-3">
                                    <span className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                                        {selectedRecipient.displayName.charAt(0)}
                                    </span>
                                    <div>
                                        <h2 className="font-bold">{selectedRecipient.displayName}</h2>
                                        <p className="text-xs text-green-500">Online</p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 p-6 space-y-3 overflow-y-auto">
                                    {loadingMessages && <div className="flex justify-center"><Spinner size="6" /></div>}
                                    {!loadingMessages && messages.map((m, i) => {
                                        const isMe = m.sender === user.userIdentifier;
                                        return (
                                            <div key={m.id || i} className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                                {!isMe && (
                                                    <span className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm font-bold text-slate-700">
                                                        {selectedRecipient.displayName.charAt(0)}
                                                    </span>
                                                )}
                                                <div className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm text-sm
                                                    ${isMe
                                                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-none'
                                                        : 'bg-white border text-slate-800 rounded-bl-none'}`}>
                                                    <p>{m.messageContent}</p>
                                                    <p className="text-[10px] mt-1 opacity-70">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <MessageInputForm onSendMessage={handleSendMessage} disabled={loadingMessages || !canMessage} />
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    className="text-slate-300 mb-4">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <h3 className="font-semibold text-slate-800">Select a Conversation</h3>
                                <p>Choose a user to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;