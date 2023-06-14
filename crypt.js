const readline = require('readline');
const crypto = require('crypto');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to derive an IV using a KDF
const deriveIV = (saltPhrase, iterations, keyLength, encryptionKey) => {
  const salt = crypto.createHash('sha256').update(saltPhrase).digest();
  const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, iterations, keyLength, 'sha256');
  return derivedKey.slice(0, 16); // Truncate to 16 bytes for AES-256-CBC
};

// Encrypt the API key
const encryptApiKey = (apiKey, unixTime, encryptionKey) => {
  const iv = deriveIV(salt + unixTime.toString(), 100000, 32, encryptionKey);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
};

// Prompt the user for input
rl.question('Enter the salt phrase: ', (salt) => {
  rl.question('Enter the Unix time: ', (unixTime) => {
    rl.question('Enter the encryption key: ', (encryptionKey) => {
      rl.question('Enter the API key data: ', (apiKey) => {
        // Decrypt the functions file
        const decryptedFunctions = decryptFunctions(salt, unixTime, encryptionKey, apiKey);
        console.log(decryptedFunctions);

        // Close the readline interface
        rl.close();
      });
    });
  });
});

// Decrypt the functions file
const decryptFunctions = (salt, unixTime, encryptionKey, apiKey) => {
  const iv = deriveIV(salt + unixTime.toString(), 100000, 16, encryptionKey);
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(apiKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

