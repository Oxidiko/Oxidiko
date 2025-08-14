# Oxidiko

> "No data leaves your browser unless you explicitly say so. No shady tracking. Not even a cookie. Your privacy is probably safer here than in your mom’s kitchen."

### ⚠️ For support/updates/suggestions, join my Telegram: http://t.me/oxidiko

## What is Oxidiko? 🤖🔒

Oxidiko is a prototype authentication platform built by a 17-year-old (me!) and a very overworked AI. It’s a privacy-first, paranoia-friendly, Gen-Z-coded experiment in making authentication suck less. Think of it as your digital vault, but without the corporate surveillance, data leaks, or weird cookie popups.

**TL;DR:**
- 🗝️ All your sensitive stuff (profile, vault, etc.) is encrypted and stored *locally* in your browser using IndexedDB.
- 🔑 Unlock your vault with a passkey (WebAuthn) + a PIN. No passwords, no phishy emails, no drama.
- 🚫 If you don’t click a button to send data, it stays on your device. Period.
- 👀 No Google Analytics, no Facebook pixels, no cookies, no tracking. Not even a single crumb. (Only Vercel Analytics to see the number of people opening it (traffic). Because if Oxidiko ever becomes something, I might need to upgrademmy plan)

## Demo
[Watch it here](/video/oxidiko_demo.mp4)

## How Does It Work? 🛠️

### 1. Profile Setup
- You fill in your details (name, email, username, birthdate, etc.).
- You create a passkey (using WebAuthn) and set a PIN (min. 8 chars, don’t use 12345678, please).
- Your profile is encrypted with a master key, which is itself locked by both your passkey and your PIN. (Dual-wrapped keys, baby!)
- All of this is stored in your browser’s IndexedDB. Not on some sketchy server.

### 2. Paranoia Mode (Default) 🕵️‍♂️
- No data leaves your browser unless you *explicitly* export it.
- No cookies, no localStorage, no sessionStorage, no tracking.
- If you’re not sure, just open DevTools and check. I dare you.

### 3. Open Source, But... 📜
- Licensed under the Business Source License 1.1. You can use, copy, and modify for personal/educational/internal use, but you *can’t* resell, rehost, or make your own SaaS with it. (Sorry, not sorry.)
- See `LICENSE` for the full legalese.

