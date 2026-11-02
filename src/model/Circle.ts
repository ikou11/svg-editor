import { ArgReader } from "./ArgReader.js";
import { LeafShape } from "./LeafShape.js";

export class Circle extends LeafShape {
  protected override readonly xKeys = ["cx"];
  protected override readonly yKeys = ["cy"];

  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id, [["cx", cx], ["cy", cy], ["r", r]], fill);
  }

  /** create circle <id> <cx> <cy> <r> [fill] */
  static create(id: string, args: readonly string[]): Circle {
    const reader = new ArgReader(args, "create circle <id> <cx> <cy> <r> [fill]");
    const circle = new Circle(id, reader.number(), reader.number(), reader.number(), reader.optionalText());
    reader.finish();
    return circle;
  }

  override get tag(): string {
    return "circle";
  }

  override geometrySummary(): string {
    return `cx=${this.get("cx")} cy=${this.get("cy")} r=${this.get("r")}`;
  }
}
