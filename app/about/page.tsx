import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/site";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <article className="dossier legal">
      <h1>About sys101</h1>

      <h2>Why I made it</h2>
      <p>
        I wanted to learn system design properly. Every attempt ended with forty open tabs: a textbook
        definition of caching, a video on consistent hashing, and a company blog post that assumed I
        already knew what replication lag was. I could never tell what to read first, or which posts were
        worth the time.
      </p>
      <p>
        The best material was the engineering blogs, where the people who run these systems explain what
        broke, what they tried and what it cost. But they are scattered, they assume a lot, and nobody puts
        them in order. So I built the thing I wanted: a map of topics in the order they depend on each
        other, with the good posts picked out and explained.
      </p>

      <h2>How it works</h2>
      <p>
        The homepage is a map. Each topic sits to the right of what it builds on, so you start on the left
        and work across. A topic shows as ready once you have read everything it needs. Not sure where to
        begin? Start with <Link href="/topic/dns">DNS</Link> or <Link href="/topic/databases">Databases</Link>.
      </p>
      <p>
        Every topic page has two halves. First the idea: why it exists, a way to picture it, how it works
        step by step, a worked example, the usual mistakes, and a short quiz. Then the real world: posts
        from companies that run it at scale, what each one did, and why their choices differed. Design
        exercises at the end let you try it yourself.
      </p>

      <h2>How posts are picked</h2>
      <p>
        A post gets in only if it has real numbers, is honest about what went wrong, comes from the team
        that built the system, and teaches something you can reuse. Older posts are allowed when the idea
        has not changed, and they show their year. Every figure on a topic page comes from a post I
        actually read. The original is always linked, with the date I last checked it.
      </p>

      <h2>About the write-ups</h2>
      <p>
        The explanations and summaries here are my own write-ups of those posts, drafted with AI assistance
        and checked against the originals. They can still contain mistakes, so check the original when it
        matters. The posts belong to their authors and companies, and this personal project is not
        affiliated with any of them. Found an error? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Your progress</h2>
      <p>
        What you mark as done is saved in your own browser and nowhere else. There are no accounts. See{" "}
        <Link href="/data">Your data</Link> and <Link href="/privacy">Privacy</Link>.
      </p>

      <SiteFooter />
    </article>
  );
}
