import { LOGO_FILES } from "@/lib/logoFiles";
import { organization } from "@/lib/organization";

/**
 * A company's mark beside its name, from a local file (public/logos, see scripts/make-logos.mjs). It sits in a fixed slot and is
 * fitted with object-fit: contain, so every mark keeps its own proportions and the text next to it never moves. A logo with a dark-page
 * version renders both and CSS shows the one for the theme. A company without a mark gets an empty slot, so names still line up (`bare`: nothing at all, for a list where most names have none).
 * Never recoloured: these are the owners' marks, shown only to identify a source.
 */
const EVEN_AREA = 420;
const EVEN_MAX_W = 36;
const EVEN_MAX_H = 24;

export default function CompanyLogo({ name, size, bare, even }: { name: string; size?: "sm"; bare?: boolean; even?: boolean }) {
  const sm = size === "sm" ? " company-logo-sm" : "";
  const logo = LOGO_FILES[organization(name)];
  if (!logo) return bare ? null :  <span className={`company-logo company-logo-none${sm}`} aria-hidden="true" />;
  const alt = `${name} logo`;
  // `even`: every mark gets the same drawn area (EVEN_AREA px squared), so a wide wordmark and a square icon weigh the same; width and height are capped so neither runs wild.
  const ratio = logo.w / logo.h;
  const fit = even ? { width: Math.min(Math.sqrt(EVEN_AREA * ratio), EVEN_MAX_W), height: Math.min(Math.sqrt(EVEN_AREA / ratio), EVEN_MAX_H) } : undefined;
  // A plain img: an SVG is not optimised by next/image, and these are small local files.
  /* eslint-disable @next/next/no-img-element */
  return (
    <span className={`company-logo${sm}${even ? " company-logo-even" : ""}`}>
      <img className={logo.dark ? "company-logo-img company-logo-light" : "company-logo-img"} src={logo.src} alt={alt} width={logo.w} height={logo.h} style={fit} loading="lazy" decoding="async" />
      {logo.dark && <img className="company-logo-img company-logo-dark" src={logo.dark} alt={alt} width={logo.w} height={logo.h} style={fit} loading="lazy" decoding="async" />}
    </span>
  );
}
