import { Document } from "../model/Document.js";
import { NumberFormat } from "../model/NumberFormat.js";
import { SvgError } from "../model/SvgError.js";
import { ShapeMutationCommand } from "./ShapeMutationCommand.js";

export class ScaleCommand extends ShapeMutationCommand {
  constructor(
    doc: Document,
    id: string,
    private readonly factor: number,
  ) {
    super(doc.require(id));
    if (!(factor > 0)) throw new SvgError("scale factor must be positive");
  }

  protected override mutate(): void {
    this.shape.scale(this.factor);
  }

  protected override doneMessage(): string {
    return `${this.shape.label()} scaled by ${NumberFormat.format(this.factor)}`;
  }

  protected override undoneMessage(): string {
    return `${this.shape.label()} scale restored`;
  }
}
