import { Block, BlockType, Direction, LevelConfig, RobotState, Entity } from '../types';

// Helper to deep copy state
const cloneState = (state: RobotState): RobotState => ({
  ...state,
  collectedCoins: [...state.collectedCoins],
  logs: [...state.logs],
});

// Calculate next position based on direction and movement type (forward/backward)
const getNextPos = (x: number, y: number, dir: Direction, moveBack: boolean = false) => {
  let nx = x;
  let ny = y;
  
  // If moving back, effectively reverse direction for calculation
  // North(0) -> South(2)
  // East(1) -> West(3)
  const effectiveDir = moveBack ? (dir + 2) % 4 : dir;

  switch (effectiveDir) {
    case Direction.North: ny -= 1; break;
    case Direction.East: nx += 1; break;
    case Direction.South: ny += 1; break;
    case Direction.West: nx -= 1; break;
  }
  return { nx, ny };
};

// Compile visual blocks into a linear sequence of atomic actions
export const compileProgram = (blocks: Block[]): Block[] => {
  let compiled: Block[] = [];
  
  for (const block of blocks) {
    if (block.type === BlockType.Repeat && block.children && block.value) {
      // Repeat logic: Duplicate the children N times
      for (let i = 0; i < block.value; i++) {
        compiled = [...compiled, ...compileProgram(block.children)];
      }
    } else {
      compiled.push(block);
    }
  }
  return compiled;
};

// Execute one step
export const executeStep = (
  currentState: RobotState,
  command: Block,
  level: LevelConfig
): RobotState => {
  const nextState = cloneState(currentState);
  const { gridSize, entities } = level;

  if (nextState.crashed || nextState.won) return nextState;

  if (command.type === BlockType.TurnLeft) {
    nextState.dir = (nextState.dir + 3) % 4;
    nextState.logs.push("Turned Left");
  } else if (command.type === BlockType.TurnRight) {
    nextState.dir = (nextState.dir + 1) % 4;
    nextState.logs.push("Turned Right");
  } else if (command.type === BlockType.Move || command.type === BlockType.MoveBack) {
    const isBack = command.type === BlockType.MoveBack;
    const { nx, ny } = getNextPos(nextState.x, nextState.y, nextState.dir, isBack);
    
    // Check Wall Collision
    const wall = entities.find(e => e.type === 'wall' && e.x === nx && e.y === ny);
    // Check Bounds
    const outOfBounds = nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize;

    if (wall || outOfBounds) {
      nextState.crashed = true;
      nextState.logs.push("CRITICAL FAILURE: Collision detected.");
    } else {
      nextState.x = nx;
      nextState.y = ny;
      nextState.logs.push(`${isBack ? 'Reversed' : 'Moved'} to (${nx}, ${ny})`);
    }
  }

  // Check Interactions after move/turn
  const coin = entities.find(e => e.type === 'coin' && e.x === nextState.x && e.y === nextState.y);
  if (coin && !nextState.collectedCoins.includes(coin.id)) {
    nextState.collectedCoins.push(coin.id);
    nextState.logs.push("Coin Collected!");
  }

  const end = entities.find(e => e.type === 'end' && e.x === nextState.x && e.y === nextState.y);
  if (end) {
    nextState.won = true;
    nextState.logs.push("TARGET REACHED. SEQUENCE COMPLETE.");
  }

  return nextState;
};

export const getInitialState = (level: LevelConfig): RobotState => ({
  x: level.startPos.x,
  y: level.startPos.y,
  dir: level.startDir,
  crashed: false,
  won: false,
  collectedCoins: [],
  logs: ["System Online. Awaiting command."],
});