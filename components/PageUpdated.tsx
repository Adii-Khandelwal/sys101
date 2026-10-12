import { formatDate } from "@/lib/topics";

/** The one date a page carries: when its content was last edited. Sits just above the footer. */
export default function PageUpdated({ date }: { date: string }) {
  return (
    <p className="page-updated label" data-pagefind-ignore>
      Page last updated {formatDate(date)}
    </p>
  );
}
