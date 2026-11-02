import { describe, expect, it } from "vitest";
import { Editor } from "../../src/app/Editor.js";
import { MemoryFileStore } from "../support/MemoryFileStore.js";

function setup() {
  const files = new MemoryFileStore();
  const editor = new Editor({ fileStore: files });
  return { files, editor };
}

describe("Editor", () => {
  it("requires a document before anything else", () => {
    const { editor } = setup();
    const msg = "no document. use 'init' or 'read' first";
    expect(() => editor.create("rect", "r", ["0", "0", "1", "1"])).toThrow(msg);
    expect(() => editor.save("a.svg")).toThrow(msg);
    expect(() => editor.undo()).toThrow(msg);
    expect(() => editor.document()).toThrow(msg);
  });

  it("init defaults to 800x600", () => {
    const { editor } = setup();
    expect(editor.init()).toBe("canvas 800x600 created");
    expect(editor.canvas()).toBe("canvas 800x600");
  });

  it("undo/redo are refused after an io command until the next edit", () => {
    const { editor } = setup();
    editor.init();
    editor.create("rect", "r", ["0", "0", "1", "1"]);
    editor.save("demo.svg");
    expect(() => editor.undo()).toThrow("undo not allowed after io command");
    expect(() => editor.redo()).toThrow("undo not allowed after io command");
    editor.create("circle", "c", ["1", "1", "1"]);
    expect(editor.undo()).toBe("circle#c creation undone");
    // the edit made before the save is still undoable afterwards
    expect(editor.undo()).toBe("rect#r creation undone");
  });

  it("canvas resize is an io command; plain canvas is not", () => {
    const { editor } = setup();
    editor.init();
    editor.create("rect", "r", ["0", "0", "1", "1"]);
    editor.canvas();
    expect(editor.undo()).toBe("rect#r creation undone");
    editor.redo();
    expect(editor.canvas(400)).toBe("canvas resized to 400x600");
    expect(() => editor.undo()).toThrow("undo not allowed after io command");
  });

  it("init and read discard history", () => {
    const { editor, files } = setup();
    editor.init();
    editor.create("rect", "r", ["0", "0", "1", "1"]);
    editor.save("a.svg");
    editor.create("circle", "c", ["1", "1", "1"]);
    editor.read("a.svg");
    editor.create("g", "g1", []);
    editor.undo();
    expect(() => editor.undo()).toThrow("nothing to undo");
    expect(files.files.has("a.svg")).toBe(true);
  });

  it("save without argument reuses the path from read, and save <file> becomes the new default", () => {
    const { editor, files } = setup();
    files.files.set("in.svg", `<svg width="10" height="10"><rect id="r" x="0" y="0" width="1" height="1"/></svg>`);
    expect(editor.read("in.svg")).toEqual(["read in.svg (1 elements)"]);
    expect(editor.save()).toBe("saved to in.svg (1 elements)");
    editor.save("out.svg");
    editor.create("circle", "c", ["1", "1", "1"]);
    editor.save();
    expect(files.files.get("out.svg")).toContain('<circle id="c"');
  });

  it("save without any known path is an error", () => {
    const { editor } = setup();
    editor.init();
    expect(() => editor.save()).toThrow("no file path. use 'save <file>'");
  });

  it("read returns warnings before the summary, and a failed read keeps the current document", () => {
    const { editor, files } = setup();
    files.files.set("other.svg", `<svg width="5" height="5"><rect x="0" y="0" width="5" height="5"/></svg>`);
    editor.init(100, 100);
    editor.create("rect", "keep", ["0", "0", "1", "1"]);
    expect(editor.read("other.svg")).toEqual([
      "warning: assigned id rect1 to unnamed <rect>",
      "read other.svg (1 elements)",
    ]);
    editor.init(100, 100);
    editor.create("rect", "keep", ["0", "0", "1", "1"]);
    expect(() => editor.read("missing.svg")).toThrow("cannot read file: missing.svg");
    expect(editor.document().has("keep")).toBe(true);
  });

  it("a failed edit changes nothing and does not unlock undo", () => {
    const { editor } = setup();
    editor.init();
    editor.save("a.svg");
    expect(() => editor.create("rect", "r", ["1"])).toThrow("usage: create rect");
    expect(() => editor.undo()).toThrow("undo not allowed after io command");
  });

  it("one group command is one undo unit", () => {
    const { editor } = setup();
    editor.init();
    editor.create("rect", "a", ["0", "0", "1", "1"]);
    editor.create("rect", "b", ["0", "0", "1", "1"]);
    editor.group("g1", ["a", "b"]);
    editor.undo();
    expect(editor.document().root.children.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
