import { describe, expect, it } from "vitest";
import { Circle } from "../../src/model/Circle.js";
import { Ellipse } from "../../src/model/Ellipse.js";
import { Line } from "../../src/model/Line.js";
import { Rect } from "../../src/model/Rect.js";
import { Text } from "../../src/model/Text.js";

describe("leaf shapes", () => {
  it("Rect.create parses args and describes itself like tree expects", () => {
    const r = Rect.create("bg", ["0", "0", "800", "600", "#ffffff"]);
    expect(r.describe()).toBe("x=0 y=0 w=800 h=600 fill=#ffffff");
    expect(r.svgAttributes()).toEqual([
      ["x", "0"], ["y", "0"], ["width", "800"], ["height", "600"], ["fill", "#ffffff"],
    ]);
  });

  it("omitted fill is not written", () => {
    const r = Rect.create("r", ["1", "2", "3", "4"]);
    expect(r.svgAttributes().map(([k]) => k)).not.toContain("fill");
    expect(r.describe()).toBe("x=1 y=2 w=3 h=4");
  });

  it("create reports usage for missing, extra and non-numeric args", () => {
    expect(() => Rect.create("r", ["1", "2"])).toThrow("usage: create rect <id> <x> <y> <w> <h> [fill]");
    expect(() => Rect.create("r", ["1", "2", "3", "4", "red", "extra"])).toThrow("usage: create rect");
    expect(() => Circle.create("c", ["a", "2", "3"])).toThrow("invalid number: a");
  });

  it("Circle / Ellipse describe", () => {
    expect(Circle.create("c1", ["100", "100", "20", "red"]).describe()).toBe("cx=100 cy=100 r=20 fill=red");
    expect(Ellipse.create("e", ["1", "2", "3", "4"]).describe()).toBe("cx=1 cy=2 rx=3 ry=4");
  });

  it("Line moves both end points and uses stroke for color", () => {
    const l = Line.create("arrow1", ["280", "130", "520", "130", "black"]);
    expect(l.describe()).toBe("(280,130) -> (520,130)");
    expect(l.get("stroke")).toBe("black");
    l.move(0, 100);
    expect(l.describe()).toBe("(280,230) -> (520,230)");
  });

  it("Text keeps content separate from attributes", () => {
    const t = Text.create("title", ["20", "40", "My Diagram"]);
    expect(t.describe()).toBe('(20,40) "My Diagram"');
    expect(t.textContent()).toBe("My Diagram");
    expect(t.svgAttributes()).toEqual([["x", "20"], ["y", "40"]]);
  });

  it("move shifts position but not size", () => {
    const r = Rect.create("r", ["10", "20", "100", "50"]);
    r.move(5, -5);
    expect(r.describe()).toBe("x=15 y=15 w=100 h=50");
  });

  it("scale multiplies position and size", () => {
    const r = Rect.create("r", ["10", "20", "100", "50"]);
    r.scale(2);
    expect(r.describe()).toBe("x=20 y=40 w=200 h=100");
  });

  it("set accepts whitelisted attributes only", () => {
    const c = Circle.create("c", ["1", "2", "3"]);
    c.set("r", "10");
    c.set("stroke-width", "2");
    expect(c.get("r")).toBe("10");
    expect(c.get("stroke-width")).toBe("2");
    expect(() => c.set("width", "1")).toThrow("unknown attribute: width");
    expect(() => c.set("r", "abc")).toThrow("invalid number: abc");
  });

  it("Text.set text changes content and memento restores it", () => {
    const t = Text.create("t", ["0", "0", "old"]);
    const saved = t.memento();
    t.set("text", "new");
    expect(t.textContent()).toBe("new");
    saved.restore();
    expect(t.textContent()).toBe("old");
  });

  it("a failed set leaves the shape unchanged", () => {
    const r = Rect.create("r", ["1", "2", "3", "4"]);
    expect(() => r.set("x", "oops")).toThrow();
    expect(r.get("x")).toBe("1");
  });
});
