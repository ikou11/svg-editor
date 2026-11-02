import type { Document } from "../model/Document.js";
import type { Group } from "../model/Group.js";
import type { Shape } from "../model/Shape.js";
import type { Command } from "./Command.js";

/** 删除图形（容器连同子孙一起摘走）；撤销时放回原父容器的原位置。 */
export class DeleteCommand implements Command {
  private readonly shape: Shape;
  private readonly parent: Group;
  private index = -1;

  constructor(
    private readonly doc: Document,
    id: string,
  ) {
    this.shape = doc.require(id);
    this.parent = this.shape.parent!;
  }

  execute(): string {
    this.index = this.parent.remove(this.shape);
    return `${this.shape.label()} deleted`;
  }

  undo(): string {
    this.parent.add(this.shape, this.index);
    return `${this.shape.label()} restored into ${this.doc.labelOf(this.parent)}`;
  }
}
