/** SVG <title> shows as a hover tooltip over the whole drawing. Render it as <desc> instead: aria-labelledby still names the image. */
export function diagramHtml(svg: string): string {
  return svg.replace(/<title(\s|>)/g, "<desc$1").replace(/<\/title>/g, "</desc>");
}
