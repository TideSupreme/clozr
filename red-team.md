# Red-Team Report: Clozr

## **What it is**

Clozr is a Next.js/TideCloak demo application for “atomic swap” real-estate closings, document vault encryption, and server-side Tide JWT verification. It uses `@tidecloak/nextjs`, a TideCloak realm config with embedded JWKS, a DPoP helper page, client-side Tide encryption/decryption APIs, and a small protected API route.

Attacker model used for this audit: **privileged insider with root on the server and/or database**. This means the attacker can read deployed files, environment/config, logs, databases, and can modify served application code. Tide can reduce the blast radius for protected cryptographic material, but the application remains responsible for server-side authorization, DPoP enforcement, policy gates, secrets handling, CSP/SRI, and avoiding plaintext side channels.

## **Posture verdict**

**Mixed / demo-grade.** The app shows correct TideCloak integration patterns in places, especially use of an embedded JWKS config and a server-side token-verification API, plus a DPoP authentication helper route with a pinned CSP. However, most business functionality is implemented as client-only pages backed by `localStorage`; those routes are not server-gated, the “atomic swap” workflow is not policy-enforced server-side, DPoP is not enforced on the protected API request, and encrypted data is duplicated in plaintext in browser storage. Under the privileged-insider model, Tide protects some cryptographic assets, but the app still has significant residual risk because a compromised server can serve malicious JavaScript and because current business state is not protected by server-side authorization or policy.

## **Findings**

### F-01 — T-09: Server-side JWT verification exists, but app authorization coverage is incomplete

- **Traditional outcome + severity:** **High.** `/api/protected` performs server-side token verification, but most business pages and workflows are not server-side protected. The middleware only applies to `/protected`, not `/home`, `/closings`, `/documents`, or `/verify`.
- **Tide neutralization:** TideCloak can validate Tide-issued JWTs and embedded JWKS reduces remote-key-fetch trust. This protects the specific API route that calls the verifier.
- **Mechanism:** The API route extracts a Bearer token and calls `verifyTideCloakToken(tcConfig, token, [ALLOWED_ROLE])`. Middleware uses `createTideCloakMiddleware`, but only for `/protected`.
- **Evidence:**
  - `app/api/protected/route.ts:5` sets `ALLOWED_ROLE = 'offline_access'`.
  - `app/api/protected/route.ts:8-16` requires an `Authorization: Bearer` token.
  - `app/api/protected/route.ts:18-19` calls `verifyTideCloakToken(tcConfig, token, [ALLOWED_ROLE])`.
  - `middleware.ts:7-13` configures protected routes only for `"/protected": ["offline_access"]`.
  - `middleware.ts:37-39` sets the matcher to only `["/protected", "/protected/:path*"]`.
  - `tidecloak.json:1` contains an embedded `"jwk":{"keys":[...]}` object rather than only a remote JWKS URL.
- **Residual:** The submitted source does **not** expose the internals of `@tidecloak/nextjs`; therefore this audit cannot directly confirm `createLocalJWKSet` versus `createRemoteJWKSet`, nor direct `iss`/`azp`/`exp`/`iat` checks inside the package. The app should either pin to audited SDK source/version or add explicit tests proving local JWKS verification and issuer/audience/time validation. Also, `offline_access` is granted broadly and should not be treated as a meaningful application role.

---

### F-02 — T-05: DPoP helper flow is present, but protected API accepts Bearer-token replay without request-bound DPoP proof

