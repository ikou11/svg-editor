/** 用户可见的编辑错误；message 不含 "error:" 前缀，由 CLI 层统一加。 */
export class SvgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SvgError";
  }
}
