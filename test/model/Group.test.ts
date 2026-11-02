import { describe, expect, it } from "vitest";
import { Group } from "../../src/model/Group.js";
import { LeafShape } from "../../src/model/LeafShape.js";

/** 测试专用叶子：一个点，几何键 x / y。 */
class Dot extends LeafShape {
  protected override readonly xKeys = ["x"];
  protected override readonly yKeys = ["y"];

  constructor(id: string, x: number, y: number, fill?: string) {
    super(id, [["x", x], ["y", y]], fill);
  }

  override get tag(): string {
    return "dot";
  }

  override geometrySummary(): string {
    return `x=${this.num("x")} y=${this.num("y")}`;
  }
}

describe("Group (Composite)", () => {
  it("add/remove keep parent pointers and report the original index", () => {
    const g = new Group("g");
    const a = new Dot("a", 0, 0);
    const b = new Dot("b", 0, 0);
    g.add(a);
    g.add(b);
    expect(a.parent).toBe(g);
    expect(g.remove(a)).toBe(0);
    expect(a.parent).toBeNull();
    g.add(a, 0);
    expect(g.children.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("move recurses into nested containers", () => {
    const outer = new Group("outer");
    const inner = new Group("inner");
    const a = new Dot("a", 1, 2);
    const b = new Dot("b", 10, 20);
    outer.add(a);
    outer.add(inner);
    inner.add(b);
    outer.move(5, 5);
    expect(a.get("x")).toBe("6");
    expect(b.get("y")).toBe("25");
  });

  it("scale recurses and rejects non-positive factors", () => {
    const g = new Group("g");
    g.add(new Dot("a", 2, 4));
    g.scale(2);
    expect(g.descendants()[0]!.get("x")).toBe("4");
    expect(() => g.scale(0)).toThrow("scale factor must be positive");
    expect(() => g.scale(-1)).toThrow("scale factor must be positive");
  });

  it("set applies style to all descendants but rejects geometry attributes", () => {
    const g = new Group("g");
    const a = new Dot("a", 0, 0);
    g.add(a);
    g.set("fill", "red");
    expect(a.get("fill")).toBe("red");
    expect(() => g.set("x", "1")).toThrow("unknown attribute: x");
  });

  it("memento restores geometry and style of the whole subtree", () => {
    const g = new Group("g");
    const a = new Dot("a", 1, 1, "blue");
    g.add(a);
    const saved = g.memento();
    g.move(10, 10);
    g.set("fill", "red");
    saved.restore();
    expect(a.get("x")).toBe("1");
    expect(a.get("fill")).toBe("blue");
  });

  it("memento restores an originally unset style attribute", () => {
    const a = new Dot("a", 0, 0);
    const saved = a.memento();
    a.set("stroke", "black");
    saved.restore();
    expect(a.get("stroke")).toBeNull();
  });

  it("refuses to nest a container inside its own descendant", () => {
    const outer = new Group("outer");
    const inner = new Group("inner");
    outer.add(inner);
    outer.remove(inner);
    inner.add(outer);
    expect(() => outer.add(inner)).toThrow("cannot group a container into its own descendant");
  });

  it("isInside walks the ancestor chain", () => {
    const outer = new Group("outer");
    const inner = new Group("inner");
    const a = new Dot("a", 0, 0);
    outer.add(inner);
    inner.add(a);
    expect(a.isInside(outer)).toBe(true);
    expect(outer.isInside(a)).toBe(false);
  });

  it("rejects ids containing whitespace", () => {
    expect(() => new Group("bad id")).toThrow(`invalid id: "bad id"`);
  });
});
