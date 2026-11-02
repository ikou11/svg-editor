import { describe, expect, it } from "vitest";
import { CliCommand } from "../../src/cli/CliCommand.js";
import { CommandInterpreter } from "../../src/cli/CommandInterpreter.js";
import { CommandRegistry } from "../../src/cli/CommandRegistry.js";
import { LineTokenizer } from "../../src/cli/LineTokenizer.js";
import { SvgError } from "../../src/model/SvgError.js";

class Echo extends CliCommand {
  readonly name = "echo";
  readonly usage = "echo <word>";
  readonly summary = "test";
  run(args: readonly string[]): string[] {
    const r = this.reader(args);
    const word = r.text();
    r.finish();
    return [`<${word}>`];
  }
}

class Boom extends CliCommand {
  readonly name = "boom";
  readonly usage = "boom";
  readonly summary = "test";
  run(args: readonly string[]): string[] {
    if (args[0] === "bug") throw new Error("kaboom");
    throw new SvgError("failed");
  }
}

describe("LineTokenizer", () => {
  it("splits on whitespace and keeps quoted text together", () => {
    expect(LineTokenizer.tokenize('create text t 1 2 "My Diagram v2"')).toEqual([
      "create", "text", "t", "1", "2", "My Diagram v2",
    ]);
  });

  it("supports empty quoted strings and CJK content", () => {
    expect(LineTokenizer.tokenize('x "" "开始"')).toEqual(["x", "", "开始"]);
  });

  it("treats only a leading # as a comment; colors with # stay intact", () => {
    expect(LineTokenizer.tokenize("# a comment")).toEqual([]);
    expect(LineTokenizer.tokenize("   # indented comment")).toEqual([]);
    expect(LineTokenizer.tokenize("create rect r 0 0 1 1 #4a90d9")).toContain("#4a90d9");
  });

  it("returns nothing for blank lines and rejects unterminated quotes", () => {
    expect(LineTokenizer.tokenize("   ")).toEqual([]);
    expect(() => LineTokenizer.tokenize('echo "oops')).toThrow("unterminated quote");
  });
});

describe("CommandInterpreter", () => {
  const registry = new CommandRegistry();
  registry.register(new Echo());
  registry.register(new Boom());
  const interpreter = new CommandInterpreter(registry);

  it("dispatches by command name", () => {
    expect(interpreter.execute("echo hi")).toEqual(["<hi>"]);
  });

  it("prints nothing for blank lines and comments", () => {
    expect(interpreter.execute("")).toEqual([]);
    expect(interpreter.execute("# nothing")).toEqual([]);
  });

  it("prefixes errors and reports unknown commands and usage problems", () => {
    expect(interpreter.execute("frobnicate")).toEqual(["error: unknown command: frobnicate"]);
    expect(interpreter.execute("echo")).toEqual(["error: usage: echo <word>"]);
    expect(interpreter.execute("echo a b")).toEqual(["error: usage: echo <word>"]);
    expect(interpreter.execute("boom")).toEqual(["error: failed"]);
    expect(interpreter.execute('echo "bad')).toEqual(["error: unterminated quote"]);
  });

  it("turns unexpected exceptions into an error line instead of crashing", () => {
    const [line] = interpreter.execute("boom bug");
    expect(line).toBe("error: internal error: kaboom");
  });
});
