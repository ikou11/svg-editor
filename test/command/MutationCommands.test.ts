import { describe, expect, it } from "vitest";
import { CreateCommand } from "../../src/command/CreateCommand.js";
import { History } from "../../src/command/History.js";
import { MoveCommand } from "../../src/command/MoveCommand.js";
import { ScaleCommand } from "../../src/command/ScaleCommand.js";
import { SetCommand } from "../../src/command/SetCommand.js";
import { Document } from "../../src/model/Document.js";
import { ShapeFactory } from "../../src/model/ShapeFactory.js";

function setup() {
  const doc = new Document();
  const history = new History();
  const factory = ShapeFactory.withBuiltins();
  const create = (type: string, id: string, args: string[], container?: string) =>
    history.run(new CreateCommand(doc, factory, type, id, args, container));
  return { doc, history, create };
}

describe("MoveCommand", () => {
  it("reports the new position for leaves, matching the sample transcript", () => {
    const { doc, history, create } = setup();
    create("circle", "c1", ["100", "100", "20", "red"]);
    expect(history.run(new MoveCommand(doc, "c1", 30, 0))).toBe("circle#c1 moved to (130,100)");
    expect(history.undo()).toBe("circle#c1 moved back to (100,100)");
    expect(history.redo()).toBe("circle#c1 moved to (130,100)");
  });

  it("reports the offset for containers and moves every descendant", () => {
    const { doc, history, create } = setup();
    create("g", "node2", []);
    create("rect", "process", ["520", "100", "160", "60"], "node2");
    create("text", "label", ["545", "135", "x"], "node2");
    expect(history.run(new MoveCommand(doc, "node2", 0, 100))).toBe("g#node2 moved by (0,100)");
    expect(doc.require("label").get("y")).toBe("235");
    expect(history.undo()).toBe("g#node2 moved back by (0,-100)");
    expect(doc.require("process").get("y")).toBe("100");
  });

  it("fails on unknown id", () => {
    const { doc } = setup();
    expect(() => new MoveCommand(doc, "nope", 1, 1)).toThrow("no such shape: nope");
  });
});

describe("ScaleCommand", () => {
  it("scales a container recursively and undo restores exact values", () => {
    const { doc, history, create } = setup();
    create("g", "g1", []);
    create("rect", "r", ["10", "20", "30", "40"], "g1");
    create("circle", "c", ["1", "1", "3"], "g1");
    history.run(new ScaleCommand(doc, "g1", 0.1));
    expect(doc.require("r").describe()).toBe("x=1 y=2 w=3 h=4");
    history.undo();
    expect(doc.require("r").describe()).toBe("x=10 y=20 w=30 h=40");
    expect(doc.require("c").describe()).toBe("cx=1 cy=1 r=3");
  });

  it("rejects non-positive factors without side effects", () => {
    const { doc, create } = setup();
    create("rect", "r", ["1", "1", "1", "1"]);
    expect(() => new ScaleCommand(doc, "r", 0)).toThrow("scale factor must be positive");
    expect(() => new ScaleCommand(doc, "r", -2)).toThrow("scale factor must be positive");
    expect(doc.require("r").describe()).toBe("x=1 y=1 w=1 h=1");
  });
});

describe("SetCommand", () => {
  it("updates text with the transcript's message format and undoes it", () => {
    const { doc, history, create } = setup();
    create("text", "title", ["20", "40", "My Diagram"]);
    expect(history.run(new SetCommand(doc, "title", "text", "My Diagram v2"))).toBe(
      'text#title updated: text="My Diagram v2"',
    );
    expect(history.undo()).toBe('text#title updated: text="My Diagram"');
    expect(doc.require("title").textContent()).toBe("My Diagram");
  });

  it("undoing the first fill on a shape clears it again", () => {
    const { doc, history, create } = setup();
    create("rect", "r", ["0", "0", "1", "1"]);
    history.run(new SetCommand(doc, "r", "fill", "red"));
    expect(history.undo()).toBe("rect#r fill reset");
    expect(doc.require("r").get("fill")).toBeNull();
  });

  it("set on a container propagates style to children and undo restores each one", () => {
    const { doc, history, create } = setup();
    create("g", "g1", []);
    create("rect", "a", ["0", "0", "1", "1", "blue"], "g1");
    create("circle", "b", ["0", "0", "1"], "g1");
    history.run(new SetCommand(doc, "g1", "fill", "red"));
    expect(doc.require("b").get("fill")).toBe("red");
    history.undo();
    expect(doc.require("a").get("fill")).toBe("blue");
    expect(doc.require("b").get("fill")).toBeNull();
  });

  it("rejects unknown attributes and leaves the history untouched", () => {
    const { doc, history, create } = setup();
    create("rect", "r", ["0", "0", "1", "1"]);
    expect(() => history.run(new SetCommand(doc, "r", "color", "red"))).toThrow("unknown attribute: color");
    expect(history.undo()).toBe("rect#r creation undone");
  });
});
