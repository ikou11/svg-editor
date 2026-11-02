import { SvgError } from "../model/SvgError.js";
import type { Command } from "./Command.js";

/** undo / redo 两个栈；新的编辑会清空 redo 栈。 */
export class History {
  private readonly undoStack: Command[] = [];
  private redoStack: Command[] = [];

  run(command: Command): string {
    const message = command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    return message;
  }

  undo(): string {
    const command = this.undoStack.pop();
    if (command === undefined) throw new SvgError("nothing to undo");
    const message = command.undo();
    this.redoStack.push(command);
    return message;
  }

  redo(): string {
    const command = this.redoStack.pop();
    if (command === undefined) throw new SvgError("nothing to redo");
    const message = command.execute();
    this.undoStack.push(command);
    return message;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack = [];
  }
}
