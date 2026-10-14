import { LOGO_FILES } from "@/lib/logoFiles";
import { organization } from "@/lib/organization";

/**
 * A company's mark beside its name, from a local file (public/logos, see scripts/make-logos.mjs). It sits in a fixed slot and is
 * fitted with object-fit: contain, so every mark keeps its own proportions and the text next to it never moves. A logo with a dark-page
 * version renders both and CSS shows the one for the theme. A company without a mark gets an empty slot, so names still line up.
 * Never recoloured: these are the owners' marks, shown only to identify a source.
 */
export default function CompanyLogo({ name }: { name: string }) {
  const logo = LOGO_FILES[organization(name)];
  if (!logo) return <span className="company-logo company-logo-none" aria-hidden="true" />;
  const alt = `${name} logo`;
  // A plain img: an SVG is not optimised by next/image, and these are small local files.
  /* eslint-disable @next/next/no-img-element */
  return (
    <span className="company-logo">
      <img className={logo.dark ? "company-logo-img company-logo-light" : "company-logo-img"} src={logo.src} alt={alt} width={logo.w} height={logo.h} loading="lazy" decoding="async" />
      {logo.dark && <img className="company-logo-img company-logo-dark" src={logo.dark} alt={alt} width={logo.w} height={logo.h} loading="lazy" decoding="async" />}
    </span>
  );
}
