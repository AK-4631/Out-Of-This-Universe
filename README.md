# OUT OF THIS UNIVERSE — v4.4 OVERMAX · CINEMATIC

A browser-based sci-fi action-adventure: 10 lost dimensions, a rewriting cosmos, an AI companion, and the question behind the question. Built with vanilla JS + Three.js (r128). No build step, no dependencies.

## Run it

Open `index.html` in any modern browser (or serve the folder with any static server, e.g. `npx serve`). Click, then press ENTER to skip intro if desired.

## What's in the build (v4.4 OVERMAX)

| System | Count | Notes |
|---|---|---|
| Dimensions | **11** | Rift, City, Ocean, Eventide Fracture, Verdant Mind, Chrono Drift, Null Sepulcher, Plasma Tempest, Dreamscape, The Source, **The Margin (secret)** |
| Weapons | **10** | 1-7 core + **[8] Singularity Launcher** + **[9] Author's Pen** (pierce-4 beams, 8% UNWRITE proc) + **[0] Seeker Swarm** (3 auto-homing hunter-darts per volley) |
| Abilities | **12** | Q/E/R/T/G/C/V/B/Z/X + **[O] Meridian Strafe** + **[U] OMEGA PROTOCOL** (10-14s god mode) |
| Skills | **24** | incl. Strafe + Omega unlocks (Omega costs 4 SP) |
| Upgrade lines | **60** | 46 base→legendary→mythic chains **+ 14 APEX overmax lines** across Suit/Weapons/Energy/Companion/Meridian/Mastery |
| Echo logs | **50** | collect all + 8 shards → TRUE ENDING unlocks |
| Endings | **5** | Destroy / Merge / Release / True Draft **/ OVERTURN (defeat the Redactor)** |
| Bosses | **6** | Herald, Leviathan's Echo, Chrono Tyrant, Gatekeeper, The Author's Hand, **The Redactor** |
| Endless Rift | **∞** | Sealed survival arena on the title screen: escalating waves, boss waves every 5th, vault drops every 3rd, Seeker cache at wave 12, +30% HP/energy refactor each wave clear, best wave recorded |
| Achievements | **18** | Kill/combo/collect milestones, margin + survival feats, NG+ and both secret-mystery endings — tracked in the J panel, persist across endings and NG+ |
| Graphics | **Ultra Max** | ACES · per-dimension procedural sky (animated clouds, sun scattering) · PMREM env reflections · PBR terrain and model surfaces w/ albedo+normal+roughness · analytic Fresnel ocean (waves/glints) · soft PCF cascades + contact shadows · final film pass: bloom → FXAA → motion blur → sun shafts → vignette/grain · 4 quality tiers |

## ∞ Endless Rift (survival)

Title screen → **∞ ENDLESS RIFT**. Portals are sealed; waves announce and spawn within 3 seconds of clearing. HP scaling +15%/wave, elite chance ramps to 45%, every 5th wave summons a rotating extinction-class boss with escort. Wave clears pay salvage + XP and refresh 30% of max HP. Death ends the run (respawn button returns to title); your best wave survives in localStorage. **SEEKER SWARM** cache drops at wave 12 — a second copy waits in the campaign's starting rift (southern edge, gold blip), so either path arms weapon [0].

## Movement & camera (v4.4)

Movement was rebuilt around a proper action-game feel while keeping the original weight, jump count and dimension-specific gravity:

- **WASD, arrow keys, or gamepad left stick** — camera-relative movement. Opposite keys cancel, duplicates don't stack, and every diagonal is normalized to unit length, so you never move faster sideways.
- **Acceleration & air control** — weighted ground response (19) and a lighter airborne blend (6.2), with ground friction when you release. Walk 7.5 u/s, sprint 11.5 u/s.
- **Forgiving jumps** — 0.12 s coyote time, 0.15 s jump buffer, variable jump height (release early to cut the arc), double jump, and extra air jumps from upgrades.
- **Cinematic camera** — spring-smoothed orbit, terrain-aware boom that shortens instead of clipping through hills, optional view bob and roll, landing dip, recoil, and a sprint/overdrive FOV kick. Base FOV is adjustable from 60–100.
- **Gamepad** — left stick move · right stick look · A jump · RT fire · LT (or L3) sprint. Mouse sensitivity and invert-Y apply to pad look too.

## Cinematic realism (v4.4)

`js/render.js` is a procedural helper library loaded before the engine — no texture or asset downloads. Each dimension has its own cinematography profile (cloud cover, haze, star density, exposure, water, sun elevation), so the rift, ocean and tempest read as different places.

- **Sky & lighting** — shader sky dome with animated cloud bands, horizon gradient and sun scattering; a PMREM environment probe generated from that sky lights PBR armor, metal and glass with matching reflections.
- **Terrain & models** — quality-scaled procedural albedo, normal and roughness maps over PBR.Standard materials. Shared cached metal, rock, organic and fabric maps add surface grain, striations, veins and weave detail to opaque 3D models without external assets.
- **Ocean** — analytic vertex waves plus Fresnel reflection, depth tint and animated sun glints; the water follows the camera so the horizon never ends.
- **Shadows** — a soft PCF shadow cascade follows the player, with contact shadows grounding characters and enemies.
- **Film pass** — bloom, FXAA, optional radial motion blur (sprint/overdrive), sun shafts, vignette, sensor grain, exposure, saturation and contrast. Display toggles apply live.

## Settings worth knowing (v4.4)

