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
  const renderEntity = (x: number, y: number) => {
    // Robot (Only show if robot is at this position AND we are not editing, OR if it's the start pos in edit mode)
    // Actually, in edit mode, we just show the start position indicator usually, but here we reuse the robot as the start marker
    const isRobotPos = robotState.x === x && robotState.y === y;
    
    // In edit mode, robotState represents the start position
    if (isRobotPos) {
      return (
        <div className="relative z-20 w-full h-full flex items-center justify-center transition-all duration-300"
             style={{ transform: `rotate(${robotState.dir * 90}deg)` }}>
           
           {/* 3D Robot CSS Construction */}
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
      return <div className="w-full h-full bg-slate-700 rounded-sm border border-slate-600 flex items-center justify-center shadow-lg pointer-events-none">
        {/* 3D Wall look */}
        <div className="w-4/5 h-4/5 bg-slate-600 border-t border-l border-slate-500 border-b-4 border-r-4 border-slate-800 rounded-sm"></div>
      </div>;
    }
    
    if (entity.type === 'coin') {
      if (!isEditing && robotState.collectedCoins.includes(entity.id)) return null;
      return <div className="w-full h-full flex items-center justify-center animate-pulse pointer-events-none">
        <Hexagon size={28} className="text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
      </div>;
    }

    if (entity.type === 'end') {
      return <div className="w-full h-full flex items-center justify-center pointer-events-none">
        <div className="w-full h-full bg-green-500/10 rounded-md border-2 border-dashed border-green-500/50 flex items-center justify-center">
             <Flag size={24} className="text-green-500 fill-green-500/20" />
        </div>
      </div>;
    }

    return null;
  };

  return (
    <div 
      className={`grid gap-2 bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-2xl relative transition-all duration-300 ${isEditing ? 'border-yellow-500/30' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        aspectRatio: '1/1',
        width: '100%',
        maxWidth: '100%',
        maxHeight: '100%', // Allow fitting in parent vertically
        objectFit: 'contain' 
      }}
    >
      {/* Floor Grid Decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none grid" 
           style={{ 
               gridTemplateColumns: `repeat(${gridSize}, 1fr)`, 
               gridTemplateRows: `repeat(${gridSize}, 1fr)` 
           }}>
      </div>

      {cells.map((cell) => (
        <div
          key={`${cell.x}-${cell.y}`}
          onClick={() => isEditing && onCellClick?.(cell.x, cell.y)}
          className={`
            relative bg-slate-800 rounded border border-slate-700/50 flex items-center justify-center overflow-hidden shadow-inner
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
  );
};

export default GridMap;