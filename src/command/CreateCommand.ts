import type { Document } from "../model/Document.js";
import type { Group } from "../model/Group.js";
import type { Shape } from "../model/Shape.js";
import type { ShapeFactory } from "../model/ShapeFactory.js";
import type { Command } from "./Command.js";

export class CreateCommand implements Command {
  private readonly shape: Shape;
  private readonly parent: Group;
  private readonly explicitParent: boolean;

  /** containerId 省略时挂在画布根。 */
  constructor(
    private readonly doc: Document,
    factory: ShapeFactory,
    type: string,
    id: string,
    args: readonly string[],
    containerId?: string,
  ) {
    doc.assertIdFree(id);
    this.explicitParent = containerId !== undefined;
    this.parent = containerId === undefined ? doc.root : doc.requireContainer(containerId);
    this.shape = factory.create(type, id, args);
  }

  execute(): string {
    this.parent.add(this.shape);
    const where = this.explicitParent ? ` in ${this.doc.labelOf(this.parent)}` : "";
    return `${this.shape.label()} created${where}`;
  }

  undo(): string {
    this.parent.remove(this.shape);
    return `${this.shape.label()} creation undone`;
  }
}
