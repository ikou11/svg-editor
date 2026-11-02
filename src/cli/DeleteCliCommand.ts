import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class DeleteCliCommand extends CliCommand {
  readonly name = "delete";
  readonly usage = "delete <id>";
  readonly summary = "删除图形（容器连同全部子孙）";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.text();
    r.finish();
    return [this.editor.delete(id)];
  }
}
