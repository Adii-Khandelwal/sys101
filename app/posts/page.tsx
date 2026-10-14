import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = pageMeta({ path: "/posts", title: "Posts", description: postsDescription(data) });

export default function Posts() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Posts",
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
        <h1 data-pagefind-meta="title">Posts</h1>
        <p className="posts-lead">
          Every engineering post the topics are built on. Each row opens the section of our topic page that explains it; the original is linked beside it. <Link href="/reads">Great reads</Link> are kept apart.
        </p>
      </div>
      <PostsIndex data={data} />
      <JsonLd data={ld} />
      <PageUpdated date={postsUpdated(getAllTopics())} />
      <SiteFooter />
    </article>
  );
}
