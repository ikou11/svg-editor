import type { Editor } from "../app/Editor.js";
import { SvgError } from "../model/SvgError.js";
import { CliCommand } from "./CliCommand.js";

export class CreateCliCommand extends CliCommand {
  readonly name = "create";
  readonly usage = "create <type> <id> [params...] [in <containerId>]";
  readonly summary = "创建图形（rect/circle/ellipse/line/text/g），in 子句指定父容器";

  constructor(private readonly editor: Editor) {
    super();
  }

  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const type = r.text();
    const id = r.text();
    let params = r.rest();
    let container: string | undefined;
    if (params.length >= 2 && params[params.length - 2] === "in") {
      container = params[params.length - 1];
      params = params.slice(0, -2);
    }
    if (container === "") throw new SvgError(`usage: ${this.usage}`);
    return [this.editor.create(type, id, params, container)];
  }
}
