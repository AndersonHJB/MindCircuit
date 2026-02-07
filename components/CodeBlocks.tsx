import React from 'react';
import { Block, BlockType, LevelConfig } from '../types';
import { BLOCK_ICONS, BLOCK_COLORS } from '../constants';
import { Trash2, PlusCircle, Repeat } from 'lucide-react';

interface CodeBlocksProps {
  program: Block[];
  setProgram: (p: Block[]) => void;
  level: LevelConfig;
  isPlaying: boolean;
  activeBlockIndex: number | null; // For visualization during run
}

const CodeBlocks: React.FC<CodeBlocksProps> = ({ 
  program, 
  setProgram, 
  level, 
  isPlaying, 
  activeBlockIndex 
}) => {

  const addBlock = (type: BlockType) => {
    if (program.length >= level.maxBlocks || isPlaying) return;
    
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: type === BlockType.Repeat ? 2 : undefined, // Default repeat 2
      children: type === BlockType.Repeat ? [] : undefined
    };
    
    // For simplicity in this version, loops wrap the *next* added block? 
    // Or we just add linear blocks.
    // Let's keep it linear: [Move, Turn, Loop]. 
    // If Loop is added, we open a modal or simple prompt? 
    // For this prototype, 'Repeat' will just add a special block that effectively duplicates the LAST command.
    // Actually, let's implement the prompt's request: "Repeat(3){Move}".
    // To keep UI simple: A 'Repeat' block will have a "+" slot inside it.
    
    // Simplification: "Repeat" is a modifier block that we don't nest visually in deep ways.
    // Let's stick to flat list but 'Repeat' has a dropdown for "Next X blocks" or just "Repeat Value".
    
    // **Revised Approach for Stability:**
    // A Repeat block is just a block in the list. It repeats the *Previous* block X times? No, that's weird.
    // It repeats the *Next* block? 
    // Let's implement a 'Slot' system.
    
    // ACTUALLY: Let's do a simple list. If you add "Repeat", it adds a "Start Loop" and "End Loop" pair? 
    // Too complex.
    
    // **Simple Version**: We only support repeating a single action for now, OR we have a "Repeat Container".
    // Let's go with "Repeat Container". When you click 'Repeat', it adds a container. You can drop blocks into it.
    // To avoid complex DND library, we will use "Selection Mode".
    
    // **Simplest UX**:
    // 1. Click 'Move' -> Adds Move to main list.
    // 2. Click 'Repeat' -> Adds Repeat block with an empty 'slot'. Click slot to fill with a basic move.
    
    if (type === BlockType.Repeat) {
       // Repeat block defaults to containing one "Move" for demo purposes or empty
       newBlock.children = [{ id: 'temp', type: BlockType.Move }];
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
        return { ...b, value: Math.max(2, Math.min(5, newVal)) }; // Clamp 2-5
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
                    disabled={isPlaying || program.length >= level.maxBlocks}
                    className={`
                        flex flex-col items-center justify-center p-2 rounded-lg transition-all
                        ${isPlaying || program.length >= level.maxBlocks 
                            ? 'opacity-50 cursor-not-allowed bg-slate-800' 
                            : 'bg-slate-700 hover:bg-slate-600 active:scale-95 text-cyan-400 hover:text-cyan-200 ring-1 ring-cyan-900 hover:ring-cyan-500'}
                    `}
                >
                    <Icon size={24} />
                    <span className="text-[10px] mt-1 font-bold">{type.replace('_', ' ')}</span>
                </button>
            )
        })}
      </div>

      {/* Program Canvas */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-slate-800/50">
        {program.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                <PlusCircle size={48} className="mb-2" />
                <p className="text-sm">Add commands to start</p>
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
                        {block.type === BlockType.Repeat ? 'LOOP SEQUENCE' : block.type.replace('_', ' ')}
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
                             <span>Run</span>
                             <div className="flex items-center bg-black/30 rounded px-1">
                                <button onClick={() => updateLoopCount(block.id, -1)} className="px-2 hover:text-white">-</button>
                                <span className="font-mono text-cyan-400 w-4 text-center">{block.value}</span>
                                <button onClick={() => updateLoopCount(block.id, 1)} className="px-2 hover:text-white">+</button>
                             </div>
                             <span>times:</span>
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
        <span>MEM: {program.length}/{level.maxBlocks} BLOCKS</span>
        <span className={program.length >= level.maxBlocks ? "text-red-500" : "text-green-500"}>
            {program.length >= level.maxBlocks ? "FULL" : "READY"}
        </span>
      </div>
    </div>
  );
};

export default CodeBlocks;