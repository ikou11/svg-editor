import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStore } from "../../src/io/FileStore.js";
import { SvgReader } from "../../src/io/SvgReader.js";
import { SvgWriter } from "../../src/io/SvgWriter.js";
import { ShapeFactory } from "../../src/model/ShapeFactory.js";

const reader = new SvgReader(ShapeFactory.withBuiltins());

/** 作业文档第 6 节的 other.svg，其中第一个 rect 缺 id。 */
const OTHER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`;

describe("SvgReader", () => {
  it("reads the assignment's other.svg and warns about the unnamed rect", () => {
    const { document, warnings } = reader.read(OTHER_SVG);
    expect(warnings).toEqual(["warning: assigned id rect1 to unnamed <rect>"]);
    expect([document.width, document.height]).toEqual([400, 300]);
    expect(document.elementCount).toBe(7);
    expect(document.root.children.map((c) => c.id)).toEqual(["rect1", "t1", "c1", "g1", "e1"]);
    expect(document.requireContainer("g1").children.map((c) => c.id)).toEqual(["r2", "c2"]);
    expect(document.require("rect1").describe()).toBe("x=0 y=0 w=400 h=300 fill=#ffffff");
    expect(document.require("t1").describe()).toBe('(10,290) "imported"');
  });

  it("numbers unnamed elements per tag and avoids ids already used in the file", () => {
    const { document, warnings } = reader.read(
      `<svg width="10" height="10"><rect x="0" y="0" width="1" height="1"/><rect id="rect2"/><rect/><circle r="1"/></svg>`,
    );
    expect(document.root.children.map((c) => c.id)).toEqual(["rect1", "rect2", "rect3", "circle1"]);
    expect(warnings).toHaveLength(3);
  });

  it("rejects duplicate ids", () => {
    expect(() => reader.read(`<svg><rect id="a"/><circle id="a"/></svg>`)).toThrow("id already exists: a");
  });

  it("warns about and skips unsupported elements and ignored transforms", () => {
    const { document, warnings } = reader.read(
      `<svg><path d="M0 0"/><g id="g" transform="translate(1,2)"><rect id="r"/></g></svg>`,
    );
    expect(warnings).toEqual([
      "warning: skipped unsupported <path>",
      "warning: ignored transform on <g> g",
    ]);
    expect(document.has("r")).toBe(true);
  });

  it("falls back to viewBox, then to 800x600, for the canvas size", () => {
    expect(reader.read(`<svg viewBox="0 0 50 60"/>`).document.width).toBe(50);
    expect(reader.read(`<svg/>`).document.height).toBe(600);
  });

  it("rejects non-svg roots and malformed input", () => {
    expect(() => reader.read(`<html/>`)).toThrow("invalid svg: root element is not <svg>");
    expect(() => reader.read(`<svg>`)).toThrow(/^invalid svg:/);
  });

  it("round-trips: write(read(write(doc))) is stable", () => {
    const first = new SvgWriter().write(reader.read(OTHER_SVG).document);
    const second = new SvgWriter().write(reader.read(first).document);
    expect(second).toBe(first);
  });
});

describe("FileStore", () => {
  it("writes and reads back, and reports failures with the documented messages", () => {
    const dir = mkdtempSync(join(tmpdir(), "svg-editor-"));
    const path = join(dir, "a.svg");
    const store = new FileStore();
    store.write(path, "hello");
    expect(readFileSync(path, "utf8")).toBe("hello");
    expect(store.read(path)).toBe("hello");
    expect(() => store.read(join(dir, "missing.svg"))).toThrow(`cannot read file: ${join(dir, "missing.svg")}`);
    expect(() => store.write(join(dir, "no-such-dir", "x.svg"), "")).toThrow("cannot write file:");
  });
});
