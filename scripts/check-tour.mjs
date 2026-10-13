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
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 }).catch(() => {});
  expect((await page.locator(".tour-tip").count()) === 0, `${label}: Done did not close the tour`);
  expect(await page.evaluate(() => document.activeElement?.classList.contains("tour-link")), `${label}: focus did not return to the entry link after Done`);

  // Esc closes from the middle and returns focus.
  await link.click();
  await page.waitForSelector(".tour-tip");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 }).catch(() => {});
  expect((await page.locator(".tour-tip").count()) === 0, `${label}: Esc did not close`);
  expect(await page.evaluate(() => document.activeElement?.classList.contains("tour-link")), `${label}: focus did not return after Esc`);

  // Skip is always visible and closes.
  await link.click();
  await page.waitForSelector(".tour-tip");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  expect(await page.getByRole("button", { name: "Skip tour" }).isVisible(), `${label}: Skip is not visible on step 3`);
  await page.getByRole("button", { name: "Skip tour" }).click();
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 }).catch(() => {});
  expect((await page.locator(".tour-tip").count()) === 0, `${label}: Skip did not close`);

  // The page stayed clickable behind the dim, and nothing was stored.
  await link.click();
  await page.waitForSelector(".tour-tip");
  await page.waitForSelector(".tour-svg");
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".tour-svg")).pointerEvents === "none"), `${label}: the dim blocks the page`);
  await page.keyboard.press("Escape");
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 }).catch(() => {});
  // Done and Skip (above) marked the tour seen: the only thing stored, and only that tour's flag.
  const after = JSON.parse(await page.evaluate(() => JSON.stringify({ ...localStorage })));
  const { "sys101:tours": flag, ...rest } = after;
  expect(JSON.stringify(rest) === JSON.stringify(JSON.parse(before)), `${label}: the tour stored something besides its seen flag`);
  expect(JSON.parse(flag ?? "{}").seen?.[label === "home" ? "home" : "topic"] === true, `${label}: finishing or skipping the tour did not mark it seen`);
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

// The link stays until the reader presses Skip tour or finishes: Esc, or leaving the page, does not remove it.
for (const [how, removes] of [["Escape", false], ["Skip", true], ["Done", true]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const open = async () => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    const link = page.getByRole("button", { name: "Take the 30-second tour" });
    if ((await link.count()) === 0) return false;
    await link.click();
    await page.waitForSelector(".tour-tip");
    return true;
  };
  expect(await open(), `${how}: no link on a first visit`);
  if (how === "Escape") await page.keyboard.press("Escape");
  else if (how === "Skip") await page.getByRole("button", { name: "Skip tour" }).click();
  else for (let i = 0; i < 5; i++) await page.locator(".tour-actions button").nth(1).click();
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 }).catch(() => {});
  await page.reload({ waitUntil: "networkidle" });
  const there = (await page.getByRole("button", { name: "Take the 30-second tour" }).count()) === 1;
  expect(there === !removes, `${how}: the link ${there ? "stayed" : "went"} on the next visit, expected it to ${removes ? "go" : "stay"}`);
  await ctx.close();
}

// The Path list gets Path wording on a desktop too, and switching view while a tour is open ends it cleanly.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("sys101:homeView", "path"));
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Take the 30-second tour" }).click();
  await page.waitForSelector(".tour-tip");
  const text = async () => (await page.locator(".tour-title").textContent()) + " | " + (await page.locator(".tour-text").textContent());
  expect(/The path/.test(await text()) && !/\bmap\b/i.test(await text()), `path view: step 1 talks about a map (${await text()})`);
  await page.locator(".tour-actions button").nth(1).click();
  await page.locator(".tour-actions button").nth(1).click();
  expect(/You are on Path/.test(await text()), `path view: the Map or Path step does not say you are on Path (${await text()})`);
  await page.getByRole("button", { name: "Map", exact: true }).last().click();
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 }).catch(() => {});
  expect((await page.locator(".tour-tip").count()) === 0, "path view: the tour stayed open after switching to the map");
  await ctx.close();
}

// The footer offers the tour on the pages that have one, even after the top link is gone, and nowhere else.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const footer = () => page.locator(".site-footer").getByRole("button", { name: "Take the tour" });
  await page.goto(BASE + "/about", { waitUntil: "networkidle" });
  expect((await footer().count()) === 0, "footer: the tour link shows on a page with no tour");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("sys101:tours", JSON.stringify({ version: 1, seen: { home: true, topic: true } })));
  await page.reload({ waitUntil: "networkidle" });
  expect((await page.getByRole("button", { name: "Take the 30-second tour" }).count()) === 0, "footer: the top link is still shown after the tour was taken");
  expect((await footer().count()) === 1, "footer: no tour link on the homepage once the top link is hidden");
  await footer().focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector(".tour-tip");
  await page.keyboard.press("Escape");
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 });
  expect(await page.evaluate(() => document.activeElement?.classList.contains("tour-footer-link")), "footer: focus did not return to the footer link");
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

// Opening and closing fade (opacity) and the page eases back to where it was; under reduced motion all of it is instant.
for (const [reduce, label] of [["no-preference", "motion"], ["reduce", "reduced motion"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduce });
  const page = await ctx.newPage();
  await page.goto(BASE + "/topic/caching", { waitUntil: "networkidle" });
  // Record the tooltip's opacity and the scroll position every frame.
  await page.evaluate(() => {
    window.__frames = [];
    const tick = () => {
      const t = document.querySelector(".tour-tip");
      window.__frames.push([t ? Number(getComputedStyle(t).opacity) : null, Math.round(scrollY)]);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.getByRole("button", { name: "Take the 30-second tour" }).click();
  const y0 = await page.evaluate(() => Math.round(scrollY)); // where the reader is when the tour begins: its first scroll comes after the chunk loads
  await page.waitForSelector(".tour-tip");
  await page.waitForTimeout(700);
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight"); // to the last step, far down the page
  await page.waitForTimeout(400);
  const down = await page.evaluate(() => scrollY);
  expect(down > y0 + 500, `${label}: the tour did not scroll down the page`);
  const escAt = await page.evaluate(() => window.__frames.length);
  await page.keyboard.press("Escape");
  await page.waitForSelector(".tour-tip", { state: "detached", timeout: 3000 });
  await page.waitForTimeout(300);
  const frames = await page.evaluate(() => window.__frames);
  const shownFrames = frames.filter((f) => f[0] !== null);
  const peak = shownFrames.findIndex((f) => f[0] === 1);
  const fadedIn = shownFrames.slice(0, peak).some((f) => f[0] > 0 && f[0] < 1);
  const fadedOut = frames.slice(escAt).some((f) => f[0] !== null && f[0] > 0 && f[0] < 1);
  const eased = frames.slice(escAt).some((f) => f[1] < down && f[1] > y0);
  if (reduce === "no-preference") {
    expect(fadedIn, `${label}: the tooltip did not fade in`);
    expect(fadedOut, `${label}: the tooltip did not fade out`);
    expect(eased, `${label}: the page did not ease back to where it was`);
  } else {
    expect(!fadedIn && !fadedOut, `${label}: the tooltip faded under reduced motion`);
    expect(!eased, `${label}: the page eased back under reduced motion`);
  }
  expect((await page.evaluate(() => scrollY)) === y0, `${label}: the tour did not end at the starting scroll position (${await page.evaluate(() => scrollY)} instead of ${y0})`);
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
