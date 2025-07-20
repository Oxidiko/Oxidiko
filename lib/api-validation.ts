// API key validation and quota management with real database

interface APIKeyData {
  companyName: string
  companyEmail: string
  apiKey: string
  quota: string // format: "used/total"
  planId: string
  isActive: boolean
  subscriptionId?: string
  createdAt?: string
  updatedAt?: string
}

// Validate API key and check quota
export const validateAPIKey = async (
  apiKey: string,
): Promise<{ valid: boolean; canUse: boolean; quota?: string; keyData?: APIKeyData }> => {
  try {
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", apiKey }),
    })

    if (!response.ok) {
      return { valid: false, canUse: false }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("API validation error:", error)
    return { valid: false, canUse: false }
  }
}

// Increment quota usage
export const incrementQuota = async (apiKey: string): Promise<void> => {
  try {
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "increment", apiKey }),
    })

    if (!response.ok) {
      throw new Error("Failed to increment quota")
    }

    const result = await response.json()
    console.log("Quota updated:", result.quota)
  } catch (error) {
    console.error("Failed to increment quota:", error)
    throw error
  }
}

// Add API key to database
export const addAPIKeyToDatabase = async (data: APIKeyData): Promise<void> => {
  try {
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...data }),
    })

    if (!response.ok) {
      throw new Error("Failed to add API key to database")
    }

    console.log("API key added to database successfully")
  } catch (error) {
    console.error("Failed to add API key to database:", error)
    throw error
  }
}

// Get API key data by email
export const getAPIKeyDataByEmail = async (email: string): Promise<APIKeyData | null> => {
  try {
    const response = await fetch(`/api/api-keys?email=${encodeURIComponent(email)}`)

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error("Failed to get API key data:", error)
    return null
  }
}

// Update API key status
export const updateAPIKeyStatus = async (apiKey: string, subscriptionId?: string): Promise<void> => {
  try {
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate", apiKey, subscriptionId }),
    })

    if (!response.ok) {
      throw new Error("Failed to activate API key")
    }

    console.log("API key activated successfully")
  } catch (error) {
    console.error("Failed to activate API key:", error)
    throw error
  }
}

// Admin functions for managing API keys

// Get API key statistics
export const getAPIKeyStats = async (token?: string): Promise<{
  total: number
  byPlan: Record<string, number>
  active: number
  inactive: number
}> => {
  try {
    const response = await fetch("/api/admin/stats", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    if (!response.ok) {
      throw new Error("Failed to fetch API key stats")
    }
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Failed to get API key stats:", error)
    throw error
  }
}

// Get all API keys for admin
export const getAllAPIKeys = async (token?: string): Promise<APIKeyData[]> => {
  try {
    const response = await fetch("/api/admin/keys", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    if (!response.ok) {
      throw new Error("Failed to fetch API keys")
    }
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error("Failed to get all API keys:", error)
    throw error
  }
}

// Revoke (deactivate) an API key
export const revokeAPIKey = async (apiKey: string): Promise<void> => {
  try {
    const token = localStorage.getItem("admin_jwt")
    const response = await fetch("/api/admin/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ apiKey }),
    })

    if (!response.ok) {
      throw new Error("Failed to revoke API key")
    }

    console.log("API key revoked successfully")
  } catch (error) {
    console.error("Failed to revoke API key:", error)
    throw error
  }
}

// Activate an API key
export const activateAPIKey = async (apiKey: string): Promise<void> => {
  try {
    const token = localStorage.getItem("admin_jwt")
    const response = await fetch("/api/admin/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ apiKey }),
    })

    if (!response.ok) {
      throw new Error("Failed to activate API key")
    }

    console.log("API key activated successfully")
  } catch (error) {
    console.error("Failed to activate API key:", error)
    throw error
  }
}
