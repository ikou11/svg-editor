import { describe, expect, it } from "vitest";
import { AddToCommand } from "../../src/command/AddToCommand.js";
import { CreateCommand } from "../../src/command/CreateCommand.js";
import { GroupCommand } from "../../src/command/GroupCommand.js";
import { History } from "../../src/command/History.js";
import { UngroupCommand } from "../../src/command/UngroupCommand.js";
import { ZOrderCommand } from "../../src/command/ZOrderCommand.js";
import { Document } from "../../src/model/Document.js";
import { ShapeFactory } from "../../src/model/ShapeFactory.js";

function setup() {
  const doc = new Document();
  const history = new History();
  const factory = ShapeFactory.withBuiltins();
  const create = (type: string, id: string, args: string[], container?: string) =>
    history.run(new CreateCommand(doc, factory, type, id, args, container));
  const ids = (containerId?: string) =>
    (containerId === undefined ? doc.root : doc.requireContainer(containerId)).children.map((c) => c.id);
  return { doc, history, create, ids };
}

/** bg, title, c1, box 四个根级图形，对应示例 transcript。 */
function sample() {
  const s = setup();
  s.create("rect", "bg", ["0", "0", "800", "600"]);
  s.create("text", "title", ["20", "40", "My Diagram"]);
  s.create("circle", "c1", ["100", "100", "20"]);
  s.create("rect", "box", ["200", "80", "60", "60"]);
  return s;
}

describe("GroupCommand", () => {
  it("groups at the position of the first member, as in the sample transcript", () => {
    const { doc, history, ids } = sample();
    expect(history.run(new GroupCommand(doc, "markers", ["c1", "box"]))).toBe("g#markers created with 2 children");
    expect(ids()).toEqual(["bg", "title", "markers"]);
    expect(ids("markers")).toEqual(["c1", "box"]);
  });

  it("keeps document order regardless of argument order", () => {
    const { doc, history, ids } = sample();
    history.run(new GroupCommand(doc, "g", ["box", "c1"]));
    expect(ids("g")).toEqual(["c1", "box"]);
  });

  it("one undo restores everything to the original parents and positions", () => {
    const { doc, history, ids } = sample();
    history.run(new GroupCommand(doc, "g", ["bg", "c1"]));
    history.undo();
    expect(ids()).toEqual(["bg", "title", "c1", "box"]);
    expect(doc.has("g")).toBe(false);
    history.redo();
    expect(ids()).toEqual(["g", "title", "box"]);
  });

  it("collects shapes from different parents", () => {
    const { doc, history, create, ids } = sample();
    create("g", "other", []);
    create("rect", "inner", ["0", "0", "1", "1"], "other");
    history.run(new GroupCommand(doc, "mix", ["inner", "title"]));
    expect(ids("mix").sort()).toEqual(["inner", "title"]);
    history.undo();
    expect(ids("other")).toEqual(["inner"]);
    expect(ids()).toEqual(["bg", "title", "c1", "box", "other"]);
  });

  it("rejects a container together with its own descendant", () => {
    const { doc, history } = sample();
    history.run(new GroupCommand(doc, "markers", ["c1", "box"]));
    expect(() => new GroupCommand(doc, "bad", ["c1", "markers"])).toThrow(
      "cannot group a container into its own descendant: markers",
    );
  });

  it("rejects duplicate new id and unknown members", () => {
    const { doc } = sample();
    expect(() => new GroupCommand(doc, "bg", ["c1"])).toThrow("id already exists: bg");
    expect(() => new GroupCommand(doc, "g", ["zzz"])).toThrow("no such shape: zzz");
  });
});

describe("UngroupCommand", () => {
  it("promotes children into the container's position and undo restores the container", () => {
    const { doc, history, create, ids } = setup();
    create("g", "outer", []);
    create("rect", "before", ["0", "0", "1", "1"], "outer");
    create("g", "inner", [], "outer");
    create("rect", "a", ["0", "0", "1", "1"], "inner");
    create("circle", "b", ["0", "0", "1"], "inner");
    create("rect", "after", ["0", "0", "1", "1"], "outer");
    history.run(new UngroupCommand(doc, "inner"));
    expect(ids("outer")).toEqual(["before", "a", "b", "after"]);
    history.undo();
    expect(ids("outer")).toEqual(["before", "inner", "after"]);
    expect(ids("inner")).toEqual(["a", "b"]);
  });

  it("refuses top-level containers and non-containers", () => {
    const { doc, create } = setup();
    create("g", "scene", []);
    create("rect", "r", ["0", "0", "1", "1"]);
    expect(() => new UngroupCommand(doc, "scene")).toThrow("cannot ungroup top-level container: scene");
    expect(() => new UngroupCommand(doc, "r")).toThrow("not a container: r");
  });
});

describe("AddToCommand", () => {
  it("moves a shape in as the last child and undo returns it to its old place", () => {
    const { doc, history, create, ids } = sample();
    create("g", "g1", []);
    create("rect", "x", ["0", "0", "1", "1"], "g1");
    expect(history.run(new AddToCommand(doc, "g1", "title"))).toBe("text#title moved into g#g1");
    expect(ids("g1")).toEqual(["x", "title"]);
    expect(history.undo()).toBe("text#title moved back to svg");
    expect(ids()).toEqual(["bg", "title", "c1", "box", "g1"]);
  });

  it("rejects moving a container into itself or its descendant, and bad targets", () => {
    const { doc, create } = setup();
    create("g", "outer", []);
    create("g", "inner", [], "outer");
    create("rect", "r", ["0", "0", "1", "1"]);
    expect(() => new AddToCommand(doc, "inner", "outer")).toThrow("cannot group a container into its own descendant: outer");
    expect(() => new AddToCommand(doc, "outer", "outer")).toThrow("cannot group a container into its own descendant: outer");
    expect(() => new AddToCommand(doc, "r", "inner")).toThrow("not a container: r");
    expect(() => new AddToCommand(doc, "nope", "r")).toThrow("no such container: nope");
    expect(() => new AddToCommand(doc, "outer", "nope")).toThrow("no such shape: nope");
  });
});

describe("ZOrderCommand", () => {
  it("front moves to the end and back to the start; undo restores the index", () => {
    const { doc, history, ids } = sample();
    expect(history.run(ZOrderCommand.front(doc, "bg"))).toBe("rect#bg moved to front");
    expect(ids()).toEqual(["title", "c1", "box", "bg"]);
    history.undo();
    expect(ids()).toEqual(["bg", "title", "c1", "box"]);
    history.run(ZOrderCommand.back(doc, "box"));
    expect(ids()).toEqual(["box", "bg", "title", "c1"]);
    history.undo();
    expect(ids()).toEqual(["bg", "title", "c1", "box"]);
  });
});
