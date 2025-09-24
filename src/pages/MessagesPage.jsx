import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../api/apiService';
import Spinner from '../components/Spinner';
import { usePermissions } from '../hooks/usePermissions';
import { useMediaQuery } from 'react-responsive';
import messageSound from '../sounds/message.mp3';
import {
    generateKeyPair,
    importPrivateKey,
    importPublicKey,
    exportPrivateKey,
    exportPublicKey,
    encrypt,
    decrypt
} from '../utils/webCrypto';

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
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full disabled:bg-slate-400 transition-colors"
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
    const [search, setSearch] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');
    const [unreadCounts, setUnreadCounts] = useState({});
    const messagesEndRef = useRef(null);
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const [isUserListVisible, setUserListVisible] = useState(!isMobile);
    const messageSoundRef = useRef(null);
    const privateKeyRef = useRef(null);
    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        messageSoundRef.current = new Audio(messageSound);
        messageSoundRef.current.preload = 'auto';
    }, []);

    const playSound = () => {
        if (messageSoundRef.current) {
            messageSoundRef.current.currentTime = 0;
            messageSoundRef.current.play().catch(err => console.error("Sound play error:", err));
        }
    };

    // Key management on component mount
    useEffect(() => {
        const setupKeys = async () => {
            if (!user?.userIdentifier) return;
            let privateKeyString = localStorage.getItem(`privateKey_${user.userIdentifier}`);
            if (privateKeyString) {
                try {
                    privateKeyRef.current = await importPrivateKey(privateKeyString);
                } catch (e) {
                    console.error("Failed to import private key from local storage:", e);
                    localStorage.removeItem(`privateKey_${user.userIdentifier}`);
                    setError("Failed to load your private key. Please refresh to generate a new one.");
                }
            } else {
                const keyPair = await generateKeyPair();
                privateKeyRef.current = keyPair.privateKey;
                const publicKeyString = await exportPublicKey(keyPair.publicKey);
                privateKeyString = await exportPrivateKey(keyPair.privateKey);
                localStorage.setItem(`privateKey_${user.userIdentifier}`, privateKeyString);
                try {
                    await apiService.savePublicKey(user.userIdentifier, publicKeyString);
                } catch (err) {
                    console.error("Failed to save public key to backend:", err);
                    setError("Failed to save public key. Messaging may not work correctly.");
                }
            }
        };
        if (canMessage) {
            setupKeys();
        }
    }, [user?.userIdentifier, canMessage]);

    const fetchUsers = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) {
            setLoadingUsers(false);
            if (!canMessage) setError("You do not have permission to view messages.");
            return;
        }
        try {
            const res = await apiService.getUsers(user.userIdentifier);
            if (res.data.success) {
                const allUsers = await Promise.all(res.data.users
                    .filter(u => u.username !== user.userIdentifier)
                    .map(async u => ({
                        ...u,
                        publicKey: u.publicKey ? importPublicKey(u.publicKey) : null // Keep as a promise
                    })));
                setUsers(allUsers);
            } else setError(res.data.message);
        } catch (err) {
            setError(`Failed to fetch users: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoadingUsers(false);
        }
    }, [user?.userIdentifier, canMessage]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const fetchUnreadCounts = useCallback(async () => {
        if (!user?.userIdentifier || !canMessage) return;
        try {
            const res = await apiService.getUnreadMessages(user.userIdentifier);
            if (res.data.success) {
                setUnreadCounts(res.data.unreadCounts || {});
            }
        } catch (err) {
            console.error("Failed to poll unread counts:", err);
        }
    }, [user?.userIdentifier, canMessage]);

    const fetchAndMarkMessages = useCallback(async (isPolling = false) => {
        if (!selectedRecipient || !canMessage || !user?.userIdentifier || !privateKeyRef.current) return;
        try {
            if (!isPolling) setLoadingMessages(true);
            if (!isPolling) {
                await apiService.markMessagesAsRead(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
                setUnreadCounts(prev => ({ ...prev, [selectedRecipient.username]: 0 }));
            }
            const res = await apiService.getMessages(user.userIdentifier, selectedRecipient.username, user.userIdentifier);
    
            if (res.data.success) {
                const serverMessages = res.data.messages;
                const localMessages = messagesRef.current;
                const unprocessedTempMessages = new Map(
                    localMessages
                        .filter(m => m.isTemp)
                        .map(m => [m.id, m])
                );
    
                const processedMessages = await Promise.all(serverMessages.map(async serverMsg => {
                    let content = serverMsg.messageContent;
    
                    if (serverMsg.sender === user.userIdentifier) {
                        let match = null;
                        let matchId = null;
    
                        for (const [id, tempMsg] of unprocessedTempMessages.entries()) {
                            if (tempMsg.encryptedContent === serverMsg.messageContent) {
                                match = tempMsg;
                                matchId = id;
                                break;
                            }
                        }
    
                        if (match) {
                            content = match.messageContent;
                            unprocessedTempMessages.delete(matchId);
                        } else {
                            content = "••••••••••";
                        }
                    } else {
                        try {
                            content = await decrypt(privateKeyRef.current, serverMsg.messageContent);
                        } catch (decryptErr) {
                            console.error("Failed to decrypt message:", decryptErr);
                            content = "❌ Message failed to decrypt.";
                        }
                    }
                    return { ...serverMsg, messageContent: content };
                }));
    
                const finalMessages = [...processedMessages, ...Array.from(unprocessedTempMessages.values())];
                finalMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
                setMessages(prev => {
                    if (finalMessages.length > prev.length) {
                        const latest = finalMessages[finalMessages.length - 1];
                        if (latest.sender !== user.userIdentifier && !latest.isTemp) {
                            playSound();
                        }
                    }
                    return finalMessages;
                });
    
            } else if (!isPolling) {
                setError(res.data.message);
            }
        } catch (err) {
            if (!isPolling) setError(`Failed to fetch messages: ${err.response?.data?.message || err.message}`);
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

    useEffect(() => {
        fetchUnreadCounts();
        const unreadInterval = setInterval(fetchUnreadCounts, 15000);
        return () => clearInterval(unreadInterval);
    }, [fetchUnreadCounts]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = useCallback(async (msgContent) => {
        if (!selectedRecipient || !privateKeyRef.current || !user?.userIdentifier) {
            setError("Cannot send message: User or keys are not set up.");
            return;
        }
        
        const timestamp = new Date().toISOString();

        try {
            let recipientPublicKey = selectedRecipient.publicKey ? await selectedRecipient.publicKey : null;

            if (!recipientPublicKey) {
                try {
                    const res = await apiService.getPublicKey(selectedRecipient.username, user.userIdentifier);
                    if (res.data.success && res.data.publicKey) {
                        recipientPublicKey = await importPublicKey(res.data.publicKey);
                        setUsers(prevUsers => prevUsers.map(u =>
                            u.username === selectedRecipient.username
                                ? { ...u, publicKey: Promise.resolve(recipientPublicKey) }
                                : u
                        ));
                    }
                } catch (fetchErr) {
                    console.error("Failed to fetch public key on demand:", fetchErr);
                }
            }

            if (!recipientPublicKey) {
                setError("Recipient's public key is not available. They may need to open the chat page once to generate it.");
                return;
            }

            const encryptedContent = await encrypt(recipientPublicKey, msgContent);
            
            const temp = {
                sender: user.userIdentifier,
                recipient: selectedRecipient.username,
                messageContent: msgContent,
                encryptedContent: encryptedContent, // Store encrypted content for matching
                timestamp: timestamp,
                id: `client_${Date.now()}`,
                isRead: false,
                isTemp: true
            };
            setMessages(prev => [...prev, temp]);

            await apiService.saveMessage(user.userIdentifier, selectedRecipient.username, encryptedContent, user.userIdentifier);

        } catch (err) {
            setError(`Failed to send: ${err.response?.data?.message || err.message}`);
            // Remove the temp message on failure
            setMessages(prev => prev.filter(m => m.id !== `client_${timestamp}`));
        }
    }, [selectedRecipient, user?.userIdentifier]);

    const handleRecipientSelect = async (recipient) => {
        setSelectedRecipient(recipient);
        if (isMobile) setUserListVisible(false);
    };

    return (
        <div className="h-[80vh] md:h-[85vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center px-2 md:px-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <p className="text-gray-600">Chat with colleagues in real-time</p>
                </div>
            </div>
            {user && (
              <>
                {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg" onClick={() => setError('')}>{error}</div>}
                {loadingUsers && <div className="flex justify-center items-center h-64"><Spinner /></div>}
                {!loadingUsers && canMessage && (
                    <div className="flex flex-1 bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className={`w-full md:w-1/3 lg:w-1/4 border-r flex flex-col ${isMobile && !isUserListVisible ? 'hidden' : 'flex'}`}>
                            <div className="p-3 border-b">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {users
                                    .filter(u => u.displayName.toLowerCase().includes(search.toLowerCase()))
                                    .map(u => (
                                        <button key={u.username}
                                            onClick={() => handleRecipientSelect(u)}
                                            className={`w-full flex items-center justify-between p-3 hover:bg-slate-100 transition relative ${selectedRecipient?.username === u.username ? 'bg-indigo-50 text-indigo-700' : ''}`}>
                                            <div className="flex items-center space-x-3">
                                                <span className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-800">
                                                    {u.displayName.charAt(0)}
                                                </span>
                                                <div className="text-left truncate">
                                                    <p className="font-semibold">{u.displayName}</p>
                                                    <p className="text-xs text-slate-500">{u.username}</p>
                                                </div>
                                            </div>
                                            {unreadCounts[u.username] > 0 && (
                                                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                                    {unreadCounts[u.username]}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                            </div>
                        </div>

                        <div className={`flex-1 flex flex-col bg-slate-50 ${isMobile && isUserListVisible ? 'hidden' : 'flex'}`}>
                            {selectedRecipient ? (
                                <>
                                    <div className="p-4 border-b bg-white flex items-center space-x-3">
                                        <span className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                                            {selectedRecipient.displayName.charAt(0)}
                                        </span>
                                        <div>
                                            <h2 className="font-bold">{selectedRecipient.displayName}</h2>
                                            <p className="text-xs text-green-500">Online</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto overflow-x-hidden">
                                        {loadingMessages && <div className="flex justify-center"><Spinner size="6" /></div>}
                                        {!loadingMessages && messages.map((m, i) => {
                                            const isMe = m.sender === user.userIdentifier;
                                            return (
                                                <div key={m.id || m.timestamp} className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                                    {!isMe && (
                                                        <span className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm font-bold text-slate-700">
                                                            {selectedRecipient.displayName.charAt(0)}
                                                        </span>
                                                    )}
                                                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none'}`}>
                                                        <p>{m.messageContent}</p>
                                                        <div className="flex justify-end items-center space-x-1 mt-1">
                                                            <p className="text-[10px] opacity-70">
                                                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            {isMe && (
                                                                <span className="text-[10px]">
                                                                    {m.isRead ? '✓✓' : '✓'}
                                                                </span>
                                                            )}
                                                        </div>
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
                                    <h3 className="font-semibold text-slate-800">Select a Conversation</h3>
                                    <p>Choose a user to start chatting</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </>
          )}
        </div>
    );
};

export default MessagesPage;