Settings → **Mouse Sensitivity**, **Invert Y**, **Field of View** (60–100), **View Bob**, **Film Grain**, **Motion Blur**, **Stars**, **Screen Shake**, **Quality**. All changes apply instantly; **ULTRA MAX** is the default and configures up to 2.5× device pixel ratio, 4096² shadows (hardware-clamped), 1024² procedural maps, dense terrain/water meshes, expanded stars/weather, bloom and the film pass. Lower tiers remain available: `ultra`, `balanced`, and `performance`.

## APEX upgrades (v4.3)

14 single-tier overmax lines that chain on top of the existing mythic endgame (900–4200 ⬢ each, every one gated behind a maxed family). New in the beacon shop:

- **SUIT** — Apex Titan Weave (+120 HP, +10% resist, req Adamant Weave) · Infinite Aegis (+40 shield, 2× refill, req Aegis Generator T3) · Aegis Ultima (+10% resist, 85% cap, req Aegis Absolute) · Singularity Striders (+20% speed, +30% jump, +2 air jumps, req Phase Boots)
- **WEAPONS** — Weapon Amp Omega (+40% dmg) · Destiny Overdrive (+15% crit, ×3.25 crits, crit-stun non-bosses) · Crimson Cascade (lifesteal → 5%)
- **ENERGY** — Temporal Singularity (−30% cooldowns()) · Overcharged Relays (+12 energy/s)
- **MERIDIAN** — Supernova Battery (Orbital/Strafe × more) · Aether Omniscience (scan tier 4, 200u radar)
- **COMPANION** — LOOM: TRANSCENDENCE (drone +75% dmg, +30% rate)
- **MASTERY** — Unparseable Legend (+5%/5 combo, +40% cap) · Phoenix Protocol (Reaper revives at 35% HP, 10s cd)

## Secret path to THE MARGIN

In **THE SOURCE** (finale area), a gold portal marked **✎ THE MARGIN** sits at the east side. Align 3 glyphs to wake **THE REDACTOR**. The ink pools hold the Singularity Launcher (west) and the Author's Pen (east, +3 skill points). Defeating the Redactor adds a 5th choice to the finale.

## God mode

Settings → **GOD MODE — unlock all (permanent)**: every weapon (now including the Seeker Swarm), every ability, +5 SP, instantly. It writes into your save (by design — play fair first, cheese second).

## NG+ perks

Clear any ending → **↻ NEW GAME+**. Each cycle: +100⬢ startup salvage, +1 instant skill point, +25% enemy damage, +10% player damage, skills kept.

## Controls

- **WASD / Arrow keys** move · **Mouse** look · **LMB** fire
- **1-9, 0** weapons · **Q E R T G C V B Z X O U** abilities
- **Space** jump/double/triple-jump (hold for height) · **Shift** sprint
- **Gamepad** left stick move · right stick look · A jump · RT fire · LT/L3 sprint
- **F** interact · **H** drone mode · **Y** ping objective
- **Tab** inventory/upgrades · **K** skills · **M** map · **J** codex/achievements · **Esc** pause
- **1-5** for dialogue choices · **Space** continue

## Dev tools

- `node audit.js` — full cross-module wiring audit: DOM ids, engine exports, DIM_SPAWNS + survival roster data, U()/skill refs, requirement chains, boss types, save fields, pickup kinds, achievement count + UI ids, 10-weapon Digit0 binding, the realism stack (render.js load order + sky/PMREM/ground/water/contact-shadow/film features), and the movement stack (coyote/buffer/gamepad/camera collision/settings). Exits non-zero on any broken link.
- `node sim.js` — boots all five modules in a stubbed DOM (no browser) and runs logic assertions on weapon damage math, mods(), crit, upgrade buying, XP gain, shop HTML, render exports, settings wiring, and survival/achievement state.
- `node movetest.js` — movement regression: extracts the live input + camera-relative direction helpers from engine.js and asserts WASD **and arrow keys** map to the camera-forward convention (forward = -Z rotated by yaw), diagonals are normalized, sprint speed, stuck-input clearing (blur/visibility/dimension-build), gamepad and camera-collision wiring, plus the finale ending mapping.
- `node --check js/*.js` — plain syntax check.

There is no build system — run the checks manually after edits.

## Save data

`localStorage["OOTU_SAVE"]` (progress + settings + marginKill flag), `localStorage["OOTU_NG"]` (NG+ counter), `localStorage["OOTU_ACH"]` (achievements — never wiped by endings), `localStorage["OOTU_SURV"]` (best endless wave). Survival runs never write OOTU_SAVE, so the campaign save is protected while you grind. NG+ keeps skills, +25% enemy damage/+10% player damage per cycle. Wipe from Settings.

## File map

```
index.html   markup: HUD, screens, panels, weapon/ability slots
style.css    all styling (cosmic glassmorphism, rare-item glow)
js/data.js   balance + content data (dims, weapons, abilities, skills, upgrades, logs, missions)
js/audio.js  procedural WebAudio music/SFX (no asset files)
js/render.js procedural sky/env/ground/ocean/contact-shadow/film helpers (loads before engine)
js/engine.js Three.js world builder, movement, camera rig, enemies, AI companion, projectiles, FX
js/main.js   game state, story, missions, UI, combat abilities, loop
audit.js     cross-module wiring + realism/movement audit
sim.js       headless boot + logic simulation
movetest.js  movement/camera regression tests
```
