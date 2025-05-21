"use strict";

const crypto = require("crypto");
const { ENCRYPTION_KEY } = require("../config");

const algorithm = "aes-256-cbc";
const secretKey = ENCRYPTION_KEY;
const ivLength = 16; // AES block size

function encryptId(id) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
  let encrypted = cipher.update(id.toString());
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptId(encryptedId) {
  const [ivHex, encryptedHex] = encryptedId.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encryptId, decryptId };