- **Traditional outcome + severity:** **High.** A stolen access token can be replayed to `/api/protected` because the route verifies only the Bearer token and does not require or verify a DPoP proof header bound to the request method/URL.
- **Tide neutralization:** Tide’s DPoP browser flow helps bind the authentication session to a browser-held key. The static DPoP auth page reads a DPoP key from IndexedDB and signs a challenge.
- **Mechanism:** The DPoP helper page obtains the DPoP key from IndexedDB, validates parent/opener origin, signs `dpop-auth-challenge:<challenge>`, and posts the public key/signature back. But the API route does not check a `DPoP` header, JWK thumbprint, nonce, `htu`, `htm`, `iat`, or `jti`.
- **Evidence:**
  - `app/tide_dpop/[...path]/route.ts:24-34` serves the Tide DPoP helper HTML with CSP and `Allow-CSP-From`.
  - `public/tide_dpop_auth.html:150-167` accesses IndexedDB storage and loads `dpopState`.
  - `public/tide_dpop_auth.html:184-200` receives and validates a challenge from the opener origin.
  - `public/tide_dpop_auth.html:202-218` signs the challenge and posts the public JWK/signature.
  - `app/api/protected/route.ts:8-19` only reads `Authorization: Bearer` and calls `verifyTideCloakToken`; no DPoP proof is read or verified.
  - `app/verify/page.tsx:28-31` calls `/api/protected` with only `Authorization: Bearer ${token}`.
- **Residual:** Tide can reduce replay risk during authentication, but the app must enforce DPoP at each sensitive resource-server endpoint if it wants token replay resistance. Current server API behavior is bearer-token based.

---

### F-03 — Client-only route checks expose business workflows without server-side authorization

- **Traditional outcome + severity:** **High.** Pages for closings, documents, and verification are client components and are not covered by middleware. An unauthenticated user can load the pages; some Tide SDK operations may fail without a token, but the route itself is not server-gated.
- **Tide neutralization:** TideCloak can authenticate users client-side and server-side, but Tide does not automatically protect arbitrary Next.js routes unless the app configures middleware/server guards.
- **Mechanism:** Pages call `useTideCloak()` and read token-derived values in the browser. There is no server component guard, redirect, or middleware matcher for these pages.
- **Evidence:**
  - `app/home/page.tsx:1` is a client component.
  - `app/closings/page.tsx:1` is a client component.
  - `app/documents/page.tsx:1` is a client component.
  - `app/verify/page.tsx:1` is a client component.
  - `middleware.ts:37-39` only matches `/protected`, not `/home`, `/closings`, `/documents`, or `/verify`.
- **Residual:** Client-only checks are usability controls, not authorization boundaries. Sensitive pages and APIs should be protected by middleware or server-side route handlers that verify JWTs and roles before returning protected data or mutating state.

---

### F-04 — T-01/T-02/E2EE: Encrypted closing data is duplicated in plaintext in `localStorage`

- **Traditional outcome + severity:** **High.** The app encrypts closing data but also stores the same closing object in plaintext for listing. Browser compromise, XSS, malicious extensions, or malicious JavaScript served after server compromise can read the plaintext directly.
- **Tide neutralization:** Tide E2EE protects ciphertext produced by `doEncrypt`; a server or DB insider cannot decrypt that ciphertext without the appropriate user/Tide-controlled key material.
- **Mechanism:** New closings are encrypted with `doEncrypt`, but then the plaintext `closing` object is inserted into `clozr-closings` in `localStorage`. The detail page later loads plaintext closing metadata from that same key.
- **Evidence:**
  - `app/closings/new/page.tsx:37` obtains `doEncrypt`.
  - `app/closings/new/page.tsx:83-84` encrypts the closing object with `doEncrypt`.
  - `app/closings/new/page.tsx:86-90` explicitly stores both plaintext and ciphertext: `stored.unshift(closing)`, `localStorage.setItem('clozr-closings', ...)`, and `localStorage.setItem(\`clozr-sealed:${id}\`, ciphertext)`.
  - `app/closings/[id]/page.tsx:49-52` reads plaintext closings from `localStorage`.
- **Residual:** Tide protects only the encrypted copy. The plaintext duplicate is outside Tide’s protection. If the server is compromised, an insider can modify the client bundle to exfiltrate future plaintext before encryption or after decryption.

---

### F-05 — E2EE is self-encryption only; no policy-governed sharing or multi-party closing enforcement is implemented

