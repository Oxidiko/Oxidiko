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
