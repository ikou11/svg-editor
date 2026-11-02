import type { Group } from "../model/Group.js";
import type { ShapeFactory } from "../model/ShapeFactory.js";
import { SvgAttrs } from "../model/SvgAttrs.js";
import { SvgError } from "../model/SvgError.js";
import type { XmlNode } from "./XmlNode.js";

/** 一次读入过程的状态：已用 id、各标签的自动编号、警告列表。 */
export class SvgReadSession {
  readonly warnings: string[] = [];
  private readonly used = new Set<string>();
  private readonly counters = new Map<string, number>();

  constructor(
    private readonly factory: ShapeFactory,
    private readonly explicitIds: ReadonlySet<string>,
  ) {}

  fill(parent: Group, node: XmlNode): void {
    for (const child of node.children) {
      if (!this.factory.supportsSvgTag(child.tag)) {
        this.warnings.push(`warning: skipped unsupported <${child.tag}>`);
        continue;
      }
      const shape = this.factory.fromSvg(child.tag, this.idFor(child), new SvgAttrs(child.attrs), child.text);
      if (child.attrs.has("transform")) {
        this.warnings.push(`warning: ignored transform on <${child.tag}> ${shape.id}`);
      }
      parent.add(shape);
      const container = shape.asContainer();
      if (container !== null) this.fill(container, child);
    }
  }

  private idFor(node: XmlNode): string {
    const explicit = node.attrs.get("id");
    if (explicit !== undefined && explicit !== "") {
      if (this.used.has(explicit)) throw new SvgError(`id already exists: ${explicit}`);
      this.used.add(explicit);
      return explicit;
    }
    let n = this.counters.get(node.tag) ?? 0;
    let id: string;
    do {
      id = `${node.tag}${++n}`;
    } while (this.explicitIds.has(id) || this.used.has(id));
    this.counters.set(node.tag, n);
    this.used.add(id);
    this.warnings.push(`warning: assigned id ${id} to unnamed <${node.tag}>`);
    return id;
  }
}
