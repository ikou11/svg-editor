import type { Document } from "../model/Document.js";

/** 单个图形的属性明细：标题行（含父容器）、几何行、样式行。 */
export class ShowRenderer {
  render(doc: Document, id: string): string[] {
    const shape = doc.require(id);
    const parent = shape.parent === null ? "" : `  parent=${doc.labelOf(shape.parent)}`;
    const lines = [`${shape.label()}${parent}`];
    for (const detail of [shape.geometrySummary(), shape.styleSummary()]) {
      if (detail !== "") lines.push(`  ${detail}`);
    }
    return lines;
  }
}
