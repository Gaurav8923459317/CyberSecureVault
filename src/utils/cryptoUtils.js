// src/utils/cryptoUtils.js
// ===============================
// Advanced Encryption Utilities using Web Crypto API
// Includes password-strength helpers so UI components work.
// ===============================

class CryptoManager {
  constructor() {
    this.algorithm = "AES-GCM";
    this.keyLength = 256;
  }

  // ========== KEY MANAGEMENT ==========
  async deriveKeyFromPassword(password, salt) {
    try {
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        {
          name: this.algorithm,
          length: this.keyLength,
        },
        false,
        ["encrypt", "decrypt"]
      );

      return key;
    } catch (err) {
      console.error("Key derivation error:", err);
      throw new Error("Encryption key generation failed");
    }
  }

  // ========== FILE ENCRYPTION ==========
  async encryptFile(file, password) {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKeyFromPassword(password, salt);
      const fileBuffer = await file.arrayBuffer();

      const encryptedData = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        key,
        fileBuffer
      );

      // Return structured result (we'll serialize before upload if needed)
      return {
        encryptedData: new Uint8Array(encryptedData),
        salt,
        iv,
        originalName: file.name,
        originalType: file.type,
        originalSize: file.size,
        encryptedAt: new Date().toISOString(),
        algorithm: this.algorithm,
      };
    } catch (err) {
      console.error("Encryption error:", err);
      throw new Error("File encryption failed");
    }
  }

  // ========== FILE DECRYPTION ==========
  async decryptFile(encryptedBlob, password) {
    try {
      // If encryptedBlob is raw object produced by encryptFile (not serialized),
      // accept either { encryptedData, salt, iv, ... } OR a Blob (serialized).
      let meta;
      if (encryptedBlob instanceof Blob) {
        meta = await this.deserializeEncryptedFile(encryptedBlob);
      } else {
        meta = encryptedBlob;
      }

      const key = await this.deriveKeyFromPassword(password, meta.salt);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: meta.iv,
        },
        key,
        meta.encryptedData
      );

      const decryptedBlob = new Blob([decryptedData], { type: meta.originalType });

      return {
        blob: decryptedBlob,
        name: meta.originalName,
        type: meta.originalType,
        size: meta.originalSize,
      };
    } catch (err) {
      console.error("Decryption error:", err);
      if (err.name === "OperationError") throw new Error("Wrong password or corrupted file");
      throw new Error("File decryption failed");
    }
  }

  // ========== SERIALIZATION ==========
  // Create a simple serialized format: [4 bytes headerLen][header JSON][salt(16)][iv(12)][encryptedData]
  serializeEncryptedFile(encrypted) {
    const header = JSON.stringify({
      originalName: encrypted.originalName,
      originalType: encrypted.originalType,
      originalSize: encrypted.originalSize,
      encryptedAt: encrypted.encryptedAt,
      algorithm: encrypted.algorithm,
    });

    const headerLength = new Uint32Array([header.length]); // 4 bytes
    const parts = [
      new Uint8Array(headerLength.buffer),
      new TextEncoder().encode(header),
      encrypted.salt,
      encrypted.iv,
      encrypted.encryptedData,
    ];

    const total = parts.reduce((s, p) => s + p.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    parts.forEach((p) => {
      result.set(p, offset);
      offset += p.length;
    });

    return new Blob([result], { type: "application/encrypted-file" });
  }

  async deserializeEncryptedFile(blob) {
    try {
      const buffer = await blob.arrayBuffer();
      const view = new DataView(buffer);

      const headerLen = view.getUint32(0, true);
      let offset = 4;

      const headerBytes = new Uint8Array(buffer, offset, headerLen);
      const header = JSON.parse(new TextDecoder().decode(headerBytes));
      offset += headerLen;

      const salt = new Uint8Array(buffer, offset, 16);
      offset += 16;

      const iv = new Uint8Array(buffer, offset, 12);
      offset += 12;

      const encryptedData = new Uint8Array(buffer, offset);

      return {
        ...header,
        salt,
        iv,
        encryptedData,
      };
    } catch (err) {
      console.error("Deserialize error:", err);
      throw new Error("Invalid encrypted file format");
    }
  }

  // ========== PASSWORD HELPERS (added: validate + generate) ==========
  validatePasswordStrength(password) {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passed = Object.values(requirements).filter(Boolean).length;
    const score = Math.max(0, passed - 1); // 0..4 roughly
    return {
      isValid: requirements.minLength && passed >= 3,
      requirements,
      score,
    };
  }

  generateSecurePassword(length = 16) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()";
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }
}

// export singleton
export const cryptoManager = new CryptoManager();
