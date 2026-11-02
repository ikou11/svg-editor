import type { CliCommand } from "./CliCommand.js";

/**
 * 命令名 → 命令对象。按名字分派的两处之一（另一处是 ShapeFactory）。
 * 待重构：命令自描述并自动注册，help 文本由注册信息生成。
 */
export class CommandRegistry {
  private readonly commands = new Map<string, CliCommand>();

  register(command: CliCommand): void {
    this.commands.set(command.name, command);
  }

  find(name: string): CliCommand | undefined {
    return this.commands.get(name);
  }

  /** 按注册顺序返回，用于 help。 */
  all(): CliCommand[] {
    return [...this.commands.values()];
  }
}
