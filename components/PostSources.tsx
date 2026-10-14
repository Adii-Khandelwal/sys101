import Link from "next/link";
import CompanyLogo from "./CompanyLogo";
import { slugify } from "@/lib/posts";

type Props = { companies: { name: string; label: string }[] };

/** Who wrote the posts the topics are built on, counted from the content. */
export default function PostSources({ companies }: Props) {
  return (
    <section className="home-extra" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="label">
        Who wrote the sources
      </h2>
      <ul className="sources-list">
        {companies.map((c) => (
          <li key={c.name}>
            {/* /posts opens its By company view when the address names a company. */}
            <Link href={`/posts#${slugify(c.name)}`}>
              <CompanyLogo name={c.name} even />
              <span>{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="home-extra-note">
        Every source is linked and dated on its topic page, and <Link href="/posts">all of them are listed here</Link>, with <Link href="/reads">great reads</Link> kept apart. None of these companies is affiliated with this site.
      </p>
    </section>
  );
}
