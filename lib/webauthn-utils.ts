// WebAuthn utilities for Oxidiko identity management

// Generate random bytes for challenges
export const generateRandomBytes = (length = 32): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(length))
}

// SHA-256 hash function
export const sha256 = async (data: Uint8Array): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Generate random Oxidiko suffix
const generateOxidikoSuffix = (): string => {
  const randomBytes = generateRandomBytes(4)
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Extract public key from WebAuthn credential
export const extractPublicKey = (credential: PublicKeyCredential): Uint8Array => {
  // Use the credential ID as a proxy for the public key
  return new Uint8Array(credential.rawId)
}

// Create a deterministic signature for key wrapping
const createWrapSignature = async (credentialId: ArrayBuffer): Promise<ArrayBuffer> => {
  const wrapData = new Uint8Array([...new Uint8Array(credentialId), ...new TextEncoder().encode("OxidikoWrapKey")])
  return await crypto.subtle.digest("SHA-256", wrapData)
}

// Create WebAuthn credential (passkey) and get signature for key wrapping
export const createPasskey = async (): Promise<{
  credential: PublicKeyCredential
  oxidikoId: string
  credId: string
  signature: ArrayBuffer
  passkeyName: string
}> => {
  const challenge = generateRandomBytes(32)
  const oxidikoSuffix = generateOxidikoSuffix()
  const passkeyName = `oxidiko-${oxidikoSuffix}`

  // Create a meaningful user ID that can be used across devices
  const userIdString = `oxidiko-user-${oxidikoSuffix}`
  const userId = new TextEncoder().encode(userIdString)

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: challenge,
      rp: {
        name: "Oxidiko Identity",
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: passkeyName,
        displayName: `Oxidiko Identity ${oxidikoSuffix}`,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256 fallback
        { type: "public-key", alg: -8 }, // EdDSA
      ],
      authenticatorSelection: {
        userVerification: "required",
        // Remove authenticatorAttachment to allow both platform and cross-platform
        // This lets Chrome show options: "This device", "Phone or tablet", "Security key"
        residentKey: "required", // This makes the passkey discoverable and saveable across devices
        requireResidentKey: true, // Ensure the key is stored on the authenticator
      },
      timeout: 120000, // Increased timeout to give user time to choose
      attestation: "none",
      extensions: {
        // Request credential properties to understand what was created
        credProps: true,
        // Enable large blob extension for additional data storage if supported
        largeBlob: {
          support: "preferred",
        },
      },
    },
  })) as PublicKeyCredential

  if (!credential) {
    throw new Error("Failed to create passkey")
  }

  // Check if the credential was stored as a resident key
  const response = credential.response as AuthenticatorAttestationResponse
  const extensions = credential.getClientExtensionResults()

  console.log("Passkey created with extensions:", extensions)
  console.log("Credential response:", response)

  // Log authenticator info for debugging
  if (response.getAuthenticatorData) {
    const authData = response.getAuthenticatorData()
    console.log("Authenticator data length:", authData.byteLength)
  }

  // Extract public key (using credential ID)
  const pubKey = extractPublicKey(credential)

  // Generate Oxidiko ID from public key hash
  const oxidikoId = await sha256(pubKey)

  // Store credential ID for future authentication
  const credId = Array.from(new Uint8Array(credential.rawId))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Create deterministic signature for key wrapping
  // This ensures the same signature is always generated for the same credential
  const signature = await createWrapSignature(credential.rawId)

  return {
    credential,
    oxidikoId,
    credId,
    signature,
    passkeyName,
  }
}

