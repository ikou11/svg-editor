import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class FrontCliCommand extends CliCommand {
  readonly name = "front";
  readonly usage = "front <id>";
  readonly summary = "移到同级最前（绘制在最上层）";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.text();
    r.finish();
    return [this.editor.front(id)];
  }
}
