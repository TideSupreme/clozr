# Clozr

## Why use it

# Clozr — The Pitch

Last year, 4.7 million Americans handed their life savings — $400,000 on average — to a stranger with a routing number and a prayer. That stranger is called an escrow officer. And for 43 agonizing days, they hold your money in a custodial account, charging you $3,000 for the privilege, while you hope they don't get hacked, go rogue, or simply fat-finger a wire transfer to the wrong account. In 2023, First American lost a million dollars to a single compromised escrow account. In 2024, a Florida title agent quietly redirected $700,000 to her personal account over six months. Nobody noticed.

Why does this industry exist? Because the buyer won't release their money until they have the deed, and the seller won't release the deed until they have the money. Two strangers at a table, each needing an ironclad guarantee. The escrow officer IS that guarantee — and also the single point of failure.

We built Clozr. Clozr deletes the escrow officer.

Here's how it works. When a buyer and seller enter a closing on Clozr, a Tide split key is generated. Not one key held by a human — a cryptographic quorum fragmented across Tide's independent ORK network. The buyer's funds and the seller's deed are bound to the same quorum condition: both parties cryptographically confirm, OR nothing moves. There is no lockbox, no custodian, no account number to compromise. The escrow officer's trust is replaced by a mathematical guarantee that no insider can breach — because there IS no insider.

The Tide primitives make this possible in a way no other technology can. Self-encryption via `doEncrypt` means every closing document is sealed to its owner's identity — the platform literally cannot read your deed, your inspection report, or your title commitment. Multi-party quorum encryption via IAMService.doEncrypt with policy bytes means the atomic swap is enforced by Tide's threshold ORKs, not by a human pressing "approve." DPoP-bound tokens mean a stolen session token is inert — critical when you're moving six figures. And we've mocked Forseti contracts that, in production, would enforce closing conditions at the ORK level: "this wire transfer executes only if the deed signature is cryptographically verified, and vice versa."

The market is enormous and ready. Real estate closings alone are a $4 billion annual TAM in the U.S. But the pattern extends to any peer-to-peer atomic swap — domain sales, vehicle transfers, business acquisitions, cross-border trade. Every transaction where two strangers need to swap assets simultaneously inherits the same zero-trust guarantee. Title companies and escrow firms don't compete with us because they ARE the expensive single point of failure we replace. We sell Clozr as a SaaS platform to title agencies and real estate law firms at $199/month with per-closing fees — dramatically cheaper than the $2,000-$5,000 per transaction they charge today, with zero custodial liability.

Clozr. Close without the closer.

## What it is

A [Next.js](https://nextjs.org) app secured with [TideCloak](https://tidecloak.com) — decentralized identity where keys are split across a network, so **no single server (not even this app) ever holds a usable copy**. Login, sessions, and the app's sensitive data are protected by that model.

## Prerequisites

- **Node.js 20+**
- **Docker** (to run TideCloak locally)
- **`jq`** and **`curl`** (used by the init script)

## Run it locally

**1. Start TideCloak** (the public dev image — has a pre-configured entrypoint, do *not* append `start-dev`):

```bash
docker run -d --name tidecloak -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest

# wait until it answers:
until curl -sf http://localhost:8080 >/dev/null; do sleep 3; done
```

**2. Install and initialise** (the init script wires up TideCloak — see below):

```bash
cd app
npm install
npm run init
```

**3. Start the app:**

```bash
npm run dev
```

Open **http://localhost:3000**.

## Initialising TideCloak (what `npm run init` does)

`npm run init` runs [`init/tcinit.sh`](app/init/tcinit.sh) against your local TideCloak and:

- creates the **`nextjs-test`** realm and the **`myclient`** client,
- enables the **Tide IdP** and **IGA** (identity governance),
- creates an **`admin`** user and prints an account-link invite,
- writes the adapter config to **`tidecloak.json`**, which the app reads.

TideCloak admin console: **http://localhost:8080** (`admin` / `password`).

## Using it

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

---

Built on [TideCloak](https://tidecloak.com). The product story is in **[pitch.md](pitch.md)**.
