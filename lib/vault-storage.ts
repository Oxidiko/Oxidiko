// Vault storage utilities using dual-wrapped keys (Passkey + PIN)

const DB_NAME = "OxidikoVault"
const DB_VERSION = 1
const STORE_NAME = "vault"
const PROFILE_KEY = "profile"
const SITE_ACCESS_KEY = "site_access"
const WRAP_CHALLENGE = "oxidiko-wrap-v1"

let currentProfile: any = null
let currentOxidikoId: string | null = null
let currentMVK: CryptoKey | null = null

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

// Generate Master Vault Key (MVK)
const generateMVK = async (): Promise<CryptoKey> => {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable
    ["encrypt", "decrypt"],
  )
}

// Derive PIN unlock key using Argon2id (fallback to PBKDF2)
const derivePINKey = async (pin: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveKey"])

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000, // High iteration count for security
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

// Derive passkey unlock key from signature
const derivePasskeyKey = async (signature: ArrayBuffer): Promise<CryptoKey> => {
  const hash = await crypto.subtle.digest("SHA-256", signature)
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
}

// Wrap (encrypt) MVK with another key
const wrapKey = async (mvk: CryptoKey, wrapKey: CryptoKey): Promise<{ wrapped: ArrayBuffer; iv: Uint8Array }> => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const wrapped = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    wrapKey,
    await crypto.subtle.exportKey("raw", mvk),
  )
  return { wrapped, iv }
}

// Unwrap (decrypt) MVK with another key
const unwrapKey = async (wrappedKey: ArrayBuffer, wrapKey: CryptoKey, iv: Uint8Array): Promise<CryptoKey> => {
  const keyData = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, wrapKey, wrappedKey)

  return crypto.subtle.importKey("raw", keyData, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
}

// Encrypt data with MVK
const encryptData = async (data: any, mvk: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> => {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, mvk, encoder.encode(JSON.stringify(data)))

  return { encrypted, iv }
}

// Decrypt data with MVK
const decryptData = async (encrypted: ArrayBuffer, mvk: CryptoKey, iv: Uint8Array): Promise<any> => {
  const decoder = new TextDecoder()

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, mvk, encrypted)

  return JSON.parse(decoder.decode(decrypted))
}

// Helper to generate new salt or IV
export const generateSalt = (length = 16): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length))
}

