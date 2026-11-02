import { SvgError } from "../model/SvgError.js";

/** 把一行输入切成参数：空白分隔，双引号包裹的部分保留空格；以 # 开头的整行是注释。 */
export class LineTokenizer {
  static tokenize(line: string): string[] {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return [];
    const tokens: string[] = [];
    let current = "";
    let started = false;
    let quoted = false;
    for (const ch of trimmed) {
      if (ch === '"') {
        quoted = !quoted;
        started = true;
      } else if (!quoted && /\s/.test(ch)) {
        if (started) tokens.push(current);
        current = "";
        started = false;
      } else {
        current += ch;
        started = true;
      }
    }
    if (quoted) throw new SvgError("unterminated quote");
    if (started) tokens.push(current);
    return tokens;
  }
}
