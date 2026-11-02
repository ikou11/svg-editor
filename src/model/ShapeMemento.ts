/** 图形可变属性（几何、样式、文本）的快照；不含树结构。 */
export interface ShapeMemento {
  restore(): void;
}
