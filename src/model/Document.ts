import { Group } from "./Group.js";
import type { Shape } from "./Shape.js";
import { SvgError } from "./SvgError.js";

/** 画布尺寸 + 图形树的根；id 查找通过遍历完成，不维护易失效的索引。 */
export class Document {
  static readonly ROOT_ID = "svg";

  readonly root = new Group(Document.ROOT_ID);
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(width = 800, height = 600) {
    Document.checkSize(width, height);
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  get width(): number {
    return this.canvasWidth;
  }

  get height(): number {
    return this.canvasHeight;
  }

  resize(width: number, height: number): void {
    Document.checkSize(width, height);
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /** 文档中全部图形（不含根），先序。 */
  shapes(): Shape[] {
    return this.root.descendants();
  }

  get elementCount(): number {
    return this.shapes().length;
  }

  find(id: string): Shape | undefined {
    return this.shapes().find((s) => s.id === id);
  }

  has(id: string): boolean {
    return this.find(id) !== undefined;
  }

  require(id: string): Shape {
    const shape = this.find(id);
    if (shape === undefined) throw new SvgError(`no such shape: ${id}`);
    return shape;
  }

  /** 供 `in <containerId>` 使用：必须存在且是容器。 */
  requireContainer(id: string): Group {
    const shape = this.find(id);
    if (shape === undefined) throw new SvgError(`no such container: ${id}`);
    const container = shape.asContainer();
    if (container === null) throw new SvgError(`not a container: ${id}`);
    return container;
  }

  /** 反馈信息中的容器名：根容器显示为 svg，其余为 tag#id。 */
  labelOf(container: Group): string {
    return container === this.root ? "svg" : container.label();
  }

  /** id 冲突检查；读入外部文件之外，所有新建图形都要先过这里。 */
  assertIdFree(id: string): void {
    if (this.has(id)) throw new SvgError(`id already exists: ${id}`);
  }

  private static checkSize(width: number, height: number): void {
    if (!(width > 0) || !(height > 0)) throw new SvgError("canvas size must be positive");
  }
}
