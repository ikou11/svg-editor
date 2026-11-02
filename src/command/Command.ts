/**
 * 一次可撤销的编辑。构造时完成全部校验（失败即抛 SvgError，文档不受影响），
 * execute / undo 只做不会失败的状态变更，并返回给用户的一行反馈。
 * redo 就是再次 execute。
 */
export interface Command {
  execute(): string;
  undo(): string;
}
