import { describe, expect, it } from "vitest";
import { CreateCommand } from "../../src/command/CreateCommand.js";
import { DeleteCommand } from "../../src/command/DeleteCommand.js";
import { History } from "../../src/command/History.js";
import { Document } from "../../src/model/Document.js";
import { ShapeFactory } from "../../src/model/ShapeFactory.js";

const factory = ShapeFactory.withBuiltins();

function setup() {
  const doc = new Document();
  const history = new History();
  const create = (type: string, id: string, args: string[], containerId?: string) =>
    history.run(new CreateCommand(doc, factory, type, id, args, containerId));
  return { doc, history, create };
}

describe("CreateCommand", () => {
  it("creates at the root and reports it", () => {
    const { doc, create } = setup();
    expect(create("rect", "bg", ["0", "0", "800", "600", "#ffffff"])).toBe("rect#bg created");
    expect(doc.require("bg").parent).toBe(doc.root);
  });

  it("creates inside a container with `in`", () => {
    const { doc, create } = setup();
    create("g", "node1", []);
    expect(create("rect", "start", ["1", "2", "3", "4"], "node1")).toBe("rect#start created in g#node1");
    expect(doc.require("start").parent).toBe(doc.requireContainer("node1"));
  });

  it("undo removes the shape and redo puts it back", () => {
    const { doc, history, create } = setup();
    create("circle", "c1", ["1", "1", "1"]);
    history.undo();
    expect(doc.has("c1")).toBe(false);
    history.redo();
    expect(doc.has("c1")).toBe(true);
  });

  type Case = { name: string; type: string; id: string; container?: string; message: string };
  const cases: Case[] = [
    { name: "duplicate id", type: "rect", id: "r1", message: "id already exists: r1" },
    { name: "missing container", type: "rect", id: "r2", container: "node9", message: "no such container: node9" },
    { name: "non-container target", type: "rect", id: "r2", container: "r1", message: "not a container: r1" },
    { name: "unknown type", type: "hexagon", id: "h", message: "unknown shape type: hexagon (is the plugin loaded?)" },
  ];

  it.each(cases)("fails cleanly on $name", ({ type, id, container, message }) => {
    const { doc, history, create } = setup();
    create("rect", "r1", ["0", "0", "1", "1"]);
    const before = doc.elementCount;
    expect(() => create(type, id, ["0", "0", "1", "1"], container)).toThrow(message);
    expect(doc.elementCount).toBe(before);
    history.undo(); // only the first create is on the stack
    expect(() => history.undo()).toThrow("nothing to undo");
  });
});

describe("DeleteCommand", () => {
  it("restores a deleted shape at its original position in its original parent", () => {
    const { doc, history, create } = setup();
    create("g", "markers", []);
    create("circle", "c1", ["0", "0", "1"], "markers");
    create("rect", "box", ["0", "0", "1", "1"], "markers");
    create("text", "t", ["0", "0", "x"], "markers");
    expect(history.run(new DeleteCommand(doc, "box"))).toBe("rect#box deleted");
    expect(doc.has("box")).toBe(false);
    expect(history.undo()).toBe("rect#box restored into g#markers");
    expect(doc.requireContainer("markers").children.map((c) => c.id)).toEqual(["c1", "box", "t"]);
  });

  it("deleting a container removes its whole subtree and undo brings it back", () => {
    const { doc, history, create } = setup();
    create("g", "g1", []);
    create("rect", "r", ["0", "0", "1", "1"], "g1");
    history.run(new DeleteCommand(doc, "g1"));
    expect(doc.elementCount).toBe(0);
    history.undo();
    expect(doc.has("r")).toBe(true);
  });

  it("restores into the root as svg", () => {
    const { doc, history, create } = setup();
    create("rect", "r", ["0", "0", "1", "1"]);
    history.run(new DeleteCommand(doc, "r"));
    expect(history.undo()).toBe("rect#r restored into svg");
  });

  it("reports unknown ids", () => {
    const { doc } = setup();
    expect(() => new DeleteCommand(doc, "r9")).toThrow("no such shape: r9");
  });
});
