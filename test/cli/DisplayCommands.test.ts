import { describe, expect, it } from "vitest";
import { Editor } from "../../src/app/Editor.js";
import { CommandInterpreter } from "../../src/cli/CommandInterpreter.js";
import { CommandRegistry } from "../../src/cli/CommandRegistry.js";
import { CreateCliCommand } from "../../src/cli/CreateCliCommand.js";
import { GroupCliCommand } from "../../src/cli/GroupCliCommand.js";
import { HelpCliCommand } from "../../src/cli/HelpCliCommand.js";
import { InitCliCommand } from "../../src/cli/InitCliCommand.js";
import { ShowCliCommand } from "../../src/cli/ShowCliCommand.js";
import { TreeCliCommand } from "../../src/cli/TreeCliCommand.js";

function setup() {
  const editor = new Editor();
  const registry = new CommandRegistry();
  [InitCliCommand, CreateCliCommand, GroupCliCommand, TreeCliCommand, ShowCliCommand].forEach((C) =>
    registry.register(new C(editor)),
  );
  registry.register(new HelpCliCommand(registry));
  const cli = new CommandInterpreter(registry);
  return cli;
}

function sample() {
  const cli = setup();
  [
    "init 800 600",
    "create rect bg 0 0 800 600 #ffffff",
    'create text title 20 40 "My Diagram"',
    "create circle c1 100 100 20 red",
    "create rect box 200 80 60 60 #3366ff",
    "group markers c1 box",
  ].forEach((l) => cli.execute(l));
  return cli;
}

describe("tree", () => {
  it("matches the assignment's section 5.1 format exactly", () => {
    expect(sample().execute("tree")).toEqual([
      "svg (800x600)",
      "├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff",
      '├── text#title     (20,40) "My Diagram"',
      "└── g#markers",
      "    ├── circle#c1  cx=100 cy=100 r=20 fill=red",
      "    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff",
    ]);
  });

  it("tree <id> shows only that subtree", () => {
    expect(sample().execute("tree markers")).toEqual([
      "g#markers",
      "├── circle#c1  cx=100 cy=100 r=20 fill=red",
      "└── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff",
    ]);
    expect(sample().execute("tree c1")).toEqual(["circle#c1  cx=100 cy=100 r=20 fill=red"]);
  });

  it("an empty document prints just the canvas line", () => {
    const cli = setup();
    cli.execute("init 400 300");
    expect(cli.execute("tree")).toEqual(["svg (400x300)"]);
  });

  it("reports unknown ids and a missing document", () => {
    const cli = setup();
    expect(cli.execute("tree")).toEqual(["error: no document. use 'init' or 'read' first"]);
    cli.execute("init");
    expect(cli.execute("tree nope")).toEqual(["error: no such shape: nope"]);
  });
});

describe("show", () => {
  it("matches the assignment's section 5.2 format", () => {
    expect(sample().execute("show c1")).toEqual([
      "circle#c1  parent=g#markers",
      "  cx=100 cy=100 r=20",
      "  fill=red",
    ]);
  });

  it("top-level shapes have the canvas as parent, and unstyled shapes have no style line", () => {
    const cli = setup();
    cli.execute("init");
    cli.execute("create rect r 0 0 1 1");
    expect(cli.execute("show r")).toEqual(["rect#r  parent=svg", "  x=0 y=0 w=1 h=1"]);
    expect(cli.execute("show nope")).toEqual(["error: no such shape: nope"]);
  });
});

describe("help", () => {
  it("lists every registered command with its syntax", () => {
    const lines = sample().execute("help");
    expect(lines[0]).toBe("commands:");
    expect(lines.join("\n")).toContain("tree [id]");
    expect(lines.join("\n")).toContain("show <id>");
    expect(lines.join("\n")).toContain("help");
  });
});
