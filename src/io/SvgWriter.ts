import type { Document } from "../model/Document.js";
import { NumberFormat } from "../model/NumberFormat.js";
import type { Shape } from "../model/Shape.js";

/** 文档 → SVG 文本。只通过 Shape 的自描述接口取数据，不判断具体图形类型。 */
export class SvgWriter {
  write(doc: Document): string {
    const w = NumberFormat.format(doc.width);
    const h = NumberFormat.format(doc.height);
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    ];
    for (const child of doc.root.children) this.writeShape(child, 1, lines);
    lines.push("</svg>", "");
    return lines.join("\n");
  }

  private writeShape(shape: Shape, depth: number, out: string[]): void {
    const indent = "  ".repeat(depth);
    const attrs = [["id", shape.id] as const, ...shape.svgAttributes()]
      .map(([k, v]) => ` ${k}="${SvgWriter.escape(v)}"`)
      .join("");
    const container = shape.asContainer();
    const text = shape.textContent();
    if (container !== null && container.children.length > 0) {
      out.push(`${indent}<${shape.tag}${attrs}>`);
      for (const child of container.children) this.writeShape(child, depth + 1, out);
      out.push(`${indent}</${shape.tag}>`);
    } else if (text !== null) {
      out.push(`${indent}<${shape.tag}${attrs}>${SvgWriter.escape(text)}</${shape.tag}>`);
    } else {
      out.push(`${indent}<${shape.tag}${attrs}/>`);
    }
  }

  private static escape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}
