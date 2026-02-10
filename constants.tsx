import { LevelConfig, Direction, BlockType } from './types';
import { ArrowUp, ArrowDown, CornerUpLeft, CornerUpRight, Repeat } from 'lucide-react';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "初试锋芒",
    description: "编写程序让机器人到达绿色的数据终端。",
    gridSize: 5,
    startPos: { x: 0, y: 2 },
    startDir: Direction.East,
    entities: [
      { id: 'e1', type: 'end', x: 4, y: 2 },
      { id: 'w1', type: 'wall', x: 2, y: 0 },
      { id: 'w2', type: 'wall', x: 2, y: 4 },
    ],
    optimalBlocks: 4,
    availableBlocks: [BlockType.Move, BlockType.MoveBack],
    solution: [
      { type: BlockType.Move },
      { type: BlockType.Move },
      { type: BlockType.Move },
      { type: BlockType.Move },
    ]
  },
  {
    id: 2,
    name: "直角转弯",
    description: "使用转向指令，绕过前方的防火墙。",
    gridSize: 5,
    startPos: { x: 1, y: 3 },
    startDir: Direction.North,
    entities: [
      { id: 'e1', type: 'end', x: 3, y: 1 },
      { id: 'w2', type: 'wall', x: 2, y: 2 },
      { id: 'w3', type: 'wall', x: 3, y: 2 },
    ],
    optimalBlocks: 5,
    availableBlocks: [BlockType.Move, BlockType.TurnRight, BlockType.TurnLeft, BlockType.MoveBack],
    solution: [
      { type: BlockType.Move },
      { type: BlockType.Move },
      { type: BlockType.TurnRight },
      { type: BlockType.Move },
      { type: BlockType.Move },
    ]
  },
  {
    id: 3,
    name: "循环逻辑",
    description: "使用“循环”指令来高效地长距离移动。",
    gridSize: 6,
    startPos: { x: 0, y: 0 },
    startDir: Direction.East,
    entities: [
      { id: 'c1', type: 'coin', x: 2, y: 0 },
      { id: 'c2', type: 'coin', x: 4, y: 0 },
      { id: 'e1', type: 'end', x: 5, y: 5 },
    ],
    optimalBlocks: 3, 
    availableBlocks: [BlockType.Move, BlockType.TurnRight, BlockType.Repeat],
    solution: [
      { 
        type: BlockType.Repeat, 
        value: 5, 
        children: [{ type: BlockType.Move }] 
      },
      { type: BlockType.TurnRight },
      { 
        type: BlockType.Repeat, 
        value: 5, 
        children: [{ type: BlockType.Move }] 
      },
    ]
  },
  {
    id: 4,
    name: "S形回廊",
    description: "通过连续的转向操作穿越狭窄的通道。",
    gridSize: 6,
    startPos: { x: 0, y: 5 },
    startDir: Direction.East,
    entities: [
      { id: 'e1', type: 'end', x: 5, y: 0 },
      { id: 'w1', type: 'wall', x: 1, y: 5 }, { id: 'w2', type: 'wall', x: 2, y: 5 },
      { id: 'w3', type: 'wall', x: 1, y: 3 }, { id: 'w4', type: 'wall', x: 0, y: 3 },
      { id: 'w5', type: 'wall', x: 4, y: 2 }, { id: 'w6', type: 'wall', x: 5, y: 2 },
    ],
    optimalBlocks: 6,
    availableBlocks: [BlockType.Move, BlockType.TurnLeft, BlockType.TurnRight, BlockType.Repeat],
    solution: []
  },
  {
    id: 5,
    name: "往返跑",
    description: "前往死胡同获取密钥（金币），然后原路返回并前往出口。",
    gridSize: 5,
    startPos: { x: 2, y: 2 },
    startDir: Direction.North,
    entities: [
      { id: 'c1', type: 'coin', x: 2, y: 0 },
      { id: 'e1', type: 'end', x: 2, y: 4 },
      { id: 'w1', type: 'wall', x: 1, y: 0 }, { id: 'w2', type: 'wall', x: 3, y: 0 },
      { id: 'w3', type: 'wall', x: 1, y: 1 }, { id: 'w4', type: 'wall', x: 3, y: 1 },
      { id: 'w5', type: 'wall', x: 1, y: 2 }, { id: 'w6', type: 'wall', x: 3, y: 2 },
      { id: 'w7', type: 'wall', x: 1, y: 3 }, { id: 'w8', type: 'wall', x: 3, y: 3 },
      { id: 'w9', type: 'wall', x: 1, y: 4 }, { id: 'w10', type: 'wall', x: 3, y: 4 },
    ],
    optimalBlocks: 5,
    availableBlocks: [BlockType.Move, BlockType.MoveBack, BlockType.TurnLeft, BlockType.TurnRight],
    solution: []
  },
  {
    id: 6,
    name: "回旋镖",
    description: "利用循环指令构建复杂的巡逻路径。",
    gridSize: 7,
    startPos: { x: 1, y: 1 },
    startDir: Direction.East,
    entities: [
      { id: 'e1', type: 'end', x: 1, y: 2 },
      { id: 'w1', type: 'wall', x: 3, y: 3 },
      { id: 'c1', type: 'coin', x: 5, y: 1 },
      { id: 'c2', type: 'coin', x: 5, y: 5 },
      { id: 'c3', type: 'coin', x: 1, y: 5 },
    ],
    optimalBlocks: 4,
    availableBlocks: [BlockType.Move, BlockType.TurnRight, BlockType.Repeat],
    solution: []
  },
  {
    id: 7,
    name: "双子塔",
    description: "在有限的空间内进行精细操作。",
    gridSize: 6,
    startPos: { x: 0, y: 5 },
    startDir: Direction.North,
    entities: [
      { id: 'e1', type: 'end', x: 5, y: 5 },
      { id: 'w1', type: 'wall', x: 2, y: 0 }, { id: 'w2', type: 'wall', x: 3, y: 0 },
      { id: 'w3', type: 'wall', x: 2, y: 1 }, { id: 'w4', type: 'wall', x: 3, y: 1 },
      { id: 'w5', type: 'wall', x: 2, y: 2 }, { id: 'w6', type: 'wall', x: 3, y: 2 },
      { id: 'w7', type: 'wall', x: 2, y: 3 }, { id: 'w8', type: 'wall', x: 3, y: 3 },
      { id: 'w9', type: 'wall', x: 2, y: 4 }, { id: 'w10', type: 'wall', x: 3, y: 4 },
      { id: 'w11', type: 'wall', x: 2, y: 5 }, { id: 'w12', type: 'wall', x: 3, y: 5 },
    ],
    optimalBlocks: 6,
    availableBlocks: [BlockType.Move, BlockType.TurnRight, BlockType.TurnLeft, BlockType.Repeat],
    solution: []
  },
  {
    id: 8,
    name: "最终测试",
    description: "综合运用所有技巧，穿越复杂的迷宫网络。",
    gridSize: 8,
    startPos: { x: 0, y: 0 },
    startDir: Direction.East,
    entities: [
      { id: 'e1', type: 'end', x: 7, y: 7 },
      { id: 'c1', type: 'coin', x: 7, y: 0 },
      { id: 'c2', type: 'coin', x: 0, y: 7 },
      { id: 'w1', type: 'wall', x: 2, y: 0 }, { id: 'w2', type: 'wall', x: 2, y: 1 },
      { id: 'w3', type: 'wall', x: 2, y: 2 }, { id: 'w4', type: 'wall', x: 3, y: 2 },
      { id: 'w5', type: 'wall', x: 4, y: 2 }, { id: 'w6', type: 'wall', x: 5, y: 2 },
      { id: 'w7', type: 'wall', x: 5, y: 3 }, { id: 'w8', type: 'wall', x: 5, y: 4 },
      { id: 'w9', type: 'wall', x: 5, y: 5 }, { id: 'w10', type: 'wall', x: 4, y: 5 },
      { id: 'w11', type: 'wall', x: 3, y: 5 }, { id: 'w12', type: 'wall', x: 2, y: 5 },
      { id: 'w13', type: 'wall', x: 2, y: 6 }, { id: 'w14', type: 'wall', x: 2, y: 7 },
    ],
    optimalBlocks: 10,
    availableBlocks: [BlockType.Move, BlockType.MoveBack, BlockType.TurnLeft, BlockType.TurnRight, BlockType.Repeat],
    solution: []
  }
];

export const BLOCK_ICONS: Record<BlockType, any> = {
  [BlockType.Move]: ArrowUp,
  [BlockType.MoveBack]: ArrowDown,
  [BlockType.TurnLeft]: CornerUpLeft,
  [BlockType.TurnRight]: CornerUpRight,
  [BlockType.Repeat]: Repeat,
};

export const BLOCK_NAMES: Record<BlockType, string> = {
  [BlockType.Move]: "前进",
  [BlockType.MoveBack]: "后退",
  [BlockType.TurnLeft]: "左转",
  [BlockType.TurnRight]: "右转",
  [BlockType.Repeat]: "循环",
};

export const BLOCK_COLORS: Record<BlockType, string> = {
  [BlockType.Move]: "bg-blue-600 border-blue-400",
  [BlockType.MoveBack]: "bg-blue-800 border-blue-600",
  [BlockType.TurnLeft]: "bg-purple-600 border-purple-400",
  [BlockType.TurnRight]: "bg-purple-600 border-purple-400",
  [BlockType.Repeat]: "bg-orange-600 border-orange-400",
};