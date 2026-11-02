import { NumberFormat } from "./NumberFormat.js";
import { Shape } from "./Shape.js";
import type { ShapeMemento } from "./ShapeMemento.js";
import { Style } from "./Style.js";
import { SvgError } from "./SvgError.js";

/**
 * 叶子图形：几何属性是一组有名字的数值（按声明顺序输出），
 * 子类只需声明哪些键随 x / y 平移，以及各自的摘要格式。
 */
export abstract class LeafShape extends Shape {
  protected readonly paint = new Style();
  private readonly geometry = new Map<string, number>();

  /** 平移时随 dx 变化的几何键 */
  protected abstract readonly xKeys: readonly string[];
  /** 平移时随 dy 变化的几何键 */
  protected abstract readonly yKeys: readonly string[];

  protected constructor(id: string, geometry: ReadonlyArray<readonly [string, number]>, fill?: string) {
    super(id);
    for (const [key, value] of geometry) this.geometry.set(key, value);
    if (fill !== undefined) this.paint.set("fill", fill);
  }

  protected num(key: string): number {
    const value = this.geometry.get(key);
    if (value === undefined) throw new Error(`geometry key not declared: ${key}`);
    return value;
  }

  override styleSummary(): string {
    return this.paint.summary();
  }

  override svgAttributes(): ReadonlyArray<readonly [string, string]> {
    const geometry: Array<[string, string]> = [];
    this.geometry.forEach((v, k) => geometry.push([k, NumberFormat.format(v)]));
    return [...geometry, ...this.paint.entries()];
  }

  override get(attr: string): string | null {
    if (Style.isStyleAttr(attr)) return this.paint.get(attr);
    const value = this.geometry.get(attr);
    return value === undefined ? null : NumberFormat.format(value);
  }

  override set(attr: string, value: string | null): void {
    if (Style.isStyleAttr(attr)) {
      this.paint.set(attr, value);
    } else if (this.geometry.has(attr)) {
      if (value === null) throw new SvgError(`cannot clear attribute: ${attr}`);
      const n = Number(value);
      if (value.trim() === "" || !Number.isFinite(n)) throw new SvgError(`invalid number: ${value}`);
      this.geometry.set(attr, n);
    } else {
      throw new SvgError(`unknown attribute: ${attr}`);
    }
  }

  override move(dx: number, dy: number): void {
    for (const key of this.xKeys) this.geometry.set(key, this.num(key) + dx);
    for (const key of this.yKeys) this.geometry.set(key, this.num(key) + dy);
  }

  protected override applyScale(factor: number): void {
    this.geometry.forEach((v, k) => this.geometry.set(k, v * factor));
  }

  override memento(): ShapeMemento {
    const geometry = new Map(this.geometry);
    const paint = this.paint.copy();
    return {
      restore: () => {
        geometry.forEach((v, k) => this.geometry.set(k, v));
        this.paint.replaceWith(paint);
      },
    };
  }
}
