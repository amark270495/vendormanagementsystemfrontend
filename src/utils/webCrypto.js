// =========================================================================
// SECURE WEB CRYPTO WRAPPER (Persistent Keys & Safe Decryption Fallback)
// =========================================================================

const STORAGE_KEY_PUBLIC = "vms_chat_pub_key";
const STORAGE_KEY_PRIVATE = "vms_chat_priv_key";

/**
 * Generates a fresh RSA-OAEP key pair.
 */
export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );
}

/**
 * Generates or retrieves a persistent RSA-OAEP key pair for the user session.
 * Prevents key loss and decryption lockouts on browser refresh.
 */
export async function getOrCreateKeyPair() {
    try {
        const storedPub = localStorage.getItem(STORAGE_KEY_PUBLIC);
        const storedPriv = localStorage.getItem(STORAGE_KEY_PRIVATE);

        if (storedPub && storedPriv) {
            const publicKey = await importPublicKey(storedPub);
            const privateKey = await importPrivateKey(storedPriv);
            return { publicKey, privateKey };
        }
    } catch (e) {
        console.warn("Stored keys corrupted or missing. Generating new key pair...", e);
    }

    const keyPair = await generateKeyPair();

    const pubString = await exportPublicKey(keyPair.publicKey);
    const privString = await exportPrivateKey(keyPair.privateKey);

    localStorage.setItem(STORAGE_KEY_PUBLIC, pubString);
    localStorage.setItem(STORAGE_KEY_PRIVATE, privString);

    return keyPair;
}

export async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPublicKey(keyString) {
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
}

export async function exportPrivateKey(key) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importPrivateKey(keyString) {
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
}

export async function encrypt(publicKey, plaintext) {
    if (!plaintext) return "";
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Safely decrypts ciphertext. 
 * Bulletproof check: If a message is legacy plaintext, it returns it instantly 
 * without triggering a browser DOMException.
 */
export async function decrypt(privateKey, ciphertext) {
    if (!ciphertext) return "";

    // If it's not valid base64, assume it's legacy unencrypted plaintext
    if (typeof ciphertext !== 'string' || !isBase64(ciphertext)) {
        return ciphertext;
    }

    try {
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
    } catch (error) {
        console.warn("Skipping unreadable or mismatched encrypted message:", error.message);
        return ciphertext;
    }
}

function isBase64(str) {
    if (str.length % 4 !== 0) return false;
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
}