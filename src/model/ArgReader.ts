import { SvgError } from "./SvgError.js";

/** 按顺序消费 create 命令的位置参数，参数不足时给出 usage。 */
export class ArgReader {
  private pos = 0;

  constructor(
    private readonly args: readonly string[],
    private readonly usage: string,
  ) {}

  number(): number {
    const token = this.next();
    const n = Number(token);
    if (token.trim() === "" || !Number.isFinite(n)) throw new SvgError(`invalid number: ${token}`);
    return n;
  }

  text(): string {
    return this.next();
  }

  optionalText(): string | undefined {
    return this.pos < this.args.length ? this.args[this.pos++] : undefined;
  }

  /** 所有参数都读完后调用，多余参数视为用法错误。 */
  finish(): void {
    if (this.pos < this.args.length) throw new SvgError(`usage: ${this.usage}`);
  }

  private next(): string {
    const token = this.args[this.pos];
    if (token === undefined) throw new SvgError(`usage: ${this.usage}`);
    this.pos++;
    return token;
  }
}
