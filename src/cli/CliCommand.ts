import { ArgReader } from "../model/ArgReader.js";

/** 一条 CLI 命令：负责解析参数、调用 Editor、把结果整理成输出行。 */
export abstract class CliCommand {
  abstract readonly name: string;
  /** 帮助中显示的语法，如 "move <id> <dx> <dy>"；参数错误时也以它作为提示。 */
  abstract readonly usage: string;
  abstract readonly summary: string;

  abstract run(args: readonly string[]): string[];

  protected reader(args: readonly string[]): ArgReader {
    return new ArgReader(args, this.usage);
  }
}