- **Traditional outcome + severity:** **High.** The app’s “atomic swap”/dual-party claims are not backed by policy-governed cryptography or server-enforced workflow. Buyer/seller confirmation is a local browser state toggle.
- **Tide neutralization:** Tide E2EE can protect user-sealed data. Tide/Forseti-style policy can gate decryption or actions if the app integrates it correctly.
- **Mechanism:** Documents and closings use `doEncrypt`/`doDecrypt` with static tags such as `clozr-doc` and `closing`. Confirmation state is updated in `localStorage`, not through a policy-governed transaction or server-authorized state machine.
- **Evidence:**
  - `app/documents/page.tsx:14` defines static tag `clozr-doc`.
  - `app/documents/page.tsx:50` obtains `doEncrypt` and `doDecrypt`.
  - `app/documents/page.tsx:76` encrypts document content with `doEncrypt`.
  - `app/documents/page.tsx:106` decrypts document content with `doDecrypt`.
  - `app/closings/new/page.tsx:83-84` encrypts closing data with static tag `closing`.
  - `app/closings/[id]/page.tsx:62-65` decrypts closing data with static tag `closing`.
  - `app/closings/[id]/page.tsx:74-87` updates buyer/seller confirmation state locally and writes it back to `localStorage`.
- **Residual:** Self-encryption can protect personal vault data, but it does not prove buyer/seller authorization, simultaneous unlock, non-repudiation, or business-policy satisfaction. The app must implement policy-governed authorization and server-side transaction integrity.

---

### F-06 — T-10: Forseti / policy gating is not implemented for sensitive actions

- **Traditional outcome + severity:** **High.** There is no visible policy-decision call before creating closings, decrypting documents, confirming buyer/seller steps, or marking a closing complete.
- **Tide neutralization:** Tide policy systems can reduce rogue-admin and insider risk when actions are gated by externalized policy and cryptographic approval.
- **Mechanism:** The realm enables Tide roles and IGA role mapping, but the app itself does not call a policy engine or enforce policy decisions server-side.
- **Evidence:**
  - `init/realm.json:14-20` defines Tide self-encrypt/self-decrypt roles.
  - `init/realm.json:27-30` includes those roles and `appUser` in default roles.
  - `init/realm.json:88-96` configures the Tide IGA role mapper.
  - `app/closings/[id]/page.tsx:74-87` completes business confirmation using only local state.
  - No submitted application file contains a Forseti/policy-gating API call or server-side policy check.
- **Residual:** Tide cannot enforce a policy the app never asks it to enforce. All sensitive business transitions should be mediated by server-side policy checks.

---

### F-07 — T-14: DPoP helper has scoped CSP pinning, but the main app lacks global CSP and client-bundle SRI

- **Traditional outcome + severity:** **Medium to High.** A privileged server insider can modify the client bundle and exfiltrate tokens, plaintext before encryption, or decrypted documents. CSP/SRI cannot stop a root server attacker completely, but they are important defense-in-depth against injection and supply-chain tampering.
- **Tide neutralization:** Tide protects private cryptographic material and encrypted payloads, but it cannot prevent a compromised app server from serving malicious JavaScript that captures user input or decrypted output.
- **Mechanism:** The DPoP helper route serves a strict CSP with hashes. The main `next.config.js` is empty and there are no global security headers or SRI settings for Next.js chunks.
- **Evidence:**
  - `app/tide_dpop/[...path]/route.ts:19-22` defines a CSP with hashed inline script/style allowances.
  - `app/tide_dpop/[...path]/route.ts:30-31` sends `Content-Security-Policy` and `Allow-CSP-From`.
  - `next.config.js:1-5` contains an empty Next.js config with no global CSP/security headers.
- **Residual:** Even with CSP/SRI, a root server attacker has substantial power. Still, the app should add a production CSP, restrict script origins, avoid unsafe inline code, and consider build artifact integrity controls.

---

### F-08 — T-01/T-02/T-03: Bootstrap script defaults to weak admin credentials