// Store data in IndexedDB
const storeData = async (key: string, value: any): Promise<void> => {
  const db = await initDB()
  const transaction = db.transaction([STORE_NAME], "readwrite")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.put(value, key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Retrieve data from IndexedDB
const retrieveData = async (key: string): Promise<any> => {
  const db = await initDB()
  const transaction = db.transaction([STORE_NAME], "readonly")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Check if a specific vault exists by name
export const getVault = async (vaultName: string): Promise<boolean> => {
  try {
    const vaultData = await retrieveData(vaultName)
    return !!vaultData
  } catch {
    return false
  }
}

// Generate Recovery ID from Oxidiko ID and PIN
const generateRecId = async (oxidikoId: string, pin: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(oxidikoId + pin)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Create vault with dual-wrapped keys
export const createVault = async (
  profileData: any,
  oxidikoId: string,
  credId: string,
  pin: string,
  passkeySignature: ArrayBuffer,
  passkeyName: string,
): Promise<void> => {
  if (pin.length < 8) {
    throw new Error("PIN must be at least 8 characters long")
  }

  // Generate Master Vault Key
  const mvk = await generateMVK()

  // Generate salt for PIN derivation
  const salt = crypto.getRandomValues(new Uint8Array(32))

  // Generate Recovery ID
  const recId = await generateRecId(oxidikoId, pin)

  // Derive keys for wrapping
  const pinKey = await derivePINKey(pin, salt)
  const passkeyKey = await derivePasskeyKey(passkeySignature)

  // Wrap MVK with both keys
  const { wrapped: wrappedKeyPasskey, iv: ivPasskey } = await wrapKey(mvk, passkeyKey)
  const { wrapped: wrappedKeyPin, iv: ivPin } = await wrapKey(mvk, pinKey)

  // Encrypt profile data with MVK
  const { encrypted: vaultCiphertext, iv: vaultIv } = await encryptData(profileData, mvk)

  const vaultData = {
    oxidiko_id: oxidikoId,
    cred_id: credId,
    passkey_name: passkeyName, // Save the passkey name
    wrappedKey_passkey: Array.from(new Uint8Array(wrappedKeyPasskey)),
    wrappedKey_pin: Array.from(new Uint8Array(wrappedKeyPin)),
    iv_passkey: Array.from(ivPasskey),
    iv_pin: Array.from(ivPin),
    vault_ciphertext: Array.from(new Uint8Array(vaultCiphertext)),
    vault_iv: Array.from(vaultIv),
    salt: Array.from(salt),
    wrapChallenge: WRAP_CHALLENGE,
    created_at: Date.now(),
    rec_id: recId,
  }

  await storeData(PROFILE_KEY, vaultData)

  // Initialize empty access records
  await storeData(SITE_ACCESS_KEY, {})

  currentProfile = profileData
  currentOxidikoId = oxidikoId
  currentMVK = mvk
}

// Check if vault exists
export const checkVaultExists = async (): Promise<boolean> => {
  try {
    const vaultData = await retrieveData(PROFILE_KEY)
    return !!vaultData
  } catch {
    return false
  }
}

// Get stored credential ID
export const getStoredCredId = async (): Promise<string | null> => {
  try {
    const vaultData = await retrieveData(PROFILE_KEY)
    return vaultData?.cred_id || null
  } catch {
    return null
  }
}

// Get stored passkey name
export const getStoredPasskeyName = async (): Promise<string | null> => {
  try {
    const vaultData = await retrieveData(PROFILE_KEY)
    return vaultData?.passkey_name || null
  } catch {
    return null
  }
}

// Get stored recovery ID
export const getStoredRecId = async (): Promise<string | null> => {
  try {
    const vaultData = await retrieveData(PROFILE_KEY)
    return vaultData?.rec_id || null
  } catch {
    return null
  }
}

// Get wrap challenge for passkey authentication
export const getWrapChallenge = (): string => {
  return WRAP_CHALLENGE
}

// Unlock vault with passkey
export const unlockVaultWithPasskey = async (oxidikoId: string, signature: ArrayBuffer): Promise<void> => {
  const vaultData = await retrieveData(PROFILE_KEY)
  if (!vaultData) {
    throw new Error("Vault not found")
  }

  // Verify Oxidiko ID matches
  if (vaultData.oxidiko_id !== oxidikoId) {
    throw new Error("Invalid identity - Oxidiko ID mismatch")
  }

  try {
    // Derive passkey unlock key
    const passkeyKey = await derivePasskeyKey(signature)

    // Unwrap MVK
    const wrappedKeyPasskey = new Uint8Array(vaultData.wrappedKey_passkey).buffer
    const ivPasskey = new Uint8Array(vaultData.iv_passkey)
    const mvk = await unwrapKey(wrappedKeyPasskey, passkeyKey, ivPasskey)

    // Decrypt vault
    const vaultCiphertext = new Uint8Array(vaultData.vault_ciphertext).buffer
    const vaultIv = new Uint8Array(vaultData.vault_iv)
    const decryptedProfile = await decryptData(vaultCiphertext, mvk, vaultIv)

    currentProfile = decryptedProfile
    currentOxidikoId = oxidikoId
    currentMVK = mvk
  } catch (err) {
    console.error("Passkey unlock error:", err)
    throw new Error("Failed to unlock vault with passkey - invalid signature or corrupted data")
  }
}

// Unlock vault with PIN
export const unlockVaultWithPIN = async (pin: string): Promise<string> => {
  const vaultData = await retrieveData(PROFILE_KEY)
  if (!vaultData) {
    throw new Error("Vault not found")
  }

  if (pin.length < 8) {
    throw new Error("PIN must be at least 8 characters long")
  }

  try {
    // Derive PIN unlock key
    const salt = new Uint8Array(vaultData.salt)
    const pinKey = await derivePINKey(pin, salt)

    // Unwrap MVK
    const wrappedKeyPin = new Uint8Array(vaultData.wrappedKey_pin).buffer
    const ivPin = new Uint8Array(vaultData.iv_pin)
    const mvk = await unwrapKey(wrappedKeyPin, pinKey, ivPin)

    // Decrypt vault
    const vaultCiphertext = new Uint8Array(vaultData.vault_ciphertext).buffer
    const vaultIv = new Uint8Array(vaultData.vault_iv)
    const decryptedProfile = await decryptData(vaultCiphertext, mvk, vaultIv)

    currentProfile = decryptedProfile
    currentOxidikoId = vaultData.oxidiko_id
    currentMVK = mvk

    return vaultData.oxidiko_id
  } catch (err) {
    throw new Error("Invalid PIN or corrupted vault data")
  }
}

// Check if vault is unlocked
export const isVaultUnlocked = (): boolean => {
  return currentProfile !== null && currentOxidikoId !== null && currentMVK !== null
}

// Get decrypted profile
export const getDecryptedProfile = async (): Promise<any> => {
  if (!currentProfile) {
    throw new Error("Vault is locked")
  }
  return currentProfile
}

// Get current Oxidiko ID
export const getCurrentOxidikoId = (): string | null => {
  return currentOxidikoId
}

// Lock vault
export const lockVault = (): void => {
  currentProfile = null
  currentOxidikoId = null
  currentMVK = null
}

// Update profile data
export const updateProfile = async (profileData: any): Promise<void> => {
  if (!currentProfile || !currentOxidikoId || !currentMVK) {
    throw new Error("Vault is locked")
  }

  // Re-encrypt with current MVK
  const { encrypted: vaultCiphertext, iv: vaultIv } = await encryptData(profileData, currentMVK)

  const vaultData = await retrieveData(PROFILE_KEY)
  if (!vaultData) {
    throw new Error("Vault not found")
  }

  const updatedVaultData = {
    ...vaultData,
    vault_ciphertext: Array.from(new Uint8Array(vaultCiphertext)),
    vault_iv: Array.from(vaultIv),
    updated_at: Date.now(),
  }

  await storeData(PROFILE_KEY, updatedVaultData)
  currentProfile = profileData
}

// Validate site origin URL
export const validateSiteOrigin = (siteOrigin: string): string => {
  try {
    const url = new URL(siteOrigin);
    return url.origin;
  } catch {
    throw new Error("Invalid site origin");
  }
};


// Get site access history
export const getSiteAccessHistory = async (): Promise<any> => {
  if (!currentMVK) {
    throw new Error("Vault is locked")
  }

  try {
    const siteAccessData = await retrieveData(SITE_ACCESS_KEY)
    return siteAccessData || {}
  } catch (err) {
    console.error("Error getting site access history:", err)
    return {}
  }
}

// Get recent site accesses (last 3)
export const getRecentSiteAccesses = async (): Promise<any[]> => {
  const siteAccess = await getSiteAccessHistory()
  const allAccesses: any[] = []

  Object.entries(siteAccess).forEach(([origin, data]: [string, any]) => {
    if (data.recent_accesses && data.recent_accesses.length > 0) {
      data.recent_accesses.forEach((access: any) => {
        allAccesses.push({
          origin,
          ...access
        })
      })
    }
  })

  // Sort by timestamp and return last 3
  return allAccesses
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3)
}

// Export vault data for backup/transfer
export const exportVaultData = async (): Promise<string> => {
  const vaultData = await retrieveData(PROFILE_KEY)
  if (!vaultData) {
    throw new Error("Vault not found")
  }

  return JSON.stringify(vaultData)
}

// Import vault data from backup
export const importVaultData = async (vaultJson: string): Promise<void> => {
  try {
    const vaultData = JSON.parse(vaultJson)

    // Validate required fields
    if (!vaultData.oxidiko_id || !vaultData.wrappedKey_pin || !vaultData.vault_ciphertext) {
      throw new Error("Invalid vault data format")
    }

    await storeData(PROFILE_KEY, vaultData)
  } catch (err) {
    throw new Error("Failed to import vault data")
  }
}

// Obliterate vault - completely remove all vault data
export const obliterateVault = async (): Promise<void> => {
  const db = await initDB()
  const transaction = db.transaction([STORE_NAME], "readwrite")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    // Delete all vault-related keys
    const deletePromises = [
      new Promise<void>((res, rej) => {
        const req = store.delete(PROFILE_KEY)
        req.onerror = () => rej(req.error)
        req.onsuccess = () => res()
      }),
      new Promise<void>((res, rej) => {
        const req = store.delete(SITE_ACCESS_KEY)
        req.onerror = () => rej(req.error)
        req.onsuccess = () => res()
      })
    ]

    Promise.all(deletePromises)
      .then(() => {
        // Clear in-memory state
        currentProfile = null
        currentOxidikoId = null
        currentMVK = null
        resolve()
      })
      .catch(reject)
  })
}
// Import RSA Public Key (SPKI)
export const importPublicKey = async (pem: string): Promise<CryptoKey> => {
  try {
    // Remove headers and newlines
    const pemHeader = "-----BEGIN PUBLIC KEY-----"
    const pemFooter = "-----END PUBLIC KEY-----"
    const pemContents = pem.substring(pem.indexOf(pemHeader) + pemHeader.length, pem.indexOf(pemFooter))
    // base64 decode
    const binaryDerString = window.atob(pemContents.replace(/\s/g, ''))
    const binaryDer = new Uint8Array(binaryDerString.length)
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i)
    }

    return await crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    )
  } catch (e) {
    console.error("Error importing public key:", e)
    throw new Error("Invalid Public Key")
  }
}

const bufferToBase64 = (buffer: ArrayBuffer | ArrayBufferView): string => {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// Encrypt data with Hybrid Encryption (RSA + AES)
export const encryptDataWithPublicKey = async (data: any, rssPublicKey: CryptoKey): Promise<string> => {
  // 1. Generate a random AES-GCM key for data encryption
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  )

  // 2. Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  // 3. Encrypt the data with the AES key
  const encoder = new TextEncoder()
  const encodedData = encoder.encode(JSON.stringify(data))
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedData
  )

  // 4. Wrap (encrypt) the AES key with the RSA Public Key
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey)
  const wrappedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rssPublicKey,
    exportedAesKey
  )

  // 5. Package as base64 strings: WrappedKey.IV.EncryptedData
  const result = `${bufferToBase64(wrappedKey)}.${bufferToBase64(iv)}.${bufferToBase64(encryptedData)}`
  console.log("Generated hybrid payload. Parts:", result.split('.').length, "Total length:", result.length)
  return result
}
