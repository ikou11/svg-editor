import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { CommandInterpreter } from "./CommandInterpreter.js";
import type { ReplSession } from "./ReplSession.js";

/** 唯一接触终端的类：逐行读入、交给解释器、打印结果。 */
export class Repl {
  static readonly PROMPT = "svg> ";
  static readonly BANNER = "svg-editor 0.1 — type 'help' for commands";

  constructor(
    private readonly interpreter: CommandInterpreter,
    private readonly session: ReplSession,
  ) {}

  /** 读到输入结束或 exit 时返回。 */
  run(input: Readable, output: Writable): Promise<void> {
    return new Promise((resolve) => {
      const rl = createInterface({ input, output, prompt: Repl.PROMPT, terminal: false });
      output.write(`${Repl.BANNER}\n\n`);
      rl.prompt();
      rl.on("line", (line) => {
        for (const text of this.interpreter.execute(line)) output.write(`${text}\n`);
        if (!this.session.running) rl.close();
        else rl.prompt();
      });
      rl.on("close", () => {
        output.write("\n");
        resolve();
      });
    });
  }
}
