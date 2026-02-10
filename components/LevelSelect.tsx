import React, { useMemo } from 'react';
import { LevelConfig } from '../types';
import { Lock, Star, Play, CheckCircle } from 'lucide-react';

interface LevelSelectProps {
  levels: LevelConfig[];
  completedLevels: number[];
  currentLevelId: number;
  onSelectLevel: (id: number) => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ 
  levels, 
  completedLevels, 
  currentLevelId,
  onSelectLevel 
}) => {
  // Generate positions for a winding path
  const nodes = useMemo(() => {
    return levels.map((level, index) => {
      // Sine wave pattern for X axis
      const xOffset = Math.sin(index * 1.5) * 80; 
      return {
        ...level,
        x: xOffset, // Offset from center
        y: index * 120 + 60 // Vertical spacing
      };
    });
  }, [levels]);

  const totalHeight = nodes.length * 120 + 100;
  const centerX = 50; // Percentage

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-y-auto custom-scrollbar">
      <div className="max-w-md mx-auto relative min-h-full py-10">
        
        {/* Header */}
        <div className="text-center mb-8 sticky top-0 bg-slate-950/80 backdrop-blur z-20 py-4 border-b border-slate-800">
           <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
             战役地图
           </h2>
           <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">
             MISSION PROGRESS: {completedLevels.length} / {levels.length}
           </p>
        </div>

        {/* Map Container */}
        <div className="relative" style={{ height: totalHeight }}>
           
           {/* SVG Connecting Lines */}
           <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
              {nodes.map((node, i) => {
                if (i === nodes.length - 1) return null;
                const nextNode = nodes[i + 1];
                
                // Determine line status
                const isUnlocked = i === 0 || completedLevels.includes(levels[i-1].id);
                const isNextUnlocked = completedLevels.includes(node.id); // If current is done, next path is lit

                return (
                  <path
                    key={`path-${i}`}
                    d={`M calc(50% + ${node.x}px) ${node.y} C calc(50% + ${node.x}px) ${node.y + 60}, calc(50% + ${nextNode.x}px) ${nextNode.y - 60}, calc(50% + ${nextNode.x}px) ${nextNode.y}`}
                    fill="none"
                    stroke={isNextUnlocked ? "#06b6d4" : "#1e293b"}
                    strokeWidth="4"
                    strokeDasharray={isNextUnlocked ? "0" : "8 4"}
                    className="transition-all duration-500"
                  />
                );
              })}
           </svg>

           {/* Level Nodes */}
           {nodes.map((node, i) => {
              const isCompleted = completedLevels.includes(node.id);
              // Level 1 is always unlocked. Others unlock if previous is completed.
              const isUnlocked = i === 0 || completedLevels.includes(levels[i-1].id);
              const isCurrent = !isCompleted && isUnlocked;

              return (
                <div 
                  key={node.id}
                  className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                  style={{ top: node.y, marginLeft: node.x }}
                >
                    <button
                      onClick={() => isUnlocked && onSelectLevel(node.id)}
                      disabled={!isUnlocked}
                      className={`
                        relative w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 group
                        ${isCompleted 
                            ? 'bg-slate-900 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                            : isUnlocked 
                                ? 'bg-slate-800 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse-slow scale-110' 
                                : 'bg-slate-900 border-slate-700 opacity-60 cursor-not-allowed'}
                      `}
                    >
                        {isCompleted ? (
                           <CheckCircle size={28} className="text-green-500" />
                        ) : isUnlocked ? (
                           <Play size={28} className="text-cyan-400 fill-cyan-400/20 ml-1" />
                        ) : (
                           <Lock size={24} className="text-slate-600" />
                        )}

                        {/* Node Label */}
                        <div className={`
                            absolute top-full mt-3 px-3 py-1 rounded bg-slate-900/90 border border-slate-700 backdrop-blur whitespace-nowrap text-xs font-bold
                            transition-all duration-300
                            ${isUnlocked ? 'text-white border-cyan-900' : 'text-slate-500'}
                        `}>
                            LEVEL {node.id}
                        </div>
                        
                        {/* Hover Info (Desktop) */}
                        {isUnlocked && (
                           <div className="absolute bottom-full mb-3 hidden group-hover:block w-32 bg-slate-800 p-2 rounded border border-slate-600 z-20 text-center animate-fade-in">
                               <div className="text-cyan-300 font-bold text-xs mb-1">{node.name}</div>
                               <div className="text-slate-400 text-[10px] leading-tight">{node.description}</div>
                           </div>
                        )}
                    </button>
                    
                    {/* Stars for completion (Visual decoration) */}
                    {isCompleted && (
                        <div className="flex gap-1 mt-8 absolute pointer-events-none">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <Star size={12} className="text-yellow-400 fill-yellow-400 -mt-1" />
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        </div>
                    )}
                </div>
              );
           })}
        </div>
      </div>
      <style>{`
        .animate-pulse-slow {
            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 1; transform: scale(1.1); }
            50% { opacity: .9; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default LevelSelect;
