import crypto from 'crypto';

// Generate a random encryption key with the required length
const encryptionKey = crypto.randomBytes(16);
console.log(encryptionKey.toString('hex'));
