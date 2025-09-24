// A simple wrapper for the Web Crypto API
// In a real-world app, you'd want more robust key management
// and error handling.
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

// Export the public key to a format that can be stored and sent
export async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Import a public key from its exported format
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
        true, // extractable
        ["encrypt"]
    );
}

// Export the private key to a format for secure storage
export async function exportPrivateKey(key) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Import a private key from its exported format
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
        true, // extractable
        ["decrypt"]
    );
}

// Encrypt a message using a public key
export async function encrypt(publicKey, plaintext) {
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Decrypt a message using a private key
export async function decrypt(privateKey, ciphertext) {
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
}
