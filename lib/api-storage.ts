// API key storage utilities using encrypted vault

const DB_NAME = "OxidikoAPI"
const DB_VERSION = 1
const STORE_NAME = "api_vault"
const API_KEY_PREFIX = "oxid_"

// Initialize IndexedDB for API storage
const initAPIDB = (): Promise<IDBDatabase> => {
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

// Generate API key
const generateAPIKey = (): string => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const base64 = btoa(String.fromCharCode(...randomBytes))
  return API_KEY_PREFIX + base64.replace(/[+/=]/g, "").substring(0, 40)
}

// Derive key from password
const derivePasswordKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

// Encrypt data
const encryptAPIData = async (data: any, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> => {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, encoder.encode(JSON.stringify(data)))
  return { encrypted, iv }
}

// Decrypt data
const decryptAPIData = async (encrypted: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<any> => {
  const decoder = new TextDecoder()
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted)
  return JSON.parse(decoder.decode(decrypted))
}

// Store data in IndexedDB
const storeAPIData = async (key: string, value: any): Promise<void> => {
  const db = await initAPIDB()
  const transaction = db.transaction([STORE_NAME], "readwrite")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.put(value, key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Retrieve data from IndexedDB
const retrieveAPIData = async (key: string): Promise<any> => {
  const db = await initAPIDB()
  const transaction = db.transaction([STORE_NAME], "readonly")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Get all keys from IndexedDB
const getAllAPIKeys = async (): Promise<string[]> => {
  const db = await initAPIDB()
  const transaction = db.transaction([STORE_NAME], "readonly")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.getAllKeys()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as string[])
  })
}

// Create API vault
export const createAPIVault = async (
  companyName: string,
  companyEmail: string,
  password: string,
  planId: string,
): Promise<{ apiKey: string; isActive: boolean }> => {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long")
  }

  const apiKey = generateAPIKey()
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const passwordKey = await derivePasswordKey(password, salt)

  const apiData = {
    companyName,
    companyEmail,
    apiKey,
    planId,
    isActive: planId === "free", // Free plan is immediately active
    createdAt: Date.now(),
  }

  const { encrypted, iv } = await encryptAPIData(apiData, passwordKey)

  const vaultData = {
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv),
    salt: Array.from(salt),
    companyEmail, // Store email unencrypted for lookup
  }

  await storeAPIData(`api_${companyEmail}`, vaultData)

  return { apiKey, isActive: apiData.isActive }
}

// Unlock API vault
export const unlockAPIVault = async (companyEmail: string, password: string): Promise<any> => {
  const vaultData = await retrieveAPIData(`api_${companyEmail}`)
  if (!vaultData) {
    throw new Error("API vault not found")
  }

  const salt = new Uint8Array(vaultData.salt)
  const passwordKey = await derivePasswordKey(password, salt)

  try {
    const encrypted = new Uint8Array(vaultData.encrypted).buffer
    const iv = new Uint8Array(vaultData.iv)
    const decryptedData = await decryptAPIData(encrypted, passwordKey, iv)
    return decryptedData
  } catch (err) {
    throw new Error("Invalid password")
  }
}

// Update API vault activation status
export const updateAPIVaultStatus = async (
  companyEmail: string,
  password: string,
  isActive: boolean,
): Promise<void> => {
  const apiData = await unlockAPIVault(companyEmail, password)
  apiData.isActive = isActive
  apiData.updatedAt = Date.now()

  const vaultData = await retrieveAPIData(`api_${companyEmail}`)
  const salt = new Uint8Array(vaultData.salt)
  const passwordKey = await derivePasswordKey(password, salt)

  const { encrypted, iv } = await encryptAPIData(apiData, passwordKey)

  const updatedVaultData = {
    ...vaultData,
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv),
  }

  await storeAPIData(`api_${companyEmail}`, updatedVaultData)
}

// Check if API vault exists (any vault)
export const checkAPIVaultExists = async (email?: string): Promise<boolean> => {
  try {
    if (email) {
      const vaultData = await retrieveAPIData(`api_${email}`)
      return !!vaultData
    } else {
      // Check if any API vault exists
      const keys = await getAllAPIKeys()
      return keys.some((key) => key.startsWith("api_"))
    }
  } catch {
    return false
  }
}
