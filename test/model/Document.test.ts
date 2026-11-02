import { describe, expect, it } from "vitest";
import { Document } from "../../src/model/Document.js";
import { Group } from "../../src/model/Group.js";
import { Rect } from "../../src/model/Rect.js";
import { ShapeFactory } from "../../src/model/ShapeFactory.js";

describe("Document", () => {
  it("defaults to 800x600 and validates size", () => {
    const doc = new Document();
    expect([doc.width, doc.height]).toEqual([800, 600]);
    expect(() => doc.resize(0, 10)).toThrow("canvas size must be positive");
    expect(() => new Document(-1, 5)).toThrow("canvas size must be positive");
  });

  it("finds shapes at any depth and counts elements", () => {
    const doc = new Document();
    const g = new Group("g");
    const r = new Rect("r", 0, 0, 1, 1);
    doc.root.add(g);
    g.add(r);
    expect(doc.require("r")).toBe(r);
    expect(doc.elementCount).toBe(2);
  });

  it("reports the documented error messages", () => {
    const doc = new Document();
    doc.root.add(new Rect("r", 0, 0, 1, 1));
    expect(() => doc.require("r9")).toThrow("no such shape: r9");
    expect(() => doc.requireContainer("node9")).toThrow("no such container: node9");
    expect(() => doc.requireContainer("r")).toThrow("not a container: r");
    expect(() => doc.assertIdFree("r")).toThrow("id already exists: r");
    expect(() => doc.assertIdFree("other")).not.toThrow();
  });

  it("ids are case-sensitive", () => {
    const doc = new Document();
    doc.root.add(new Rect("R", 0, 0, 1, 1));
    expect(doc.has("r")).toBe(false);
  });
});

describe("ShapeFactory", () => {
  const factory = ShapeFactory.withBuiltins();

  it("creates all six built-in types", () => {
    expect(factory.create("rect", "a", ["0", "0", "1", "1"]).tag).toBe("rect");
    expect(factory.create("circle", "b", ["0", "0", "1"]).tag).toBe("circle");
    expect(factory.create("ellipse", "c", ["0", "0", "1", "2"]).tag).toBe("ellipse");
    expect(factory.create("line", "d", ["0", "0", "1", "1"]).tag).toBe("line");
    expect(factory.create("text", "e", ["0", "0", "hi"]).tag).toBe("text");
    expect(factory.create("g", "f", []).asContainer()).not.toBeNull();
  });

  it("rejects unknown types such as box", () => {
    expect(() => factory.create("box", "n1", [])).toThrow("unknown shape type: box (is the plugin loaded?)");
  });

  it("supports registering new types without touching existing code", () => {
    const custom = ShapeFactory.withBuiltins();
    custom.register("dot", (id) => new Rect(id, 0, 0, 1, 1));
    expect(custom.create("dot", "d", []).tag).toBe("rect");
  });

  it("g takes no extra args", () => {
    expect(() => factory.create("g", "x", ["1"])).toThrow("usage: create g <id>");
  });
});
