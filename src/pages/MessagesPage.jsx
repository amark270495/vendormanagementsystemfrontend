import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

// NOTE: All necessary components and hooks are now self-contained within this single file
// as external imports were causing build issues.

const MessageInputForm = memo(({ onSendMessage, disabled }) => {
    const [newMessage, setNewMessage] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        onSendMessage(newMessage.trim());
        setNewMessage('');
    };

    // A correct SVG for the send button
    const sendIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-5 h-5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    );

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
                {sendIcon}
            </button>
        </form>
    );
});

// A simple Spinner component to show loading state
const Spinner = ({ size = "10" }) => (
    <div className={`w-${size} h-${size} rounded-full animate-spin border-4 border-solid border-indigo-500 border-t-transparent`}></div>
);

// A mock useAuth hook to simulate user authentication
const useAuth = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    setUser({ userIdentifier: 'amarendra@taprootsolutions.com' });
  }, []);
  return { user };
};

// A mock usePermissions hook
const usePermissions = () => {
    return { canMessage: true };
};

// A mock useMediaQuery hook
const useMediaQuery = () => {
    return false; // Assume desktop for simplicity
};

// A mock apiService for demonstration purposes
const apiService = {
    // This will now handle JSON objects with encrypted content
    getUsers: async (authenticatedUsername) => {
        console.log(`API: Fetching users for ${authenticatedUsername}`);
        return {
            data: {
                success: true,
                users: [
                    { username: 'user1@example.com', displayName: 'User One', publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyYt7Lw.../your-public-key-here' },
                    { username: 'user2@example.com', displayName: 'User Two', publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyYt7Lw.../your-public-key-here' }
                ]
            }
        };
    },
    getMessages: async (user1, user2, authenticatedUsername) => {
        console.log(`API: Fetching messages between ${user1} and ${user2}`);
        // This is a placeholder for a message stored in an Azure table
        const messages = [
            { sender: 'user2@example.com', recipient: 'amarendra@taprootsolutions.com', messageContent: 'ThisIsAnEncryptedMessageFromUser2', timestamp: '2025-09-24T20:50:00Z', isRead: false },
            { sender: 'amarendra@taprootsolutions.com', recipient: 'user2@example.com', messageContent: 'ThisIsAnEncryptedMessageFromMe', timestamp: '2025-09-24T20:51:00Z', isRead: false },
        ];
        return { data: { success: true, messages } };
    },
    saveMessage: async (sender, recipient, messageContent, authenticatedUsername) => {
        console.log(`API: Saving encrypted message from ${sender} to ${recipient}`);
        return { data: { success: true } };
    },
    getUnreadMessages: async (authenticatedUsername) => {
        console.log(`API: Getting unread messages for ${authenticatedUsername}`);
        return { data: { success: true, unreadCounts: { 'user2@example.com': 1 } } };
    },
    markMessagesAsRead: async (recipient, sender, authenticatedUsername) => {
        console.log(`API: Marking messages from ${sender} as read for ${recipient}`);
        return { data: { success: true } };
    },
    savePublicKey: async (username, publicKey) => {
        console.log(`API: Saving public key for ${username}`);
        return { data: { success: true } };
    }
};

// The Web Crypto API wrapper (from webCrypto.js) is now embedded here
// In a real-world app, you'd want more robust key management and error handling.
const generateKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
};

const exportPublicKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

const importPublicKey = async (keyString) => {
    const binaryDerString = atob(keyString);
    const binaryDer = new Uint8Array(
        [...binaryDerString].map(ch => ch.charCodeAt(0))
    );
    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
};

const exportPrivateKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

const importPrivateKey = async (keyString) => {
    const binaryDerString = atob(keyString);
    const binaryDer = new Uint8Array(
        [...binaryDerString].map(ch => ch.charCodeAt(0))
    );
    return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
};

const encrypt = async (publicKey, plaintext) => {
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

const decrypt = async (privateKey, ciphertext) => {
    const binaryDerString = atob(ciphertext);
    const encrypted = new Uint8Array(
        [...binaryDerString].map(ch => ch.charCodeAt(0))
    );
    const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encrypted
    );
    return new TextDecoder().decode(decrypted);
};


// The main component
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

    useEffect(() => {
        // NOTE: In a real app, you would load the sound here from an accessible URL.
    }, []);

    const playSound = () => {
        // NOTE: Sound playback logic is removed as the mock audio path will fail.
        // It should be reinstated with a valid audio file in a live app.
    };

    // Key management on component mount
    useEffect(() => {
        const setupKeys = async () => {
            if (!user?.userIdentifier) return;

            let privateKeyString = localStorage.getItem(`privateKey_${user.userIdentifier}`);

            if (privateKeyString) {
                // If a private key exists, import it
                try {
                    privateKeyRef.current = await importPrivateKey(privateKeyString);
                } catch (e) {
                    console.error("Failed to import private key from local storage:", e);
                    localStorage.removeItem(`privateKey_${user.userIdentifier}`);
                    setError("Failed to load your private key. Please refresh to generate a new one.");
                }
            } else {
                // If no private key, generate a new key pair
                const keyPair = await generateKeyPair();
                privateKeyRef.current = keyPair.privateKey;
                const publicKeyString = await exportPublicKey(keyPair.publicKey);
                privateKeyString = await exportPrivateKey(keyPair.privateKey);

                // Save to local storage for persistence
                localStorage.setItem(`privateKey_${user.userIdentifier}`, privateKeyString);

                // Save public key to the backend
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
                const allUsers = res.data.users
                    .filter(u => u.username !== user.userIdentifier)
                    .map(u => ({
                        ...u,
                        publicKey: u.publicKey ? importPublicKey(u.publicKey) : null
                    }));
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
                const decryptedMessages = await Promise.all(res.data.messages.map(async m => {
                    let content = m.messageContent;
                    if (m.sender !== user.userIdentifier) {
                        try {
                            content = await decrypt(privateKeyRef.current, m.messageContent);
                        } catch (decryptErr) {
                            console.error("Failed to decrypt message:", decryptErr);
                            content = "❌ Message failed to decrypt.";
                        }
                    }
                    return { ...m, messageContent: content };
                }));

                const newMessages = decryptedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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
        if (!selectedRecipient || !privateKeyRef.current) {
            setError("Cannot send message: Keys are not set up.");
            return;
        }
        
        const temp = {
            sender: user.userIdentifier,
            recipient: selectedRecipient.username,
            messageContent: msgContent,
            timestamp: new Date().toISOString(),
            id: Date.now(),
            isRead: false
        };
        setMessages(prev => [...prev, temp]);

        try {
            const recipientData = users.find(u => u.username === selectedRecipient.username);
            const recipientPublicKey = await recipientData.publicKey;
            if (!recipientPublicKey) {
                setError("Recipient's public key is not available.");
                setMessages(prev => prev.filter(m => m.id !== temp.id));
                return;
            }

            const encryptedContent = await encrypt(recipientPublicKey, msgContent);

            await apiService.saveMessage(user.userIdentifier, selectedRecipient.username, encryptedContent, user.userIdentifier);
        } catch (err) {
            setError(`Failed to send: ${err.response?.data?.message || err.message}`);
            setMessages(prev => prev.filter(m => m.id !== temp.id));
        }
    }, [selectedRecipient, user.userIdentifier, users]);

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

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg">{error}</div>}
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
                                            <div key={m.id || i} className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                                {!isMe && (
                                                    <span className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-sm font-bold text-slate-700">
                                                        {selectedRecipient.displayName.charAt(0)}
                                                    </span>
                                                )}
                                                <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm
                                                    ${isMe
                                                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-none'
                                                        : 'bg-white border text-slate-800 rounded-bl-none'}`}>
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
        </div>
    );
};

export default MessagesPage;