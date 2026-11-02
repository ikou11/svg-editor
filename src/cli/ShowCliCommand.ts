import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";
import { ShowRenderer } from "./ShowRenderer.js";

export class ShowCliCommand extends CliCommand {
  readonly name = "show";
  readonly usage = "show <id>";
  readonly summary = "显示单个图形的属性明细";

  constructor(
    private readonly editor: Editor,
    private readonly renderer = new ShowRenderer(),
  ) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.text();
    r.finish();
    return this.renderer.render(this.editor.document(), id);
  }
}
