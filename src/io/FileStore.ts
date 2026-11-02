import { readFileSync, writeFileSync } from "node:fs";
import { SvgError } from "../model/SvgError.js";

/** 文件系统访问的唯一出口，便于在测试中替换。 */
export class FileStore {
  read(path: string): string {
    try {
      return readFileSync(path, "utf8");
    } catch {
      throw new SvgError(`cannot read file: ${path}`);
    }
  }

  write(path: string, content: string): void {
    try {
      writeFileSync(path, content, "utf8");
    } catch {
      throw new SvgError(`cannot write file: ${path}`);
    }
  }
}
