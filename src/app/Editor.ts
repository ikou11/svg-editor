import { AddToCommand } from "../command/AddToCommand.js";
import type { Command } from "../command/Command.js";
import { CreateCommand } from "../command/CreateCommand.js";
import { DeleteCommand } from "../command/DeleteCommand.js";
import { GroupCommand } from "../command/GroupCommand.js";
import { History } from "../command/History.js";
import { MoveCommand } from "../command/MoveCommand.js";
import { ScaleCommand } from "../command/ScaleCommand.js";
import { SetCommand } from "../command/SetCommand.js";
import { UngroupCommand } from "../command/UngroupCommand.js";
import { ZOrderCommand } from "../command/ZOrderCommand.js";
import { FileStore } from "../io/FileStore.js";
import { SvgReader } from "../io/SvgReader.js";
import { SvgWriter } from "../io/SvgWriter.js";
import { Document } from "../model/Document.js";
import { NumberFormat } from "../model/NumberFormat.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { SvgError } from "../model/SvgError.js";

export interface EditorOptions {
  readonly factory?: ShapeFactory;
  readonly fileStore?: FileStore;
}

/**
 * 应用门面：持有当前文档、撤销历史与"io 命令后禁止 undo"状态，
 * 把界面层的请求翻译成 Command。界面层（cli）只和它打交道。
 * 所有方法返回给用户看的反馈；失败抛 SvgError，且不改变任何状态。
 */
export class Editor {
  private doc: Document | null = null;
  private path: string | null = null;
  private ioLocked = false;
  private readonly history = new History();
  private readonly factory: ShapeFactory;
  private readonly fileStore: FileStore;

  constructor(options: EditorOptions = {}) {
    this.factory = options.factory ?? ShapeFactory.withBuiltins();
    this.fileStore = options.fileStore ?? new FileStore();
  }

  /** 当前文档，供界面层只读渲染；未 init/read 时报错。 */
  document(): Document {
    if (this.doc === null) throw new SvgError("no document. use 'init' or 'read' first");
    return this.doc;
  }

  // ---- 文档类命令：执行后 undo/redo 禁止 ----

  init(width = 800, height = 600): string {
    this.replaceDocument(new Document(width, height), null);
    return `canvas ${NumberFormat.format(width)}x${NumberFormat.format(height)} created`;
  }

  /** 返回若干行输出：读入时产生的警告，随后是摘要。 */
  read(path: string): string[] {
    const result = new SvgReader(this.factory).read(this.fileStore.read(path));
    this.replaceDocument(result.document, path);
    return [...result.warnings, `read ${path} (${result.document.elementCount} elements)`];
  }

  save(path?: string): string {
    const doc = this.document();
    const target = path ?? this.path;
    if (target === null) throw new SvgError("no file path. use 'save <file>'");
    this.fileStore.write(target, new SvgWriter().write(doc));
    this.path = target;
    this.ioLocked = true;
    return `saved to ${target} (${doc.elementCount} elements)`;
  }

  /** 无参数只显示尺寸；带参数修改尺寸（未给的一维保持不变）。 */
  canvas(width?: number, height?: number): string {
    const doc = this.document();
    if (width === undefined) return `canvas ${NumberFormat.format(doc.width)}x${NumberFormat.format(doc.height)}`;
    doc.resize(width, height ?? doc.height);
    this.ioLocked = true;
    return `canvas resized to ${NumberFormat.format(doc.width)}x${NumberFormat.format(doc.height)}`;
  }

  // ---- 撤销 / 重做 ----

  undo(): string {
    this.assertHistoryUsable();
    return this.history.undo();
  }

  redo(): string {
    this.assertHistoryUsable();
    return this.history.redo();
  }

  // ---- 编辑类命令：每条 = 一个 undo 单元 ----

  create(type: string, id: string, args: readonly string[], containerId?: string): string {
    return this.apply((doc) => new CreateCommand(doc, this.factory, type, id, args, containerId));
  }

  delete(id: string): string {
    return this.apply((doc) => new DeleteCommand(doc, id));
  }

  move(id: string, dx: number, dy: number): string {
    return this.apply((doc) => new MoveCommand(doc, id, dx, dy));
  }

  scale(id: string, factor: number): string {
    return this.apply((doc) => new ScaleCommand(doc, id, factor));
  }

  set(id: string, attr: string, value: string): string {
    return this.apply((doc) => new SetCommand(doc, id, attr, value));
  }

  group(newGid: string, ids: readonly string[]): string {
    return this.apply((doc) => new GroupCommand(doc, newGid, ids));
  }

  ungroup(gid: string): string {
    return this.apply((doc) => new UngroupCommand(doc, gid));
  }

  addTo(gid: string, id: string): string {
    return this.apply((doc) => new AddToCommand(doc, gid, id));
  }

  front(id: string): string {
    return this.apply((doc) => ZOrderCommand.front(doc, id));
  }

  back(id: string): string {
    return this.apply((doc) => ZOrderCommand.back(doc, id));
  }

  private apply(build: (doc: Document) => Command): string {
    const command = build(this.document());
    const message = this.history.run(command);
    this.ioLocked = false;
    return message;
  }

  private assertHistoryUsable(): void {
    this.document();
    if (this.ioLocked) throw new SvgError("undo not allowed after io command");
  }

  private replaceDocument(doc: Document, path: string | null): void {
    this.doc = doc;
    this.path = path;
    this.history.clear();
    this.ioLocked = true;
  }
}
