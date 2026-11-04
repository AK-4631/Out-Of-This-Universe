/* OOTU MOVEMENT TEST — extracts the live input + camera-relative direction helpers from
   js/engine.js and validates WASD / arrows / gamepad-friendly logic against the engine's
   camera-forward convention (forward = -Z rotated by yaw). */
const fs = require("fs");
const src = fs.readFileSync("js/engine.js", "utf8");
const start = src.indexOf("function movementInput(k){");
const end = src.indexOf("function requestJump(){");
if (start < 0 || end < 0) {
  console.log("MOVE FAIL movement helpers not found in engine.js");
  process.exitCode = 1;
  process.exit();
}
const block = src.slice(start, end);
const helpers = new Function(block + "\nreturn {movementInput, worldMove};")();
const input = (keys) => helpers.movementInput(Object.assign({
  KeyW: 0, KeyS: 0, KeyA: 0, KeyD: 0, ArrowUp: 0, ArrowDown: 0,
  ArrowLeft: 0, ArrowRight: 0, ShiftLeft: 0, ShiftRight: 0
}, keys));
const dir = (keys, yaw) => {
  const m = input(keys);
  const d = helpers.worldMove(yaw == null ? 0.75 : yaw, m.mx, m.mz, 1);
  return [d.x, d.z];
};
const fwd = y => [-Math.sin(y), -Math.cos(y)];
const rgt = y => [Math.cos(y), -Math.sin(y)];
const set = a => { const m = Math.hypot(a[0], a[1]) || 1; return [a[0] / m, a[1] / m]; };
const eq = (a, b) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
let bad = 0;
const ok = (name, pass) => { console.log((pass ? "MOVE OK   " : "MOVE FAIL ") + name); if (!pass) bad++; };

const Y = 0.75;
ok("W moves along camera-forward",             eq(dir({ KeyW: 1 }, Y), fwd(Y)));
ok("ArrowUp moves along camera-forward",       eq(dir({ ArrowUp: 1 }, Y), fwd(Y)));
ok("S moves against camera-forward",           eq(dir({ KeyS: 1 }, Y), set(fwd(Y).map(x => -x))));
ok("ArrowDown moves against camera-forward",   eq(dir({ ArrowDown: 1 }, Y), set(fwd(Y).map(x => -x))));
ok("D strafes right only",                     eq(dir({ KeyD: 1 }, Y), rgt(Y)));
ok("ArrowRight strafes right only",            eq(dir({ ArrowRight: 1 }, Y), rgt(Y)));
ok("A strafes left only",                      eq(dir({ KeyA: 1 }, Y), set(rgt(Y).map(x => -x))));
ok("ArrowLeft strafes left only",              eq(dir({ ArrowLeft: 1 }, Y), set(rgt(Y).map(x => -x))));
ok("held W + ArrowUp does not double speed",   eq(dir({ KeyW: 1, ArrowUp: 1 }, Y), fwd(Y)));
ok("diagonals are normalized (no speed boost)", (() => {
  const d = dir({ KeyW: 1, KeyD: 1 }, Y);
  return Math.abs(Math.hypot(d[0], d[1]) - 1) < 1e-9;
})());
ok("all four diagonals unit length", (() => {
  const combos = [{ KeyW: 1, KeyD: 1 }, { KeyW: 1, KeyA: 1 }, { KeyS: 1, KeyD: 1 }, { KeyS: 1, KeyA: 1 }];
  return combos.every(k => { const d = dir(k, 2.1); return Math.abs(Math.hypot(d[0], d[1]) - 1) < 1e-9; });
})());
ok("worldMove preserves direction at every yaw", (() => {
  for (const y of [0, Math.PI, 1.234, -3.456, 6.283]) {
    if (!eq(dir({ KeyW: 1 }, y), fwd(y)) || !eq(dir({ KeyA: 1 }, y), set(rgt(y).map(x => -x)))) return false;
  }
  return true;
})());
ok("sprint detection (Shift left/right)", input({ ShiftLeft: 1 }).sprint && input({ ShiftRight: 1 }).sprint);
ok("sprint speed 11.5 > walk 7.5", (() => {
  const walk = helpers.worldMove(0, 0, 1, 7.5);
  const run = helpers.worldMove(0, 0, 1, 11.5);
  return Math.abs(Math.hypot(walk.x, walk.z) - 7.5) < 1e-9 && Math.abs(Math.hypot(run.x, run.z) - 11.5) < 1e-9;
})());
ok("no input = no drift", (() => {
  const m = input({});
  const d = helpers.worldMove(1.1, m.mx, m.mz, 1);
  return !m.moving && d.x === 0 && d.z === 0;
})());

// architecture checks: the helpers must stay pure so tests and future ports keep working
ok("movement input is a pure helper", /function movementInput\(k\)\{/.test(src));
ok("camera-relative worldMove is a pure helper", /function worldMove\(yaw,mx,mz,speed\)\{/.test(src));
ok("accelerated ground/air movement", /MOVE\.accelGround/.test(src) && /MOVE\.accelAir/.test(src));
ok("coyote time + jump buffering", /moveState\.coyote/.test(src) && /moveState\.jumpBuffer/.test(src));
ok("variable jump height (jump cut)", /moveState\.jumpCut/.test(src) && /player\.vel\.y\*=\s*0\.52/.test(src));
ok("double jump preserved", /maxJumps=2/.test(src) && /MOVE\.jump2/.test(src));
ok("gamepad poll (move/look/jump/fire/sprint)", /function pollGamepad\(dt\)/.test(src) && /padJumpPrev/.test(src));
ok("camera terrain collision + spring", /clearBoom/.test(src) && /heightAt\(sx,sz\)/.test(src) && /cameraRig\.len/.test(src));
ok("view bob + camera roll settings-aware", /S\.viewBob!==false/.test(src) && /cameraRig\.roll/.test(src));
ok("mouse sensitivity / invert-Y wired", /mouseSens/.test(src) && /invertY/.test(src));

const main = fs.readFileSync("js/main.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");
ok("modal key-clear list includes arrow keys", /"Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"/.test(main));
ok("window blur clears stuck input", /addEventListener\("blur",\(\)=>\{ input\.keys=\{\}; input\.fire=false;/.test(src));
ok("visibilitychange clears stuck input", /visibilitychange/.test(src));
ok("dimension build resets input", /fresh dimension = fresh input state/.test(src));
ok("settings expose mouseSens / invertY / viewBob / fov", ["mouseSens", "invertY", "viewBob", "fov"].every(k => main.includes(k)));
ok("finale maps endings by option text", /ans\.indexOf\("OVERTURN"\)/.test(main) && /ans\.indexOf\("TRUE DRAFT"\)/.test(main));
ok("render.js loads before engine.js", html.indexOf('src="js/render.js"') > -1 && html.indexOf('src="js/render.js"') < html.indexOf('src="js/engine.js"'));
if (bad) process.exitCode = 1;