## Try It Now 🚀
- Make your own vault at [https://oxidiko.com](https://oxidiko.com)
- Then log in and test it at [https://v0-store-rho-hazel.vercel.app/](https://v0-store-rho-hazel.vercel.app/)
- If it breaks, congrats, you found a bug! (Or a feature?)
- Want to read more? Check out the docs: [https://oxidiko.com/docs](https://oxidiko.com/docs) 📚

## Why Donate? 💸
- This is a prototype, built by a 17-year-old and an AI, not a VC-backed megacorp.
- Donations = more features, less bugs, and maybe a pizza for the dev.
- If you like privacy, hate tracking, and want to support indie devs, throw a coin at [https://ko-fi.com/oxidiko](https://ko-fi.com/oxidiko)

## Brutally Honest FAQ 🤔

**Q: Is this production-ready?**
> LOL, no. It’s a prototype. Use at your own risk. But hey, it’s probably safer than most things you use daily, and it is pretty much stable.

**Q: Can you see my data?**
> Nope. Not even if I wanted to. Everything’s encrypted and local. Unless you send it somewhere, it stays with you.

**Q: What if I forget my PIN or lose my passkey?**
> You’re locked out. That’s the point. No backdoors, no password resets, no customer support hotline.

**Q: Why so paranoid?**
> Because you should be. The internet is a scary place.

**Q: Can I use this for my startup?**
> Not unless you want a lawyer in your inbox. Read the license. But you can check out the API.

---

Made with caffeine ☕, memes 🐸, and a healthy dose of skepticism.

*Oxidiko: Your data, your responsibility*

## Public APIs, Functions, and Components (Snackable + Real) 🍿

You want the goods. Here you go — the whole public surface area, with copy-pasteable examples. Zero fluff, max signal.

### Prereqs (2 envs, done.)
- `DATABASE_URL`: Neon/Postgres connection string (for API keys).
- `RSA_PRIVATE_KEY`: PEM private key used to sign JWTs on the server. Store it as a single line in env with literal \n. Example:
```bash
RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...snip...\n-----END PRIVATE KEY-----"
```

---

### Server Routes (Next.js) 🛰️

- POST `/api/generate-jwt`
  - Signs a short-lived RS256 JWT. If you pass `encrypted` + `iv`, the token wraps encrypted payloads. If you pass plain data, `sub` is required.
  - Request (plain):
```bash
curl -X POST https://your.app/api/generate-jwt \
  -H 'content-type: application/json' \
  -d '{
    "sub": "user_123",
    "email": "user@example.com",
    "role": "user"
  }'
```
  - Request (encrypted):
```bash
curl -X POST https://your.app/api/generate-jwt \
  -H 'content-type: application/json' \
  -d '{
    "encrypted": "<hex>",
    "iv": "<hex>",
    "type": "encrypted"
  }'
```
  - Response:
```json
{ "token": "<JWT>" }
```

- POST `/api/verify-jwt`
  - Verifies JWT signature server-side using RSA public key derived from your private key. Can optionally echo encrypted payloads.
  - Request:
```bash
curl -X POST https://your.app/api/verify-jwt \
  -H 'content-type: application/json' \
  -d '{ "token": "<JWT>", "decrypt": false }'
```
  - Response:
```json
{ "payload": { /* claims or encrypted payload */ }, "valid": true }
```

- POST `/api/api-keys`
  - Multiplexed admin-lite endpoint for API key lifecycle.
  - Actions:
    - `create`: upsert by `apiKey`
    - `validate`: returns `{ valid, canUse, quota, keyData? }`
    - `increment`: increments the usage counter in `quota` (rate limit guard)
    - `activate`: sets `is_active = true` (optionally attach `subscriptionId`)
    - `getByEmail`: fetch by `companyEmail`
  - Example: create
```bash
curl -X POST https://your.app/api/api-keys \
  -H 'content-type: application/json' \
  -d '{
    "action": "create",
    "apiKey": "oxid_abc123...",
    "companyName": "Acme, Inc.",
    "companyEmail": "ops@acme.com",
    "quota": "0/1000",
    "planId": "starter",
    "isActive": false,
    "subscriptionId": null
  }'
```
  - Example: validate
```bash
curl -X POST https://your.app/api/api-keys \
  -H 'content-type: application/json' \
  -d '{ "action": "validate", "apiKey": "oxid_abc123..." }'
```

- GET `/api/api-keys?email=:companyEmail`
  - Fetch key metadata by email.

- Admin-only (Bearer JWT with `role: "admin"` in payload):
  - GET `/api/admin/keys` → list all keys
  - GET `/api/admin/stats` → `{ total, active, inactive, byPlan }`
  - POST `/api/admin/activate` `{ apiKey }`
  - POST `/api/admin/revoke` `{ apiKey }`
```bash
curl https://your.app/api/admin/keys \
  -H 'authorization: Bearer <ADMIN_JWT>'
```

- Database schema (`api_keys`)
  - Columns: `id`, `api_key` (unique), `company_name`, `company_email` (unique), `quota` (e.g. `3/1000`), `plan_id`, `is_active`, `subscription_id`, `created_at`, `updated_at`

Security vibes: admin routes accept tokens verified with `verifyJWT`’s claim checks (exp/nbf/iat). Signature verification for admin routes happens in the server handler via `jsonwebtoken` using your RSA public key. Keep your `RSA_PRIVATE_KEY` locked down.

---

### Client SDK (Everything under `lib/*`) ⚙️

Use these in your React client. All crypto happens in-browser. Your data only leaves if you literally push the button.

- `@/lib/webauthn-utils`
  - `createPasskey()` → `{ credential, oxidikoId, credId, signature, passkeyName }`
  - `createPasskeyWithPreference(authenticatorType)` → same return, choose `"platform" | "cross-platform" | "any"`
  - `authenticatePasskey(credId)` → `{ assertion, oxidikoId, signature }`
  - `authenticateWithDiscoverableCredential()` → `{ assertion, oxidikoId, signature, credId }`
  - `isWebAuthnSupported()` → `boolean`
  - `isPlatformAuthenticatorAvailable()` → `Promise<boolean>`
  - `isConditionalUISupported()` → `Promise<boolean>`
  - `getAvailableAuthenticatorTypes()` → `{ platform, crossPlatform }`

- `@/lib/vault-storage`
  - Vault lifecycle: `createVault`, `unlockVaultWithPasskey`, `unlockVaultWithPIN`, `lockVault`
  - State/reads: `isVaultUnlocked`, `getDecryptedProfile`, `getCurrentOxidikoId`, `getVault`, `checkVaultExists`, `getStoredCredId`, `getStoredPasskeyName`, `getStoredRecId`, `getWrapChallenge`
  - Site crypto: `validateSiteOrigin`, `getSiteKey`, `encryptDataForSite`, `recordSiteAccess`, `getSiteAccessHistory`, `getRecentSiteAccesses`
  - Portability: `exportVaultData`, `importVaultData`, `obliterateVault`

- `@/lib/api-storage` (separate local API vault — password-based)
  - `createAPIVault(companyName, companyEmail, password, planId)` → `{ apiKey, isActive }`
  - `unlockAPIVault(companyEmail, password)` → decrypted object
  - `updateAPIVaultStatus(companyEmail, password, isActive)`
  - `checkAPIVaultExists(email?)` → `boolean`

- `@/lib/jwt-utils`
  - `decodeJWT(token)` → `{ header, payload }` (no signature check)
  - `verifyJWT(token)` → throws if `exp/nbf/iat` invalid (still no signature)

- `@/lib/countries`
  - `getCountryNames()` → `{ code, name }[]`
  - `getNationalityNames()` → `{ code, name }[]`
  - `getCountryByCode(code)` → `{ code, name } | null`
  - `getNationalityByCode(code)` → `{ code, name } | null`

- `@/lib/utils`
  - `cn(...classNames)` → Tailwind + clsx merge helper

#### Client SDK: Quick Examples

- Onboarding (create vault with Passkey + PIN):
```ts
import { createPasskey } from "@/lib/webauthn-utils"
import { createVault } from "@/lib/vault-storage"

const { oxidikoId, credId, signature, passkeyName } = await createPasskey()
await createVault(profileData, oxidikoId, credId, pin, signature, passkeyName)
```

- Unlocking (passkey or PIN):
```ts
import { authenticatePasskey } from "@/lib/webauthn-utils"
import { unlockVaultWithPasskey, unlockVaultWithPIN } from "@/lib/vault-storage"

// Passkey
const { oxidikoId, signature } = await authenticatePasskey(credId)
await unlockVaultWithPasskey(oxidikoId, signature)

// Or PIN
await unlockVaultWithPIN(pin)
```

- Encrypt for a site + log the access:
```ts
import { encryptDataForSite, recordSiteAccess } from "@/lib/vault-storage"

const site = "https://example.com"
const payload = { email: "user@example.com", username: "neo" }
const encrypted = await encryptDataForSite(payload, site)
await recordSiteAccess(site, ["email", "username"], encrypted, "https://example.com/callback")
```

- Site access history:
```ts
import { getSiteAccessHistory, getRecentSiteAccesses } from "@/lib/vault-storage"

const history = await getSiteAccessHistory()
const recent = await getRecentSiteAccesses()
```

- Portability:
```ts
import { exportVaultData, importVaultData, obliterateVault } from "@/lib/vault-storage"

const backup = await exportVaultData()
await importVaultData(backup)
await obliterateVault()
```

- WebAuthn support checks:
```ts
import { isWebAuthnSupported, getAvailableAuthenticatorTypes } from "@/lib/webauthn-utils"

if (!isWebAuthnSupported()) throw new Error("no webauthn, no party")
const { platform, crossPlatform } = await getAvailableAuthenticatorTypes()
```

- JWT helpers (client):
```ts
import { decodeJWT, verifyJWT } from "@/lib/jwt-utils"

const { payload } = decodeJWT(token)
await verifyJWT(token) // throws if expired/nbf/iat bad
```

- Countries for dropdowns:
```ts
import { getCountryNames, getNationalityNames } from "@/lib/countries"

const countries = getCountryNames()
const nationalities = getNationalityNames()
```

- Tailwind merge:
```tsx
import { cn } from "@/lib/utils"
<div className={cn("p-3", isDanger && "bg-red-600")}>hey</div>
```

---

### Components (Drop-in UI) 🧩

- `@/components/ProfileSetup`
  - Props: `{ onVaultCreated: () => void }`
  - Purpose: full guided flow to create a passkey + PIN-secured vault.
  - Usage:
```tsx
import { ProfileSetup } from "@/components/profile-setup"

<ProfileSetup onVaultCreated={() => router.push("/")} />
```

- `@/components/VaultUnlock`
  - Props: `{ onUnlocked: () => void }`
  - Purpose: unlock via passkey or PIN; also import/export helpers.
  - Usage:
```tsx
import { VaultUnlock } from "@/components/vault-unlock"

<VaultUnlock onUnlocked={() => router.push("/dashboard")} />
```

- `@/components/SiteAccessHistory`
  - Props: `{ isOpen: boolean; onClose: () => void }`
  - Purpose: visual history for which sites accessed what (fields + timestamps).
  - Usage:
```tsx
import { SiteAccessHistory } from "@/components/site-access-history"

const [open, setOpen] = useState(false)
<SiteAccessHistory isOpen={open} onClose={() => setOpen(false)} />
```

- `@/components/ThemeProvider`
  - thin wrapper around `next-themes`.
```tsx
import { ThemeProvider } from "@/components/theme-provider"

<ThemeProvider attribute="class" defaultTheme="dark">{children}</ThemeProvider>
```

- UI Kit (shadcn-inspired): `@/components/ui/*`
  - All the usual suspects: `button`, `card`, `dialog`, `dropdown-menu`, `form`, `input`, `badge`, `tabs`, `table`, `toast`, `toaster`, `sheet`, `avatar`, `checkbox`, `select`, `tooltip`, `sidebar`, `calendar`, `menubar`, `pagination`, and more.
  - Example (Toast):
```tsx
import { Toaster } from "@/components/ui/toaster"
import { useToast, toast } from "@/components/ui/use-toast"

function App() {
  const { toast: push } = useToast()
  return (
    <>
      <button onClick={() => push({ title: "Saved", description: "We did the thing" })}>Save</button>
      <Toaster />
    </>
  )
}
```

---

### Hooks (Tiny but mighty) 🪝

- `useIsMobile()` — available from both `@/hooks/use-mobile` and `@/components/ui/use-mobile`
```tsx
import { useIsMobile } from "@/hooks/use-mobile"

const isMobile = useIsMobile()
```

- Toast hooks
```tsx
import { useToast, toast } from "@/components/ui/use-toast"

const { toast: push } = useToast()
push({ title: "Heads up", description: "It actually worked" })
toast({ title: "Global toast, who dis" })
```

---

### Real Talk: Security Notes 🔐
- Client `verifyJWT` only checks time-based claims. Signature verification is done on the server via `/api/verify-jwt` using your RSA key.
- Your vault stays local (IndexedDB) and is encrypted with your Master Vault Key, which is dual-wrapped by your Passkey and your PIN. Lose both? It’s gone.
- Site data encryption uses per-origin keys with HKDF, derived and stored encrypted under your MVK.

### License TL;DR ⚖️
Business Source License 1.1. Personal/edu/internal use is chill. Reselling/rehosting/SaaSing this? Not chill. See `LICENSE`.

If you got this far, you’re either building something cool or procrastinating. Either way — go ship. 🚀
