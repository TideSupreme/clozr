# Clozr — The Pitch

Hello, Sharks!

Last year, 4.7 million Americans handed their life savings — $400,000 on average — to a stranger with a routing number and a prayer. That stranger is called an escrow officer. And for 43 agonizing days, they hold your money in a custodial account, charging you $3,000 for the privilege, while you hope they don't get hacked, go rogue, or simply fat-finger a wire transfer to the wrong account. In 2023, First American lost a million dollars to a single compromised escrow account. In 2024, a Florida title agent quietly redirected $700,000 to her personal account over six months. Nobody noticed.

Why does this industry exist? Because the buyer won't release their money until they have the deed, and the seller won't release the deed until they have the money. Two strangers at a table, each needing an ironclad guarantee. The escrow officer IS that guarantee — and also the single point of failure.

We built Clozr. Clozr deletes the escrow officer.

Here's how it works. When a buyer and seller enter a closing on Clozr, a Tide split key is generated. Not one key held by a human — a cryptographic quorum fragmented across Tide's independent ORK network. The buyer's funds and the seller's deed are bound to the same quorum condition: both parties cryptographically confirm, OR nothing moves. There is no lockbox, no custodian, no account number to compromise. The escrow officer's trust is replaced by a mathematical guarantee that no insider can breach — because there IS no insider.

The Tide primitives make this possible in a way no other technology can. Self-encryption via `doEncrypt` means every closing document is sealed to its owner's identity — the platform literally cannot read your deed, your inspection report, or your title commitment. Multi-party quorum encryption via IAMService.doEncrypt with policy bytes means the atomic swap is enforced by Tide's threshold ORKs, not by a human pressing "approve." DPoP-bound tokens mean a stolen session token is inert — critical when you're moving six figures. And we've mocked Forseti contracts that, in production, would enforce closing conditions at the ORK level: "this wire transfer executes only if the deed signature is cryptographically verified, and vice versa."

The market is enormous and ready. Real estate closings alone are a $4 billion annual TAM in the U.S. But the pattern extends to any peer-to-peer atomic swap — domain sales, vehicle transfers, business acquisitions, cross-border trade. Every transaction where two strangers need to swap assets simultaneously inherits the same zero-trust guarantee. Title companies and escrow firms don't compete with us because they ARE the expensive single point of failure we replace. We sell Clozr as a SaaS platform to title agencies and real estate law firms at $199/month with per-closing fees — dramatically cheaper than the $2,000-$5,000 per transaction they charge today, with zero custodial liability.

Sharks, we're asking for your vote. Fund Clozr because escrow is a $4 billion industry that exists only because no one solved the two-stranger problem — until Tide made it solvable. We're not digitizing escrow. We're making it mathematically unnecessary.

Clozr. Close without the closer.