- **Traditional outcome + severity:** **Medium.** The init script defaults to `KC_USER=admin` and `KC_PASSWORD=password`. If reused outside local development or leaked into automation, this creates a predictable privileged credential path.
- **Tide neutralization:** Tide admin workflows and IGA can add friction to rogue-admin changes, but they do not make weak bootstrap credentials safe.
- **Mechanism:** Defaults are set in shell variables and used to obtain an admin token.
- **Evidence:**
  - `init/tcinit.sh:29-37` defines defaults including `KC_USER="${KC_USER:-admin}"` and `KC_PASSWORD="${KC_PASSWORD:-password}"`.
  - `init/tcinit.sh:70-77` posts username/password to the token endpoint to obtain an admin token.
- **Residual:** In production, bootstrap credentials must be unique, secret-managed, rotated, and disabled after setup. Root server compromise can still alter init scripts or capture tokens during setup.

---

### F-09 — T-06: Development HTTP origins are embedded in config

- **Traditional outcome + severity:** **Medium if promoted to production; Low in local-only dev.** The app and realm config use `http://localhost` URLs. If analogous HTTP origins are used beyond localhost, token and redirect flows are exposed to network manipulation.
- **Tide neutralization:** Tide cryptography helps protect key material and token validity, but TLS is still mandatory for transport confidentiality, origin integrity, cookie security, and DPoP/browser assumptions.
- **Mechanism:** TideCloak config and realm redirect/web origins are HTTP localhost values.
- **Evidence:**
  - `tidecloak.json:1` sets `"auth-server-url":"http://localhost:8080/"` and includes `client-origin-auth-http://localhost:3000`.
  - `init/realm.json:48-54` lists `http://localhost:3000` redirect URIs.
  - `init/realm.json:55-57` sets web origins to `http://localhost:3000`.
- **Residual:** Localhost HTTP is acceptable for development. Production must use HTTPS-only origins, secure cookies, strict redirect URI allowlists, and HSTS.

---

### F-10 — T-04: Supply-chain versions are floating and no lockfile is provided

- **Traditional outcome + severity:** **Medium.** Dependency ranges allow future package changes without source review. No package lockfile was submitted, so the exact audited dependency tree is not reproducible.
- **Tide neutralization:** Tide does not neutralize malicious or compromised client/server dependencies. A malicious dependency can read tokens, plaintext, or decrypted data in-process.
- **Mechanism:** `next`/`react` use `x` ranges and Tide SDK uses a caret range.
- **Evidence:**
  - `package.json:13-18` declares `"next": "16.x"`, `"react": "19.x"`, `"react-dom": "19.x"`, and `"@tidecloak/nextjs": "^0.13.32"`.
  - No lockfile is included in the submitted files.
- **Residual:** Pin exact versions, commit a lockfile, use provenance/signature checks where available, and run dependency scanning. A privileged server attacker can still alter deployed dependencies unless builds are reproducible and verified.

---

## **App-responsibility checklist**

| Area | Status | Evidence | Notes |
|---|---:|---|---|
| **T-09 server-side JWT verification** | **FAIL overall / PASS only for `/api/protected`** | `app/api/protected/route.ts:8-19`; `tidecloak.json:1`; `middleware.ts:37-39` | The API route uses server-side verification with embedded JWKS config. However, business pages are not covered by middleware/server guards. SDK internals were not provided, so direct `createLocalJWKSet` vs `createRemoteJWKSet` and `iss`/`azp`/`exp`/`iat` checks cannot be independently confirmed from submitted code. |
| **T-05 DPoP** | **FAIL** | `public/tide_dpop_auth.html:150-218`; `app/api/protected/route.ts:8-19`; `app/verify/page.tsx:28-31` | DPoP helper flow exists, but the protected API accepts Bearer-only requests and does not verify a DPoP proof. |
| **T-10 Forseti / policy gating** | **FAIL** | `app/closings/[id]/page.tsx:74-87`; `init/realm.json:88-96` | IGA role mapper exists in realm config, but app actions are not policy-gated server-side. |
| **T-01/T-02 secrets/data at rest** | **FAIL** | `app/closings/new/page.tsx:86-90`; `init/tcinit.sh:29-37` | No server DB is shown, but sensitive closing metadata is stored plaintext in browser `localStorage`; bootstrap defaults include `admin/password`. |
| **E2EE: `doEncrypt`/`doDecrypt`** | **FAIL / partial** | `app/documents/page.tsx:50,76,106`; `app/closings/new/page.tsx:83-90`; `app/closings/[id]/page.tsx:62-65` | Tide self-encryption is used, but plaintext duplicates are stored and no policy-governed multi-party encryption/sharing is visible. |
| **T-14 client-bundle SRI/CSP** | **FAIL / partial** | `app/tide_dpop/[...path]/route.ts:19-31`; `next.config.js:1-5` | DPoP helper has CSP hash pinning. Main Next.js app lacks global CSP/SRI/security headers. |
| **Unauthenticated setup/admin routes** | **N-A for app routes; FAIL for bootstrap hygiene if reused in prod** | `middleware.ts:37-39`; `init/tcinit.sh:29-37` | No unauthenticated Next.js setup/admin route is visible. The init script uses TideCloak admin APIs with a token, but defaults are weak for anything beyond local dev. |

