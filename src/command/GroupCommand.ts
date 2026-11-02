import type { Document } from "../model/Document.js";
import { Group } from "../model/Group.js";
import type { Shape } from "../model/Shape.js";
import { SvgError } from "../model/SvgError.js";
import type { Command } from "./Command.js";

interface Origin {
  readonly shape: Shape;
  readonly parent: Group;
  index: number;
}

/**
 * 新建容器并收编若干图形：新容器放在"文档顺序最靠前的图形"原来的位置，
 * 子节点保持它们原有的文档顺序。整条命令是一个 undo 单元。
 */
export class GroupCommand implements Command {
  private readonly group: Group;
  private readonly members: Shape[];
  private readonly target: Group;
  private readonly origins: Origin[] = [];
  private groupIndex = -1;

  constructor(
    doc: Document,
    newGid: string,
    ids: readonly string[],
  ) {
    doc.assertIdFree(newGid);
    if (ids.length === 0) throw new SvgError("usage: group <newGid> <id1> <id2>...");
    const wanted = new Set(ids.map((id) => doc.require(id)));
    this.members = doc.shapes().filter((s) => wanted.has(s));
    for (const inner of this.members) {
      const outer = this.members.find((m) => m !== inner && inner.isInside(m));
      if (outer !== undefined) {
        throw new SvgError(`cannot group a container into its own descendant: ${outer.id}`);
      }
    }
    this.target = this.members[0]!.parent!;
    this.group = new Group(newGid);
  }

  execute(): string {
    this.origins.length = 0;
    for (const shape of this.members) {
      const parent = shape.parent!;
      this.origins.push({ shape, parent, index: parent.remove(shape) });
    }
    this.groupIndex = this.origins[0]!.index;
    this.target.add(this.group, this.groupIndex);
    for (const shape of this.members) this.group.add(shape);
    return `${this.group.label()} created with ${this.members.length} children`;
  }

  undo(): string {
    for (const shape of this.members) this.group.remove(shape);
    this.target.remove(this.group);
    for (const origin of [...this.origins].reverse()) origin.parent.add(origin.shape, origin.index);
    return `${this.group.label()} removed`;
  }
}
