/** XML 元素节点：标签、属性（保持出现顺序）、子元素与直接文本。 */
export class XmlNode {
  readonly attrs = new Map<string, string>();
  readonly children: XmlNode[] = [];
  private textParts: string[] = [];

  constructor(readonly tag: string) {}

  appendText(text: string): void {
    this.textParts.push(text);
  }

  /** 元素直接包含的文本（不含子元素文本），首尾空白已去除。 */
  get text(): string {
    return this.textParts.join("").trim();
  }
}
