/** REPL 的运行状态；exit 命令通过它通知 Repl 停止读入。 */
export class ReplSession {
  private active = true;

  get running(): boolean {
    return this.active;
  }

  stop(): void {
    this.active = false;
  }
}
