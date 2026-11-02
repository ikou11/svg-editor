import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class BackCliCommand extends CliCommand {
  readonly name = "back";
  readonly usage = "back <id>";
  readonly summary = "移到同级最后（绘制在最底层）";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.text();
    r.finish();
    return [this.editor.back(id)];
  }
}
