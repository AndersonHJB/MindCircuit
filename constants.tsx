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
    startPos: { x: 1, y: 4 },
    startDir: Direction.North,
    entities: [
      { id: 'e1', type: 'end', x: 3, y: 1 },
      { id: 'w1', type: 'wall', x: 1, y: 2 },
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
      { id: 'w1', type: 'wall', x: 5, y: 0 },
      { id: 'w2', type: 'wall', x: 5, y: 1 },
      { id: 'w3', type: 'wall', x: 5, y: 2 },
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