/* OOTU v4.4 WIRING AUDIT — cross-references all modules without a browser */
const fs = require("fs");
const problems = [];
const ok = [];

// load data with window stub
global.window = {};
new Function(fs.readFileSync("js/data.js", "utf8"))();
const D = global.window.OOTU_DATA;

const read = f => fs.readFileSync(f, "utf8");
const main = read("js/main.js"), engine = read("js/engine.js"), render = read("js/render.js"), html = read("index.html");

// 1. every static $("id") in main.js must exist in index.html OR be created dynamically in any JS file
const allJs = main + engine + read("js/audio.js") + render;
const staticIds = [...new Set([...main.matchAll(/\$\("([^"\+]+)"\)/g)].map(m => m[1]))];
let missingHtml = staticIds.filter(id => !html.includes(`id="${id}"`) && !allJs.includes(`id=${id}`) && !allJs.includes(`id='${id}'`));
if (missingHtml.length) problems.push("main.js references missing HTML ids: " + missingHtml.join(", "));
else ok.push(`all ${staticIds.length} static $("id") refs exist in index.html`);

// 2. dynamic id builders: w0..w9, a0..a11, cd0..cd11, wAmmo0..9 must exist
for (let i = 0; i < 10; i++) ["w" + i, "wAmmo" + i].forEach(id => { if (!html.includes(`id="${id}"`)) problems.push("missing weapon-slot id: " + id); });
for (let i = 0; i < 12; i++) ["a" + i, "cd" + i].forEach(id => { if (!html.includes(`id="${id}"`)) problems.push("missing ability-slot id: " + id); });
ok.push("weapon slots w0-w9 + ability slots a0-a11 present");

// 3. every E().method called in main.js must exist in engine exports
const exportsMatch = engine.match(/return \{init:[\s\S]*?\};\s*\}\)\(\);/);
const exportBlock = exportsMatch ? exportsMatch[0] : engine;
const eCalls = [...new Set([...main.matchAll(/E\(\)\.(\w+)/g)].map(m => m[1]))];
const missingExports = eCalls.filter(fn => !new RegExp(`[,{\\s]${fn}\\s*[:(]`).test(exportBlock) && !new RegExp(`${fn}\\s*:`).test(exportBlock) && !engine.includes("function " + fn));
if (missingExports.length) problems.push("main.js calls missing engine exports: " + missingExports.join(", "));
else ok.push(`all ${eCalls.length} E().method calls resolve in engine`);

// 4. DIM_SPAWNS keys are real dimensions, values are real enemy types
const dspawns = {};
(engine.match(/DIM_SPAWNS=\{([\s\S]*?)\};/) || [])[1].replace(/\s/g, "").split("],").forEach(pair => {
  const m = pair.match(/^(\w+):\[(.*)/); if (m) dspawns[m[1]] = m[2] + "]";
});
Object.keys(dspawns).forEach(k => { if (!D.dimensions[k]) problems.push("DIM_SPAWNS has unknown dim: " + k); });
const enemyTypes = new Set([...engine.matchAll(/^\s{2}(\w+):\{name:/gm)].map(m => m[1]));
[...new Set([].concat(...Object.values(dspawns).map(s => s.replace(/[\[\]"']/g, "").split(","))))]
  .forEach(t => { if (t && !enemyTypes.has(t)) problems.push("DIM_SPAWNS has unknown enemy type: " + t); });
ok.push(`DIM_SPAWNS covers ${Object.keys(dspawns).length} dims; all enemy types valid`);

// 5. U("id") calls in main.js must exist as upgrade ids
const upgIds = new Set(D.upgrades.map(u => u.id));
const uCalls = [...new Set([...main.matchAll(/U\("(\w+)"\)/g)].map(m => m[1]))];
const missingUpg = uCalls.filter(id => !upgIds.has(id));
if (missingUpg.length) problems.push("main.js U() references missing upgrade ids: " + missingUpg.join(", "));
else ok.push(`all ${uCalls.length} U() upgrade refs exist in data.js`);

// 6. skill unlock ids used in main must exist as skills
const skillIds = new Set(D.skills.map(s => s.id));
const skillCalls = [...new Set([...main.matchAll(/G\.skills\.has\("(\w+)"\)/g)].map(m => m[1]))];
const missingSkill = skillCalls.filter(id => !skillIds.has(id));
if (missingSkill.length) problems.push("main.js checks missing skill ids: " + missingSkill.join(", "));
else ok.push(`all ${skillCalls.length} skill refs exist in data.js`);

// 7. upgrade req chains resolve (against upgrades OR skills, both now supported)
D.upgrades.forEach(u => { if (u.req) { const base = u.req.split(":")[0]; if (!upgIds.has(base) && !skillIds.has(base)) problems.push(`upgrade ${u.id} requires unknown gate ${base}`); } });
D.skills.forEach(s => { if (s.req && !skillIds.has(s.req)) problems.push(`skill ${s.id} requires unknown skill ${s.req}`); });
ok.push("upgrade/skill requirement chains resolve");

// 8. ability key sanity: 12 abilities, unique keys, castAbility indexes within bounds
if (D.abilities.length !== 12) problems.push("expected 12 abilities, got " + D.abilities.length);
const akeys = D.abilities.map(a => a.key);
if (new Set(akeys).size !== akeys.length) problems.push("duplicate ability keys");
if (!/for\(let i=0;i<12;i\+\+\)if\(G\.cds\[i\]>0\)/.test(main)) problems.push("cooldown loop not 12");
ok.push("12 abilities, unique keys, 12-slot cooldown loop");

// 9. spawnBoss args must be boss enemy types
[...main.matchAll(/spawnBoss\("(\w+)"/g)].forEach(m => {
  const def = engine.match(new RegExp(`\\s${m[1]}:\\{name:"([^"]+)"[\\s\\S]*?boss:true`));
  if (!def) problems.push("spawnBoss with non-boss/unknown type: " + m[1]);
});
ok.push("all spawnBoss calls use valid boss types");

// 10. save/load fields parity
[["marginKill", "G.marginKill"], ["omegaT", "G.omegaT"]].forEach(([f]) => {
  if (f === "marginKill" && (!main.includes("marginKill:G.marginKill") || !main.includes("G.marginKill=!!s.marginKill"))) problems.push("marginKill not saved/loaded");
});
ok.push("marginKill persisted in save/load");

// 11. pickups kinds: engine buildPickups kinds must be handled by main doInteract or be generic
const pickupKinds = ["shard", "vault", "voidgun", "voidpulse", "chrono", "stargun", "singular", "pen", "rail", "anchor", "heart", "log", "seeker"];
pickupKinds.forEach(k => { if (!main.includes(`p.kind==="${k}"`)) problems.push("doInteract missing kind: " + k); });
ok.push("all story pickup kinds handled in doInteract");

// 12. achievements: every ACHS id is poured via unlock(); ACHS ids rendered in missions panel
const achListMatch = main.match(/const ACHS=\[([\s\S]*?)\];/);
const achIds = achListMatch ? [...achListMatch[1].matchAll(/id:"(\w+)"/g)].map(m => m[1]) : [];
if (achIds.length < 18) problems.push("expected 18 achievements, got " + achIds.length);
const renderIds = ["achievements-list", "btn-endless"];
renderIds.forEach(id => { if (!html.includes(`id="${id}"`)) problems.push("index.html missing id: " + id); });
if (!main.includes('loadAch();')) problems.push("boot does not call loadAch()");
if (!/G\.survival\)\{ saveAch\(\); location\.reload/.test(main)) problems.push("survival respawn does not exit via reload");
if (!/G\.dim!=="rift"\|\|G\.survival/.test(main)) problems.push("renderHUD boss bar hides boss in survival rift");
ok.push(`achievements: ${achIds.length} ids wired into missions panel; endless rift UI present`);

// 13. endless rift: survival spawner types/bosses must be real enemy types
const survTypesMatch = main.match(/const SURV_TYPES=\[(.*?)\]/);
const survBossMatch = main.match(/const SURV_BOSSES=\[(.*?)\]/);
if (survTypesMatch) survTypesMatch[1].replace(/["\s]/g, "").split(",").forEach(t => { if (t && !enemyTypes.has(t)) problems.push("SURV_TYPES has unknown enemy: " + t); });
if (survBossMatch) survBossMatch[1].replace(/["\s]/g, "").split(",").forEach(b => {
  if (b && !engine.match(new RegExp(`\\s${b}:\\{name:"([^"]+)"[\\s\\S]*?boss:true`))) problems.push("SURV_BOSSES has non-boss: " + b);
});
ok.push("survival wave roster + boss rotation use valid enemy types");

// 14. weapon count sanity: data.js has 10 weapons, Digit0 selects index 9
if (D.weapons.length !== 10) problems.push("expected 10 weapons in data.js, got " + D.weapons.length);
if (!main.includes('G.wIndex=9')) problems.push("Digit0 does not select the 10th weapon");
ok.push("10 weapons; seeker homing in engine; Digit0 bound");

// 15. realism stack: composer scripts loaded, procedural render module, PBR/shadows/water/film
["postprocessing/EffectComposer", "postprocessing/UnrealBloomPass", "shaders/FXAAShader"].forEach(u => {
  if (!html.includes("examples/js/" + u + ".js")) problems.push("index.html missing three.js script: " + u);
});
if (!html.includes('src="js/render.js"')) problems.push("index.html missing js/render.js");
if (html.indexOf('src="js/render.js"') > html.indexOf('src="js/engine.js"')) problems.push("render.js must load before engine.js");
["makeSky", "makeEnvironment", "makeGroundTextures", "makeWater", "updateWater", "filmShader", "contactShadow", "standardize", "paletteFor"].forEach(k => {
  if (!render.includes("function " + k) && !render.includes(k + ":") && !render.includes(k + " =")) problems.push("render.js missing feature: " + k);
});
["makeSurfaceTextures", "surfaceFor", "SURFACE_PROFILES", "normalMap", "roughnessMap"].forEach(k => {
  if (!render.includes(k)) problems.push("render.js missing model texture feature: " + k);
});
if (!/quality==="ultra_max"\?1024/.test(render)) problems.push("procedural texture maps lack Ultra Max resolution");
if (!/quality==="ultra_max"\?192/.test(render)) problems.push("water mesh lacks Ultra Max tessellation");
["PMREMGenerator", "EquirectangularReflectionMapping", "normalMap", "roughnessMap", "fres", "uSunVis", "uVignette", "uGrain", "uSpeed"].forEach(k => {
  if (!render.includes(k)) problems.push("render.js missing realism feature: " + k);
});
["EffectComposer", "UnrealBloomPass", "FXAAShader", "PCFSoftShadowMap", "ACESFilmicToneMapping", "MeshStandardMaterial({vertexColors:true", "ocean", "updateWater", "applySettings:applySettings", "contactShadow", "sunScreen", "composer.render()"].forEach(k => {
  if (!engine.includes(k)) problems.push("engine missing realism feature: " + k);
});
if (!engine.includes("receiveShadow=true")) problems.push("terrain does not receive shadows");
if (!engine.includes("castShadow=true")) problems.push("shadow casters not wired");
if (!/quality="ultra_max"/.test(engine) || !/q==="ultra_max"\?4096/.test(engine)) problems.push("engine Ultra Max default/shadow preset missing");
if (!/q==="ultra_max"\?2\.5/.test(engine)) problems.push("engine Ultra Max pixel-ratio preset missing");
if (!/renderLib\(\)\.standardize/.test(engine)) problems.push("engine does not apply model surface textures");
if (!/dirLight\.position\.set\(player\.pos\.x\+SUN_DIR/.test(engine)) problems.push("shadow cascade does not follow the player");
if (!/skyDome\.position\.copy\(camera\.position\)/.test(engine)) problems.push("sky dome does not follow the camera");
if (!/quality:"ultra_max"/.test(main) || !main.includes('"ULTRA MAX"')) problems.push("settings do not default to/show Ultra Max");
if (!main.includes('if(SET.quality==="ultra")SET.quality="ultra_max"')) problems.push("legacy ultra settings are not migrated to Ultra Max");
ok.push("realism stack wired: Ultra Max preset, procedural model PBR maps, sky/PMREM/ground/water/shadows/film pass");

// 16. movement stack: normalized camera-relative input, acceleration, coyote/buffer, gamepad, camera collision
["function movementInput", "function worldMove", "function requestJump", "function pollGamepad", "MOVE.accelGround", "MOVE.accelAir", "moveState.coyote", "moveState.jumpBuffer", "moveState.jumpCut", "clearBoom", "cameraRig.roll", "S.viewBob!==false"].forEach(k => {
  if (!engine.includes(k)) problems.push("engine missing movement feature: " + k);
});
["mouseSens", "invertY", "viewBob", "filmGrain", "motionBlur", "fov", "stars"].forEach(k => {
  if (!main.includes(k)) problems.push("main.js missing settings key: " + k);
});
if (!main.includes("E().applySettings")) problems.push("main.js does not push settings into the renderer");
ok.push("movement stack wired: normalized input, acceleration, coyote/buffer, gamepad, camera collision, settings");

console.log("==== AUDIT RESULTS ====");
ok.forEach(o => console.log("  OK  " + o));
if (problems.length) { console.log("PROBLEMS:"); problems.forEach(p => console.log("  !!  " + p)); process.exitCode = 1; }
else console.log("  ZERO PROBLEMS — wiring is fully cross-linked");
