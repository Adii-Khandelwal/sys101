// Drives the guided tours in a real browser: keyboard flow, Esc, focus return, Skip, nothing stored, docking at 390px.
// Offline, never in the build. Run: npm run check:tour   (BASE_URL defaults to http://localhost:3000, a running dev or start server)
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const problems = [];
const expect = (ok, what) => ok || problems.push(what);

const browser = await chromium.launch();
for (const [label, url, steps] of [["home", "/", 5], ["topic", "/topic/caching", 5]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  const link = page.getByRole("button", { name: "Take the 30-second tour" });
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));

  // Never auto-starts.
  expect((await page.locator(".tour-tip").count()) === 0, `${label}: the tour started by itself`);

  // Keyboard only: open with Enter, move with the arrows and Tab, finish with Done.
  await link.focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector(".tour-tip");
  expect(await page.evaluate(() => document.activeElement?.classList.contains("tour-tip")), `${label}: focus did not move into the tooltip`);
  expect(/Step 1 of \d/.test(await page.locator(".tour-count").textContent()), `${label}: no step count`);
  expect((await page.locator("[role=status]").innerText()).startsWith("Step 1 of"), `${label}: the step was not announced`);
  await page.keyboard.press("ArrowRight");
  expect(/Step 2 of/.test(await page.locator(".tour-count").textContent()), `${label}: ArrowRight did not step`);
  await page.keyboard.press("ArrowLeft");
  expect(/Step 1 of/.test(await page.locator(".tour-count").textContent()), `${label}: ArrowLeft did not step back`);
  // Tab stays inside the tooltip (Back is disabled on step 1, so Next, Skip, then wrap to Next).
  const seen = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    seen.push(await page.evaluate(() => (document.activeElement?.closest(".tour-tip") ? document.activeElement.textContent.trim().toLowerCase() : "OUTSIDE")));
  }
  expect(!seen.includes("OUTSIDE"), `${label}: Tab left the tooltip (${seen.join(", ")})`);
  for (let i = 1; i < steps; i++) await page.keyboard.press("ArrowRight");
  const total = Number((await page.locator(".tour-count").textContent()).match(/of (\d+)/)[1]);
  expect(total === steps, `${label}: expected ${steps} steps, got ${total}`);
  expect((await page.locator(".tour-actions button").nth(1).innerText()).toLowerCase() === "done", `${label}: the last step does not say Done`);
  await page.locator(".tour-actions button").nth(1).click();
  expect((await page.locator(".tour-tip").count()) === 0, `${label}: Done did not close the tour`);
  expect(await page.evaluate(() => document.activeElement?.classList.contains("tour-link")), `${label}: focus did not return to the entry link after Done`);

  // Esc closes from the middle and returns focus.
  await link.click();
  await page.waitForSelector(".tour-tip");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  expect((await page.locator(".tour-tip").count()) === 0, `${label}: Esc did not close`);
  expect(await page.evaluate(() => document.activeElement?.classList.contains("tour-link")), `${label}: focus did not return after Esc`);

  // Skip is always visible and closes.
  await link.click();
  await page.waitForSelector(".tour-tip");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  expect(await page.getByRole("button", { name: "Skip tour" }).isVisible(), `${label}: Skip is not visible on step 3`);
  await page.getByRole("button", { name: "Skip tour" }).click();
  expect((await page.locator(".tour-tip").count()) === 0, `${label}: Skip did not close`);

  // The page stayed clickable behind the dim, and nothing was stored.
  await link.click();
  await page.waitForSelector(".tour-tip");
  await page.waitForSelector(".tour-svg");
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".tour-svg")).pointerEvents === "none"), `${label}: the dim blocks the page`);
  await page.keyboard.press("Escape");
  // Closing marks the tour seen: the only thing stored, and only that tour's flag.
  const after = JSON.parse(await page.evaluate(() => JSON.stringify({ ...localStorage })));
  const { "sys101:tours": flag, ...rest } = after;
  expect(JSON.stringify(rest) === JSON.stringify(JSON.parse(before)), `${label}: the tour stored something besides its seen flag`);
  expect(JSON.parse(flag ?? "{}").seen?.[label === "home" ? "home" : "topic"] === true, `${label}: closing the tour did not mark it seen`);
  // A later visit does not show the link; Your data brings it back.
  await page.reload({ waitUntil: "networkidle" });
  expect((await page.getByRole("button", { name: "Take the 30-second tour" }).count()) === 0, `${label}: the link came back on the next visit`);
  await page.goto(BASE + "/data", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Show the tour links again" }).click();
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  expect((await page.getByRole("button", { name: "Take the 30-second tour" }).count()) === 1, `${label}: Your data did not bring the link back`);
  expect(errors.length === 0, `${label}: console errors: ${errors.join(" | ").slice(0, 200)}`);
  await ctx.close();
}

// Moving between steps glides (transform only); under reduced motion it jumps.
for (const [reduce, label] of [["no-preference", "motion"], ["reduce", "reduced motion"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduce });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Take the 30-second tour" }).click();
  await page.waitForSelector(".tour-ring");
  const ring = () => page.evaluate(() => { const r = document.querySelector(".tour-ring").getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
  const start = await ring();
  await page.locator(".tour-actions button").nth(1).click();
  await page.waitForTimeout(60);
  const early = await ring();
  await page.waitForTimeout(500);
  const end = await ring();
  expect(start.join() !== end.join(), `${label}: the outline did not move to the next target`);
  if (reduce === "no-preference") expect(early.join() !== end.join() && early.join() !== start.join(), `${label}: the outline did not glide (start ${start}, 60ms ${early}, end ${end})`);
  else expect(early.join() === end.join(), `${label}: the outline moved gradually under reduced motion (60ms ${early}, end ${end})`);
  await ctx.close();
}

// A phone: the tooltip docks to the bottom edge and the page does not scroll sideways.
for (const [label, url] of [["home", "/"], ["topic", "/topic/caching"]]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Take the 30-second tour" }).tap();
  await page.waitForSelector(".tour-tip");
  const box = await page.locator(".tour-tip").boundingBox();
  expect(Math.abs(box.y + box.height - 844) <= 1 && box.width === 390 && box.x === 0, `${label} 390: the tooltip is not docked to the bottom edge (${JSON.stringify(box)})`);
  const sizes = await page.locator(".tour-actions button").evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().height));
  expect(sizes.every((h) => h >= 44), `${label} 390: a tour button is under 44px tall (${sizes})`);
  expect(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)), `${label} 390: sideways scroll`);
  await ctx.close();
}
await browser.close();

if (problems.length) {
  console.error(`Tour check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Tour check passed.");
