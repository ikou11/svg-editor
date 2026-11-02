import { describe, expect, it } from "vitest";
import { Editor } from "../../src/app/Editor.js";
import { CanvasCliCommand } from "../../src/cli/CanvasCliCommand.js";
import { CommandInterpreter } from "../../src/cli/CommandInterpreter.js";
import { CommandRegistry } from "../../src/cli/CommandRegistry.js";
import { InitCliCommand } from "../../src/cli/InitCliCommand.js";
import { ReadCliCommand } from "../../src/cli/ReadCliCommand.js";
import { RedoCliCommand } from "../../src/cli/RedoCliCommand.js";
import { SaveCliCommand } from "../../src/cli/SaveCliCommand.js";
import { UndoCliCommand } from "../../src/cli/UndoCliCommand.js";

function setup() {
  const editor = new Editor();
  const registry = new CommandRegistry();
  [InitCliCommand, ReadCliCommand, SaveCliCommand, CanvasCliCommand, UndoCliCommand, RedoCliCommand].forEach((C) =>
    registry.register(new C(editor)),
  );
  return new CommandInterpreter(registry);
}

describe("document and history commands", () => {
  it("init takes optional width and height", () => {
    const cli = setup();
    expect(cli.execute("init")).toEqual(["canvas 800x600 created"]);
    expect(cli.execute("init 400 200")).toEqual(["canvas 400x200 created"]);
    expect(cli.execute("canvas")).toEqual(["canvas 400x200"]);
  });

  it("canvas with arguments resizes", () => {
    const cli = setup();
    cli.execute("init");
    expect(cli.execute("canvas 300 100")).toEqual(["canvas resized to 300x100"]);
    expect(cli.execute("canvas 300 100 5")).toEqual(["error: usage: canvas [w] [h]"]);
  });

  it("reports bad numbers and missing documents", () => {
    const cli = setup();
    expect(cli.execute("canvas")).toEqual(["error: no document. use 'init' or 'read' first"]);
    expect(cli.execute("init abc")).toEqual(["error: invalid number: abc"]);
    expect(cli.execute("init -5 10")).toEqual(["error: canvas size must be positive"]);
  });

  it("read and save report file errors with the documented messages", () => {
    const cli = setup();
    expect(cli.execute("read definitely-missing.svg")).toEqual(["error: cannot read file: definitely-missing.svg"]);
    cli.execute("init");
    expect(cli.execute("save /no/such/dir/a.svg")).toEqual(["error: cannot write file: /no/such/dir/a.svg"]);
    expect(cli.execute("save")).toEqual(["error: no file path. use 'save <file>'"]);
    expect(cli.execute("read")).toEqual(["error: usage: read <file.svg>"]);
  });

  it("undo and redo take no arguments", () => {
    const cli = setup();
    cli.execute("init");
    expect(cli.execute("undo extra")).toEqual(["error: usage: undo"]);
    expect(cli.execute("undo")).toEqual(["error: undo not allowed after io command"]);
  });
});