// Create passkey with specific authenticator preference
export const createPasskeyWithPreference = async (
  authenticatorType: "platform" | "cross-platform" | "any" = "any",
): Promise<{
  credential: PublicKeyCredential
  oxidikoId: string
  credId: string
  signature: ArrayBuffer
  passkeyName: string
}> => {
  const challenge = generateRandomBytes(32)
  const oxidikoSuffix = generateOxidikoSuffix()
  const passkeyName = `oxidiko-${oxidikoSuffix}`

  // Create a meaningful user ID that can be used across devices
  const userIdString = `oxidiko-user-${oxidikoSuffix}`
  const userId = new TextEncoder().encode(userIdString)

  // Configure authenticator selection based on preference
  const authenticatorSelection: AuthenticatorSelectionCriteria = {
    userVerification: "required",
    residentKey: "required",
    requireResidentKey: true,
  }

  if (authenticatorType === "platform") {
    authenticatorSelection.authenticatorAttachment = "platform"
  } else if (authenticatorType === "cross-platform") {
    authenticatorSelection.authenticatorAttachment = "cross-platform"
  }
  // If "any", don't set authenticatorAttachment to let user choose

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: challenge,
      rp: {
        name: "Oxidiko Identity",
        id: window.location.hostname,
      },
      user: {
        id: userId,
        name: passkeyName,
        displayName: `Oxidiko Identity ${oxidikoSuffix}`,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256 fallback
        { type: "public-key", alg: -8 }, // EdDSA
      ],
      authenticatorSelection,
      timeout: 120000, // Increased timeout to give user time to choose
      attestation: "none",
      extensions: {
        credProps: true,
        largeBlob: {
          support: "preferred",
        },
      },
    },
  })) as PublicKeyCredential

  if (!credential) {
    throw new Error("Failed to create passkey")
  }

  // Extract public key (using credential ID)
  const pubKey = extractPublicKey(credential)

  // Generate Oxidiko ID from public key hash
  const oxidikoId = await sha256(pubKey)

  // Store credential ID for future authentication
  const credId = Array.from(new Uint8Array(credential.rawId))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Create deterministic signature for key wrapping
  const signature = await createWrapSignature(credential.rawId)

  return {
    credential,
    oxidikoId,
    credId,
    signature,
    passkeyName,
  }
}

// Authenticate with existing passkey using wrap challenge
export const authenticatePasskey = async (
  credId: string,
): Promise<{
  assertion: PublicKeyCredential
  oxidikoId: string
  signature: ArrayBuffer
}> => {
  // Convert hex string back to Uint8Array
  const credIdBytes = new Uint8Array(credId.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])

  // Create deterministic signature for key wrapping (same as creation)
  const signature = await createWrapSignature(credIdBytes.buffer)

  // Extract public key from credential ID (using credential ID as proxy)
  const pubKey = credIdBytes

  // Recompute Oxidiko ID
  const oxidikoId = await sha256(pubKey)

  // We still need to verify the user can authenticate, but we don't use the signature from WebAuthn
  // Instead we use our deterministic signature for consistency
  const encoder = new TextEncoder()
  const challenge = encoder.encode("OxidikoAuthChallenge")

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      allowCredentials: [
        {
          id: credIdBytes,
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  })) as PublicKeyCredential

  if (!assertion) {
    throw new Error("Authentication failed")
  }

  return {
    assertion,
    oxidikoId,
    signature, // Use our deterministic signature, not the WebAuthn signature
  }
}

// Authenticate with discoverable credentials (for cross-device usage)
export const authenticateWithDiscoverableCredential = async (): Promise<{
  assertion: PublicKeyCredential
  oxidikoId: string
  signature: ArrayBuffer
  credId: string
}> => {
  const encoder = new TextEncoder()
  const challenge = encoder.encode("OxidikoAuthChallenge")

  // Don't specify allowCredentials - let the authenticator show available passkeys
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      // No allowCredentials - this enables discoverable credential flow
      userVerification: "required",
      timeout: 60000,
    },
  })) as PublicKeyCredential

  if (!assertion) {
    throw new Error("Authentication failed")
  }

  // Extract credential ID
  const credIdBytes = new Uint8Array(assertion.rawId)
  const credId = Array.from(credIdBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Create deterministic signature for key wrapping
  const signature = await createWrapSignature(assertion.rawId)

  // Extract public key from credential ID (using credential ID as proxy)
  const pubKey = credIdBytes

  // Recompute Oxidiko ID
  const oxidikoId = await sha256(pubKey)

  return {
    assertion,
    oxidikoId,
    signature,
    credId,
  }
}

// Check if WebAuthn is supported
export const isWebAuthnSupported = (): boolean => {
  return !!(navigator.credentials && navigator.credentials.create)
}

// Check if platform authenticator is available
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// Check if conditional UI (discoverable credentials) is supported
export const isConditionalUISupported = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false

  try {
    return await PublicKeyCredential.isConditionalMediationAvailable()
  } catch {
    return false
  }
}

// Get available authenticator types
export const getAvailableAuthenticatorTypes = async (): Promise<{
  platform: boolean
  crossPlatform: boolean
}> => {
  const platform = await isPlatformAuthenticatorAvailable()

  // Cross-platform is harder to detect, but we can assume it's available if WebAuthn is supported
  const crossPlatform = isWebAuthnSupported()

  return {
    platform,
    crossPlatform,
  }
}
