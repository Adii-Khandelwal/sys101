import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLearn, citations, getAllLearn, prerequisiteLabel, type Learn, type VideoSource } from "./learn";

const dir = path.resolve(__dirname, "../content/topics");
const slugs = fs.readdirSync(dir).map((f) => f.replace(/\.json$/, ""));
const dns = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../content/learn/dns.json"), "utf8")) as Learn;
const clone = () => structuredClone(dns);

describe("learn pages", () => {
  it("the DNS page passes every rule", () => {
    expect(checkLearn(dns, slugs)).toEqual([]);
    expect(getAllLearn(slugs).map((l) => l.slug)).toContain("dns");
  });

  it("reads inline citations", () => {
    expect(citations("Labels are short [[rfc1035]] and names too [[rfc1035]].")).toEqual(["rfc1035", "rfc1035"]);
  });

  it("fails an empty stage", () => {
    const l = clone();
    l.stages[0].body = [""];
    expect(checkLearn(l, slugs).join()).toMatch(/Basics\) is empty/);
  });

  it("fails a stage with no official written source", () => {
    const l = clone();
    l.stages[2].reading = [];
    expect(checkLearn(l, slugs).join()).toMatch(/no official written source/);
  });

  it("fails an unknown source id, in text or in Try it", () => {
    const l = clone();
    l.stages[0].body.push("A claim [[made-up]].");
    l.tryIt.commands[0].source = "nope";
    const problems = checkLearn(l, slugs).join();
    expect(problems).toMatch(/unknown source id "made-up"/);
    expect(problems).toMatch(/unknown source id "nope"/);
  });

  it("fails a Try it command that starts with a prompt character", () => {
    for (const prompt of ["> ", "$ "]) {
      const l = clone();
      l.tryIt.commands[0].command = `${prompt}PUBLISH a b`;
      expect(checkLearn(l, slugs).join()).toMatch(/prompt character/);
    }
  });

  it("fails a source missing publisher, kind, year or verifiedOn", () => {
    for (const f of ["publisher", "kind", "year", "verifiedOn"] as const) {
      const l = clone();
      (l.sources[0] as Record<string, unknown>)[f] = "";
      expect(checkLearn(l, slugs).join()).toMatch(new RegExp(`missing ${f}`));
    }
  });

  it("fails a video without channel, length or year", () => {
    for (const f of ["channel", "length", "year"] as const) {
      const l = clone();
      const v = l.sources.find((s) => s.kind === "video") as Record<string, unknown>;
      v[f] = "";
      expect(checkLearn(l, slugs).join()).toMatch(new RegExp(`video needs its ${f}`));
    }
  });
});

describe("rate limiting learn page", () => {
  const rl = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../content/learn/rate-limiting.json"), "utf8")) as Learn;
  const draft = () => rl.sources.find((x) => x.id === "ietf-ratelimit-draft")!;

  it("passes every rule", () => {
    expect(checkLearn(rl, slugs)).toEqual([]);
    expect(getAllLearn(slugs).map((l) => l.slug)).toContain("rate-limiting");
  });

  it("labels the IETF draft as a draft with its expiry, and fails if it does not", () => {
    expect(draft().note).toMatch(/Internet-Draft.*work in progress.*not a standard.*expires 24 November 2026/);
    const bad = structuredClone(rl);
    bad.sources.find((x) => x.id === "ietf-ratelimit-draft")!.note = "Version 11.";
    expect(checkLearn(bad, slugs).join()).toMatch(/is an Internet-Draft/);
  });

  it("mentions the sliding window only with a link to the Cloudflare post on the topic page", () => {
    const paras = [...rl.stages.flatMap((st) => st.body), rl.next];
    for (const p of paras.filter((x) => /sliding window/i.test(x))) expect(p).toContain("](/topic/rate-limiting#cloudflare-rate-limiting-2017)");
    expect(JSON.stringify(rl.stages.flatMap((st) => st.terms))).not.toMatch(/sliding window/i);
  });

  it("states no AWS numbers and tells readers the headers may change", () => {
    const text = rl.stages.flatMap((st) => st.body).join(" ");
    const aws = (text.match(/[^.]*\[\[aws-apigw-throttling\]\]/g) ?? []).join(" "); // the sentences that cite AWS
    expect(aws.length).toBeGreaterThan(0);
    expect(aws.replace(/\[\[[a-z0-9-]+\]\]|429/g, "")).not.toMatch(/\d/); // the 429 status code is not a limit value
    expect(rl.stages[3].body.join(" ")).toMatch(/may change/);
  });

  it("labels the three videos as approved", () => {
    const v = (id: string) => rl.sources.find((x) => x.id === id) as VideoSource;
    expect(rl.stages.map((st) => st.video)).toEqual(["aws-reinvent-rate-limiting-2022", undefined, "cncf-tinder-envoy-rate-limiting-2020", "cncf-spotify-envoy-rate-limiter-2025"]);
    expect([v("aws-reinvent-rate-limiting-2022").channel, v("aws-reinvent-rate-limiting-2022").year, v("aws-reinvent-rate-limiting-2022").length]).toEqual(["AWS Events", "2022", "52:27"]);
    expect([v("cncf-tinder-envoy-rate-limiting-2020").channel, v("cncf-tinder-envoy-rate-limiting-2020").year, v("cncf-tinder-envoy-rate-limiting-2020").length]).toEqual(["CNCF", "2020", "10:20"]);
    expect([v("cncf-spotify-envoy-rate-limiter-2025").channel, v("cncf-spotify-envoy-rate-limiter-2025").year, v("cncf-spotify-envoy-rate-limiter-2025").length]).toEqual(["CNCF", "2025", "27:15"]);
  });
});

