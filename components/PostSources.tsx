import Link from "next/link";
import Overprint from "./Overprint";
import CompanyLogo from "./CompanyLogo";
import { slugify } from "@/lib/posts";

type Props = { companies: { name: string; label: string }[] };

/** Who wrote the posts the topics are built on, counted from the content. */
export default function PostSources({ companies }: Props) {
  return (
    <section className="home-extra" aria-labelledby="sources-heading">
      <Overprint id="sources-heading" className="label">Companies we learn from</Overprint>
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
        <Link href="/posts">Browse all posts</Link>, or start with the <Link href="/reads">great reads</Link>. None of these companies is connected to sys101.
      </p>
    </section>
  );
}
