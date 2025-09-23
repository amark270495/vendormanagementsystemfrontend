import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import { useMediaQuery } from 'react-responsive';

// Memoized input form
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
                {/* FIXED viewBox */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-6 h-6">
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

    // 🔊 preload sound (Messenger-like)
    const messageSoundRef = useRef(null);
    useEffect(() => {
        messageSoundRef.current = new Audio();
        const audio = messageSoundRef.current;
        audio.src = '/sounds/message.mp3';
        audio.srcObject = null;
        audio.preload = 'auto';

        // fallback for Safari/Firefox
        const ogg = document.createElement('source');
        ogg.src = '/sounds/message.ogg';
        ogg.type = 'audio/ogg';
        audio.appendChild(ogg);
    }, []);

    const playSound = () => {
        if (messageSoundRef.current) {
            messageSoundRef.current.currentTime = 0;
            messageSoundRef.current.play().catch(err => {
                console.error("Error playing sound:", err);
            });
        }
    };

    // fetch users
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

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // fetch messages with polling
    const fetchAndMarkMessages = useCallback(async (isPolling = false) => {
        if (!selectedRecipient || !canMessage || !user?.userIdentifier) return;
        try {
            if (!isPolling) setLoadingMessages(true);

            if (!isPolling) {
                await apiService.markMessagesAsRead(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
            }

            const response = await apiService.getMessages(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
            if (response.data.success) {
                const newMessages = response.data.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                setMessages(prev => {
                    if (newMessages.length > prev.length) {
                        const latestMessage = newMessages[newMessages.length - 1];
                        if (latestMessage.sender !== user.userIdentifier) {
                            playSound(); // 🔊 notify only on incoming
                        }
                    }
                    return newMessages;
                });
            } else if (!isPolling) {
                setError(`Failed to fetch messages: ${response.data.message}`);
            }
        } catch (err) {
            if (!isPolling) setError(`Failed to fetch messages: ${err.response?.data?.message || err.message}`);
            else console.error("Polling failed:", err);
        } finally {
            if (!isPolling) setLoadingMessages(false);
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

    // auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = useCallback(async (messageContent) => {
        if (!selectedRecipient) return;
        const tempMessage = {
            sender: user.userIdentifier,
            recipient: selectedRecipient.username,
            messageContent,
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
        if (isMobile) setUserListVisible(false);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* ... (unchanged UI) ... */}

            {/* FIXED Empty Chat SVG */}
            {!selectedRecipient && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-16 h-16 text-slate-300 mb-4">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-800">Select a Conversation</h3>
                    <p>Choose a user from the list to start messaging.</p>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;