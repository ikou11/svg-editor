import { SvgError } from "./SvgError.js";

/** 从外部 SVG 元素读到的属性（只读视图），供各图形的 fromSvg 使用。 */
export class SvgAttrs {
  constructor(private readonly map: ReadonlyMap<string, string>) {}

  /** 缺省按 SVG 规则视为 0；允许 "10px" 这种带单位 px 的写法。 */
  number(name: string, fallback = 0): number {
    const raw = this.map.get(name);
    if (raw === undefined) return fallback;
    const text = raw.trim().replace(/px$/, "");
    const n = Number(text);
    if (text === "" || !Number.isFinite(n)) throw new SvgError(`invalid number: ${raw}`);
    return n;
  }

  forEach(fn: (value: string, name: string) => void): void {
    this.map.forEach(fn);
  }
}
