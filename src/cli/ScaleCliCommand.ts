import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class ScaleCliCommand extends CliCommand {
  readonly name = "scale";
  readonly usage = "scale <id> <factor>";
  readonly summary = "等比缩放（位置与尺寸同乘 factor）；容器递归到全部子孙";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const id = r.text();
    const factor = r.number();
    r.finish();
    return [this.editor.scale(id, factor)];
  }
}
