import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class UndoCliCommand extends CliCommand {
  readonly name = "undo";
  readonly usage = "undo";
  readonly summary = "撤销上一次编辑命令";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    this.reader(args).finish();
    return [this.editor.undo()];
  }
}
