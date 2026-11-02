import type { Group } from "./Group.js";
import type { ShapeMemento } from "./ShapeMemento.js";
import { SvgError } from "./SvgError.js";

/** Composite 的组件角色：叶子与容器共享同一套操作接口。 */
export abstract class Shape {
  private owner: Group | null = null;

  protected constructor(readonly id: string) {
    if (!/^\S+$/.test(id)) throw new SvgError(`invalid id: ${id}`);
  }

  abstract get tag(): string;

  get parent(): Group | null {
    return this.owner;
  }

  /** 仅供 Group.add / Group.remove 维护父指针，其他代码不要直接调用。 */
  attachTo(parent: Group | null): void {
    this.owner = parent;
  }

  /** 容器返回自身，叶子返回 null；避免调用方做类型判断。 */
  asContainer(): Group | null {
    return null;
  }

  isInside(container: Shape): boolean {
    for (let p = this.owner; p !== null; p = p.parent) {
      if (p === container) return true;
    }
    return false;
  }

  label(): string {
    return `${this.tag}#${this.id}`;
  }

  /** tree 中内联的几何摘要，如 "x=0 y=0 w=10 h=10"。 */
  abstract geometrySummary(): string;

  /** 样式摘要，如 "fill=red stroke=black"，无样式时为空串。 */
  abstract styleSummary(): string;

  /** tree 中一行的属性部分。 */
  describe(): string {
    return [this.geometrySummary(), this.styleSummary()].filter((s) => s !== "").join(" ");
  }

  /** 序列化用的属性（不含 id），按输出顺序。 */
  abstract svgAttributes(): ReadonlyArray<readonly [string, string]>;

  /** `<text>` 的子文本内容；其他图形为 null。 */
  textContent(): string | null {
    return null;
  }

  /** 读取白名单属性的当前值，未设置或不适用时为 null。 */
  abstract get(attr: string): string | null;

  /** 设置白名单属性；value 为 null 仅用于撤销时清除样式属性。 */
  abstract set(attr: string, value: string | null): void;

  abstract move(dx: number, dy: number): void;

  /** 叶子的定位点 (x,y)，用于 "moved to (x,y)" 反馈；容器没有单一位置，返回 null。 */
  anchor(): readonly [number, number] | null {
    return null;
  }

  scale(factor: number): void {
    if (!(factor > 0)) throw new SvgError("scale factor must be positive");
    this.applyScale(factor);
  }

  protected abstract applyScale(factor: number): void;

  abstract memento(): ShapeMemento;
}