describe("Before you start label", () => {
  it('says "Later, on the topic page:" only where the note says the prerequisites are not needed', () => {
    expect(prerequisiteLabel("You do not need Caching or Consistent Hashing for the stages below.")).toBe("Later, on the topic page:");
    expect(prerequisiteLabel("Read Load Balancing first: caches often sit behind the balancer.")).toBe("Read first:");
    expect(prerequisiteLabel(undefined)).toBe("Read first:");
  });

  it("matches the pages: no page both says it is not needed and says Read first", () => {
    for (const l of getAllLearn(slugs)) {
      if (/\b(do not|don't) need\b/i.test(l.before.note ?? "")) expect(prerequisiteLabel(l.before.note), l.slug).toBe("Later, on the topic page:");
    }
  });
});

describe("circuit breakers learn page", () => {
  const cb = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../content/learn/circuit-breakers.json"), "utf8")) as Learn;
  const paras = cb.stages.flatMap((st) => st.body);
  const src = (id: string) => cb.sources.find((x) => x.id === id)!;

  it("passes every rule", () => {
    expect(checkLearn(cb, slugs)).toEqual([]);
    expect(getAllLearn(slugs).map((l) => l.slug)).toContain("circuit-breakers");
  });

  it("labels every claim from the AWS article as AWS's view and records no year", () => {
    expect(src("aws-timeouts-retries").year).toBe("no year recorded");
    for (const p of paras.filter((x) => x.includes("[[aws-timeouts-retries]]"))) expect(p).toMatch(/AWS/);
    expect(src("aws-timeouts-retries").note).toMatch(/AWS's view/);
  });

  it("says Envoy's circuit breaking is not the state machine, and dates its default", () => {
    const text = cb.stages[2].body.join(" ");
    expect(text).toMatch(/circuit breaking means resource limits, not the Closed, Open, Half-Open state machine/);
    expect(text).toMatch(/1024 connections per cluster. That is what it shows on 2026-10-11 and it may change/);
    expect(cb.misconceptions.map((m) => m.truth).join(" ")).toContain("[[envoy-circuit-breaking]]");
  });

  it("says the adaptive concurrency page gives no status label", () => {
    expect(cb.stages[2].body.join(" ")).toMatch(/gives the filter no status label/);
  });

  it("labels the Google chapter as guidance and never copies it", () => {
    expect(src("google-sre-overload").kind).toMatch(/guidance, not a specification/);
    expect(src("google-sre-overload").year).toBe("2017");
  });

  it("places and labels the two approved videos", () => {
    expect(cb.stages.map((st) => st.video)).toEqual([undefined, undefined, "cncf-lyft-adaptive-circuit-breaking-2020", "aws-reinvent-netflix-load-shedding-2021"]);
    const v = (id: string) => src(id) as VideoSource;
    expect([v("cncf-lyft-adaptive-circuit-breaking-2020").channel, v("cncf-lyft-adaptive-circuit-breaking-2020").year, v("cncf-lyft-adaptive-circuit-breaking-2020").length]).toEqual(["CNCF", "2020", "34:06"]);
    expect([v("aws-reinvent-netflix-load-shedding-2021").channel, v("aws-reinvent-netflix-load-shedding-2021").year, v("aws-reinvent-netflix-load-shedding-2021").length]).toEqual(["AWS Events", "2021", "38:21"]);
    expect(v("cncf-lyft-adaptive-circuit-breaking-2020").tag).toBe("company talk, advanced");
  });

  it("links to the posts on the topic page and drops Resilience4j", () => {
    expect([...paras, cb.next].join(" ")).toContain("](/topic/circuit-breakers#zalando-circuit-breaker-herd-2026)");
    expect(JSON.stringify(cb)).not.toMatch(/resilience4j/i);
  });
});

