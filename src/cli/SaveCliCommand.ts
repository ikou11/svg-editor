import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class SaveCliCommand extends CliCommand {
  readonly name = "save";
  readonly usage = "save [file.svg]";
  readonly summary = "保存当前文档；无参数时保存到读入时的路径";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const path = r.optionalText();
    r.finish();
    return [this.editor.save(path)];
  }
}
