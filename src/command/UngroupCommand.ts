import type { Document } from "../model/Document.js";
import type { Group } from "../model/Group.js";
import type { Shape } from "../model/Shape.js";
import { SvgError } from "../model/SvgError.js";
import type { Command } from "./Command.js";

/** 解散容器：子图形提升到容器原父级，占据容器原来的位置。 */
export class UngroupCommand implements Command {
  private readonly container: Group;
  private readonly parent: Group;
  private children: Shape[] = [];
  private index = -1;

  constructor(
    private readonly doc: Document,
    gid: string,
  ) {
    const shape = doc.require(gid);
    const container = shape.asContainer();
    if (container === null) throw new SvgError(`not a container: ${gid}`);
    if (container.parent === doc.root) throw new SvgError(`cannot ungroup top-level container: ${gid}`);
    this.container = container;
    this.parent = container.parent!;
  }

  execute(): string {
    this.children = [...this.container.children];
    this.index = this.parent.remove(this.container);
    for (const child of this.children) this.container.remove(child);
    this.children.forEach((child, i) => this.parent.add(child, this.index + i));
    return `${this.container.label()} ungrouped (${this.children.length} children moved to ${this.doc.labelOf(this.parent)})`;
  }

  undo(): string {
    for (const child of this.children) this.parent.remove(child);
    for (const child of this.children) this.container.add(child);
    this.parent.add(this.container, this.index);
    return `${this.container.label()} restored`;
  }
}
