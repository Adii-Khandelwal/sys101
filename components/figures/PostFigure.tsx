import type { Post } from "@/lib/topics";
import { figureText, resolveInputs } from "@/lib/figures";
import type { WindowInputs } from "@/lib/slidingWindow";
import type { RaceInputs } from "@/lib/fillRace";
import type { LatchInputs } from "@/lib/commitLatch";
import { buildGeometry as windowGeometry } from "./slidingWindow/geometry";
import { buildGeometry as raceGeometry } from "./fillRace/geometry";
import { buildGeometry as latchGeometry } from "./commitLatch/geometry";
import { CommitLatchLazy, FillRaceLazy, SlidingWindowLazy } from "./FigureLazy";

/** The post's interactive figure, or nothing. Inputs come from the digest's numbers rows. */
export default function PostFigure({ post }: { post: Post }) {
  const spec = post.digest.figure;
  const inputs = spec && resolveInputs(spec, post.digest.numbers);
  if (!spec || !inputs || !post.id) return null;
  const text = figureText(spec.id, inputs, { company: post.company, year: post.published.slice(0, 4), postId: post.id });
  const uid = `fig-${post.id}`;
  if (spec.id === "sliding-window") return <SlidingWindowLazy uid={uid} geo={windowGeometry(inputs as WindowInputs)} inputs={inputs as WindowInputs} text={text} />;
  if (spec.id === "fill-race") return <FillRaceLazy uid={uid} geo={raceGeometry()} inputs={inputs as RaceInputs} text={text} />;
  return <CommitLatchLazy uid={uid} geo={latchGeometry()} inputs={inputs as LatchInputs} text={text} />;
}
