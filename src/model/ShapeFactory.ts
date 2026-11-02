import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Group } from "./Group.js";
import { Line } from "./Line.js";
import { Rect } from "./Rect.js";
import type { Shape } from "./Shape.js";
import { SvgError } from "./SvgError.js";
import { Text } from "./Text.js";

export type ShapeCreator = (id: string, args: readonly string[]) => Shape;

/**
 * 图形工厂：类型名 → 创建函数。
 * 按名字分派的两处之一（另一处是 CLI 命令分发），待重构为 ShapeProvider 插件。
 */
export class ShapeFactory {
  private readonly creators = new Map<string, ShapeCreator>();

  /** 内置六种类型；其余类型（如 box）需由插件注册。 */
  static withBuiltins(): ShapeFactory {
    const factory = new ShapeFactory();
    factory.register("rect", Rect.create);
    factory.register("circle", Circle.create);
    factory.register("ellipse", Ellipse.create);
    factory.register("line", Line.create);
    factory.register("text", Text.create);
    factory.register("g", (id, args) => {
      if (args.length > 0) throw new SvgError("usage: create g <id>");
      return new Group(id);
    });
    return factory;
  }

  register(type: string, creator: ShapeCreator): void {
    this.creators.set(type, creator);
  }

  create(type: string, id: string, args: readonly string[]): Shape {
    const creator = this.creators.get(type);
    if (creator === undefined) throw new SvgError(`unknown shape type: ${type} (is the plugin loaded?)`);
    return creator(id, args);
  }
}
