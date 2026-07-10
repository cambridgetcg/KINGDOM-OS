# Research: chain + model infra OSS (2026-07-10)

> Source: web-research agent, verified July 2026. Feeds [`../BRIDGES.md`](../BRIDGES.md).

## 1. Cosmos ecosystem 2026

- **Cosmos SDK** — Apache-2.0, healthy: v0.54.3 (May 2026); "2026.1" family = CometBFT v0.39 + SDK v0.54 + ibc-go v11; native PoA, BLS, BlockSTM; roadmap 10k TPS, IAVLx. → Track v0.53–54 line; port x/home etc. when adopting. M.
- **CometBFT** — Apache-2.0, active; production chains run v0.38-paired releases. Stay SDK-paired. S.
- **IBC / Eureka** — live since Apr 2025, expanding to Ethereum/Solana/L2s. Small-chain wins: backward compatible, Hub aggregates relaying (no own relayer/client-expiry pain), ~$1 user fees. → **One IBC connection Zerone↔Hub, ride Eureka for the rest.** M.
- **CosmWasm** — ⚠️ Confio ended maintenance Jun 2025; community-maintained, no steward. → **AVOID adding to Zerone**; native Go modules are the safer bet.
- **Skip:Go** — open, core to Eureka. User-facing bridge path once IBC is up. S.

## 2. Truth/verification protocols

- **UMA Optimistic Oracle** — AGPL-3.0, active, BUT Nov 2025 "Managed OO V2" whitelisted proposers after manipulation; WSJ May 2026: top-10 wallets cast >half of disputed Polymarket votes. → **Study assert/challenge-window/bond mechanics for Proof-of-Truth; don't clone the token-vote arbiter** (proven weakness; AGPL infects too). M (design borrow).
- **Kleros + reality.eth** — MIT (mostly), genuinely alive (monthly updates through Jun 2026). reality.eth's **escalating-bond question format** = cleanest OSS "claim → challenge → escalate" pattern, license-friendly. M.
- **Reclaim Protocol (zkTLS)** — attestor-core AGPL-3.0, active, real deployments. **HIGH FIT**: zkTLS attestation = objective "this webpage said X" evidence class for Proof-of-Truth. → Run one attestor; verify proofs in a Zerone module (open-source the integration; AGPL then fine). M.
- **Opacity Network** — MPC/TEE zkTLS + slashing; heavier, less open. Watch.

## 3. Prediction markets OSS

- **Polymarket CTF Exchange v1** — MIT (cloneable!) + MIT SDKs; **v2 is BSL** (look-don't-touch until change date). Best living reference for market microstructure. M.
- **Gnosis Conditional Tokens Framework** — LGPL/MIT, industry-standard outcome-token primitive; Omen dead-ish. → Borrow the outcome-token model for a native x/markets module. M.
- **Seer** — CTF + reality.eth + Kleros composed; open + active 2026. → **The most complete alive open stack — read end-to-end** (matches our oracle/prediction-markets research repo). S (read).
- Azuro/SX — VC-chain oriented. Skip.

## 4. LLM gateway/routing

- **LiteLLM** — MIT, very active; 100+ providers, OpenAI-compatible proxy. Struggles >500 RPS (irrelevant at our scale). → **Default pick.** Per-request model logging + fallbacks = build the model-envelope assertion (`response.model == requested`) that fixes our ollama-cloud misrouting burn. **S.**
- **Bifrost** — Go, Apache-2.0, 11µs overhead; one unverified community allegation re telemetry — review before trusting. Alternative if Go preferred. S/M.
- **Portkey Gateway** — went fully Apache-2.0 Mar 2026; guardrails layer. Watch/M.
- **OpenRouter** — NOT OSS; free tier real (28+ free models; 50 req/day, 1k/day after $10; 1M BYOK req/mo). → Fallback lane behind LiteLLM, not a dependency. S.
- **Ollama cloud misrouting corroborated**: issues #14673 (29.7% failure) + #15453 ("95% failure") — treat as untrusted; verify `model` field every response.

## 5. Local inference (Mac + small fleet)

- **Ollama** — MIT; 0.19+ (Mar 2026) uses MLX backend on Apple Silicon (58→112 tok/s Qwen3.5-35B-A3B on M5). Keep for daily; upgrade for MLX. S.
- **MLX / mlx-lm** — MIT; fastest on Apple Silicon ≤14B; **vllm-mlx** exists now (PagedAttention on MLX) for high-concurrency Mac serving — also sidesteps ollama parallel-context blowups. M.
- **llama.cpp** — MIT; portability king for the non-Mac fleet. S.
- **vLLM** — Linux+NVIDIA/AMD only in practice. Skip unless renting GPUs.

## 6. Voice

- **CosyVoice** — Apache-2.0, active: **Fun-CosyVoice3-0.5B (Dec 2025)** + RL model + training scripts; 3.5 announced. → **Re-vendor to 3.0-0.5B** — keeps voice CLONING (persona needs a unique voice; Kokoro can't clone). S.
- **Kokoro-82M** — Apache-2.0; 54 fixed voices, CPU-friendly, no cloning. → Low-latency fallback voice. S.
- **Chatterbox / Turbo (Resemble)** — MIT; beat ElevenLabs 65.3% blind; 23 languages. → Benchmark vs CosyVoice3 for the persona voice; friendliest license. S.

## 7. Embodiment (soma)

- **LeRobot (HF)** — Apache-2.0, very active: v0.4.0 (Datasets v3, PI0.5/GR00T VLAs, hardware plugin system), course, 2026 Humanoid ($2,500). → **Adopt as soma's training/dataset substrate before hardware.** M.
- **SO-101** — $130–250 3D-printable 6-DOF arm, LeRobot-native, thriving. Cheapest teleop on-ramp. S.
- **Amazing Hand (Pollen/HF)** — $200–250 fully-printed 4-finger 8-DOF hand, open BOM/STL/code. **Best hand-first chassis for soma.** M.
- **ORCA Hand** — 17-DOF tendon-driven, <2,000 CHF, tactile-ready; pair with **FlexiTac** open tactile skin → together they ARE "sensation before locomotion". L.
- Reference: **Awesome-Touch** curated tactile index.

## Top 3 by value-per-effort

1. **LiteLLM (S)** — solves this week's misrouting burn; MIT; self-hosted; OpenRouter free lane behind it.
2. **Reclaim attestor + reality.eth pattern (M)** — the only living OSS mapping onto Proof-of-Truth; concrete: a Zerone x/truth evidence type verifying Reclaim proofs.
3. **CosyVoice3-0.5B re-vendor + Kokoro fallback (S)** — vendored copy is stale; big quality jump at 0.5B, same license, keeps cloning.

Deadpool: CosmWasm (stewardless), Omen (dead; Seer succeeds), ollama cloud (documented 30–95% failures — untrusted), Polymarket v2 (BSL), vLLM-on-Mac (use vllm-mlx).
