// WebAuthn utilities for Oxidiko identity management

// PRF extension input salt — static per application, identifies the purpose of the key.
// This is NOT secret; it just namespaces the PRF output for Oxidiko key-wrapping.
const PRF_EVAL_INPUT = new TextEncoder().encode("oxidiko-vault-wrap-v2")

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

// LEGACY ONLY: static deterministic wrap signature derived from credential ID.
// Used only for vaults created before PRF support was added (prf_supported: false).
// SECURITY NOTE: This derives from public data and does NOT provide hardware binding.
// New vaults always use PRF when the authenticator supports it.
const createLegacyWrapSignature = async (credentialId: ArrayBuffer): Promise<ArrayBuffer> => {
  const wrapData = new Uint8Array([...new Uint8Array(credentialId), ...new TextEncoder().encode("OxidikoWrapKey")])
  return await crypto.subtle.digest("SHA-256", wrapData)
}

// Create WebAuthn credential (passkey) and get signature for key wrapping.
// Returns prf_supported: true and a PRF-derived signature when the authenticator
// supports the PRF extension, giving hardware-bound key material.
// Falls back to the legacy scheme when PRF is not available.
export const createPasskey = async (): Promise<{
  credential: PublicKeyCredential
  oxidikoId: string
  credId: string
  signature: ArrayBuffer
  passkeyName: string
  prfSupported: boolean
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
        residentKey: "required",
        requireResidentKey: true,
      },
      timeout: 120000,
      attestation: "none",
      extensions: {
        credProps: true,
        largeBlob: { support: "preferred" },
        // HIGH-1 FIX: Request PRF extension for hardware-bound key derivation.
        // If the authenticator supports it, we get a deterministic secret that
        // is bound to the device and cannot be computed from public data alone.
        prf: { eval: { first: PRF_EVAL_INPUT } },
      } as any,
    },
  })) as PublicKeyCredential

  if (!credential) {
    throw new Error("Failed to create passkey")
  }

  const extensions = credential.getClientExtensionResults() as any

  // Extract public key (using credential ID)
  const pubKey = extractPublicKey(credential)
  const oxidikoId = await sha256(pubKey)

  const credId = Array.from(new Uint8Array(credential.rawId))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // HIGH-1 FIX: Use PRF output as the wrap signature if the authenticator supports it.
  // The PRF output is hardware-bound: it cannot be derived without the physical authenticator,
  // even by someone who has read the credential ID from IndexedDB.
  let signature: ArrayBuffer
  let prfSupported = false

  if (extensions?.prf?.results?.first) {
    // PRF is supported — use the hardware-bound PRF output.
    signature = extensions.prf.results.first
    prfSupported = true
  } else {
    // PRF not supported by this authenticator — fall back to legacy scheme.
    // This is weaker (no hardware binding) but keeps the app functional.
    signature = await createLegacyWrapSignature(credential.rawId)
    prfSupported = false
  }

  return {
    credential,
    oxidikoId,
    credId,
    signature,
    passkeyName,
    prfSupported,
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
  prfSupported: boolean
}> => {
  const challenge = generateRandomBytes(32)
  const oxidikoSuffix = generateOxidikoSuffix()
  const passkeyName = `oxidiko-${oxidikoSuffix}`

  const userIdString = `oxidiko-user-${oxidikoSuffix}`
  const userId = new TextEncoder().encode(userIdString)

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
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
        { type: "public-key", alg: -8 },
      ],
      authenticatorSelection,
      timeout: 120000,
      attestation: "none",
      extensions: {
        credProps: true,
        largeBlob: { support: "preferred" },
        prf: { eval: { first: PRF_EVAL_INPUT } },
      } as any,
    },
  })) as PublicKeyCredential

  if (!credential) {
    throw new Error("Failed to create passkey")
  }

  const extensions = credential.getClientExtensionResults() as any
  const pubKey = extractPublicKey(credential)
  const oxidikoId = await sha256(pubKey)

  const credId = Array.from(new Uint8Array(credential.rawId))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  let signature: ArrayBuffer
  let prfSupported = false

  if (extensions?.prf?.results?.first) {
    signature = extensions.prf.results.first
    prfSupported = true
  } else {
    signature = await createLegacyWrapSignature(credential.rawId)
    prfSupported = false
  }

  return { credential, oxidikoId, credId, signature, passkeyName, prfSupported }
}

// Authenticate with existing passkey.
// HIGH-1 FIX: Uses a random challenge each time (no more static "OxidikoAuthChallenge").
// Supports both PRF-enabled vaults (hardware-bound key) and legacy vaults (static hash).
export const authenticatePasskey = async (
  credId: string,
  prfSupported?: boolean, // pass true if the vault was created with PRF support
): Promise<{
  assertion: PublicKeyCredential
  oxidikoId: string
  signature: ArrayBuffer
}> => {
  const credIdBytes = new Uint8Array(credId.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])

  // HIGH-1 FIX: Use a random challenge instead of a static string.
  // This is what WebAuthn requires — a static challenge provides no replay protection.
  const challenge = generateRandomBytes(32)

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
      // Request PRF evaluation during authentication if the vault uses it
      extensions: prfSupported
        ? ({ prf: { eval: { first: PRF_EVAL_INPUT } } } as any)
        : undefined,
    },
  })) as PublicKeyCredential

  if (!assertion) {
    throw new Error("Authentication failed")
  }

  const pubKey = credIdBytes
  const oxidikoId = await sha256(pubKey)

  // HIGH-1 FIX: Derive wrap key from hardware-bound PRF output if available,
  // otherwise fall back to the legacy static hash for backward compatibility.
  let signature: ArrayBuffer
  const assertionExtensions = assertion.getClientExtensionResults() as any

  if (prfSupported && assertionExtensions?.prf?.results?.first) {
    // PRF path: hardware-bound, cannot be replicated from IndexedDB alone.
    signature = assertionExtensions.prf.results.first
  } else {
    // Legacy path: static hash — only used for old vaults.
    signature = await createLegacyWrapSignature(credIdBytes.buffer)
  }

  return { assertion, oxidikoId, signature }
}

// Authenticate with discoverable credentials (for cross-device usage).
// HIGH-1 FIX: Uses a random challenge and PRF extension for hardware-bound key derivation.
export const authenticateWithDiscoverableCredential = async (
  prfSupported?: boolean,
): Promise<{
  assertion: PublicKeyCredential
  oxidikoId: string
  signature: ArrayBuffer
  credId: string
}> => {
  const challenge = generateRandomBytes(32)

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      userVerification: "required",
      timeout: 60000,
      extensions: prfSupported
        ? ({ prf: { eval: { first: PRF_EVAL_INPUT } } } as any)
        : undefined,
    },
  })) as PublicKeyCredential

  if (!assertion) {
    throw new Error("Authentication failed")
  }

  const credIdBytes = new Uint8Array(assertion.rawId)
  const credId = Array.from(credIdBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const pubKey = credIdBytes
  const oxidikoId = await sha256(pubKey)

  let signature: ArrayBuffer
  const assertionExtensions = assertion.getClientExtensionResults() as any

  if (prfSupported && assertionExtensions?.prf?.results?.first) {
    signature = assertionExtensions.prf.results.first
  } else {
    signature = await createLegacyWrapSignature(assertion.rawId)
  }

  return { assertion, oxidikoId, signature, credId }
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
