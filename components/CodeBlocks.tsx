import React, { useRef, useState } from 'react';
import { Block, BlockType, LevelConfig } from '../types';
import { BLOCK_ICONS, BLOCK_COLORS, BLOCK_NAMES } from '../constants';
import { Trash2, PlusCircle, GripVertical } from 'lucide-react';

interface CodeBlocksProps {
  program: Block[];
  setProgram: (p: Block[]) => void;
  level: LevelConfig;
  isPlaying: boolean;
  activeBlockIndex: number | null; // For visualization during run
  attemptCount: number;
}

const CodeBlocks: React.FC<CodeBlocksProps> = ({ 
  program, 
  setProgram, 
  level, 
  isPlaying, 
  activeBlockIndex,
  attemptCount
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const addBlock = (type: BlockType) => {
    if (isPlaying) return;
    
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: type === BlockType.Repeat ? 2 : undefined,
      children: type === BlockType.Repeat ? [] : undefined
    };
    
    if (type === BlockType.Repeat) {
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
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isPlaying) {
      e.preventDefault();
      return;
    }
    setDraggingIndex(index);
    // Set effect to move
    e.dataTransfer.effectAllowed = "move";
    // Optional: Hide the default ghost image slightly if desired, but default is usually fine
  };

  const handleDragEnter = (index: number) => {
    // Reorder logic: Swap items when hovering over another item
    if (draggingIndex === null || draggingIndex === index || isPlaying) return;

    const newProgram = [...program];
    const draggedItem = newProgram[draggingIndex];
    
    // Remove from old position
    newProgram.splice(draggingIndex, 1);
    // Insert at new position
    newProgram.splice(index, 0, draggedItem);

    setProgram(newProgram);
    setDraggingIndex(index);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Check if dropped outside the container to delete
    if (listRef.current && draggingIndex !== null) {
        const rect = listRef.current.getBoundingClientRect();
        const buffer = 50; // Distance in pixels outside container to trigger delete
        
        const isOutside = 
            e.clientX < rect.left - buffer ||
            e.clientX > rect.right + buffer ||
            e.clientY < rect.top - buffer ||
            e.clientY > rect.bottom + buffer;

        if (isOutside) {
            const newProgram = [...program];
            newProgram.splice(draggingIndex, 1);
            setProgram(newProgram);
        }
    }
    setDraggingIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

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
      <div 
        ref={listRef}
        className="flex-1 p-4 overflow-y-auto space-y-2 bg-slate-800/50 relative"
      >
        {program.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                <PlusCircle size={48} className="mb-2" />
                <p className="text-sm">点击上方按钮添加指令</p>
            </div>
        )}

        {program.map((block, index) => {
          const Icon = BLOCK_ICONS[block.type];
          const isActive = index === activeBlockIndex;
          const isDragging = index === draggingIndex;

          return (
            <div 
                key={block.id}
                draggable={!isPlaying}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                className={`
                    relative group flex items-center p-3 rounded-lg border-l-4 transition-all select-none
                    ${BLOCK_COLORS[block.type]}
                    ${isActive ? 'ring-2 ring-yellow-400 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10' : 'bg-opacity-20 border-opacity-60'}
                    ${isDragging ? 'opacity-30 border-dashed scale-95' : 'opacity-100'}
                    ${!isPlaying ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
            >
              {/* Drag Handle Icon */}
              {!isPlaying && (
                 <div className="mr-2 text-white/20 group-hover:text-white/50 cursor-grab">
                    <GripVertical size={16} />
                 </div>
              )}

              <div className="mr-3 p-2 bg-black/20 rounded-md">
                <Icon size={20} className="text-white" />
              </div>

              <div className="flex-1 pointer-events-none"> {/* Disable pointer events on content so drag triggers on container easily */}
                <div className="flex justify-between items-center pointer-events-auto"> {/* Re-enable for buttons */}
                    <span className="font-bold text-sm tracking-wide text-white/90">
                        {block.type === BlockType.Repeat ? '循环序列' : BLOCK_NAMES[block.type]}
                    </span>
                    
                    {!isPlaying && (
                        <button 
                            onClick={() => removeBlock(block.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-opacity"
                            title="删除 (或向外拖拽移除)"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Specific UI for Loop Blocks */}
                {block.type === BlockType.Repeat && (
                    <div className="mt-2 pl-2 border-l-2 border-white/10 flex flex-col gap-2 pointer-events-auto">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                             <span>执行</span>
                             <div className="flex items-center bg-black/30 rounded px-1">
                                <button onClick={() => updateLoopCount(block.id, -1)} className="px-2 hover:text-white">-</button>
                                <span className="font-mono text-cyan-400 w-4 text-center">{block.value}</span>
                                <button onClick={() => updateLoopCount(block.id, 1)} className="px-2 hover:text-white">+</button>
                             </div>
                             <span>次：</span>
                        </div>
                        
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