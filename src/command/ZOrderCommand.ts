import type { Document } from "../model/Document.js";
import type { Group } from "../model/Group.js";
import type { Shape } from "../model/Shape.js";
import type { Command } from "./Command.js";

/** 调整同级 z-order：front 移到最后（绘制在最上），back 移到最前。 */
export class ZOrderCommand implements Command {
  private readonly shape: Shape;
  private readonly parent: Group;
  private oldIndex = -1;

  private constructor(
    doc: Document,
    id: string,
    private readonly toFront: boolean,
  ) {
    this.shape = doc.require(id);
    this.parent = this.shape.parent!;
  }

  static front(doc: Document, id: string): ZOrderCommand {
    return new ZOrderCommand(doc, id, true);
  }

  static back(doc: Document, id: string): ZOrderCommand {
    return new ZOrderCommand(doc, id, false);
  }

  execute(): string {
    this.oldIndex = this.parent.remove(this.shape);
    this.parent.add(this.shape, this.toFront ? this.parent.children.length : 0);
    return `${this.shape.label()} moved to ${this.toFront ? "front" : "back"}`;
  }

  undo(): string {
    this.parent.remove(this.shape);
    this.parent.add(this.shape, this.oldIndex);
    return `${this.shape.label()} z-order restored`;
  }
}
