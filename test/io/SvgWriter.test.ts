import { describe, expect, it } from "vitest";
import { CreateCommand } from "../../src/command/CreateCommand.js";
import { SvgWriter } from "../../src/io/SvgWriter.js";
import { Document } from "../../src/model/Document.js";
import { ShapeFactory } from "../../src/model/ShapeFactory.js";

function build(steps: Array<[string, string, string[], string?]>, w = 400, h = 200): Document {
  const doc = new Document(w, h);
  const factory = ShapeFactory.withBuiltins();
  for (const [type, id, args, container] of steps) {
    new CreateCommand(doc, factory, type, id, args, container).execute();
  }
  return doc;
}

describe("SvgWriter", () => {
  it("writes the background-section example exactly", () => {
    const doc = build([
      ["g", "flow", []],
      ["rect", "start", ["30", "70", "120", "60", "#4a90d9"], "flow"],
      ["line", "edge", ["150", "100", "250", "100", "black"], "flow"],
      ["rect", "end", ["250", "70", "120", "60", "#f5a623"], "flow"],
    ]);
    expect(new SvgWriter().write(doc)).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <g id="flow">
    <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>
    <line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>
    <rect id="end" x="250" y="70" width="120" height="60" fill="#f5a623"/>
  </g>
</svg>
`);
  });

  it("writes text as child content, escaped, and empty groups self-closed", () => {
    const doc = build([
      ["text", "t1", ["20", "40", 'a < b & "c"']],
      ["g", "scene", []],
    ]);
    const svg = new SvgWriter().write(doc);
    expect(svg).toContain('<text id="t1" x="20" y="40">a &lt; b &amp; &quot;c&quot;</text>');
    expect(svg).toContain('<g id="scene"/>');
  });

  it("omits fill/stroke when they were never set", () => {
    const svg = new SvgWriter().write(build([["circle", "c1", ["1", "2", "3"]]]));
    expect(svg).toContain('<circle id="c1" cx="1" cy="2" r="3"/>');
  });
});
