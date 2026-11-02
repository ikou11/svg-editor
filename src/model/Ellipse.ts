import { ArgReader } from "./ArgReader.js";
import { LeafShape } from "./LeafShape.js";
import type { SvgAttrs } from "./SvgAttrs.js";

export class Ellipse extends LeafShape {
  protected override readonly xKeys = ["cx"];
  protected override readonly yKeys = ["cy"];

  constructor(id: string, cx: number, cy: number, rx: number, ry: number, fill?: string) {
    super(id, [["cx", cx], ["cy", cy], ["rx", rx], ["ry", ry]], fill);
  }

  /** create ellipse <id> <cx> <cy> <rx> <ry> [fill] */
  static create(id: string, args: readonly string[]): Ellipse {
    const reader = new ArgReader(args, "create ellipse <id> <cx> <cy> <rx> <ry> [fill]");
    const ellipse = new Ellipse(id, reader.number(), reader.number(), reader.number(), reader.number(), reader.optionalText());
    reader.finish();
    return ellipse;
  }

  static fromSvg(id: string, attrs: SvgAttrs): Ellipse {
    return new Ellipse(id, attrs.number("cx"), attrs.number("cy"), attrs.number("rx"), attrs.number("ry"));
  }

  override get tag(): string {
    return "ellipse";
  }

  override geometrySummary(): string {
    return `cx=${this.get("cx")} cy=${this.get("cy")} rx=${this.get("rx")} ry=${this.get("ry")}`;
  }
}
