import { Document } from "../model/Document.js";
import type { ShapeFactory } from "../model/ShapeFactory.js";
import { SvgAttrs } from "../model/SvgAttrs.js";
import { SvgError } from "../model/SvgError.js";
import type { XmlNode } from "./XmlNode.js";
import { SvgReadSession } from "./SvgReadSession.js";
import { XmlParser } from "./XmlParser.js";

export interface SvgReadResult {
  readonly document: Document;
  /** 形如 "warning: assigned id rect1 to unnamed <rect>"，由调用方负责输出。 */
  readonly warnings: readonly string[];
}

/** SVG 文本 → 文档。图形通过 ShapeFactory 构造，读入时缺 id 的元素自动补 id 并给出警告。 */
export class SvgReader {
  constructor(private readonly factory: ShapeFactory) {}

  read(source: string): SvgReadResult {
    const root = XmlParser.parse(source);
    if (root.tag !== "svg") throw new SvgError("invalid svg: root element is not <svg>");
    const [width, height] = SvgReader.canvasSize(root);
    const document = new Document(width, height);
    const run = new SvgReadSession(this.factory, SvgReader.collectIds(root));
    run.fill(document.root, root);
    return { document, warnings: run.warnings };
  }

  private static canvasSize(root: XmlNode): [number, number] {
    const attrs = new SvgAttrs(root.attrs);
    const box = (root.attrs.get("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
    const fromBox = box.length === 4 && box.every(Number.isFinite);
    const width = root.attrs.has("width") ? attrs.number("width") : fromBox ? box[2]! : 800;
    const height = root.attrs.has("height") ? attrs.number("height") : fromBox ? box[3]! : 600;
    return [width, height];
  }

  private static collectIds(node: XmlNode, ids = new Set<string>()): Set<string> {
    const id = node.attrs.get("id");
    if (id !== undefined && id !== "") ids.add(id);
    for (const child of node.children) SvgReader.collectIds(child, ids);
    return ids;
  }
}
