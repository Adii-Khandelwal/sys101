import Link from "next/link";
import Overprint from "./Overprint";
import CompanyLogo from "./CompanyLogo";
import { slugify } from "@/lib/posts";
import { NOT_COMPANIES } from "@/lib/organization";

type Props = { companies: { name: string; label: string }[] };

/** Who wrote the posts the topics are built on, counted from the content. */
export default function PostSources({ companies }: Props) {
  const notCompanies = companies.filter((c) => NOT_COMPANIES.includes(c.name)).map((c) => c.label);
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
        <Link href="/posts">Browse every source</Link>, or start with the <Link href="/reads">great reads</Link>. {notCompanies.length > 0 && `${notCompanies.join(" and ")} is an open-source project, not a company. `}None of these is affiliated with this site.
      </p>
    </section>
  );
}
