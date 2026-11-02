import { SvgError } from "../model/SvgError.js";
import { XmlNode } from "./XmlNode.js";

/**
 * 只覆盖 SVG 所需子集的 XML 解析器：元素、属性、文本、注释、CDATA、
 * 声明 / DOCTYPE（跳过）以及常见字符实体。命名空间前缀原样保留。
 */
export class XmlParser {
  private pos = 0;

  private constructor(private readonly src: string) {}

  static parse(src: string): XmlNode {
    return new XmlParser(src).parseDocument();
  }

  private parseDocument(): XmlNode {
    let root: XmlNode | null = null;
    const stack: XmlNode[] = [];
    while (this.pos < this.src.length) {
      if (this.src[this.pos] !== "<") {
        const text = this.readUntil("<");
        const top = stack[stack.length - 1];
        if (top !== undefined) top.appendText(XmlParser.decode(text));
        else if (text.trim() !== "") this.fail("text outside root element");
      } else if (this.startsWith("<!--")) {
        this.skipPast("-->");
      } else if (this.startsWith("<![CDATA[")) {
        this.pos += 9;
        const end = this.src.indexOf("]]>", this.pos);
        if (end < 0) this.fail("unterminated CDATA");
        stack[stack.length - 1]?.appendText(this.src.slice(this.pos, end));
        this.pos = end + 3;
      } else if (this.startsWith("<?")) {
        this.skipPast("?>");
      } else if (this.startsWith("<!")) {
        this.skipPast(">");
      } else if (this.startsWith("</")) {
        this.pos += 2;
        const name = this.readName();
        this.skipSpaces();
        this.expect(">");
        const open = stack.pop();
        if (open === undefined || open.tag !== name) this.fail(`unexpected closing tag </${name}>`);
      } else {
        const node = this.parseOpenTag();
        const parent = stack[stack.length - 1];
        if (parent !== undefined) parent.children.push(node);
        else if (root === null) root = node;
        else this.fail("multiple root elements");
        if (!this.selfClosed) stack.push(node);
      }
    }
    if (stack.length > 0) this.fail(`unclosed tag <${stack[stack.length - 1]!.tag}>`);
    if (root === null) this.fail("no root element");
    return root;
  }

  private selfClosed = false;

  private parseOpenTag(): XmlNode {
    this.pos++; // '<'
    const node = new XmlNode(this.readName());
    for (;;) {
      this.skipSpaces();
      const ch = this.src[this.pos];
      if (ch === undefined) this.fail(`unterminated tag <${node.tag}>`);
      if (ch === ">") {
        this.pos++;
        this.selfClosed = false;
        return node;
      }
      if (ch === "/") {
        this.pos++;
        this.expect(">");
        this.selfClosed = true;
        return node;
      }
      const name = this.readName();
      this.skipSpaces();
      this.expect("=");
      this.skipSpaces();
      node.attrs.set(name, XmlParser.decode(this.readQuoted()));
    }
  }

  private readQuoted(): string {
    const quote = this.src[this.pos];
    if (quote !== '"' && quote !== "'") this.fail("expected quoted attribute value");
    const end = this.src.indexOf(quote, this.pos + 1);
    if (end < 0) this.fail("unterminated attribute value");
    const value = this.src.slice(this.pos + 1, end);
    this.pos = end + 1;
    return value;
  }

  private readName(): string {
    const m = /^[^\s=/>"'<]+/.exec(this.src.slice(this.pos));
    if (m === null) this.fail("expected a name");
    this.pos += m[0].length;
    return m[0];
  }

  private readUntil(stop: string): string {
    const end = this.src.indexOf(stop, this.pos);
    const stopAt = end < 0 ? this.src.length : end;
    const text = this.src.slice(this.pos, stopAt);
    this.pos = stopAt;
    return text;
  }

  private skipPast(terminator: string): void {
    const end = this.src.indexOf(terminator, this.pos);
    if (end < 0) this.fail(`unterminated section, expected ${terminator}`);
    this.pos = end + terminator.length;
  }

  private skipSpaces(): void {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos]!)) this.pos++;
  }

  private startsWith(s: string): boolean {
    return this.src.startsWith(s, this.pos);
  }

  private expect(ch: string): void {
    if (this.src[this.pos] !== ch) this.fail(`expected '${ch}'`);
    this.pos++;
  }

  private fail(message: string): never {
    throw new SvgError(`invalid svg: ${message}`);
  }

  private static decode(text: string): string {
    return text.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_m, ent: string) => {
      if (ent === "amp") return "&";
      if (ent === "lt") return "<";
      if (ent === "gt") return ">";
      if (ent === "quot") return '"';
      if (ent === "apos") return "'";
      const code = ent[1] === "x" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return String.fromCodePoint(code);
    });
  }
}
