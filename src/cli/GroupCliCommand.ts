import type { Editor } from "../app/Editor.js";
import { SvgError } from "../model/SvgError.js";
import { CliCommand } from "./CliCommand.js";

export class GroupCliCommand extends CliCommand {
  readonly name = "group";
  readonly usage = "group <newGid> <id1> <id2>...";
  readonly summary = "新建容器并收入若干图形（保持相对顺序）";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const gid = r.text();
    const ids = r.rest();
    if (ids.length === 0) throw new SvgError(`usage: ${this.usage}`);
    return [this.editor.group(gid, ids)];
  }
}
