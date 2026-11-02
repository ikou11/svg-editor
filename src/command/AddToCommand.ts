import type { Document } from "../model/Document.js";
import type { Group } from "../model/Group.js";
import type { Shape } from "../model/Shape.js";
import { SvgError } from "../model/SvgError.js";
import type { Command } from "./Command.js";

/** 把已有图形移入容器，作为最后一个子节点；撤销时回到原父容器的原位置。 */
export class AddToCommand implements Command {
  private readonly container: Group;
  private readonly shape: Shape;
  private readonly oldParent: Group;
  private oldIndex = -1;

  constructor(
    private readonly doc: Document,
    gid: string,
    id: string,
  ) {
    this.container = doc.requireContainer(gid);
    this.shape = doc.require(id);
    if (this.shape === this.container || this.container.isInside(this.shape)) {
      throw new SvgError(`cannot group a container into its own descendant: ${id}`);
    }
    this.oldParent = this.shape.parent!;
  }

  execute(): string {
    this.oldIndex = this.oldParent.remove(this.shape);
    this.container.add(this.shape);
    return `${this.shape.label()} moved into ${this.doc.labelOf(this.container)}`;
  }

  undo(): string {
    this.container.remove(this.shape);
    this.oldParent.add(this.shape, this.oldIndex);
    return `${this.shape.label()} moved back to ${this.doc.labelOf(this.oldParent)}`;
  }
}
