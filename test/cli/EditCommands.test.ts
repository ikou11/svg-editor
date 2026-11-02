import { describe, expect, it } from "vitest";
import { Editor } from "../../src/app/Editor.js";
import { AddToCliCommand } from "../../src/cli/AddToCliCommand.js";
import { BackCliCommand } from "../../src/cli/BackCliCommand.js";
import { CommandInterpreter } from "../../src/cli/CommandInterpreter.js";
import { CommandRegistry } from "../../src/cli/CommandRegistry.js";
import { CreateCliCommand } from "../../src/cli/CreateCliCommand.js";
import { DeleteCliCommand } from "../../src/cli/DeleteCliCommand.js";
import { FrontCliCommand } from "../../src/cli/FrontCliCommand.js";
import { GroupCliCommand } from "../../src/cli/GroupCliCommand.js";
import { InitCliCommand } from "../../src/cli/InitCliCommand.js";
import { MoveCliCommand } from "../../src/cli/MoveCliCommand.js";
import { ScaleCliCommand } from "../../src/cli/ScaleCliCommand.js";
import { SetCliCommand } from "../../src/cli/SetCliCommand.js";
import { UndoCliCommand } from "../../src/cli/UndoCliCommand.js";
import { UngroupCliCommand } from "../../src/cli/UngroupCliCommand.js";

function setup() {
  const editor = new Editor();
  const registry = new CommandRegistry();
  [
    InitCliCommand, CreateCliCommand, DeleteCliCommand, MoveCliCommand, ScaleCliCommand, SetCliCommand,
    GroupCliCommand, UngroupCliCommand, AddToCliCommand, FrontCliCommand, BackCliCommand, UndoCliCommand,
  ].forEach((C) => registry.register(new C(editor)));
  const cli = new CommandInterpreter(registry);
  cli.execute("init");
  return { editor, cli };
}

describe("edit commands (cli parsing)", () => {
  it("create passes positional params and quoted text through", () => {
    const { cli, editor } = setup();
    expect(cli.execute("create rect bg 0 0 800 600 #ffffff")).toEqual(["rect#bg created"]);
    expect(cli.execute('create text title 20 40 "My Diagram"')).toEqual(["text#title created"]);
    expect(editor.document().require("title").textContent()).toBe("My Diagram");
  });

  it("create ... in <container> places the shape inside and says so", () => {
    const { cli, editor } = setup();
    cli.execute("create g node1");
    expect(cli.execute("create rect start 120 100 160 60 #4a90d9 in node1")).toEqual(["rect#start created in g#node1"]);
    expect(cli.execute('create text start-label 155 135 "开始" in node1')).toEqual(["text#start-label created in g#node1"]);
    expect(editor.document().requireContainer("node1").children).toHaveLength(2);
  });

  it("create reports the documented errors", () => {
    const { cli } = setup();
    cli.execute("create rect r1 0 0 1 1");
    expect(cli.execute("create rect r1 0 0 1 1")).toEqual(["error: id already exists: r1"]);
    expect(cli.execute("create rect r2 0 0 1 1 in node9")).toEqual(["error: no such container: node9"]);
    expect(cli.execute("create rect r2 0 0 1 1 in r1")).toEqual(["error: not a container: r1"]);
    expect(cli.execute("create hexagon h")).toEqual(["error: unknown shape type: hexagon (is the plugin loaded?)"]);
    expect(cli.execute("create box n1 120 100 160 60 开始")).toEqual([
      "error: unknown shape type: box (is the plugin loaded?)",
    ]);
    expect(cli.execute("create rect")).toEqual(["error: usage: create <type> <id> [params...] [in <containerId>]"]);
    expect(cli.execute("create rect r3 1 2")).toEqual(["error: usage: create rect <id> <x> <y> <w> <h> [fill]"]);
  });

  it("move / scale / set / delete use the documented feedback", () => {
    const { cli } = setup();
    cli.execute("create circle c1 100 100 20 red");
    expect(cli.execute("move c1 30 0")).toEqual(["circle#c1 moved to (130,100)"]);
    expect(cli.execute("scale c1 2")).toEqual(["circle#c1 scaled by 2"]);
    expect(cli.execute("set c1 fill blue")).toEqual(["circle#c1 updated: fill=blue"]);
    expect(cli.execute("delete c1")).toEqual(["circle#c1 deleted"]);
    expect(cli.execute("undo")).toEqual(["circle#c1 restored into svg"]);
  });

  it("argument validation: bad numbers, non-positive scale, unknown attribute, unknown ids", () => {
    const { cli } = setup();
    cli.execute("create rect r 0 0 1 1");
    expect(cli.execute("move r a b")).toEqual(["error: invalid number: a"]);
    expect(cli.execute("move r 1")).toEqual(["error: usage: move <id> <dx> <dy>"]);
    expect(cli.execute("scale r 0")).toEqual(["error: scale factor must be positive"]);
    expect(cli.execute("scale r -1")).toEqual(["error: scale factor must be positive"]);
    expect(cli.execute("set r color red")).toEqual(["error: unknown attribute: color"]);
    expect(cli.execute("delete r9")).toEqual(["error: no such shape: r9"]);
    expect(cli.execute("move r9 1 1")).toEqual(["error: no such shape: r9"]);
  });

  it("group / ungroup / addto / front / back", () => {
    const { cli } = setup();
    cli.execute("create rect a 0 0 1 1");
    cli.execute("create rect b 0 0 1 1");
    cli.execute("create rect c 0 0 1 1");
    expect(cli.execute("group g1 a b")).toEqual(["g#g1 created with 2 children"]);
    expect(cli.execute("group")).toEqual(["error: usage: group <newGid> <id1> <id2>..."]);
    expect(cli.execute("group g2")).toEqual(["error: usage: group <newGid> <id1> <id2>..."]);
    expect(cli.execute("group bad a g1")).toEqual(["error: cannot group a container into its own descendant: g1"]);
    expect(cli.execute("addto g1 c")).toEqual(["rect#c moved into g#g1"]);
    expect(cli.execute("ungroup g1")).toEqual(["error: cannot ungroup top-level container: g1"]);
    expect(cli.execute("front a")).toEqual(["rect#a moved to front"]);
    expect(cli.execute("back a")).toEqual(["rect#a moved to back"]);
  });
});
