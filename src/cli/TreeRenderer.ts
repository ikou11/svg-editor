import type { Document } from "../model/Document.js";
import { NumberFormat } from "../model/NumberFormat.js";
import type { Shape } from "../model/Shape.js";

interface Entry {
  readonly prefix: string;
  readonly label: string;
  readonly attrs: string;
}

/**
 * 结构树文本。图形标签后内联关键属性，并让全树的属性列对齐
 * （列位置 = 最宽的"前缀 + 标签" + 2 个空格）。
 */
export class TreeRenderer {
  render(doc: Document, id?: string): string[] {
    const entries: Entry[] = [];
    if (id === undefined) {
      entries.push({ prefix: "", label: `svg (${NumberFormat.format(doc.width)}x${NumberFormat.format(doc.height)})`, attrs: "" });
      this.collect(doc.root.children, "", entries);
    } else {
      const shape = doc.require(id);
      entries.push({ prefix: "", label: shape.label(), attrs: shape.describe() });
      const container = shape.asContainer();
      if (container !== null) this.collect(container.children, "", entries);
    }
    const column = Math.max(0, ...entries.filter((e) => e.attrs !== "").map((e) => e.prefix.length + e.label.length)) + 2;
    return entries.map((e) =>
      e.attrs === "" ? e.prefix + e.label : (e.prefix + e.label).padEnd(column) + e.attrs,
    );
  }

  private collect(children: readonly Shape[], indent: string, out: Entry[]): void {
    children.forEach((child, i) => {
      const last = i === children.length - 1;
      out.push({ prefix: indent + (last ? "└── " : "├── "), label: child.label(), attrs: child.describe() });
      const container = child.asContainer();
      if (container !== null) this.collect(container.children, indent + (last ? "    " : "│   "), out);
    });
  }
}
