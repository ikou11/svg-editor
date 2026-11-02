import { Document } from "../model/Document.js";
import { ShapeMutationCommand } from "./ShapeMutationCommand.js";

export class SetCommand extends ShapeMutationCommand {
  private readonly oldValue: string | null;

  constructor(
    doc: Document,
    id: string,
    private readonly attr: string,
    private readonly value: string,
  ) {
    super(doc.require(id));
    this.oldValue = this.shape.get(attr);
  }

  protected override mutate(): void {
    this.shape.set(this.attr, this.value);
  }

  protected override doneMessage(): string {
    return `${this.shape.label()} updated: ${this.attr}=${this.show(this.value)}`;
  }

  protected override undoneMessage(): string {
    if (this.oldValue === null) return `${this.shape.label()} ${this.attr} reset`;
    return `${this.shape.label()} updated: ${this.attr}=${this.show(this.oldValue)}`;
  }

  /** 文本内容带引号显示，与示例 transcript 一致。 */
  private show(value: string): string {
    return this.attr === "text" ? `"${value}"` : value;
  }
}
