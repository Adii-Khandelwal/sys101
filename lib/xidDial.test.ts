import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { XID_LAST, xidState, xidText, xidValid, type XidInputs } from "./xidDial";

const topic = JSON.parse(readFileSync("content/topics/transactions-and-mvcc.json", "utf8"));
const post = topic.posts.find((p: { id: string }) => p.id === "sentry-xid-2015");
const first = (row: number) => Number(post.digest.numbers[row].value.match(/\d[\d,]*(?:\.\d+)?/)[0].replace(/,/g, ""));
const i: XidInputs = { limit: first(post.digest.figure.rows.limit), margin: first(post.digest.figure.rows.margin) };

describe("xid-dial model", () => {
  it("reads the post's rows", () => {
    expect(i).toEqual({ limit: 2, margin: 1 });
    expect(xidValid(i)).toBe(true);
    expect(xidValid({ limit: 0, margin: 1 })).toBe(false);
  });
  it("closes the gate only at the halt step and refuses writes there", () => {
    const gates = Array.from({ length: XID_LAST + 1 }, (_, s) => xidState(i, s).gate);
    expect(gates).toEqual(["open", "open", "open", "closed", "open"]);
    expect(xidState(i, 3)).toMatchObject({ writes: false, pos: "halt" });
    expect(xidState(i, 4)).toMatchObject({ writes: true, pos: "halt" });
    expect(xidState(i, 3).headline).toContain("Fewer than 1 million");
    expect(xidState(i, 2).headline).toContain("2 billion");
  });
  it("clamps the step and uses no em dash", () => {
    expect(xidState(i, 99).event).toBe("recover");
    expect(xidState(i, -1).event).toBe("start");
    const t = xidText(i, { company: "Sentry", year: "2015", postId: "sentry-xid-2015" });
    expect(JSON.stringify(t)).not.toContain("—");
  });
});
