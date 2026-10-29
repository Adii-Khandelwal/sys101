/** The sticky "On this page" list in the left margin from 1200px (CSS `.page-rail`). Ids must match the Overprint h2 ids. */
export default function PageRail({ sections }: { sections: string[][] }) {
  return (
    <nav className="page-rail" aria-label="On this page" data-pagefind-ignore>
      <div className="page-rail-in">
        <p className="label">On this page</p>
        <ol>
          {sections.map(([id, name]) => (
            <li key={id}>
              <a href={`#${id}`}>{name}</a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
