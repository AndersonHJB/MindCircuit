import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Box, HelpCircle, CheckCircle, XCircle, Terminal, Trash2, Eye, Award, Zap, Hammer, Pencil, Eraser, Flag, Hexagon, User, Grid3x3, Settings, ChevronRight, AlertTriangle } from 'lucide-react';
import GridMap from './components/GridMap';
import CodeBlocks from './components/CodeBlocks';
import { LEVELS } from './constants';
import { compileProgram, executeStep, getInitialState } from './services/engine';
import { Block, BlockType, RobotState, SolutionBlockDef, LevelConfig, Direction, GameMode, EditorTool, Entity } from './types';

// Default Custom Level Template
const DEFAULT_CUSTOM_LEVEL: LevelConfig = {
  id: 999,
  name: "自定义地图",
  description: "由玩家设计的关卡。",
  gridSize: 6, // Will be overridden on init
  startPos: { x: 0, y: 0 },
  startDir: Direction.East,
  entities: [],
  optimalBlocks: 99, // Ignore in creative
  availableBlocks: [BlockType.Move, BlockType.MoveBack, BlockType.TurnLeft, BlockType.TurnRight, BlockType.Repeat],
  solution: [],
};

const App: React.FC = () => {
  // --- Global State ---
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.Story);
  
  // --- Story Mode State ---
  const [currentLevelId, setCurrentLevelId] = useState(1);
  
  // --- Creative Mode State ---
  const [customLevel, setCustomLevel] = useState<LevelConfig>(DEFAULT_CUSTOM_LEVEL);
  const [editorTool, setEditorTool] = useState<EditorTool>(EditorTool.Wall);
  const [isEditingCustom, setIsEditingCustom] = useState(false); // True = Editing Map, False = Playing Map

  // --- Shared Gameplay State ---
  const [program, setProgram] = useState<Block[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>(getInitialState(LEVELS[0]));
  const [playbackSpeed, setPlaybackSpeed] = useState(500); 
  const [attemptCount, setAttemptCount] = useState(0);

  // --- Execution State ---
  const [executionQueue, setExecutionQueue] = useState<Block[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false); // Custom modal for clear confirmation

  // Refs for auto-scrolling logs
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Derived current level based on mode
  const activeLevel = gameMode === GameMode.Story 
    ? (LEVELS.find(l => l.id === currentLevelId) || LEVELS[0])
    : customLevel;

  // Initialize level when ID changes or Mode changes
  useEffect(() => {
    resetLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevelId, gameMode]);

  // Special reset for entering Creative Mode & Auto-Adaptation
  useEffect(() => {
     if (gameMode === GameMode.Creative) {
         // Auto-adapt grid size based on screen width
         const isMobile = window.innerWidth < 768;
         const defaultSize = isMobile ? 5 : 8;

         const newLevel = {
             ...DEFAULT_CUSTOM_LEVEL,
             gridSize: defaultSize
         };
         
         setCustomLevel(newLevel);
         setIsEditingCustom(true);
         setRobotState(getInitialState(newLevel));
     }
  }, [gameMode]);

  // Auto-scroll logs
  useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [robotState.logs]);

  const resetLevel = useCallback(() => {
    setProgram([]);
    setRobotState(getInitialState(activeLevel));
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setExecutionQueue([]);
    setShowWinModal(false);
    setShowClearModal(false);
    setAttemptCount(0);
  }, [activeLevel]);

  // --- Creative Mode: Map Editing Logic ---
  const handleCellClick = (x: number, y: number) => {
      if (gameMode !== GameMode.Creative || !isEditingCustom) return;

      const newEntities = [...customLevel.entities];
      const existingEntityIndex = newEntities.findIndex(e => e.x === x && e.y === y);
      
      // Prevent placing start on top of existing entity (unless erasing)
      if (editorTool === EditorTool.Start) {
          if (existingEntityIndex !== -1) {
              newEntities.splice(existingEntityIndex, 1);
          }
          setCustomLevel(prev => ({ ...prev, startPos: { x, y }, entities: newEntities }));
          setRobotState(prev => ({ ...prev, x, y }));
          return;
      }

      // Handle Entities (Wall, End, Coin)
      if (editorTool === EditorTool.Erase) {
          if (existingEntityIndex !== -1) {
              newEntities.splice(existingEntityIndex, 1);
          }
      } else {
          // Remove existing first if placing something new
          if (existingEntityIndex !== -1) {
              newEntities.splice(existingEntityIndex, 1);
          }

          // Do not place entities on Start Pos
          if (x === customLevel.startPos.x && y === customLevel.startPos.y) {
              return; 
          }

          if (editorTool === EditorTool.Wall) {
              newEntities.push({ id: `w-${Date.now()}`, type: 'wall', x, y });
          } else if (editorTool === EditorTool.End) {
              const oldEndIndex = newEntities.findIndex(e => e.type === 'end');
              if (oldEndIndex !== -1) newEntities.splice(oldEndIndex, 1);
              newEntities.push({ id: `e-${Date.now()}`, type: 'end', x, y });
          } else if (editorTool === EditorTool.Coin) {
              newEntities.push({ id: `c-${Date.now()}`, type: 'coin', x, y });
          }
      }

      setCustomLevel(prev => ({ ...prev, entities: newEntities }));
  };

  const handleGridResize = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSize = parseInt(e.target.value, 10);
      setCustomLevel(prev => {
          // 1. Filter out entities that are now out of bounds
          const validEntities = prev.entities.filter(ent => ent.x < newSize && ent.y < newSize);
          
          // 2. Check if Start Pos is out of bounds
          let newStartPos = prev.startPos;
          if (newStartPos.x >= newSize || newStartPos.y >= newSize) {
              newStartPos = { x: 0, y: 0 };
          }

          const updatedLevel = {
              ...prev,
              gridSize: newSize,
              entities: validEntities,
              startPos: newStartPos
          };

          // Update visual robot immediately
          setRobotState(getInitialState(updatedLevel));

          return updatedLevel;
      });
  };

  const validateAndPlayCustomLevel = () => {
      const hasEnd = customLevel.entities.some(e => e.type === 'end');
      if (!hasEnd) {
          alert("请设置终点！");
          return;
      }
      setIsEditingCustom(false);
      resetLevel(); 
  };

  const backToEdit = () => {
      setIsEditingCustom(true);
      handleStop();
      setRobotState(getInitialState(customLevel));
  };


  // --- Gameplay Logic ---
  const handleRun = () => {
    if (program.length === 0) return;
    setAttemptCount(prev => prev + 1);
    const flatSteps = compileProgram(program);
    setExecutionQueue(flatSteps);
    setRobotState(getInitialState(activeLevel));
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setRobotState(getInitialState(activeLevel));
    setCurrentStepIndex(-1);
    setExecutionQueue([]); // Clear execution queue
  };

  const handleClearRequest = () => {
      if (isPlaying) return;
      if (program.length === 0) return;
      setShowClearModal(true);
  };

  const confirmClear = () => {
      setProgram([]);
      handleStop();
      setRobotState(prev => ({
          ...prev,
          logs: [...prev.logs, ">> 指令序列已清空"]
      }));
      setShowClearModal(false);
  };

  const loadSolution = () => {
      const convertDef = (defs: SolutionBlockDef[]): Block[] => {
          return defs.map(def => ({
              id: Math.random().toString(36).substr(2, 9),
              type: def.type,
              value: def.value,
              children: def.children ? convertDef(def.children) : undefined
          }));
      };

      if (activeLevel.solution) {
        const solutionBlocks = convertDef(activeLevel.solution);
        setProgram(solutionBlocks);
        setShowWinModal(false);
        handleStop();
      }
  };

  // Game Loop
  useEffect(() => {
    let timer: number;
    if (isPlaying && currentStepIndex >= 0 && currentStepIndex < executionQueue.length) {
      const currentCommand = executionQueue[currentStepIndex];
      timer = window.setTimeout(() => {
        setRobotState(prev => {
           const newState = executeStep(prev, currentCommand, activeLevel);
           if (newState.crashed) setIsPlaying(false);
           if (newState.won) {
             setIsPlaying(false);
             setShowWinModal(true);
           }
           return newState;
        });
        setCurrentStepIndex(prev => prev + 1);
      }, playbackSpeed);
    } else if (isPlaying && currentStepIndex >= executionQueue.length) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, executionQueue, activeLevel, playbackSpeed]);

  const isOptimal = gameMode === GameMode.Story ? program.length <= activeLevel.optimalBlocks : true;
  const isOneShot = attemptCount === 1;

  // Render Helpers
  const renderEditorTools = () => (
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-2 flex items-center gap-2">
              <Settings size={14} />
              地图设置
          </div>
          
          {/* Grid Size Slider */}
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mb-2">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Grid3x3 size={12} /> 地图尺寸
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                      {customLevel.gridSize} x {customLevel.gridSize}
                  </span>
              </div>
              <input 
                  type="range" 
                  min="3" 
                  max="12" 
                  step="1"
                  value={customLevel.gridSize}
                  onChange={handleGridResize}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
              />
          </div>

          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-2 mt-4">
              放置工具
          </div>
          <div className="grid grid-cols-2 gap-2">
              <button 
                  onClick={() => setEditorTool(EditorTool.Start)}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${editorTool === EditorTool.Start ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                  <Box size={20} className="mb-1" />
                  <span className="text-xs">起点</span>
              </button>
              <button 
                  onClick={() => setEditorTool(EditorTool.End)}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${editorTool === EditorTool.End ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                  <Flag size={20} className="mb-1" />
                  <span className="text-xs">终点</span>
              </button>
              <button 
                  onClick={() => setEditorTool(EditorTool.Wall)}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${editorTool === EditorTool.Wall ? 'bg-slate-500 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                  <div className="w-5 h-5 bg-slate-300 border-2 border-slate-800 mb-1" />
                  <span className="text-xs">墙壁</span>
              </button>
              <button 
                  onClick={() => setEditorTool(EditorTool.Coin)}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${editorTool === EditorTool.Coin ? 'bg-yellow-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                  <Hexagon size={20} className="mb-1" />
                  <span className="text-xs">金币</span>
              </button>
              <button 
                  onClick={() => setEditorTool(EditorTool.Erase)}
                  className={`p-3 rounded-lg col-span-2 flex flex-row items-center justify-center gap-2 transition-all ${editorTool === EditorTool.Erase ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                  <Eraser size={20} />
                  <span className="text-xs">橡皮擦</span>
              </button>
          </div>
          
          <div className="pt-4 border-t border-slate-700">
              <button 
                  onClick={validateAndPlayCustomLevel}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-black font-bold rounded-lg shadow-lg flex items-center justify-center gap-2"
              >
                  <Play size={18} fill="black" />
                  开始挑战
              </button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-30">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-colors ${gameMode === GameMode.Story ? 'bg-blue-600 shadow-blue-500/20' : 'bg-purple-600 shadow-purple-500/20'}`}>
            {gameMode === GameMode.Story ? <Box className="text-white" size={24} /> : <Hammer className="text-white" size={24} />}
          </div>
          <div>
             <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
               {gameMode === GameMode.Story ? "机器指挥官" : "地图工坊"}
             </h1>
             <div className="text-[10px] text-slate-400 tracking-widest uppercase">
               {gameMode === GameMode.Story 
                  ? `第 ${activeLevel.id} 关: ${activeLevel.name}`
                  : isEditingCustom ? "编辑模式" : "测试模式"
               }
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
             {/* Mode Switcher */}
             <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 hidden md:flex">
                 <button 
                    onClick={() => setGameMode(GameMode.Story)}
                    className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 transition-all ${gameMode === GameMode.Story ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                    <Box size={14} /> 剧情模式
                 </button>
                 <button 
                    onClick={() => setGameMode(GameMode.Creative)}
                    className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 transition-all ${gameMode === GameMode.Creative ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                    <User size={14} /> 创造模式
                 </button>
             </div>
             
             {/* Mobile simple switcher */}
             <div className="md:hidden flex gap-2">
                 <button 
                    onClick={() => setGameMode(prev => prev === GameMode.Story ? GameMode.Creative : GameMode.Story)}
                    className="p-2 bg-slate-800 rounded border border-slate-700"
                 >
                    {gameMode === GameMode.Story ? <User size={20} className="text-purple-400"/> : <Box size={20} className="text-blue-400"/>}
                 </button>
             </div>

             <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Help">
                 <HelpCircle size={20} />
             </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Panel: Content changes based on Mode and Phase */}
        <section className="order-2 md:order-1 h-1/2 md:h-full w-full md:w-1/3 max-w-md p-4 flex flex-col space-y-4 border-t md:border-t-0 md:border-r border-slate-800 bg-slate-900/50 z-20">
            
            {/* If in Creative Edit Mode, show Editor Tools. Otherwise show Code Blocks */}
            {gameMode === GameMode.Creative && isEditingCustom ? (
                renderEditorTools()
            ) : (
                <>
                    {/* Control Bar */}
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex gap-2 shrink-0">
                        {gameMode === GameMode.Creative && (
                             <button 
                                onClick={backToEdit}
                                disabled={isPlaying}
                                className="px-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors flex items-center justify-center font-bold"
                                title="返回编辑"
                             >
                                 <Pencil size={18} />
                             </button>
                        )}

                        <button 
                            type="button"
                            onClick={handleRun} 
                            disabled={isPlaying || program.length === 0}
                            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                            ${isPlaying 
                                ? 'bg-slate-700 text-slate-500' 
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 active:translate-y-0.5'}
                            `}
                        >
                            <Play size={18} fill="currentColor" />
                            执行
                        </button>

                        <button 
                            type="button"
                            onClick={handleStop}
                            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors flex items-center justify-center"
                            title="重置模拟"
                        >
                            <RotateCcw size={18} />
                        </button>

                        <button 
                            type="button"
                            onClick={handleClearRequest}
                            disabled={isPlaying || program.length === 0}
                            className={`px-4 py-3 rounded-lg transition-colors flex items-center justify-center
                                ${program.length === 0 || isPlaying ? 'bg-slate-800 text-slate-600' : 'bg-slate-700 hover:bg-slate-600 hover:text-red-400 text-slate-300'}
                            `}
                            title="清空指令"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="mb-2 flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">程序指令序列</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                                {gameMode === GameMode.Story ? "LIMIT: " + activeLevel.optimalBlocks : "UNLIMITED"}
                            </span>
                        </div>
                        <CodeBlocks 
                            program={program} 
                            setProgram={setProgram} 
                            level={activeLevel} 
                            isPlaying={isPlaying}
                            activeBlockIndex={currentStepIndex} 
                            attemptCount={attemptCount}
                        />
                    </div>
                </>
            )}
        </section>

        {/* Right Panel: Simulation / Grid Map */}
        <section className="order-1 md:order-2 flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
            
            {/* Top Error Banner */}
            <div className="absolute top-4 left-0 right-0 px-6 z-30 pointer-events-none flex justify-center">
                 {robotState.crashed && (
                     <div className="bg-red-900/90 backdrop-blur border border-red-500 text-red-100 px-4 py-2 rounded-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-fade-in pointer-events-auto">
                        <XCircle size={20} className="text-red-400" />
                        <span className="text-sm font-bold">发生碰撞！系统停止。</span>
                        <button onClick={handleStop} className="ml-2 text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded border border-red-700">重置</button>
                     </div>
                 )}
                 {gameMode === GameMode.Creative && isEditingCustom && (
                     <div className="bg-purple-900/80 backdrop-blur border border-purple-500 text-purple-100 px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-xl animate-fade-in">
                        <Pencil size={16} />
                        <span className="text-xs font-bold">编辑模式：点击网格放置元素</span>
                     </div>
                 )}
            </div>

            {/* Grid Container - Flexible space */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-4 relative z-10">
                <GridMap 
                    level={activeLevel} 
                    robotState={robotState} 
                    isEditing={gameMode === GameMode.Creative && isEditingCustom}
                    onCellClick={handleCellClick}
                />
            </div>

            {/* Logs / Console - Fixed Height at bottom */}
            <div className="shrink-0 w-full z-20 px-4 pb-4 md:px-8">
               <div className="w-full max-w-3xl mx-auto bg-slate-900/90 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col transition-all duration-300">
                  {/* Terminal Header */}
                  <div className="h-8 bg-black/40 border-b border-slate-700/50 flex items-center justify-between px-3">
                      <div className="flex items-center gap-2">
                           <Terminal size={14} className="text-cyan-500" />
                           <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest">SYSTEM_LOGS // V.2.4</span>
                      </div>
                      <div className="flex gap-1.5">
                           <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                           <div className="w-2 h-2 rounded-full bg-slate-700" />
                      </div>
                  </div>
                  
                  {/* Terminal Content */}
                  <div className="h-28 md:h-36 overflow-y-auto p-3 font-mono text-xs custom-scrollbar bg-black/20 space-y-1">
                      {robotState.logs.length === 0 && <span className="text-slate-600 italic opacity-50">...等待输入...</span>}
                      {robotState.logs.map((log, i) => (
                          <div key={i} className="animate-fade-in flex items-start">
                              <span className="text-slate-600 mr-2 shrink-0">{`>`}</span>
                              <span className={log.includes('错误') || log.includes('碰撞') ? 'text-red-400' : log.includes('达成') ? 'text-green-400 font-bold' : log.includes('获得') ? 'text-yellow-400' : 'text-cyan-100'}>
                                {log}
                              </span>
                          </div>
                      ))}
                      <div ref={logsEndRef} />
                  </div>
               </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl filter transition-colors duration-1000 ${gameMode === GameMode.Story ? 'bg-blue-900/10' : 'bg-purple-900/10'}`} />
                 <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/5 rounded-full blur-3xl filter" />
            </div>

        </section>
      </main>

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-slate-900 border border-red-500/50 rounded-xl p-6 max-w-xs w-full shadow-2xl shadow-red-900/20 text-center">
                 <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                     <Trash2 size={24} className="text-red-500" />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2">清空所有指令？</h3>
                 <p className="text-slate-400 text-sm mb-6">此操作将移除当前所有的 {program.length} 条指令，无法撤销。</p>
                 <div className="flex gap-3">
                     <button 
                        onClick={() => setShowClearModal(false)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-bold transition-colors"
                     >
                         取消
                     </button>
                     <button 
                        onClick={confirmClear}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold transition-colors shadow-lg"
                     >
                         确认清空
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className={`
                bg-slate-900 border rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden
                ${isOptimal ? 'border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)]'}
           `}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isOptimal ? 'from-transparent via-green-500 to-transparent' : 'from-transparent via-yellow-500 to-transparent'}`} />
              
              {isOneShot && (
                  <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                      <Zap size={10} fill="currentColor" />
                      一次通关
                  </div>
              )}

              {isOptimal ? (
                  <CheckCircle size={64} className="mx-auto text-green-500 mb-4 animate-bounce" />
              ) : (
                  <Award size={64} className="mx-auto text-yellow-500 mb-4 animate-pulse" />
              )}
              
              <h2 className="text-2xl font-bold text-white mb-2">
                  {gameMode === GameMode.Creative ? "自定义挑战成功！" : (isOptimal ? "完美运行" : "任务完成")}
              </h2>
              
              <div className="mb-6 space-y-1 text-slate-400 text-sm">
                  {gameMode === GameMode.Story && (
                      <p>
                        {isOptimal 
                            ? "代码效率评级：S级" 
                            : `代码指令数：${program.length} (目标: ${activeLevel.optimalBlocks})`}
                      </p>
                  )}
                  <p className={isOneShot ? "text-yellow-400 font-bold" : ""}>
                      总尝试次数：{attemptCount} {isOneShot && "(完美!)"}
                  </p>
              </div>
              
              <div className="flex flex-col gap-3">
                  {gameMode === GameMode.Story ? (
                      <button 
                        onClick={() => {
                           if (currentLevelId < LEVELS.length) {
                               setCurrentLevelId(id => id + 1);
                           } else {
                               setCurrentLevelId(1); // Loop back
                           }
                           setShowWinModal(false);
                        }}
                        className={`w-full py-3 font-bold rounded-xl transition-all shadow-lg active:scale-95 text-white
                            ${isOptimal ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}
                        `}
                      >
                          {currentLevelId < LEVELS.length ? "下一关" : "重新开始"}
                      </button>
                  ) : (
                       <button 
                        onClick={() => {
                            setShowWinModal(false);
                            backToEdit();
                        }}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
                      >
                          返回编辑
                      </button>
                  )}

                  {!isOptimal && gameMode === GameMode.Story && (
                      <button 
                        onClick={loadSolution}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-yellow-400 font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
                      >
                         <Eye size={18} />
                         查看最佳方案
                      </button>
                  )}
              </div>
           </div>
        </div>
      )}

      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;