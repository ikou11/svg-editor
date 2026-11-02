import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class CanvasCliCommand extends CliCommand {
  readonly name = "canvas";
  readonly usage = "canvas [w] [h]";
  readonly summary = "无参数显示画布尺寸；带参数修改尺寸";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const width = args.length > 0 ? r.number() : undefined;
    const height = args.length > 1 ? r.number() : undefined;
    r.finish();
    return [this.editor.canvas(width, height)];
  }
}
