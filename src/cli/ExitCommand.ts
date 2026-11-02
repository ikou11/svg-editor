import { CliCommand } from "./CliCommand.js";
import type { ReplSession } from "./ReplSession.js";

export class ExitCommand extends CliCommand {
  readonly name = "exit";
  readonly usage = "exit";
  readonly summary = "退出编辑器（也可用 Ctrl-D）";

  constructor(private readonly session: ReplSession) {
    super();
  }

  run(args: readonly string[]): string[] {
    this.reader(args).finish();
    this.session.stop();
    return [];
  }
}
