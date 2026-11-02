import { ArgReader } from "./ArgReader.js";
import { LeafShape } from "./LeafShape.js";
import type { SvgAttrs } from "./SvgAttrs.js";

export class Line extends LeafShape {
  protected override readonly xKeys = ["x1", "x2"];
  protected override readonly yKeys = ["y1", "y2"];

  /** line 的颜色属性是 stroke，而不是 fill。 */
  constructor(id: string, x1: number, y1: number, x2: number, y2: number, stroke?: string) {
    super(id, [["x1", x1], ["y1", y1], ["x2", x2], ["y2", y2]]);
    if (stroke !== undefined) this.paint.set("stroke", stroke);
  }

  /** create line <id> <x1> <y1> <x2> <y2> [stroke] */
  static create(id: string, args: readonly string[]): Line {
    const reader = new ArgReader(args, "create line <id> <x1> <y1> <x2> <y2> [stroke]");
    const line = new Line(id, reader.number(), reader.number(), reader.number(), reader.number(), reader.optionalText());
    reader.finish();
    return line;
  }

  static fromSvg(id: string, attrs: SvgAttrs): Line {
    return new Line(id, attrs.number("x1"), attrs.number("y1"), attrs.number("x2"), attrs.number("y2"));
  }

  override get tag(): string {
    return "line";
  }

  override geometrySummary(): string {
    return `(${this.get("x1")},${this.get("y1")}) -> (${this.get("x2")},${this.get("y2")})`;
  }

  /** 示例 transcript 中 line 的 tree 行不显示 stroke。 */
  override describe(): string {
    return this.geometrySummary();
  }
}
