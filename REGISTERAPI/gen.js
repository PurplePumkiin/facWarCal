import crypto from 'crypto';

// Generate a random encryption key with the required length
const encryptionKey = crypto.randomBytes(32);
console.log(encryptionKey.toString('hex'));
