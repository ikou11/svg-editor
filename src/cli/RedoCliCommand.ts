import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class RedoCliCommand extends CliCommand {
  readonly name = "redo";
  readonly usage = "redo";
  readonly summary = "重做；undo 后若有新编辑，redo 栈清空";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    this.reader(args).finish();
    return [this.editor.redo()];
  }
}
