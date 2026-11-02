import { FileStore } from "../../src/io/FileStore.js";
import { SvgError } from "../../src/model/SvgError.js";

/** 测试用：文件内容放在内存 Map 里，不碰磁盘。 */
export class MemoryFileStore extends FileStore {
  readonly files = new Map<string, string>();

  override read(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) throw new SvgError(`cannot read file: ${path}`);
    return content;
  }

  override write(path: string, content: string): void {
    this.files.set(path, content);
  }
}
