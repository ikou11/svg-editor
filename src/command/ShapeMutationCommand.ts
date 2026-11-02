import type { Shape } from "../model/Shape.js";
import type { ShapeMemento } from "../model/ShapeMemento.js";
import type { Command } from "./Command.js";

/**
 * 修改图形属性（不改变树结构）的命令模板：执行前拍快照，撤销时整体还原。
 * 用快照而不是"反向运算"，避免缩放等操作的浮点误差。
 */
export abstract class ShapeMutationCommand implements Command {
  private before: ShapeMemento | null = null;

  protected constructor(protected readonly shape: Shape) {}

  execute(): string {
    this.before = this.shape.memento();
    this.mutate();
    return this.doneMessage();
  }

  undo(): string {
    this.before?.restore();
    return this.undoneMessage();
  }

  protected abstract mutate(): void;
  protected abstract doneMessage(): string;
  protected abstract undoneMessage(): string;
}
