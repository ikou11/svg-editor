import { describe, expect, it } from "vitest";
import type { Command } from "../../src/command/Command.js";
import { History } from "../../src/command/History.js";

class Counter implements Command {
  constructor(
    private readonly log: string[],
    private readonly name: string,
  ) {}
  execute(): string {
    this.log.push(`do ${this.name}`);
    return `did ${this.name}`;
  }
  undo(): string {
    this.log.push(`undo ${this.name}`);
    return `undid ${this.name}`;
  }
}

describe("History", () => {
  it("undoes in reverse order and redoes in original order", () => {
    const log: string[] = [];
    const h = new History();
    h.run(new Counter(log, "a"));
    h.run(new Counter(log, "b"));
    expect(h.undo()).toBe("undid b");
    expect(h.undo()).toBe("undid a");
    expect(h.redo()).toBe("did a");
    expect(h.redo()).toBe("did b");
    expect(log).toEqual(["do a", "do b", "undo b", "undo a", "do a", "do b"]);
  });

  it("a new edit clears the redo stack", () => {
    const log: string[] = [];
    const h = new History();
    h.run(new Counter(log, "a"));
    h.undo();
    h.run(new Counter(log, "b"));
    expect(() => h.redo()).toThrow("nothing to redo");
  });

  it("reports empty stacks", () => {
    const h = new History();
    expect(() => h.undo()).toThrow("nothing to undo");
    expect(() => h.redo()).toThrow("nothing to redo");
  });

  it("a command that throws is not recorded", () => {
    const h = new History();
    const bad: Command = {
      execute() {
        throw new Error("boom");
      },
      undo: () => "",
    };
    expect(() => h.run(bad)).toThrow("boom");
    expect(() => h.undo()).toThrow("nothing to undo");
  });

  it("clear drops both stacks", () => {
    const h = new History();
    h.run(new Counter([], "a"));
    h.undo();
    h.clear();
    expect(() => h.redo()).toThrow("nothing to redo");
  });
});
