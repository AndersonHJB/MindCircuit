import { LevelConfig, Direction, BlockType } from './types';
import { ArrowUp, ArrowDown, CornerUpLeft, CornerUpRight, Repeat } from 'lucide-react';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Initiation",
    description: "Program the robot to reach the Data Terminal.",
    gridSize: 5,
    startPos: { x: 0, y: 2 },
    startDir: Direction.East,
    entities: [
      { id: 'e1', type: 'end', x: 4, y: 2 },
      { id: 'w1', type: 'wall', x: 2, y: 0 },
      { id: 'w2', type: 'wall', x: 2, y: 4 },
    ],
    maxBlocks: 5,
    availableBlocks: [BlockType.Move, BlockType.MoveBack],
  },
  {
    id: 2,
    name: "The Corner",
    description: "Use Turn commands to navigate around the firewall.",
    gridSize: 5,
    startPos: { x: 1, y: 4 },
    startDir: Direction.North,
    entities: [
      { id: 'e1', type: 'end', x: 3, y: 1 },
      { id: 'w1', type: 'wall', x: 1, y: 2 },
      { id: 'w2', type: 'wall', x: 2, y: 2 },
      { id: 'w3', type: 'wall', x: 3, y: 2 },
    ],
    maxBlocks: 8,
    availableBlocks: [BlockType.Move, BlockType.TurnRight, BlockType.TurnLeft, BlockType.MoveBack],
  },
  {
    id: 3,
    name: "Loop Logic",
    description: "Use the Repeat block to traverse long distances efficiently.",
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
    maxBlocks: 6,
    availableBlocks: [BlockType.Move, BlockType.TurnRight, BlockType.Repeat],
  },
];

export const BLOCK_ICONS: Record<BlockType, any> = {
  [BlockType.Move]: ArrowUp,
  [BlockType.MoveBack]: ArrowDown,
  [BlockType.TurnLeft]: CornerUpLeft,
  [BlockType.TurnRight]: CornerUpRight,
  [BlockType.Repeat]: Repeat,
};

export const BLOCK_COLORS: Record<BlockType, string> = {
  [BlockType.Move]: "bg-blue-600 border-blue-400",
  [BlockType.MoveBack]: "bg-blue-800 border-blue-600",
  [BlockType.TurnLeft]: "bg-purple-600 border-purple-400",
  [BlockType.TurnRight]: "bg-purple-600 border-purple-400",
  [BlockType.Repeat]: "bg-orange-600 border-orange-400",
};