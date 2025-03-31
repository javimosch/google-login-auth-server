const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '32characterslongencryptionkey!';
const IV_LENGTH = 16; // Longueur du vecteur d'initialisation

/**
 * Chiffre un texte avec AES-256-CBC
 * @param {string} text - Le texte à chiffrer
 * @returns {string} - Texte chiffré sous forme de chaîne hexadécimale
 */
function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error("Erreur lors du chiffrement :", error);
    return null;
  }
}

/**
 * Déchiffre un texte avec AES-256-CBC
 * @param {string} text - Le texte chiffré
 * @returns {string|null} - Texte déchiffré ou null en cas d'erreur
 */
function decrypt(text) {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) throw new Error("Format invalide du texte chiffré");

    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error("Erreur lors du déchiffrement :", error);
    return null;
  }
}

module.exports = { encrypt, decrypt };
