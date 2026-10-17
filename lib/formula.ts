// A tiny arithmetic evaluator for the capstone sizing calculator. No eval and no Function: a tokenizer and a
// recursive-descent parser over + - * / ( ), numbers, input ids and ceil, floor, round, min, max.
// shortcut: no exponent or modulo operator, add one here if a capstone needs it.

type Token = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

const FUNCTIONS: Record<string, (...a: number[]) => number> = {
  ceil: (x) => Math.ceil(x),
  floor: (x) => Math.floor(x),
  round: (x) => Math.round(x),
  min: Math.min,
  max: Math.max,
};
const ARITY: Record<string, number> = { ceil: 1, floor: 1, round: 1 };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  const re = /\s*(?:(\d+(?:\.\d+)?)|([a-z_][a-z0-9_]*)|([-+*/(),]))/gy;
  let end = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    end = re.lastIndex;
    if (m[1] !== undefined) out.push({ t: "num", v: Number(m[1]) });
    else if (m[2] !== undefined) out.push({ t: "id", v: m[2] });
    else out.push({ t: "op", v: m[3] });
  }
  if (src.slice(end).trim()) throw new Error(`unexpected "${src.slice(end).trim()[0]}" in formula "${src}"`);
  return out;
}

/** Parse and evaluate `src` with `vars`. Throws on bad syntax, an unknown id or function, or a wrong argument count. */
export function evaluate(src: string, vars: Record<string, number>): number {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i];
  const isOp = (v: string) => peek()?.t === "op" && peek().v === v;
  const want = (v: string) => {
    if (!isOp(v)) throw new Error(`expected "${v}" in formula "${src}"`);
    i++;
  };

  function expr(): number {
    let x = term();
    while (isOp("+") || isOp("-")) x = toks[i++].v === "+" ? x + term() : x - term();
    return x;
  }
  function term(): number {
    let x = unary();
    while (isOp("*") || isOp("/")) {
      const op = toks[i++].v;
      const y = unary();
      if (op === "/" && y === 0) throw new Error(`division by zero in formula "${src}"`);
      x = op === "*" ? x * y : x / y;
    }
    return x;
  }
  function unary(): number {
    if (isOp("-")) {
      i++;
      return -unary();
    }
    return atom();
  }
  function atom(): number {
    const tok = toks[i++];
    if (!tok) throw new Error(`formula "${src}" ends too soon`);
    if (tok.t === "num") return tok.v;
    if (tok.t === "op" && tok.v === "(") {
      const x = expr();
      want(")");
      return x;
    }
    if (tok.t === "id") {
      if (isOp("(")) {
        const fn = Object.hasOwn(FUNCTIONS, tok.v) ? FUNCTIONS[tok.v] : undefined;
        if (!fn) throw new Error(`unknown function "${tok.v}" in formula "${src}"`);
        i++;
        const args = [expr()];
        while (isOp(",")) {
          i++;
          args.push(expr());
        }
        want(")");
        if (ARITY[tok.v] && args.length !== ARITY[tok.v]) throw new Error(`${tok.v} takes ${ARITY[tok.v]} argument in formula "${src}"`);
        return fn(...args);
      }
      if (!Object.hasOwn(vars, tok.v)) throw new Error(`unknown input "${tok.v}" in formula "${src}"`);
      return vars[tok.v];
    }
    throw new Error(`unexpected "${tok.v}" in formula "${src}"`);
  }

  const result = expr();
  if (i < toks.length) throw new Error(`unexpected "${toks[i].v}" in formula "${src}"`);
  return result;
}

/** A number for display: grouped thousands, up to two decimals once it is small. Fixed locale so server and browser agree. */
export function formatValue(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const digits = Math.abs(n) >= 100 ? 0 : 2;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
