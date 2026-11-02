import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class UngroupCliCommand extends CliCommand {
  readonly name = "ungroup";
  readonly usage = "ungroup <gid>";
  readonly summary = "解散容器，子图形提升到原容器的位置";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const gid = r.text();
    r.finish();
    return [this.editor.ungroup(gid)];
  }
}
