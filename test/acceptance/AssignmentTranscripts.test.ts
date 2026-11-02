import { describe, expect, it } from "vitest";
import { Editor } from "../../src/app/Editor.js";
import { CliApplication } from "../../src/cli/CliApplication.js";
import { MemoryFileStore } from "../support/MemoryFileStore.js";
import { TranscriptReplay } from "../support/TranscriptReplay.js";

const OTHER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`;

function setup() {
  const files = new MemoryFileStore();
  files.files.set("other.svg", OTHER_SVG);
  const app = CliApplication.create(new Editor({ fileStore: files }));
  return { files, replay: new TranscriptReplay(app) };
}

describe("assignment section 6: typical session", () => {
  it("reproduces the transcript line by line", () => {
    const { replay } = setup();
    replay.run(`
svg> init 800 600
canvas 800x600 created
svg> create rect bg 0 0 800 600 #ffffff
rect#bg created
svg> create text title 20 40 "My Diagram"
text#title created
svg> create circle c1 100 100 20 red
circle#c1 created
svg> create rect box 200 80 60 60 #3366ff
rect#box created

svg> group markers c1 box
g#markers created with 2 children
svg> tree
svg (800x600)
├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff
├── text#title     (20,40) "My Diagram"
└── g#markers
    ├── circle#c1  cx=100 cy=100 r=20 fill=red
    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff

svg> move c1 30 0
circle#c1 moved to (130,100)
svg> undo
circle#c1 moved back to (100,100)
svg> redo
circle#c1 moved to (130,100)

svg> set title text "My Diagram v2"
text#title updated: text="My Diagram v2"
svg> undo
text#title updated: text="My Diagram"

svg> group bad c1 markers
error: cannot group a container into its own descendant: markers
svg> delete box
rect#box deleted
svg> undo
rect#box restored into g#markers

svg> save demo.svg
saved to demo.svg (5 elements)
svg> undo
error: undo not allowed after io command

svg> read other.svg
warning: assigned id rect1 to unnamed <rect>
read other.svg (7 elements)
svg> tree
svg (400x300)
├── rect#rect1     x=0 y=0 w=400 h=300 fill=#ffffff
├── text#t1        (10,290) "imported"
├── circle#c1      cx=50 cy=50 r=10
├── g#g1
│   ├── rect#r2    x=0 y=0 w=10 h=10
│   └── circle#c2  cx=5 cy=5 r=2
└── ellipse#e1     cx=1 cy=2 rx=3 ry=4
`);
  });

  it("show matches section 5.2", () => {
    const { replay } = setup();
    replay.run(`
svg> init 800 600
canvas 800x600 created
svg> create g markers
g#markers created
svg> create circle c1 100 100 20 red in markers
circle#c1 created in g#markers
svg> show c1
circle#c1  parent=g#markers
  cx=100 cy=100 r=20
  fill=red
`);
  });
});

describe("assignment section 6.1: two-node flowchart", () => {
  const SESSION = `
# 先建容器骨架，再往里放图形：每一步都显式表达归属
svg> init 800 600
canvas 800x600 created
svg> create g flowchart
g#flowchart created
svg> create g node1 in flowchart
g#node1 created in g#flowchart
svg> create rect start 120 100 160 60 #4a90d9 in node1
rect#start created in g#node1
svg> create text start-label 155 135 "开始" in node1
text#start-label created in g#node1

svg> create g node2 in flowchart
g#node2 created in g#flowchart
svg> create rect process 520 100 160 60 #f5a623 in node2
rect#process created in g#node2
svg> create text process-label 545 135 "处理数据" in node2
text#process-label created in g#node2

# 连接线挂在流程图容器下
svg> create line arrow1 280 130 520 130 black in flowchart
line#arrow1 created in g#flowchart

svg> tree
svg (800x600)
└── g#flowchart
    ├── g#node1
    │   ├── rect#start       x=120 y=100 w=160 h=60 fill=#4a90d9
    │   └── text#start-label (155,135) "开始"
    ├── g#node2
    │   ├── rect#process     x=520 y=100 w=160 h=60 fill=#f5a623
    │   └── text#process-label (545,135) "处理数据"
    └── line#arrow1          (280,130) -> (520,130)

# 容器移动：整个节点 2 下移 100，文字随行（容器的价值所在）
svg> move node2 0 100
g#node2 moved by (0,100)
svg> undo
g#node2 moved back by (0,-100)

# 改节点内容：只动组内 text
svg> set process-label text "处理数据 v2"
text#process-label updated: text="处理数据 v2"

svg> save flowchart.svg
saved to flowchart.svg (8 elements)
`;

  it("reproduces the session (tree alignment in the handout is hand-made, so whitespace runs are collapsed)", () => {
    const { replay } = setup();
    replay.run(SESSION, { collapseSpaces: true });
  });

  it("saves a well-formed file that reads back to the same structure", () => {
    const { files, replay } = setup();
    replay.run(SESSION, { collapseSpaces: true });
    const saved = files.files.get("flowchart.svg")!;
    expect(saved).toContain('<g id="flowchart">');
    expect(saved).toContain('<text id="process-label" x="545" y="135">处理数据 v2</text>');
    expect(saved).toContain('<line id="arrow1" x1="280" y1="130" x2="520" y2="130" stroke="black"/>');
  });
});

describe("box is a later-phase plugin type", () => {
  it("is rejected as an unknown shape type", () => {
    const { replay } = setup();
    replay.run(`
svg> init
canvas 800x600 created
svg> create box n1 120 100 160 60 "开始"
error: unknown shape type: box (is the plugin loaded?)
`);
  });
});
