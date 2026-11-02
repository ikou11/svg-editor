import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class MoveCliCommand extends CliCommand {
  readonly name = "move";
  readonly usage = "move <id> <dx> <dy>";
  readonly summary = "平移（增量）；作用于容器时整体平移";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.text();
    const dx = r.number();
    const dy = r.number();
    r.finish();
    return [this.editor.move(id, dx, dy)];
  }
}
