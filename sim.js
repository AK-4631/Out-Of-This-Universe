/* OOTU v4.1 BOOT SIM — evaluates all four modules with a minimal DOM stub to catch top-level crashes */
const fs = require("fs");
const noop = () => {};
global.window = { addEventListener: noop, OOTU_DATA: null, OOTU_Audio: null, OOTU_Engine: null, OOTU_Game: null };
global.document = {
  addEventListener: noop, getElementById: () => null, exitPointerLock: noop,
  querySelectorAll: () => [], querySelector: () => null,
  createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, remove: noop, setAttribute: noop, getContext: () => null }),
  body: { classList: { add: noop, remove: noop, toggle: noop }, style: {} },
  pointerLockElement: null
};
global.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
global.addEventListener = noop;
global.innerWidth = 1280; global.innerHeight = 720; global.devicePixelRatio = 1;
// minimal math stubs used at module load time (full Three.js is browser-only)
class V3 {
  constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new V3(this.x, this.y, this.z); }
  normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
  lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
}
class V2 {
  constructor(x, y) { this.x = x || 0; this.y = y || 0; }
  set(x, y) { this.x = x; this.y = y; return this; }
}
global.THREE = { Vector2: V2, Vector3: V3 };

const files = ["js/data.js", "js/audio.js", "js/render.js", "js/engine.js", "js/main.js"];
for (const f of files) {
  try { new Function(fs.readFileSync(f, "utf8"))(); console.log("BOOT OK   " + f); }
  catch (e) { console.log("BOOT FAIL " + f + " → " + e.message); process.exitCode = 1; }
}
const w = global.window;
const checks = [
  ["OOTU_DATA with 11 dims", w.OOTU_DATA && Object.keys(w.OOTU_DATA.dimensions).length === 11],
  ["OOTU_DATA 10 weapons", w.OOTU_DATA && w.OOTU_DATA.weapons.length === 10],
  ["10th weapon is seeker", w.OOTU_DATA && w.OOTU_DATA.weapons[9].id === "seeker"],
  ["seeker is auto weapon", w.OOTU_DATA && w.OOTU_DATA.weapons[9].auto === true],
  ["OOTU_DATA 12 abilities", w.OOTU_DATA && w.OOTU_DATA.abilities.length === 12],
  ["OOTU_AUDIO present", !!w.OOTU_Audio],
  ["OOTU_RENDER present", !!w.OOTU_Render],
  ["render sky/water/film exports", w.OOTU_Render && ["makeSky", "makeWater", "makeEnvironment", "filmShader"].every(k => typeof w.OOTU_Render[k] === "function")],
  ["render model PBR texture exports", w.OOTU_Render && ["makeSurfaceTextures", "standardize"].every(k => typeof w.OOTU_Render[k] === "function")],
  ["OOTU_ENGINE exported", !!w.OOTU_Engine],
  ["engine applySettings export", w.OOTU_Engine && typeof w.OOTU_Engine.applySettings === "function"],
  ["engine Ultra Max default quality", w.OOTU_Game && w.OOTU_Game.SET.quality === "ultra_max"],
  ["engine movement config export", w.OOTU_Engine && w.OOTU_Engine.moveConfig && w.OOTU_Engine.moveConfig.walk === 7.5],
  ["engine strafe export", typeof w.OOTU_Engine.strafe === "function"],
  ["engine orbital export", typeof w.OOTU_Engine.orbital === "function"],
  ["engine nova export", typeof w.OOTU_Engine.nova === "function"],
  ["engine drawMinimap export", typeof w.OOTU_Engine.drawMinimap === "function"],
  ["engine spawnWave export", typeof w.OOTU_Engine.spawnWave === "function"],
  ["engine addPickup export", typeof w.OOTU_Engine.addPickup === "function"],
  ["OOTU_GAME exported", !!w.OOTU_Game],
  ["settings expose render+movement controls", w.OOTU_Game && ["mouseSens", "invertY", "viewBob", "filmGrain", "motionBlur", "fov", "stars"].every(k => k in w.OOTU_Game.SET)],
  ["game weapon()", typeof w.OOTU_Game.weapon === "function"],
  ["game G.ach Set present", w.OOTU_Game.G && w.OOTU_Game.G.ach instanceof Set],
  ["game G.survival flag present", w.OOTU_Game.G && typeof w.OOTU_Game.G.survival === "boolean"],
  ["game rollCrit()", typeof w.OOTU_Game.rollCrit === "function"],
  ["game travelTo()", typeof w.OOTU_Game.travelTo === "function"],
  ["game _test.castAbility()", w.OOTU_Game._test && typeof w.OOTU_Game._test.castAbility === "function"],
  ["game audio omega()", typeof w.OOTU_Audio.omega === "function"]
];
let bad = 0;
checks.forEach(([name, pass]) => { console.log((pass ? "CHECK OK   " : "CHECK FAIL ") + name); if (!pass) bad++; });

