import { Document } from "../model/Document.js";
import { NumberFormat } from "../model/NumberFormat.js";
import { ShapeMutationCommand } from "./ShapeMutationCommand.js";

export class MoveCommand extends ShapeMutationCommand {
  constructor(
    doc: Document,
    id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super(doc.require(id));
  }

  protected override mutate(): void {
    this.shape.move(this.dx, this.dy);
  }

  protected override doneMessage(): string {
    return this.report("moved", this.dx, this.dy);
  }

  protected override undoneMessage(): string {
    return this.report("moved back", -this.dx, -this.dy);
  }

  /** 叶子报告新位置，容器（无单一位置）报告位移量。 */
  private report(verb: string, dx: number, dy: number): string {
    const anchor = this.shape.anchor();
    const label = this.shape.label();
    if (anchor === null) return `${label} ${verb} by (${NumberFormat.format(dx)},${NumberFormat.format(dy)})`;
    return `${label} ${verb} to (${NumberFormat.format(anchor[0])},${NumberFormat.format(anchor[1])})`;
  }
}
