/** 公共样式属性 fill / stroke / stroke-width；未设置的属性不输出。 */
export class Style {
  private static readonly ATTRS = ["fill", "stroke", "stroke-width"] as const;
  private readonly values = new Map<string, string>();

  static isStyleAttr(attr: string): boolean {
    return (Style.ATTRS as readonly string[]).includes(attr);
  }

  get(attr: string): string | null {
    return this.values.get(attr) ?? null;
  }

  /** value 为 null 表示清除该属性（用于撤销"原本未设置"的情况） */
  set(attr: string, value: string | null): void {
    if (value === null) {
      this.values.delete(attr);
    } else {
      this.values.set(attr, value);
    }
  }

  entries(): Array<[string, string]> {
    const result: Array<[string, string]> = [];
    for (const attr of Style.ATTRS) {
      const value = this.values.get(attr);
      if (value !== undefined) result.push([attr, value]);
    }
    return result;
  }

  summary(): string {
    return this.entries()
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
  }

  copy(): Style {
    const clone = new Style();
    this.values.forEach((v, k) => clone.values.set(k, v));
    return clone;
  }

  replaceWith(other: Style): void {
    this.values.clear();
    other.values.forEach((v, k) => this.values.set(k, v));
  }
}