// ---- LOGIC PHASE: exercise pure game functions ----
let lbad = 0;
const logick = (name, pass) => { console.log((pass ? "LOGIC OK   " : "LOGIC FAIL ") + name); if (!pass) lbad++; };
try {
  const T = w.OOTU_Game._test, Data = w.OOTU_DATA, Gm = w.OOTU_Game.G;
  const w0 = T.applyUpgrades() || w.OOTU_Game.weapon();
  const dmg0 = w.OOTU_Game.weapon();
  logick("weapon() base pulse dmg=16, got " + dmg0.dmg, dmg0.dmg === 16);
  Gm.unlocked.rail = true; Gm.wIndex = 2;
  const rail = w.OOTU_Game.weapon();
  logick("rail buffed dmg=140, got " + rail.dmg, rail.dmg === 140);
  Gm.wIndex = 0;
  const m = T.mods();
  logick("mods().ai.miniOrb=false", m.ai.miniOrb === false);
  logick("mods().dmgMul===1", m.dmgMul === 1);
  logick("critChance===0.05 base", Math.abs(T.critChance() - 0.05) < 1e-9);
  logick("orbitalMul===1 base", Math.abs(T.orbitalMul() - 1) < 1e-9);
  logick("energyCost(30)===30 base", T.energyCost(30) === 30);
  T.applyUpgrades();
  const p = w.OOTU_Engine.player;
  logick("applyUpgrades maxHp=100 +hp text", p.maxHp === 100);
  const html2 = T.upgradesHTML();
  logick("upgradesHTML contains Reactive Plating", html2.includes("Reactive Plating"));
  logick("upgradesHTML contains all 6 categories", ["SUIT","WEAPONS","ENERGY","COMPANION","MERIDIAN","MASTERY"].every(c => html2.includes(c)));
  const xpBefore = Gm.xp; T.gainXP(50); const gained = Gm.xp - xpBefore;
  logick("gainXP(50)→65 with 1.3 mult, got " + gained, gained === 65);
  T.buyUpgrade("hull"); logick("buyUpgrade blocks with no salvage (hull tier 0)", T.U("hull") === 0);
  // ---- v4.1: achievements + endless rift state ----
  logick("achievements Set starts empty on fresh boot", Gm.ach.size === 0);
  logick("bestWave starts 0 on fresh boot", Gm.bestWave === 0);
  const n0 = Gm.unlocked; logick("fresh unlock map has 10 slots + seeker locked", n0.seeker === false && n0.pen === false);
  // ---- v4.3: APEX upgrade tier ----
  logick("60 upgrade lines (46 classic + 14 apex)", Data.upgrades.length === 60);
  const apexIds = ["hullA","shieldA","reactiveA","bootsA","w_dmgA","critA","vampiric","cooldownA","overcharge","ship_gunA","ship_radarA","ai_transcend","comboA","reborn"];
  logick("all 14 apex ids present in data.js", apexIds.every(id => Data.upgrades.some(u => u.id === id)));
  Gm.upT.w_dmgA = 1;
  logick("Weapon Amp Omega: pulse 16→22", w.OOTU_Game.weapon().dmg === 22);
  Gm.upT.w_dmgA = 0; Gm.upT.comboA = 1; Gm.combo = 10;
  logick("Unparseable Legend: +10% at x10 combo (pulse→18)", w.OOTU_Game.weapon().dmg === 18);
  Gm.combo = 0; Gm.upT.comboA = 0;
  Gm.upT.critA = 1;
  logick("Destiny Overdrive critMul=3.25", T.critMul() === 3.25);
  logick("critA adds +15% crit chance (0.20)", Math.abs(T.critChance() - 0.2) < 1e-9);
  Gm.upT.critA = 0;
  Gm.upT.cooldownA = 1;
  logick("Temporal Singularity cdMul=0.7", Math.abs(T.cdMul() - 0.7) < 1e-9);
  Gm.upT.cooldownA = 0;
  Gm.upT.overcharge = 1;
  logick("Overcharged Relays enRegen=12", T.mods().enRegen === 12);
  logick("Overcharged Relays on top of Meridian plating", (() => { Gm.upT.ship_hull = 2; const v = T.mods().enRegen; Gm.upT.ship_hull = 0; return v === 15; })());
  Gm.upT.overcharge = 0;
  Gm.upT.ai_transcend = 1;
  logick("LOOM: TRANSCENDENCE dmg 6→10.5", Math.abs(T.mods().ai.dmg - 10.5) < 1e-9);
  Gm.upT.ai_transcend = 0;
  Gm.upT.shieldA = 1; T.applyUpgrades();
  logick("Infinite Aegis maxShield=40", w.OOTU_Engine.player.maxShield === 40);
  Gm.upT.shieldA = 0;
  Gm.upT.hullA = 1; T.applyUpgrades();
  logick("Apex Titan Weave maxHp=220", w.OOTU_Engine.player.maxHp === 220);
  Gm.upT.hullA = 0; T.applyUpgrades();
  Gm.upT.ship_gunA = 1;
  logick("Supernova Battery orbitalMul=1.75", Math.abs(T.orbitalMul() - 1.75) < 1e-9);
  Gm.upT.ship_gunA = 0;
  Gm.upT.ship_radarA = 1;
  logick("Aether Omniscience scanLevel=4", T.scanLevel() === 4);
  Gm.upT.ship_radarA = 0; T.applyUpgrades();
} catch (e) { logick("logic phase threw: " + e.message, false); }
bad += lbad;
console.log(bad === 0 && !process.exitCode ? "==== BOOT SIMULATION: ALL CLEAR ====" : "==== BOOT SIMULATION: " + bad + " FAILURES ====");
if (bad) process.exitCode = 1;
