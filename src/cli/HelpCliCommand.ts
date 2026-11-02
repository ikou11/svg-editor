import { CliCommand } from "./CliCommand.js";
import type { CommandRegistry } from "./CommandRegistry.js";

export class HelpCliCommand extends CliCommand {
  readonly name = "help";
  readonly usage = "help";
  readonly summary = "显示全部命令与语法";

  constructor(private readonly registry: CommandRegistry) {
    super();
  }

  run(args: readonly string[]): string[] {
    this.reader(args).finish();
    const commands = this.registry.all();
    const width = Math.max(...commands.map((c) => c.usage.length));
    return ["commands:", ...commands.map((c) => `  ${c.usage.padEnd(width)}  ${c.summary}`)];
  }
}
