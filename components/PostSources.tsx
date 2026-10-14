import Link from "next/link";
import CompanyLogo from "./CompanyLogo";

type Props = { companies: { name: string; posts: number }[] };

/** Who wrote the posts the topics are built on, counted from the content. */
export default function PostSources({ companies }: Props) {
  return (
    <section className="home-extra" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="label">
        Where the sources come from
      </h2>
      <ul className="sources-list">
        {companies.map((c) => (
          <li key={c.name}>
            <CompanyLogo name={c.name} />
            <span>
              {c.name} <span className="sources-count">{c.posts} {c.posts === 1 ? "post" : "posts"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="home-extra-note">
        Every source is linked and dated on its topic page, and <Link href="/posts">all of them are listed here</Link>. None of these companies is affiliated with this site.
      </p>
    </section>
  );
}
