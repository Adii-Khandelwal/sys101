import type { Metadata } from "next";
import { AI_ASSISTANCE, CONTACT_EMAIL, PAGE_DATES, pageMeta } from "@/lib/site";
import Link from "next/link";
import Overprint from "@/components/Overprint";
import PageRail from "@/components/PageRail";
import PageUpdated from "@/components/PageUpdated";
import SiteFooter from "@/components/SiteFooter";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

export const metadata: Metadata = pageMeta({ path: "/about", title: "About", description: "Why sys101 exists, how the map of topics works, how to use it, and how the engineering posts on each topic are picked." });

const SECTIONS = [
  ["why-i-made-it", "Why I made it"],
  ["how-it-works", "How the map works"],
  ["how-to-use-it", "How to use it"],
  ["how-posts-are-picked", "How posts are picked"],
  ["about-the-write-ups", "How the write-ups are made"],
  ["whats-new", "What’s new"],
  ["your-progress", "Your progress"],
  ["questions", "Common questions"],
];

const FAQ = [
  ["What is sys101?", "A map of system design topics in the order they depend on each other, with the engineering posts from companies that run these systems picked out and explained."],
  ["Is it free?", "Yes. There are no accounts and nothing to buy."],
  ["Where is my progress kept?", "In your own browser and nowhere else. You can export, import or reset it on the Your data page."],
  ["Does it work offline?", "After one visit online, the whole site works offline. Only links to other sites need a connection."],
  ["Where do the posts come from?", "From the engineering teams that built and ran the system. Each one needs real numbers and an honest account of what went wrong, and the original is always linked."],
];

export default function About() {
  return (
    <article className="dossier legal rail-page" data-pagefind-body>
      <PageRail sections={SECTIONS} />
      <Overprint as="h1" className="page-h1" data-pagefind-meta="title">
        About sys101
      </Overprint>

      <Overprint as="h2" id="why-i-made-it">Why I made it</Overprint>
      <p>
        I’m learning system design, and the best material I found was the engineering blogs, where the
        people who run these systems explain what broke and what they tried. But each company has its own
        blog, they assume a lot of background, and nothing tells you which post to read first or what you
        should know before it. So I built the thing I wanted: a map of topics in the order they depend on
        each other, with the good posts picked out and explained.
      </p>

      <Overprint as="h2" id="how-it-works">How the map works</Overprint>
      <p>
        On a wide screen the homepage is a map; on a phone it is a list in the same order. On the map,
        each topic sits to the right of what it builds on, so you start on the left and work across. A
        topic shows as Ready once you have read everything it needs. Not sure where to
        begin? Start with <Link href="/topic/dns">DNS</Link> or <Link href="/topic/databases">Databases</Link>.
      </p>
      <p>
        Every topic page has two halves. First the idea: why it exists, a way to picture it, how it works
        step by step, a worked example, the usual mistakes, and a short quiz. Then the real world: posts
        from companies that run it at scale, what each one did, and why their choices differed. Design
        exercises at the end let you try it yourself.
      </p>
      <p>New to a topic? Every topic has a Start from zero page with official sources.</p>

      <Overprint as="h2" id="how-to-use-it">How to use it</Overprint>
      <p>
        Start on the map. A hollow ring is Unread, a thicker ring with a dot is Ready, an orange ring with a
        dot is In progress, and a filled orange circle is Read. &ldquo;Next up&rdquo; at the top tells you
        where to go.
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

      <Overprint as="h2" id="how-posts-are-picked">How posts are picked</Overprint>
      <p>
        A post gets in only if it has real numbers, is honest about what went wrong, comes from the team
        that built the system, and teaches something you can reuse. Older posts are allowed when the idea
        has not changed, and they show their year. Every company figure on a topic page comes from
        the post it is shown with. The original is always linked, with
        the date I last edited that entry. Nothing updates the date automatically, and the weekly link
        check only reports links that stop working.
      </p>

      <Overprint as="h2" id="about-the-write-ups">How the write-ups are made</Overprint>
      <p>
        {AI_ASSISTANCE} The figures are compared against the original pages with a script I run by hand,
        and a person may not have reviewed each one. The posts belong to their authors and companies, and
        this personal project is not affiliated with any of them. Company marks beside their names come from svgl and Simple Icons, belong to their owners, are never altered, and are shown only to say whose post it is. Found an error? Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <Overprint as="h2" id="whats-new">What’s new</Overprint>
      <p>
        Some topics end with a short &quot;What&apos;s new&quot; list: a few recent pages from approved
        official or engineering sites. An automated routine finds them and checks each against the page it
        links to. The write-ups there are short and the page they link to is the source. They do not count
        toward your progress.
      </p>

      <Overprint as="h2" id="your-progress">Your progress</Overprint>
      <p>
        What you mark as done, your theme and Map or Path choice, and whether you have taken the guided
        tour are saved in your own browser and nowhere else. There are no accounts. See{" "}
        <Link href="/data">Your data</Link> and <Link href="/privacy">Privacy</Link>.
      </p>

      <Overprint as="h2" id="questions">Common questions</Overprint>
      <div className="faq">
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>

      <PageUpdated date={PAGE_DATES.about} />
      <SiteFooter />
    </article>
  );
}
