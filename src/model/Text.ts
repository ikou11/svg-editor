import { ArgReader } from "./ArgReader.js";
import type { ShapeMemento } from "./ShapeMemento.js";
import { LeafShape } from "./LeafShape.js";
import type { SvgAttrs } from "./SvgAttrs.js";
import { SvgError } from "./SvgError.js";

export class Text extends LeafShape {
  protected override readonly xKeys = ["x"];
  protected override readonly yKeys = ["y"];
  private content: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id, [["x", x], ["y", y]]);
    this.content = content;
  }

  /** create text <id> <x> <y> "content" */
  static create(id: string, args: readonly string[]): Text {
    const reader = new ArgReader(args, 'create text <id> <x> <y> "content"');
    const text = new Text(id, reader.number(), reader.number(), reader.text());
    reader.finish();
    return text;
  }

  static fromSvg(id: string, attrs: SvgAttrs, text: string): Text {
    return new Text(id, attrs.number("x"), attrs.number("y"), text);
  }

  override get tag(): string {
    return "text";
  }

  override textContent(): string {
    return this.content;
  }

  override geometrySummary(): string {
    return `(${this.get("x")},${this.get("y")}) "${this.content}"`;
  }

  override get(attr: string): string | null {
    return attr === "text" ? this.content : super.get(attr);
  }

  override set(attr: string, value: string | null): void {
    if (attr !== "text") {
      super.set(attr, value);
    } else if (value === null) {
      throw new SvgError("cannot clear attribute: text");
    } else {
      this.content = value;
    }
  }

  override memento(): ShapeMemento {
    const base = super.memento();
    const content = this.content;
    return {
      restore: () => {
        base.restore();
        this.content = content;
      },
    };
  }
}
