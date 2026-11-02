import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Group } from "./Group.js";
import { Line } from "./Line.js";
import { Rect } from "./Rect.js";
import type { Shape } from "./Shape.js";
import { Style } from "./Style.js";
import type { SvgAttrs } from "./SvgAttrs.js";
import { SvgError } from "./SvgError.js";
import { Text } from "./Text.js";

/** 由 create 命令的位置参数构造图形。 */
export type ShapeCreator = (id: string, args: readonly string[]) => Shape;
/** 由外部 SVG 元素的属性（及 <text> 的子文本）构造图形，样式属性由工厂统一补上。 */
export type SvgShapeReader = (id: string, attrs: SvgAttrs, text: string) => Shape;

/**
 * 图形工厂：类型名 → 创建函数 / SVG 读取函数。
 * 按名字分派的两处之一（另一处是 CLI 命令分发），待重构为 ShapeProvider 插件。
 */
export class ShapeFactory {
  private readonly creators = new Map<string, ShapeCreator>();
  private readonly readers = new Map<string, SvgShapeReader>();

  /** 内置六种类型；其余类型（如 box）需由插件注册。 */
  static withBuiltins(): ShapeFactory {
    const factory = new ShapeFactory();
    factory.register("rect", Rect.create, Rect.fromSvg);
    factory.register("circle", Circle.create, Circle.fromSvg);
    factory.register("ellipse", Ellipse.create, Ellipse.fromSvg);
    factory.register("line", Line.create, Line.fromSvg);
    factory.register("text", Text.create, Text.fromSvg);
    factory.register(
      "g",
      (id, args) => {
        if (args.length > 0) throw new SvgError("usage: create g <id>");
        return new Group(id);
      },
      (id) => new Group(id),
    );
    return factory;
  }

  register(type: string, creator: ShapeCreator, reader: SvgShapeReader): void {
    this.creators.set(type, creator);
    this.readers.set(type, reader);
  }

  create(type: string, id: string, args: readonly string[]): Shape {
    const creator = this.creators.get(type);
    if (creator === undefined) throw new SvgError(`unknown shape type: ${type} (is the plugin loaded?)`);
    return creator(id, args);
  }

  supportsSvgTag(tag: string): boolean {
    return this.readers.has(tag);
  }

  fromSvg(tag: string, id: string, attrs: SvgAttrs, text: string): Shape {
    const reader = this.readers.get(tag);
    if (reader === undefined) throw new SvgError(`unknown shape type: ${tag} (is the plugin loaded?)`);
    const shape = reader(id, attrs, text);
    attrs.forEach((value, name) => {
      if (Style.isStyleAttr(name)) shape.set(name, value);
    });
    return shape;
  }
}
