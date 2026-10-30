// Model and wording of the circuit breaker gate (Zalando 2026, Thundering herd of circuit breakers). Pure.
// The post gives the cycle: an open breaker blocks roughly 95% of requests, the service shrinks to its minimum of
// three pods, a handful of fast probes pass in the half-open phase, the breaker closes, the withheld traffic hits
// three pods at about 10x each, requests queue for over 100 ms against 3 ms of processing, and the breaker re-opens
// after a burst of about three seconds. Lanes, the four probes and which requests are lit are the figure's own example.
import type { FigureSource } from "./figures";

/** blocked: percent of requests the open breaker blocked. rps: requests per second per pod. clientMs: client span of the probes. serviceMs: service processing time. factor: traffic per pod once the breaker closed (times normal). */
export type BreakerInputs = { blocked: number; rps: number; clientMs: number; serviceMs: number; factor: number };

export const LANES = 3; // the post's minimum of three pods, one lane each
export const PROBES = 4; // the post says "a handful"; four is drawn for the example
/** The other two spans of the same row ("15 ms, 10 ms and 2 ms"): reverse proxy and service during the probes. */
export const PROXY_MS = 10;
export const PROBE_SERVICE_MS = 2;

/** The drawing holds `factor` requests per lane (the 10x), at most 10, and needs room for the probes. */
export const breakerValid = (i: BreakerInputs) => i.blocked > 0 && i.blocked < 100 && i.rps > 0 && i.clientMs > 0 && i.serviceMs > 0 && i.factor > PROBES && i.factor <= 10;

export const BREAKER_STEPS = 6;
export const breakerLast = BREAKER_STEPS - 1;

export type Gate = "closed" | "half-open" | "open";
/** wait: held back before the gate. flow: passing through at normal load. pod: at the service, in its queue. */
export type Zone = "wait" | "flow" | "pod";
export type Req = { lane: number; j: number; zone: Zone; visible: boolean; lit: boolean };

export type BreakerState = {
  step: number;
  gate: Gate;
  reqs: Req[];
  headline: string;
  readout: string;
};

export function breakerState(i: BreakerInputs, step: number): BreakerState {
  const at = Math.min(Math.max(Math.round(step), 0), breakerLast);
  const gate: Gate = at === 2 ? "half-open" : at === 1 || at === 5 ? "open" : "closed";
  const reqs: Req[] = [];
  for (let lane = 0; lane < LANES; lane++)
    for (let j = 0; j < i.factor; j++) {
      const probe = lane === LANES - 1 && j >= 1 && j <= PROBES;
      let r: Req = { lane, j, zone: "wait", visible: true, lit: false };
      if (at === 0) r = j === 0 ? { ...r, zone: "flow" } : { ...r, visible: false };
      else if (at === 1) r = j === 0 ? { ...r, zone: "pod", lit: true } : r;
      else if (at === 2) r = probe ? { ...r, zone: "pod" } : j === 0 ? { ...r, zone: "pod", visible: false } : r;
      else r = { ...r, zone: "pod", lit: at === 5 || (at === 4 && j > 0) };
      reqs.push(r);
    }
  const headline = [
    `The breaker is closed, so calls flow through to the service at about ${i.rps} requests per second per pod.`,
    `Timeouts pile up and the breaker opens. In the incident it stayed open for hours, blocking roughly ${i.blocked}% of requests, while the service looked healthy. With so little traffic the autoscaler shrinks the service to its minimum of ${LANES} pods.`,
    `After a pause the breaker goes half-open and lets a handful of probes through. They are fast: ${i.clientMs} ms at the client, ${PROXY_MS} ms at the reverse proxy, ${PROBE_SERVICE_MS} ms in the service, so they meet the success criteria.`,
    `The breaker closes and all the withheld traffic heads for the service at once.`,
    `Service processing stays at ${i.serviceMs} ms, but requests queue for over 100 ms. Each of the ${LANES} pods now takes about ${i.factor}x the traffic, so nearly all requests time out.`,
    `The timeouts open the breaker again. One close, avalanche and re-open burst lasted about three seconds, and with the service still at ${LANES} pods the cycle repeats.`,
  ][at];
  const load = ["normal", "none", "a handful of probes", `${i.factor}x`, `${i.factor}x`, `${i.factor}x, queued`][at];
  const readout = `breaker ${gate}; pods ${LANES}; load per pod ${load}`;
  return { step: at, gate, reqs, headline, readout };
}

export function breakerText(i: BreakerInputs, src: FigureSource) {
  return {
    title: "Circuit breaker gate",
    description: `A road with three lanes runs from a client tower on the left, through a gate, to three pods on the right. Cubes are requests. The gate has two bars. Both down means the breaker is open and no request passes. Both up means it is closed and requests flow. With only the bar over the near lane raised the breaker is half-open and a few probes pass. Three lamps beside the gate show which of the three states the breaker is in. In the last steps ${i.factor} requests per lane crowd in front of each pod and the timed-out ones turn lit, which drops the gate again.`,
    legend: [
      `Gate with two bars: both down is open (calls rejected), both up is closed (calls flow). Near-lane bar up only is half-open (probes). The lit lamp shows the state.`,
      `Cubes: requests. A dashed cube is held back before the gate. A lit cube timed out.`,
      `Three blocks on the right: the pods. Each lane leads to one pod. The service sits at its minimum of ${LANES} pods throughout.`,
    ],
    caption: `Figure from ${src.company} ${src.year} (${src.postId}). The cycle follows the post's trace analysis: the open breaker blocking roughly ${i.blocked}% of requests, the fast half-open probes, the close, requests queueing for over 100 ms against ${i.serviceMs} ms of processing at ${LANES} pods, about ${i.factor}x the traffic per pod, and a burst of about three seconds. The lanes, the ${PROBES} probes (the post says a handful), the ${i.factor} cubes per lane (one cube is normal load) and which cubes are lit are drawn for the example, not figures from the post. The post gives no breaker thresholds or timeout values.`,
  };
}
