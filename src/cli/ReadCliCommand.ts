import type { Editor } from "../app/Editor.js";
import { CliCommand } from "./CliCommand.js";

export class ReadCliCommand extends CliCommand {
  readonly name = "read";
  readonly usage = "read <file.svg>";
  readonly summary = "读入 SVG 文件为当前文档（缺 id 自动补并警告）";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const path = r.text();
    r.finish();
    return this.editor.read(path);
  }
}
