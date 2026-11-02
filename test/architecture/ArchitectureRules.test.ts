import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

/** 把 doc/README.md 中的架构规则变成可执行检查：依赖方向、一类一文件、禁止按类型分支。 */
const SRC = join(import.meta.dirname, "../../src");

const ALLOWED: Record<string, string[]> = {
  model: [],
  command: ["model"],
  io: ["model"],
  app: ["command", "io", "model"],
  cli: ["app", "model"],
};

interface SourceFile {
  readonly module: string;
  readonly name: string;
  readonly path: string;
  readonly text: string;
}

function sources(): SourceFile[] {
  return Object.keys(ALLOWED).flatMap((module) =>
    readdirSync(join(SRC, module))
      .filter((f) => f.endsWith(".ts"))
      .map((f) => {
        const path = join(SRC, module, f);
        return { module, name: basename(f, ".ts"), path: `${module}/${f}`, text: readFileSync(path, "utf8") };
      }),
  );
}

describe("architecture rules (doc/README.md §1.3)", () => {
  it("every src directory is a declared module", () => {
    expect(readdirSync(SRC).sort()).toEqual(Object.keys(ALLOWED).sort());
  });

  it("modules only import from the modules they are allowed to depend on", () => {
    const violations: string[] = [];
    for (const file of sources()) {
      for (const m of file.text.matchAll(/["']\.\.\/([a-z]+)\//g)) {
        const target = m[1]!;
        if (!ALLOWED[file.module]!.includes(target)) violations.push(`${file.path} -> ${target}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("the module dependency graph has no cycles", () => {
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (m: string): void => {
      expect(visiting.has(m), `cycle through ${m}`).toBe(false);
      if (done.has(m)) return;
      visiting.add(m);
      ALLOWED[m]!.forEach(visit);
      visiting.delete(m);
      done.add(m);
    };
    Object.keys(ALLOWED).forEach(visit);
  });

  it("cli never builds Commands or touches the file system directly", () => {
    const offenders = sources()
      .filter((f) => f.module === "cli")
      .filter((f) => /["']\.\.\/(command|io)\/|node:fs/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("only io touches the file system, and only cli touches the terminal", () => {
    const fsUsers = sources().filter((f) => /node:fs/.test(f.text)).map((f) => f.path);
    expect(fsUsers).toEqual(["io/FileStore.ts"]);
    const terminalUsers = sources().filter((f) => /node:readline|process\.std/.test(f.text)).map((f) => f.path);
    expect(terminalUsers.sort()).toEqual(["cli/Repl.ts", "cli/main.ts"]);
  });

  it("one class per file, named after the file", () => {
    const bad: string[] = [];
    for (const file of sources().filter((f) => f.name !== "main")) {
      const declared = [...file.text.matchAll(/^(?:export )?(?:abstract )?(?:class|interface) (\w+)/gm)].map((m) => m[1]!);
      const classes = [...file.text.matchAll(/^(?:export )?(?:abstract )?class (\w+)/gm)].map((m) => m[1]!);
      if (classes.length > 1 || !declared.includes(file.name)) bad.push(`${file.path}: ${declared.join(",")}`);
    }
    expect(bad).toEqual([]);
  });

  it("no switch statements, and instanceof only for exception types", () => {
    const bad: string[] = [];
    for (const file of sources()) {
      if (/\bswitch\s*\(/.test(file.text)) bad.push(`${file.path}: switch`);
      for (const m of file.text.matchAll(/instanceof\s+(\w+)/g)) {
        if (!["SvgError", "Error"].includes(m[1]!)) bad.push(`${file.path}: instanceof ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("name-based dispatch exists only in CommandRegistry and ShapeFactory", () => {
    const maps = sources()
      .filter((f) => /new Map<string, (CliCommand|ShapeCreator|SvgShapeReader)>/.test(f.text))
      .map((f) => f.path)
      .sort();
    expect(maps).toEqual(["cli/CommandRegistry.ts", "model/ShapeFactory.ts"]);
  });
});