## **Breach blast-radius**

### Exposed under server/root compromise

- Application source, static assets, `tidecloak.json`, public JWKS, realm metadata, and client-origin auth material visible in deployed files.
- Ability to modify Next.js pages/bundles and exfiltrate future user tokens, plaintext form input, `localStorage`, and decrypted data.
- Ability to alter the DPoP helper page unless deployment integrity controls detect tampering.
- Ability to change middleware and API authorization logic.
- Ability to capture admin/bootstrap credentials or tokens if setup is run on the compromised host.
- Plaintext client-side business metadata already stored in browser `localStorage` is exposed to any malicious script delivered by the app origin.

### Protected or reduced by Tide, when used correctly

- Tide private signing keys are not present in the app files.
- The embedded JWKS allows local signature verification of Tide-issued tokens without trusting a live remote JWKS fetch, assuming SDK behavior is as intended.
- Ciphertexts produced by `doEncrypt` are protected from a passive server/database insider **if** the app stores only ciphertext and does not also store or leak plaintext.
- DPoP browser key material is held in browser IndexedDB and the DPoP helper signs a challenge, reducing some session/key replay paths during Tide authentication.
- Tide IGA/policy mechanisms can reduce rogue-admin risk **only if** the app gates sensitive operations through those mechanisms.

### Not protected by Tide automatically

- Client-only route access.
- Bearer-token replay at resource-server APIs that do not verify DPoP proofs.
- Plaintext copied into `localStorage`.
- Business-state integrity for closings, confirmations, and “atomic swap” status.
- Malicious JavaScript served by a compromised app server.
- Weak bootstrap/admin credentials.
- Floating supply-chain dependencies.

## **Residual risk**

Tide reduces the blast radius for cryptographic assets and encrypted payloads, but it does not remove the need for conventional application security. The largest residual risks are:

1. **Resource-server replay risk:** `/api/protected` accepts Bearer-only requests without DPoP proof verification.
2. **Authorization coverage gap:** Most business routes are client-only and not middleware/server protected.
3. **Plaintext side channel:** Closing data is encrypted and then also stored in plaintext.
4. **No policy-backed atomic swap:** Buyer/seller confirmation and completion are local browser state, not server-side or Forseti-gated policy.
5. **Malicious-bundle risk:** A root server attacker can alter JavaScript to steal plaintext before encryption or after decryption.
6. **SDK verification opacity:** The app delegates JWT validation to `@tidecloak/nextjs`, but submitted code does not prove local JWKS implementation details or claim checks.
7. **Inherited Tide/platform residuals:** T-12/T-15/T-18/T-19/T-20 remain inherited platform risks. The app should treat them as residual dependencies on Tide infrastructure, ORKs, browser behavior, cryptographic implementation correctness, and operational governance; they are not eliminated by this integration and should be covered by platform attestations, monitoring, and incident response.
