import { Shape } from "./Shape.js";
import type { ShapeMemento } from "./ShapeMemento.js";
import { Style } from "./Style.js";
import { SvgError } from "./SvgError.js";

/** Composite 的容器：移动 / 缩放 / 设置样式都递归到全部子孙。 */
export class Group extends Shape {
  private readonly members: Shape[] = [];

  constructor(id: string) {
    super(id);
  }

  override get tag(): string {
    return "g";
  }

  get children(): readonly Shape[] {
    return this.members;
  }

  override asContainer(): Group {
    return this;
  }

  indexOf(child: Shape): number {
    return this.members.indexOf(child);
  }

  /** 全部子孙，先序（父在前，保持文档顺序）。 */
  descendants(): Shape[] {
    const result: Shape[] = [];
    for (const child of this.members) {
      result.push(child);
      const container = child.asContainer();
      if (container !== null) result.push(...container.descendants());
    }
    return result;
  }

  /** 插入子节点（默认追加到末尾）；child 必须尚未挂在任何容器下。 */
  add(child: Shape, index: number = this.members.length): void {
    if (child === this || this.isInside(child)) {
      throw new SvgError(`cannot group a container into its own descendant: ${child.id}`);
    }
    if (child.parent !== null) throw new Error(`shape already has a parent: ${child.id}`);
    this.members.splice(index, 0, child);
    child.attachTo(this);
  }

  /** 摘除子节点并返回它原来的下标，便于撤销时放回原位。 */
  remove(child: Shape): number {
    const index = this.members.indexOf(child);
    if (index < 0) throw new Error(`not a child of ${this.id}: ${child.id}`);
    this.members.splice(index, 1);
    child.attachTo(null);
    return index;
  }

  override geometrySummary(): string {
    return "";
  }

  override styleSummary(): string {
    return "";
  }

  override svgAttributes(): ReadonlyArray<readonly [string, string]> {
    return [];
  }

  override get(): string | null {
    return null;
  }

  /** 容器只接受样式属性，并把它应用到所有子孙。 */
  override set(attr: string, value: string | null): void {
    if (!Style.isStyleAttr(attr)) throw new SvgError(`unknown attribute: ${attr}`);
    for (const child of this.members) child.set(attr, value);
  }

  override move(dx: number, dy: number): void {
    for (const child of this.members) child.move(dx, dy);
  }

  protected override applyScale(factor: number): void {
    for (const child of this.members) child.scale(factor);
  }

  override memento(): ShapeMemento {
    const parts = this.members.map((child) => child.memento());
    return { restore: () => parts.forEach((part) => part.restore()) };
  }
}
