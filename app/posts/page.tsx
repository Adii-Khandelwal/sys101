import type { Metadata } from "next";
import Link from "next/link";
import Overprint from "@/components/Overprint";
import JsonLd from "@/components/JsonLd";
import PageUpdated from "@/components/PageUpdated";
import PostsIndex from "@/components/PostsIndex";
import SiteFooter from "@/components/SiteFooter";
import { topicOrder } from "@/lib/order";
import { buildPostsIndex } from "@/lib/posts";
import { absoluteUrl, pageMeta, postsDescription, postsUpdated } from "@/lib/site";
import { getAllTopics } from "@/lib/topics";

// Prerendered at build time; using anything dynamic here fails the build.
export const dynamic = "error";

const data = buildPostsIndex(topicOrder(getAllTopics()));

export const metadata: Metadata = pageMeta({ path: "/posts", title: "Blogs", description: postsDescription(data) });

export default function Posts() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blogs",
    url: absoluteUrl("/posts"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: data.total,
      itemListElement: data.byCompany
        .flatMap((c) => c.posts)
        .map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: absoluteUrl(`/topic/${p.topics[0].slug}#${p.topics[0].postId}`) })),
    },
  };
  return (
    <article className="dossier posts-page">
      <div data-pagefind-body>
        <Overprint as="h1" className="page-h1" data-pagefind-meta="title">
          Blogs
        </Overprint>
        <p className="posts-lead">
          Every engineering blog post the topics are built on, plus a few papers and docs. Each row opens the topic section that explains the post, with the original linked beside it. For posts that fit no single topic, see <Link href="/reads">Great reads</Link>.
        </p>
      </div>
      <PostsIndex data={data} />
      <JsonLd data={ld} />
      <PageUpdated date={postsUpdated(getAllTopics())} />
      <SiteFooter />
    </article>
  );
}
