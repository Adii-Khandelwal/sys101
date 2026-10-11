import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <article className="dossier legal">
      <h1>About sys101</h1>

      <h2>Why I made it</h2>
      <p>
        I wanted to learn system design properly. Every time I tried, I ended up with forty open tabs:
        a textbook definition of caching, a video on consistent hashing, a blog post from some company
        that assumed I already knew what replication lag was. I could never tell what to read first, or
        which of those posts were worth the time.
      </p>
      <p>
        The best material I found was the engineering blogs, where people who run these systems explain
        what broke, what they tried and what it cost. But they are scattered, they assume a lot, and
        nobody puts them in order. So I built the thing I wanted: a map of the topics, in the order they
        depend on each other, with the good posts already picked out and explained.
      </p>

      <h2>How it works</h2>
      <p>
        The homepage is a map. Each topic sits to the right of what it builds on, so you can start on the
        left and work your way across. A topic shows as ready once you have read everything it needs.
      </p>
      <p>
        Every topic page has two halves. First the idea itself: why it exists, a way to picture it, how it
        works step by step, a worked example and the usual mistakes, with a short quiz to check yourself.
        Then the real world: two posts from companies that run it at scale, what each one did, and why
        they made different choices. A few design exercises at the end let you try it yourself.
      </p>

      <h2>How posts are picked</h2>
      <p>
        A post gets in only if it has real numbers, is honest about what went wrong, comes from the team
        that built the system, and teaches something you can reuse. Older posts are allowed when the idea
        has not changed, and they are marked with their year. Every figure on a topic page comes from a
        post that was actually read, and the original is always linked.
      </p>

      <h2>Your progress</h2>
      <p>
        What you mark as done is saved in your own browser and nowhere else. There are no accounts. See{" "}
        <Link href="/data">Your data</Link> and <Link href="/privacy">Privacy</Link>.
      </p>

      <p>
        <Link href="/">Back to the map</Link>
      </p>

      <SiteFooter />
    </article>
  );
}
