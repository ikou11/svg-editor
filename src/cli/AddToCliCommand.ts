import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class AddToCliCommand extends CliCommand {
  readonly name = "addto";
  readonly usage = "addto <gid> <id>";
  readonly summary = "把已有图形移入容器（作为最后一个子节点）";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const gid = r.text();
    const id = r.text();
    r.finish();
    return [this.editor.addTo(gid, id)];
  }
}
