import { SvgError } from "../model/SvgError.js";
import type { CommandRegistry } from "./CommandRegistry.js";
import { LineTokenizer } from "./LineTokenizer.js";

/** 一行输入 → 若干输出行；不做任何 I/O，错误统一加 "error: " 前缀。 */
export class CommandInterpreter {
  constructor(private readonly registry: CommandRegistry) {}

  execute(line: string): string[] {
    try {
      const [name, ...args] = LineTokenizer.tokenize(line);
      if (name === undefined) return [];
      const command = this.registry.find(name);
      if (command === undefined) throw new SvgError(`unknown command: ${name}`);
      return command.run(args);
    } catch (e) {
      if (e instanceof SvgError) return [`error: ${e.message}`];
      return [`error: internal error: ${e instanceof Error ? e.message : String(e)}`];
    }
  }
}
