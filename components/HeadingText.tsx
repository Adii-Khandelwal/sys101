// Keeps a hyphenated word such as "B-trees" on one line: a plain hyphen is a place the browser may break.
export default function HeadingText({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <span key={i}>
      {i > 0 && " "}
      {word.includes("-") ? <span style={{ whiteSpace: "nowrap" }}>{word}</span> : word}
    </span>
  ));
}
