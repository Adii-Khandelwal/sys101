// Prints the parts of a topic needed to write its summary and edge reasons.
// Usage: node scripts/topic-brief.mjs <slug>
import fs from "node:fs";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/topic-brief.mjs <slug>");
  process.exit(1);
}
const file = `content/topics/${slug}.json`;
if (!fs.existsSync(file)) {
  console.error(`unknown topic "${slug}"`);
  process.exit(1);
}
const t = JSON.parse(fs.readFileSync(file, "utf8"));
const titles = Object.fromEntries(
  fs.readdirSync("content/topics").map((f) => {
    const x = JSON.parse(fs.readFileSync(`content/topics/${f}`, "utf8"));
    return [x.slug, x.title];
  }),
);
console.log(`id: ${t.slug}\ntitle: ${t.title}`);
console.log(`prerequisites: ${t.prerequisites.map((p) => `${p} (${titles[p]})`).join(", ") || "none"}`);
console.log(`\nconcept: ${t.concept}`);
console.log(`\nmental model: ${t.lesson?.mentalModel?.body ?? ""}`);
for (const p of t.posts) {
  console.log(`\npost ${p.id} (${p.company}, ${p.published.slice(0, 4)})`);
  console.log(`  takeaways: ${p.digest.takeaways}`);
  p.digest.numbers.forEach((n, i) => console.log(`  numbers[${i}]: ${n.value} | ${n.meaning}`));
}
