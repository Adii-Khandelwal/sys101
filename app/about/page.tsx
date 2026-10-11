import type { Metadata } from "next";
import { CONTACT_EMAIL, pageMeta } from "@/lib/site";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({ path: "/about", title: "About", description: "Why sys101 exists, how the map of topics works, how to use it, and how the engineering posts on each topic are picked." });

export default function About() {
  return (
    <article className="dossier legal">
      <h1>About sys101</h1>

      <h2>Why I made it</h2>
      <p>
        I’m learning system design, and the best material I found was the engineering blogs, where the
        people who run these systems explain what broke and what they tried. But each company has its own
        blog, they assume a lot of background, and nothing tells you which post to read first or what you
        should know before it. So I built the thing I wanted: a map of topics in the order they depend on
        each other, with the good posts picked out and explained.
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
      <p>New to a topic? Every topic has a Start from zero page with official sources.</p>

      <h2>How to use it</h2>
      <p>
        Start on the map. Hollow circles are unread, a circle with a dot is ready to read, and a filled one is
        done. &ldquo;Next up&rdquo; at the top tells you where to go.
      </p>
      <p>Already know a topic&apos;s idea? Use &ldquo;Skip to the posts&rdquo; at the top of any topic page.</p>
      <p>
        Mark things done as you go. Each section and each post has its own button, the quiz counts once you
        have answered every question, and the bar on the page shows how far you are.
      </p>
      <p>
        Test yourself. Every topic has a quiz with explanations, and design exercises with model answers that
        stay hidden until you open them.
      </p>
      <p>Search finds topics, companies, and terms across every topic page.</p>
      <p>
        Your progress is yours. Export it, import it, or reset it on the <Link href="/data">Your data</Link> page.
      </p>

      <h2>How posts are picked</h2>
      <p>
        A post gets in only if it has real numbers, is honest about what went wrong, comes from the team
        that built the system, and teaches something you can reuse. Older posts are allowed when the idea
        has not changed, and they show their year. Every figure on a topic page was checked against the
        text of the post it comes from when the topic was written. The original is always linked, with
        the date I last edited that entry. Nothing updates the date automatically, and the weekly link
        check only reports links that stop working.
      </p>

      <h2>About the write-ups</h2>
      <p>
        I write these with an AI assistant. It reads each source and drafts the explanations, quizzes and
        summaries, and I have not reviewed every line. Figures are checked against the original pages with
        a script. Write-ups can contain mistakes, so when one and the original post disagree, trust the
        post.{" "}
        The posts belong to their authors and companies, and this personal project is not
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
