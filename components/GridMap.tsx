import React from 'react';
import { LevelConfig, RobotState, Direction } from '../types';
import { Flag, Hexagon, Box } from 'lucide-react';

interface GridMapProps {
  level: LevelConfig;
  robotState: RobotState;
  isEditing?: boolean;
  onCellClick?: (x: number, y: number) => void;
}

const GridMap: React.FC<GridMapProps> = ({ level, robotState, isEditing = false, onCellClick }) => {
  const { gridSize, entities } = level;

  // Generate grid cells
  const cells = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      cells.push({ x, y });
    }
  }

  // Helper to render entities
  // All entities are rendered with absolute positioning to prevent them from affecting the grid cell size
  const renderEntity = (x: number, y: number) => {
    // Robot
    const isRobotPos = robotState.x === x && robotState.y === y;
    
    // In edit mode, robotState represents the start position
    if (isRobotPos) {
      return (
        <div className="absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 pointer-events-none"
             style={{ transform: `rotate(${robotState.dir * 90}deg)` }}>
           
           {/* 3D Robot CSS Construction - Restored EXACT original dimensions (w-12 h-12) */}
           <div className={`
              relative w-12 h-12 
              ${!isEditing && robotState.crashed ? 'animate-shake' : !isEditing && robotState.won ? 'animate-bounce' : ''}
              ${isEditing ? 'opacity-80' : ''}
           `}>
              {/* Shadow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-black/40 blur-sm rounded-full scale-75" />
              
              {/* Body (Base) */}
              <div className="absolute inset-2 bg-slate-300 rounded-lg shadow-inner border-b-4 border-slate-400" />
              
              {/* Head */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-md shadow-md border-b-2 border-slate-300 z-10 flex flex-col items-center justify-center">
                  {/* Eyes / Visor */}
                  <div className={`w-6 h-3 rounded-sm flex items-center justify-around px-0.5 transition-colors duration-300 ${!isEditing && robotState.crashed ? 'bg-red-900' : 'bg-cyan-900'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${!isEditing && robotState.crashed ? 'bg-red-500' : 'bg-cyan-400 animate-pulse'}`} />
                      <div className={`w-1.5 h-1.5 rounded-full ${!isEditing && robotState.crashed ? 'bg-red-500' : 'bg-cyan-400 animate-pulse'}`} />
                  </div>
              </div>

              {/* Shoulders/Arms Hint */}
              <div className="absolute top-4 -left-1 w-2 h-4 bg-slate-400 rounded-l-md" />
              <div className="absolute top-4 -right-1 w-2 h-4 bg-slate-400 rounded-r-md" />
           </div>
        </div>
      );
    }

    const entity = entities.find(e => e.x === x && e.y === y);
    if (!entity) return null;

    if (entity.type === 'wall') {
      return (
        <div className="absolute inset-0 z-10 p-0.5">
            <div className="w-full h-full bg-slate-700 rounded-sm border border-slate-600 flex items-center justify-center shadow-lg pointer-events-none">
                {/* 3D Wall look - Restored */}
                <div className="w-4/5 h-4/5 bg-slate-600 border-t border-l border-slate-500 border-b-4 border-r-4 border-slate-800 rounded-sm"></div>
            </div>
        </div>
      );
    }
    
    if (entity.type === 'coin') {
      if (!isEditing && robotState.collectedCoins.includes(entity.id)) return null;
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center animate-pulse pointer-events-none">
          {/* Restored exact Hexagon size */}
          <Hexagon size={28} className="text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
        </div>
      );
    }

    if (entity.type === 'end') {
      return (
        <div className="absolute inset-0 z-0 p-1 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full bg-green-500/10 rounded-md border-2 border-dashed border-green-500/50 flex items-center justify-center">
             {/* Restored exact Flag size */}
             <Flag size={24} className="text-green-500 fill-green-500/20" />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
        <div 
            className={`grid gap-1 bg-slate-900 p-2 rounded-xl border border-slate-700 shadow-2xl relative transition-all duration-300 ${isEditing ? 'border-yellow-500/30' : ''}`}
            style={{
                // Strict grid definition for both columns and rows
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                aspectRatio: '1/1',
                width: '100%',
                maxWidth: '600px', // Prevent grid from becoming too large on desktops
                maxHeight: '100%', 
            }}
        >
        {/* Floor Grid Decoration */}
        <div className="absolute inset-0 z-0 pointer-events-none grid" 
             style={{ 
                 gridTemplateColumns: `repeat(${gridSize}, 1fr)`, 
                 gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                 gap: '4px' 
             }}>
        </div>

        {cells.map((cell) => (
            <div
            key={`${cell.x}-${cell.y}`}
            onClick={() => isEditing && onCellClick?.(cell.x, cell.y)}
            className={`
                relative w-full h-full bg-slate-800 rounded-sm border border-slate-700/50 overflow-hidden shadow-inner
                ${isEditing ? 'cursor-pointer hover:bg-slate-700 hover:border-slate-500 transition-colors' : ''}
            `}
            >
            {renderEntity(cell.x, cell.y)}
            </div>
        ))}
        
        <style>{`
            @keyframes shake {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-2px, 2px) rotate(-5deg); }
            75% { transform: translate(2px, -2px) rotate(5deg); }
            }
            .animate-shake {
            animation: shake 0.3s ease-in-out infinite;
            }
        `}</style>
        </div>
    </div>
  );
};

export default GridMap;