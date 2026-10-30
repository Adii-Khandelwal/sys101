import type { Post } from "@/lib/topics";
import { figureText, resolveInputs } from "@/lib/figures";
import type { WindowInputs } from "@/lib/slidingWindow";
import type { RaceInputs } from "@/lib/fillRace";
import type { LatchInputs } from "@/lib/commitLatch";
import { buildGeometry as windowGeometry } from "./slidingWindow/geometry";
import { buildGeometry as raceGeometry } from "./fillRace/geometry";
import { buildGeometry as latchGeometry } from "./commitLatch/geometry";
import type { XidInputs } from "@/lib/xidDial";
import type { RingInputs } from "@/lib/hashRing";
import type { JitterInputs } from "@/lib/retryJitter";
import { buildGeometry as xidGeometry } from "./xidDial/geometry";
import { buildGeometry as ringGeometry } from "./hashRing/geometry";
import { buildGeometry as jitterGeometry } from "./retryJitter/geometry";
import type { FilterInputs } from "@/lib/filterBits";
import type { BreakerInputs } from "@/lib/breakerGate";
import type { BucketInputs } from "@/lib/tokenBucket";
import { buildGeometry as filterGeometry } from "./filterBits/geometry";
import { buildGeometry as breakerGeometry } from "./breakerGate/geometry";
import { buildGeometry as bucketGeometry } from "./tokenBucket/geometry";
import { BreakerGateLazy, CommitLatchLazy, FillRaceLazy, FilterBitsLazy, HashRingLazy, RetryJitterLazy, SlidingWindowLazy, TokenBucketLazy, XidDialLazy } from "./FigureLazy";

/** The post's interactive figure, or nothing. Inputs come from the digest's numbers rows. */
export default function PostFigure({ post }: { post: Post }) {
  const spec = post.digest.figure;
  const inputs = spec && resolveInputs(spec, post.digest.numbers);
  if (!spec || !inputs || !post.id) return null;
  const text = figureText(spec.id, inputs, { company: post.company, year: post.published.slice(0, 4), postId: post.id });
  const uid = `fig-${post.id}`;
  if (spec.id === "sliding-window") return <SlidingWindowLazy uid={uid} geo={windowGeometry(inputs as WindowInputs)} inputs={inputs as WindowInputs} text={text} />;
  if (spec.id === "fill-race") return <FillRaceLazy uid={uid} geo={raceGeometry()} inputs={inputs as RaceInputs} text={text} />;
  if (spec.id === "xid-dial") return <XidDialLazy uid={uid} geo={xidGeometry()} inputs={inputs as XidInputs} text={text} />;
  if (spec.id === "hash-ring") return <HashRingLazy uid={uid} geo={ringGeometry()} inputs={inputs as RingInputs} text={text} />;
  if (spec.id === "retry-jitter") return <RetryJitterLazy uid={uid} geo={jitterGeometry(inputs as JitterInputs)} inputs={inputs as JitterInputs} text={text} />;
  if (spec.id === "filter-bits") return <FilterBitsLazy uid={uid} geo={filterGeometry()} inputs={inputs as FilterInputs} text={text} />;
  if (spec.id === "breaker-gate") return <BreakerGateLazy uid={uid} geo={breakerGeometry(inputs as BreakerInputs)} inputs={inputs as BreakerInputs} text={text} />;
  if (spec.id === "token-bucket") return <TokenBucketLazy uid={uid} geo={bucketGeometry()} inputs={inputs as BucketInputs} text={text} />;
  return <CommitLatchLazy uid={uid} geo={latchGeometry()} inputs={inputs as LatchInputs} text={text} />;
}
