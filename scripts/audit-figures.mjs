// Replays the figures' geometry through the anatomy skill's audit (kit/audit.mjs): every solid at rest in
// every reachable state, checked for sunk or floating parts and for depth order. Offline, never in the build.
//
// Run: npm run audit:figures        (needs the skill; set ANATOMY_SKILL if it is not in ~/.claude/skills/anatomy)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const ROOT = process.cwd();
const SKILL = process.env.ANATOMY_SKILL ?? path.join(os.homedir(), ".claude", "skills", "anatomy");
if (!fs.existsSync(path.join(SKILL, "kit", "audit.mjs"))) {
  console.error(`The anatomy skill is not at ${SKILL}. Set ANATOMY_SKILL to its folder.`);
  process.exit(1);
}
const A = await import(pathToFileURL(path.join(SKILL, "kit", "audit.mjs")).href);

// Bundle the pure TypeScript (geometry and models) so node can import it.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "audit-figures-"));
const load = async (entry) => {
  const outfile = path.join(tmp, `${path.basename(path.dirname(entry))}-${path.basename(entry, ".ts")}.mjs`);
  await build({ entryPoints: [path.join(ROOT, entry)], bundle: true, format: "esm", outfile, alias: { "@": ROOT }, logLevel: "error" });
  return import(pathToFileURL(outfile).href);
};
const W = await load("components/figures/slidingWindow/geometry.ts");
const R = await load("components/figures/fillRace/geometry.ts");
const L = await load("components/figures/commitLatch/geometry.ts");
const latchModel = await load("lib/commitLatch.ts");
const slidingWindow = await load("lib/slidingWindow.ts");

// The figures' inputs are the post's numbers rows, so read them the same way the site does.
const figureOf = (topic, id) => {
  const post = JSON.parse(fs.readFileSync(path.join(ROOT, "content/topics", `${topic}.json`), "utf8")).posts.find((p) => p.digest.figure?.id === id);
  const num = (row) => Number(post.digest.numbers[row].value.match(/\d[\d,]*(?:\.\d+)?/)[0].replace(/,/g, ""));
  return Object.fromEntries(Object.entries(post.digest.figure.rows).map(([k, row]) => [k, num(row)]));
};

const mid = (min, max) => min.map((v, i) => (v + max[i]) / 2);
let runs = 0;
let failed = 0;
function run(label, P, specs, extra = []) {
  const rec = A.recorder(P);
  for (const s of specs) rec.put({ name: s.name, at: mid(s.min, s.max), shapes: [rec.solid(A.box(s.min, s.max, { name: s.name, ...(s.name.startsWith("stand.") ? { ground: true } : {}) }))] });
  for (const [name, shape, at] of extra) rec.put({ name, at, shapes: [rec.solid(shape)], bias: 0.1 });
  A.settle(rec, P);
  rec.items.sort((a, b) => a.key - b.key);
  const result = A.audit(rec, P, { allow: [], crowd: [] });
  runs++;
  const n = A.failures(result);
  if (n) {
    failed += n;
    console.log(`--- ${label}: ${n} problems\n${A.report(result)}`);
  }
}

// Sliding window: the frame, the gauge disc and every bead, at several elapsed times, with and without added requests.
const w = figureOf("rate-limiting", "sliding-window");
const G = W.GAUGE_WORLD;
const B = W.BEAD_WORLD;
for (const e of [0, 1, 15, 30, 45, 59, 60]) {
  for (const added of [0, slidingWindow.MAX_ADDED]) {
    const specs = [...W.STATIC, ...[...W.FRAME_BACK, ...W.FRAME_FRONT].map((s) => ({ ...s, min: [s.min[0] + e, s.min[1], s.min[2]], max: [s.max[0] + e, s.max[1], s.max[2]] }))];
    const disc = A.disc({ o: [G.x, 0, G.z], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] }, G.back, 0, G.r, { name: "gauge.disc" });
    const extra = [["gauge.disc", disc, [G.x, -1.2, G.z]]];
    for (let k = 0; k < w.previous; k++) {
      const at = [((k + 0.5) * 60) / w.previous, 9, B.z];
      extra.push([`bead.prev${k}`, A.ball(at, B.r, { name: `bead.prev${k}` }), at]);
    }
    const count = w.current + added;
    W.currentBeadX(count, e).forEach((x, k) => {
      const at = [x, W.CUR_LANES[k % W.CUR_LANES.length], B.z];
      extra.push([`bead.cur${k}`, A.ball(at, B.r, { name: `bead.cur${k}` }), at]);
    });
    run(`window e=${e} added=${added}`, W.PROJECTION, specs, extra);
  }
}

// Fill race: every reachable place of both carriages, with the pawl and the token as the model sets them.
for (const [fp, fx] of Object.entries(R.FILL_AT)) {
  for (const [ip, ix] of Object.entries(R.INVAL_AT)) {
    for (const up of [true, false]) {
      for (const token of [true, false]) {
        if ((fp === "blocked" && !up) || (fp === "delivered" && up)) continue;
        run(`race fill=${fp} inval=${ip} pawl=${up ? "up" : "down"} token=${token}`, R.PROJECTION, R.auditShapes(fx, ix, up, token));
      }
    }
  }
}

// Commit latch: each step of the story.
const latch = figureOf("distributed-transactions", "commit-latch");
for (let step = 0; step < latchModel.LATCH_STEPS; step++) {
  const s = latchModel.latchState(latch, step);
  run(`latch step ${step + 1}`, L.PROJECTION, L.auditShapes({ bobLock: s.bobLock, joeLock: s.joeLock, bobNew: s.bobNew !== "none", joeNew: s.joeNew !== "none", bobFlag: s.bobNew === "committed", joeFlag: s.joeNew === "committed" }));
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `audit failed: ${failed} problems in ${runs} states` : `audit passed: ${runs} states`);
process.exit(failed ? 1 : 0);
