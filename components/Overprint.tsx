import type { ElementType } from "react";

/** A heading or line with a second-ink copy (the CSS `.overprint`). `data-text` comes from the same string, so the two cannot drift. */
export default function Overprint({ as: Tag = "h2", className, children, ...rest }: { as?: ElementType; className?: string; children: string } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag {...rest} className={`${className ? className + " " : ""}overprint`} data-text={children}>
      {children}
    </Tag>
  );
}
