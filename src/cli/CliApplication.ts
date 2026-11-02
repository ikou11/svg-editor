import type { Readable, Writable } from "node:stream";
import { Editor } from "../app/Editor.js";
import { AddToCliCommand } from "./AddToCliCommand.js";
import { BackCliCommand } from "./BackCliCommand.js";
import { CanvasCliCommand } from "./CanvasCliCommand.js";
import { CommandInterpreter } from "./CommandInterpreter.js";
import { CommandRegistry } from "./CommandRegistry.js";
import { CreateCliCommand } from "./CreateCliCommand.js";
import { DeleteCliCommand } from "./DeleteCliCommand.js";
import { ExitCliCommand } from "./ExitCliCommand.js";
import { FrontCliCommand } from "./FrontCliCommand.js";
import { GroupCliCommand } from "./GroupCliCommand.js";
import { HelpCliCommand } from "./HelpCliCommand.js";
import { InitCliCommand } from "./InitCliCommand.js";
import { MoveCliCommand } from "./MoveCliCommand.js";
import { ReadCliCommand } from "./ReadCliCommand.js";
import { RedoCliCommand } from "./RedoCliCommand.js";
import { Repl } from "./Repl.js";
import { ReplSession } from "./ReplSession.js";
import { SaveCliCommand } from "./SaveCliCommand.js";
import { ScaleCliCommand } from "./ScaleCliCommand.js";
import { SetCliCommand } from "./SetCliCommand.js";
import { ShowCliCommand } from "./ShowCliCommand.js";
import { TreeCliCommand } from "./TreeCliCommand.js";
import { UndoCliCommand } from "./UndoCliCommand.js";
import { UngroupCliCommand } from "./UngroupCliCommand.js";

/** CLI 的装配点：把命令注册进注册表（help 按此顺序显示），并连接解释器与 REPL。 */
export class CliApplication {
  private constructor(
    private readonly interpreter: CommandInterpreter,
    private readonly repl: Repl,
  ) {}

  static create(editor: Editor = new Editor()): CliApplication {
    const session = new ReplSession();
    const registry = new CommandRegistry();
    registry.register(new InitCliCommand(editor));
    registry.register(new ReadCliCommand(editor));
    registry.register(new SaveCliCommand(editor));
    registry.register(new CanvasCliCommand(editor));
    registry.register(new CreateCliCommand(editor));
    registry.register(new DeleteCliCommand(editor));
    registry.register(new MoveCliCommand(editor));
    registry.register(new ScaleCliCommand(editor));
    registry.register(new SetCliCommand(editor));
    registry.register(new GroupCliCommand(editor));
    registry.register(new UngroupCliCommand(editor));
    registry.register(new AddToCliCommand(editor));
    registry.register(new FrontCliCommand(editor));
    registry.register(new BackCliCommand(editor));
    registry.register(new TreeCliCommand(editor));
    registry.register(new ShowCliCommand(editor));
    registry.register(new UndoCliCommand(editor));
    registry.register(new RedoCliCommand(editor));
    registry.register(new HelpCliCommand(registry));
    registry.register(new ExitCliCommand(session));
    const interpreter = new CommandInterpreter(registry);
    return new CliApplication(interpreter, new Repl(interpreter, session));
  }

  /** 执行一行命令，返回输出行（测试与脚本回放用）。 */
  execute(line: string): string[] {
    return this.interpreter.execute(line);
  }

  start(input: Readable, output: Writable): Promise<void> {
    return this.repl.run(input, output);
  }
}
