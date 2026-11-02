import { expect } from "vitest";
import type { CliApplication } from "../../src/cli/CliApplication.js";

/**
 * 回放作业文档里的会话 transcript：以 "svg> " 开头的行是输入，
 * 其后直到下一条输入之间的非空、非 # 注释行是期望输出。
 */
export class TranscriptReplay {
  constructor(private readonly app: CliApplication) {}

  /** collapseSpaces：把连续空白视为一个，用于作业文档中手工对齐不一致的 tree 样例。 */
  run(transcript: string, options: { collapseSpaces?: boolean } = {}): void {
    const norm = (s: string) => (options.collapseSpaces ? s.replace(/ +/g, " ") : s);
    const steps: Array<{ input: string; expected: string[] }> = [];
    for (const raw of transcript.split("\n")) {
      const line = raw.trimEnd();
      if (line.startsWith("svg> ")) steps.push({ input: line.slice(5), expected: [] });
      else if (line !== "" && !line.startsWith("#") && steps.length > 0) steps[steps.length - 1]!.expected.push(line);
    }
    for (const step of steps) {
      const actual = this.app.execute(step.input).map((l) => norm(l.trimEnd()));
      expect(actual, `after "svg> ${step.input}"`).toEqual(step.expected.map(norm));
    }
  }
}
