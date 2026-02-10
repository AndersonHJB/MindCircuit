export enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

export enum BlockType {
  Move = 'MOVE', // Forward
  MoveBack = 'MOVE_BACK', // Backward
  TurnLeft = 'TURN_LEFT',
  TurnRight = 'TURN_RIGHT',
  Repeat = 'REPEAT',
}

export enum GameMode {
  Story = 'STORY',
  Creative = 'CREATIVE',
}

export enum EditorTool {
  Start = 'START',
  End = 'END',
  Wall = 'WALL',
  Coin = 'COIN',
  Erase = 'ERASE',
}

export interface Block {
  id: string;
  type: BlockType;
  value?: number; // For loops or parameterized moves
  children?: Block[]; // For nested blocks (loops)
}

// Simplified block structure for defining solutions in constants
export interface SolutionBlockDef {
  type: BlockType;
  value?: number;
  children?: SolutionBlockDef[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity extends Position {
  id: string;
  type: 'wall' | 'coin' | 'end';
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  gridSize: number;
  startPos: Position;
  startDir: Direction;
  entities: Entity[];
  optimalBlocks: number; // The target number of blocks for a "Perfect" score
  availableBlocks: BlockType[];
  solution: SolutionBlockDef[]; // The correct answer
}

export interface RobotState {
  x: number;
  y: number;
  dir: Direction;
  crashed: boolean;
  won: boolean;
  collectedCoins: string[]; // IDs of collected coins
  logs: string[];
}