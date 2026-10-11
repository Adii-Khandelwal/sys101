type Props = { companies: { name: string; posts: number }[] };

/** Who wrote the posts the topics are built on, counted from the content. */
export default function PostSources({ companies }: Props) {
  return (
    <section className="home-extra" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="label">
        Where the posts come from
      </h2>
      <ul className="sources-list">
        {companies.map((c) => (
          <li key={c.name}>
            {c.name} <span className="sources-count">{c.posts === 1 ? "1 post" : `${c.posts} posts`}</span>
          </li>
        ))}
      </ul>
      <p className="home-extra-note">
        Every post is linked and dated on its topic page. None of these companies is affiliated with this site.
      </p>
    </section>
  );
}
