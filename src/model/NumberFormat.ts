export class NumberFormat {
  /** 去掉浮点噪声并省略无意义的小数位：130, 0.5, 33.333333 */
  static format(n: number): string {
    return String(Math.round(n * 1e6) / 1e6);
  }
}
