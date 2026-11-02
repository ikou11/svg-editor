import { ArgReader } from "./ArgReader.js";
import { LeafShape } from "./LeafShape.js";

export class Rect extends LeafShape {
  protected override readonly xKeys = ["x"];
  protected override readonly yKeys = ["y"];

  constructor(id: string, x: number, y: number, width: number, height: number, fill?: string) {
    super(id, [["x", x], ["y", y], ["width", width], ["height", height]], fill);
  }

  /** create rect <id> <x> <y> <w> <h> [fill] */
  static create(id: string, args: readonly string[]): Rect {
    const reader = new ArgReader(args, "create rect <id> <x> <y> <w> <h> [fill]");
    const rect = new Rect(id, reader.number(), reader.number(), reader.number(), reader.number(), reader.optionalText());
    reader.finish();
    return rect;
  }

  override get tag(): string {
    return "rect";
  }

  override geometrySummary(): string {
    return `x=${this.get("x")} y=${this.get("y")} w=${this.get("width")} h=${this.get("height")}`;
  }
}
