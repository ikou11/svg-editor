import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class SetCliCommand extends CliCommand {
  readonly name = "set";
  readonly usage = "set <id> <attr> <value>";
  readonly summary = "设置属性：fill/stroke/stroke-width、各类型几何属性、text 的 text";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.text();
    const attr = r.text();
    const value = r.text();
    r.finish();
    return [this.editor.set(id, attr, value)];
  }
}
