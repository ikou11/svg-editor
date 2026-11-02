import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";
import { TreeRenderer } from "./TreeRenderer.js";

export class TreeCliCommand extends CliCommand {
  readonly name = "tree";
  readonly usage = "tree [id]";
  readonly summary = "显示结构树（默认全文档，带 id 只显示该子树）";

  constructor(
    private readonly editor: Editor,
    private readonly renderer = new TreeRenderer(),
  ) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.optionalText();
    r.finish();
    return this.renderer.render(this.editor.document(), id);
  }
}
