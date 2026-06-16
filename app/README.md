# Clozr

## What it is

Clozr is an atomic swap closing platform that replaces the escrow officer with Tide split-key cryptography. Buyers and sellers confirm their side of a real estate closing, and the funds + deed unlock simultaneously — or not at all. No human custodian, no lockbox, no wire fraud vector.

Built with Next.js 16 + `@tidecloak/nextjs` SDK. All sensitive data is Tide self-encrypted — the platform literally cannot read your documents or closing details.

## How to run

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:3000`. Click "Continue with Tide" to authenticate via the running TideCloak instance.

## Pages & features

| Route | Feature | Tide primitive |
|-------|---------|---------------|
| `/` | Login — branded cover with value props | TideCloak OIDC login |
| `/home` | Dashboard — navigation + feature grid | Authenticated session |
| `/closings` | All closings list with status badges | Plain (reads localStorage) |
| `/closings/new` | Create closing — form → `doEncrypt` seals data | Self-encryption |
| `/closings/[id]` | Detail view — dual confirmation + `doDecrypt` | Self-decryption, atomic swap demo |
| `/documents` | Document vault — seal and reveal docs | Self-encrypt + self-decrypt |
| `/verify` | Server-side JWT verification proof | `verifyTideCloakToken` |

## What's mocked vs real

**Real (working end-to-end):**
- TideCloak OIDC login/logout via `useTideCloak()`
- `doEncrypt` / `doDecrypt` for self-encryption of closing data and documents
- `verifyTideCloakToken` server-side JWT verification on `/api/protected`
- localStorage persistence for demo (survives page refresh, cross-page reads)
- Dual-party confirmation UI (buyer/seller buttons → status updates)

**Mocked / declared for production:**
- **IAMService.doEncrypt with policy bytes**: Multi-party quorum encryption for the atomic swap. Current MVP simulates this with boolean flags in localStorage.
- **Forseti contracts**: ORK-enforced closing conditions ("this deed transfers only when funds are cryptographically confirmed"). Declared in dev-log. Would use `PolicySignRequest` with a C# contract implementing `IAccessPolicy`.
- **Doken delegation**: Lending capability for real estate agents to act for a buyer for exactly one closing. Declared, not implemented.