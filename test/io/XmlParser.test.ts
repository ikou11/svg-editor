import { describe, expect, it } from "vitest";
import { XmlParser } from "../../src/io/XmlParser.js";

describe("XmlParser", () => {
  it("parses nested elements, attributes in order, and self-closing tags", () => {
    const root = XmlParser.parse(`<?xml version="1.0" encoding="UTF-8"?>
<!-- comment -->
<svg width="400" height='200'>
  <g id="a"><rect x="1" y="2"/></g>
  <circle r="3"/>
</svg>`);
    expect(root.tag).toBe("svg");
    expect([...root.attrs.keys()]).toEqual(["width", "height"]);
    expect(root.attrs.get("height")).toBe("200");
    expect(root.children.map((c) => c.tag)).toEqual(["g", "circle"]);
    expect(root.children[0]!.children[0]!.attrs.get("y")).toBe("2");
  });

  it("reads text content and decodes entities", () => {
    const root = XmlParser.parse(`<svg><text a="x &amp; y">  1 &lt; 2 &#65;&#x42;  </text></svg>`);
    const text = root.children[0]!;
    expect(text.text).toBe("1 < 2 AB");
    expect(text.attrs.get("a")).toBe("x & y");
  });

  it("supports CDATA and DOCTYPE", () => {
    const root = XmlParser.parse(`<!DOCTYPE svg><svg><text><![CDATA[a<b]]></text></svg>`);
    expect(root.children[0]!.text).toBe("a<b");
  });

  it.each([
    ["mismatched tags", "<svg><g></svg>"],
    ["unclosed tag", "<svg><g>"],
    ["missing attribute quotes", "<svg width=1></svg>"],
    ["no root", "   "],
    ["two roots", "<svg/><svg/>"],
    ["text outside root", "hello <svg/>"],
  ])("rejects %s", (_name, src) => {
    expect(() => XmlParser.parse(src)).toThrow(/^invalid svg:/);
  });
});
