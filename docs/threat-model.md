# Compass Threat Model

> Nine attack surfaces from the locked plan's Section 1. For each:
> (a) realistic mitigation in v1, (b) what cannot be solved in 31 days,
> (c) honest README framing.

The unifying principle: Compass minimizes the **blast radius of disclosure**.
We do not claim to make Maria invisible. We claim that a clinic / employer /
state under subpoena pressure can disclose only a non-identifying receipt.

---

## 1a. Attestor coercion / compromise

**Threat.** NGO partners (HELP, Bethune House, MFMW) issuing SD-JWT
credentials are themselves coercible by state actors.

**Mitigation.** Multi-issuer trust list per agent (`trustListRoot`). Verifier
policies require ≥2 attestors for high-stakes claims. Trust registry on 0G
Chain so revocation is auditable.

**Cannot solve in 31 days.** Threshold issuance / DKG.

**README framing.**
> *We assume the attestor key is held honestly. If the issuer is compromised,
> the system fails open.*

---

## 1b. Verifier collusion

**Threat.** Two providers (clinic A + clinic B) both ask for "free legal
assistance eligible" receipts and combine logs to triangulate Maria.

**Mitigation.** The on-chain `ReceiptIssued` event contains
`{receiptId, policyId, nullifier, agentIdCommitment, resultHash, expiry,
attestationDigest, timestampBucket}` — no name, no HKID, no employer.
Bucketed timestamps (15-min) and per-grant nullifiers limit linkability.

**Cannot solve in 31 days.** Full unlinkable presentations across verifiers
(would need BBS+ or full ZK).

**README framing.**
> *Receipts are unlinkable across distinct policies; within the same policy,
> the same Agent shows the same nullifier — by design, for revocation.*

---

## 1c. Metadata leakage

**Threat.** IP, wallet correlation (the gas-funding wallet for the agent's
gas), attestor identity (only HELP issues "HK domestic worker" creds, so the
issuer reveals the persona).

**Mitigation.** Privy-style embedded wallet with social login (so the user
never sees gas), 0G gas sponsorship, broad issuer trust lists.

**Cannot solve in 31 days.** Tor / mixnet integration, payment-meta privacy.

**README framing.**
> *Network-layer anonymity is out of scope; we recommend deploying behind
> Oblivious HTTP or a privacy CDN in production.*

---

## 1d. Revocation privacy

**Threat.** Standard CRL / status-list lookups leak which credential is being
checked.

**Mitigation.** `@sd-jwt/jwt-status-list` (RFC 7644 status list JWT) — fetches
a batch list, the verifier never tells the issuer which slot it cares about.

**Cannot solve in 31 days.** Private information retrieval (PIR) for status.

**README framing.**
> *Status-list batching reduces but does not eliminate revocation correlation
> by an issuer that controls hosting.*

---

## 1e. Device compromise

**Threat.** Employer-controlled phone, abuser stalkerware. Tech-enabled
abuse (location-tracking, account hijacking, covert apps) is reported as
a routine feature of intimate-partner-violence cases by Refuge UK, the UK's
largest specialist domestic-abuse charity (see Refuge's "Unsocial Spaces"
work, 2020-2024). Hard percentages vary by source and definition; we
treat tech abuse as the default threat surface, not the exception.

**Mitigation (planned, not yet implemented).** Duress PIN that wipes the
agent vault and emits a normal-looking dummy receipt. No app icon by
default. Web app accessed via shared kiosk at NGO premises. v1 demo does
not include the duress PIN — Phase 7 frontend roadmap.

**Cannot solve in 31 days.** Hardware attestation of the user's device,
root/jailbreak detection.

**README framing.**
> *If the device is compromised before app launch, the system provides no
> protection. Compass is designed to be used from a trusted device — typically
> an NGO drop-in centre kiosk — not the worker's employer-supplied phone.*

---

## 1f. Coercive disclosure (rubber-hose / employer forces unlock)

**Threat.** Adversary forces Maria to unlock the app and produce a receipt.

**Mitigation.** Duress unlock surfaces a decoy vault; receipts produced under
duress can be marked with a hidden flag in the policy evaluation.

**Cannot solve in 31 days.** Deniable encryption, plausible-deniability that
survives forensic analysis.

**README framing — explicit acknowledgment.**
> *Compass cannot defeat physical coercion. It can only ensure the blast
> radius of disclosure is bounded — even if Maria is forced to produce a
> receipt, the receipt does not reveal her identity or her credentials.*

---

## 1g. TEE side-channels and operator compromise

**Threat.** Documented 2024–2025 attacks: TDXdown (USENIX Security 2024 —
single-stepping TDX VMs by deluding the security monitor); StumbleStepping
(USENIX Security 2025 — leaks instruction count via the prevention mechanism
itself); TEE.Fail (Sep 2025 — DDR5 bus-interposition attack extracting Intel
SGX/TDX and AMD SEV-SNP attestation keys, including from NVIDIA Confidential
Computing).

**Mitigation.** The 0G broker pattern verifies a TEE signature per response;
we validate the attestation report on every request. Plan B requires the
enclave-born signing key to be bound into the TEE attestation custom-data
field (Phase 6b.0 + 6b.4) so a fake "enclave" cannot mint receipts.

**Cannot solve in 31 days.** Defeating physical-bus attacks; that is a
hardware vendor problem.

**README framing.**
> *Compass inherits 0G Sealed Inference's TEE attacker model — software
> adversaries on the host cannot read user data. Adversaries with physical
> access to DDR5 memory or 0-day TDX flaws are out of scope. See TEE.Fail
> (2025) and TDXdown (CCS 2024).*

---

## 1h. Small-population correlation (k-anonymity)

**Threat.** "Filipino domestic worker, Eastern District, age 30–35,
unmarried" is already trivially identifying within HK's ~370k FDH population.
A receipt that says "qualifies for HELP free legal aid" combined with
timestamp narrows further.

**Mitigation.** Receipts use coarse-grained policy IDs only ("eligible for
legal aid" — not "eligible for legal aid for sexual harassment claim against
Filipino employer in Eastern"). Each policy declares its `minAnonymitySet`
on-chain at registration time.

**Cannot solve in 31 days.** Differential privacy budget across receipts;
provable k-anonymity for arbitrary policies.

**README framing.**
> *Each policy in the registry must declare its minimum anonymity set;
> policies with k<100 are flagged as "narrow" and require additional review.*

---

## 1i. GDPR / right-to-deletion vs permanent 0G Storage

**Threat.** Article 17 RTBF vs blockchain immutability is an unresolved
regulatory problem (see EDPB Guidelines 02/2025 on processing of personal
data through blockchain, April 2025).

**Mitigation.** All PII strictly off-chain. On 0G Storage we keep only
encrypted blobs whose decryption keys live on the user's device — destroy
the key, the data is dead (crypto-shredding). On 0G Chain we keep only
`{nullifier, policyHash, attestationDigest, timestampBucket}` — no PII.

**Cannot solve in 31 days.** A clean GDPR controllership map for a
decentralized chain.

**README framing.**
> *We follow the EDPB-aligned pattern: personal data off-chain,
> references/hashes/proofs on-chain. Crypto-shredding (key destruction) is
> our deletion mechanism. We do not claim full Article 17 compliance —
> that is a regulatory open problem.*
