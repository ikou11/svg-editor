import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class InitCliCommand extends CliCommand {
  readonly name = "init";
  readonly usage = "init [w] [h]";
  readonly summary = "新建空画布（默认 800x600）";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const width = args.length > 0 ? r.number() : undefined;
    const height = args.length > 1 ? r.number() : undefined;
    r.finish();
    return [this.editor.init(width, height)];
  }
}
