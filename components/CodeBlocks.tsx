import React from 'react';
import { Block, BlockType, LevelConfig } from '../types';
import { BLOCK_ICONS, BLOCK_COLORS, BLOCK_NAMES } from '../constants';
import { Trash2, PlusCircle, Repeat } from 'lucide-react';

interface CodeBlocksProps {
  program: Block[];
  setProgram: (p: Block[]) => void;
  level: LevelConfig;
  isPlaying: boolean;
  activeBlockIndex: number | null; // For visualization during run
  attemptCount: number; // New prop
}

const CodeBlocks: React.FC<CodeBlocksProps> = ({ 
  program, 
  setProgram, 
  level, 
  isPlaying, 
  activeBlockIndex,
  attemptCount
}) => {

  const addBlock = (type: BlockType) => {
    // Removed maxBlocks check
    if (isPlaying) return;
    
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: type === BlockType.Repeat ? 2 : undefined, // Default repeat 2
      children: type === BlockType.Repeat ? [] : undefined
    };
    
    // Logic for Repeat block default child
    if (type === BlockType.Repeat) {
       // Repeat block defaults to containing one "Move" for demo purposes
       newBlock.children = [{ id: Math.random().toString(36).substr(2, 9), type: BlockType.Move }];
    }
    
    setProgram([...program, newBlock]);
  };

  const removeBlock = (id: string) => {
    if (isPlaying) return;
    setProgram(program.filter(b => b.id !== id));
  };

  const updateLoopCount = (id: string, delta: number) => {
    if (isPlaying) return;
    setProgram(program.map(b => {
      if (b.id === id && b.type === BlockType.Repeat) {
        const newVal = (b.value || 2) + delta;
        return { ...b, value: Math.max(2, Math.min(10, newVal)) }; // Clamp 2-10
      }
      return b;
    }));
  };
  
  const updateLoopChild = (id: string, childType: BlockType) => {
     if (isPlaying) return;
     setProgram(program.map(b => {
         if (b.id === id) {
             return { 
                 ...b, 
                 children: [{ id: Math.random().toString(), type: childType }] 
             };
         }
         return b;
     }));
  }

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
      {/* Toolbar / Palette */}
      <div className="p-3 bg-slate-900 border-b border-slate-700 grid grid-cols-4 gap-2">
        {level.availableBlocks.map(type => {
            const Icon = BLOCK_ICONS[type];
            return (
                <button
                    key={type}
                    onClick={() => addBlock(type)}
                    disabled={isPlaying}
                    className={`
                        flex flex-col items-center justify-center p-2 rounded-lg transition-all
                        ${isPlaying 
                            ? 'opacity-50 cursor-not-allowed bg-slate-800' 
                            : 'bg-slate-700 hover:bg-slate-600 active:scale-95 text-cyan-400 hover:text-cyan-200 ring-1 ring-cyan-900 hover:ring-cyan-500'}
                    `}
                >
                    <Icon size={24} />
                    <span className="text-[12px] mt-1 font-bold">{BLOCK_NAMES[type]}</span>
                </button>
            )
        })}
      </div>

      {/* Program Canvas */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-slate-800/50">
        {program.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                <PlusCircle size={48} className="mb-2" />
                <p className="text-sm">点击上方按钮添加指令</p>
            </div>
        )}

        {program.map((block, index) => {
          const Icon = BLOCK_ICONS[block.type];
          const isActive = index === activeBlockIndex;

          return (
            <div 
                key={block.id} 
                className={`
                    relative group flex items-center p-3 rounded-lg border-l-4 transition-all
                    ${BLOCK_COLORS[block.type]}
                    ${isActive ? 'ring-2 ring-yellow-400 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10' : 'bg-opacity-20 border-opacity-60'}
                `}
            >
              <div className="mr-3 p-2 bg-black/20 rounded-md">
                <Icon size={20} className="text-white" />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-sm tracking-wide text-white/90">
                        {block.type === BlockType.Repeat ? '循环序列' : BLOCK_NAMES[block.type]}
                    </span>
                    
                    {!isPlaying && (
                        <button 
                            onClick={() => removeBlock(block.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Specific UI for Loop Blocks */}
                {block.type === BlockType.Repeat && (
                    <div className="mt-2 pl-2 border-l-2 border-white/10 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                             <span>执行</span>
                             <div className="flex items-center bg-black/30 rounded px-1">
                                <button onClick={() => updateLoopCount(block.id, -1)} className="px-2 hover:text-white">-</button>
                                <span className="font-mono text-cyan-400 w-4 text-center">{block.value}</span>
                                <button onClick={() => updateLoopCount(block.id, 1)} className="px-2 hover:text-white">+</button>
                             </div>
                             <span>次：</span>
                        </div>
                        
                        {/* Nested Slot (Simplified to 1 child for prototype) */}
                        <div className="flex gap-2">
                            {level.availableBlocks.filter(t => t !== BlockType.Repeat).map(childType => {
                                const CIcon = BLOCK_ICONS[childType];
                                const isSelected = block.children?.[0]?.type === childType;
                                return (
                                    <button 
                                        key={childType}
                                        onClick={() => updateLoopChild(block.id, childType)}
                                        className={`p-1 rounded ${isSelected ? 'bg-cyan-500 text-black' : 'bg-black/20 text-slate-400'}`}
                                    >
                                        <CIcon size={14} />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Usage Stat */}
      <div className="p-2 bg-slate-900 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400 font-mono">
        <div className="flex gap-4">
             <span>指令: {program.length}</span>
             <span>尝试: {attemptCount}</span>
        </div>
        <span className={program.length <= level.optimalBlocks ? "text-green-500" : "text-yellow-500"}>
            目标: {level.optimalBlocks}
        </span>
      </div>
    </div>
  );
};

export default CodeBlocks;