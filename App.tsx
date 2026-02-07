import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Box, HelpCircle, CheckCircle, XCircle, Terminal, Trash2, Eye, Award } from 'lucide-react';
import GridMap from './components/GridMap';
import CodeBlocks from './components/CodeBlocks';
import { LEVELS } from './constants';
import { compileProgram, executeStep, getInitialState } from './services/engine';
import { Block, BlockType, RobotState, SolutionBlockDef } from './types';

const App: React.FC = () => {
  // Game State
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [program, setProgram] = useState<Block[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [robotState, setRobotState] = useState<RobotState>(getInitialState(LEVELS[0]));
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per step
  
  // Execution State
  const [executionQueue, setExecutionQueue] = useState<Block[]>([]); // Flattened instructions
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [showWinModal, setShowWinModal] = useState(false);
  
  const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  // Initialize level
  useEffect(() => {
    resetLevel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevelId]);

  const resetLevel = useCallback(() => {
    setProgram([]);
    setRobotState(getInitialState(currentLevel));
    setIsPlaying(false);
    setCurrentStepIndex(-1);
    setExecutionQueue([]);
    setShowWinModal(false);
  }, [currentLevel]);

  // Compile and Start
  const handleRun = () => {
    if (program.length === 0) return;
    
    // Compile nested loops into flat list
    const flatSteps = compileProgram(program);
    setExecutionQueue(flatSteps);
    
    // Reset robot to start before running
    setRobotState(getInitialState(currentLevel));
    
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setRobotState(getInitialState(currentLevel));
    setCurrentStepIndex(-1);
    // Note: We intentionally do NOT clear setProgram here, users keep their blocks
  };

  const handleClear = () => {
      if (isPlaying) return;
      if (confirm("Clear all blocks?")) {
          setProgram([]);
          handleStop();
      }
  };

  const loadSolution = () => {
      // Recursively helper to convert solution defs to blocks with IDs
      const convertDef = (defs: SolutionBlockDef[]): Block[] => {
          return defs.map(def => ({
              id: Math.random().toString(36).substr(2, 9),
              type: def.type,
              value: def.value,
              children: def.children ? convertDef(def.children) : undefined
          }));
      };

      const solutionBlocks = convertDef(currentLevel.solution);
      setProgram(solutionBlocks);
      setShowWinModal(false);
      handleStop(); // Reset position
      // Optional: Auto run? Let's just load it so they can see it.
  };

  // Game Loop
  useEffect(() => {
    let timer: number;

    if (isPlaying && currentStepIndex >= 0 && currentStepIndex < executionQueue.length) {
      // Execute Logic
      const currentCommand = executionQueue[currentStepIndex];
      
      timer = window.setTimeout(() => {
        setRobotState(prev => {
           const newState = executeStep(prev, currentCommand, currentLevel);
           
           // Check Win/Loss conditions inside the state update to ensure sync
           if (newState.crashed) {
             setIsPlaying(false);
           } 
           if (newState.won) {
             setIsPlaying(false);
             setShowWinModal(true);
           }
           
           return newState;
        });

        // Advance Step
        setCurrentStepIndex(prev => prev + 1);

      }, playbackSpeed);
    } else if (isPlaying && currentStepIndex >= executionQueue.length) {
      // Finished all commands but didn't win/crash
      setIsPlaying(false);
    }

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, executionQueue, currentLevel, playbackSpeed]);

  const isOptimal = program.length <= currentLevel.optimalBlocks;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Box className="text-white" size={24} />
          </div>
          <div>
             <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
               BOT COMMANDER
             </h1>
             <div className="text-[10px] text-slate-400 tracking-widest uppercase">
               Mission {currentLevel.id}: {currentLevel.name}
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
             <button className="p-2 text-slate-400 hover:text-white transition-colors" title="Help">
                 <HelpCircle size={20} />
             </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel: Code & Controls */}
        <section className="w-full md:w-1/3 max-w-md p-4 flex flex-col space-y-4 border-r border-slate-800 bg-slate-900/50 z-20">
            
            {/* Control Bar */}
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex gap-2">
                 <button 
                    onClick={handleRun} 
                    disabled={isPlaying || program.length === 0}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                      ${isPlaying 
                        ? 'bg-slate-700 text-slate-500' 
                        : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 active:translate-y-0.5'}
                    `}
                 >
                     <Play size={18} fill="currentColor" />
                     EXECUTE
                 </button>

                 <button 
                    onClick={handleStop}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors flex items-center justify-center"
                    title="Reset Simulation (Keep Code)"
                 >
                     <RotateCcw size={18} />
                 </button>

                 <button 
                    onClick={handleClear}
                    disabled={isPlaying}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 hover:text-red-400 rounded-lg text-slate-300 transition-colors flex items-center justify-center"
                    title="Clear All Blocks"
                 >
                     <Trash2 size={18} />
                 </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
               <div className="mb-2 flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Program Sequence</span>
                  <span className="text-[10px] text-slate-500 font-mono">UNLIMITED BLOCKS</span>
               </div>
               <CodeBlocks 
                 program={program} 
                 setProgram={setProgram} 
                 level={currentLevel} 
                 isPlaying={isPlaying}
                 activeBlockIndex={currentStepIndex} 
               />
            </div>
        </section>

        {/* Right Panel: Simulation */}
        <section className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-6">
            
            {/* Top Error Banner (Non-blocking) */}
            <div className="absolute top-4 w-full px-6 z-30 pointer-events-none">
                 {robotState.crashed && (
                     <div className="mx-auto max-w-md bg-red-900/80 backdrop-blur border border-red-500 text-red-100 px-4 py-2 rounded-lg flex items-center justify-center gap-3 shadow-xl animate-fade-in pointer-events-auto">
                        <XCircle size={20} className="text-red-400" />
                        <span className="text-sm font-bold">Collision Detected! Reset to try again.</span>
                        <button onClick={handleStop} className="ml-auto text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded">Reset</button>
                     </div>
                 )}
            </div>

            {/* Grid Container */}
            <div className="relative z-10 w-full max-w-lg">
                <GridMap level={currentLevel} robotState={robotState} />
            </div>

            {/* Logs / Console */}
            <div className="mt-8 w-full max-w-lg h-36 bg-slate-900/90 rounded-lg border border-slate-700 p-3 font-mono text-xs overflow-hidden flex flex-col shadow-xl">
                <div className="flex items-center gap-2 text-slate-400 border-b border-slate-700 pb-2 mb-2">
                   <Terminal size={14} />
                   <span>SYSTEM_LOG</span>
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1">
                    {robotState.logs.length === 0 && <span className="text-slate-600 italic">Ready for input...</span>}
                    {robotState.logs.map((log, i) => (
                        <div key={i} className="animate-fade-in">
                            <span className="text-slate-500 mr-2">{`>`}</span>
                            <span className={log.includes('CRITICAL') ? 'text-red-400' : log.includes('COMPLETE') ? 'text-green-400' : 'text-cyan-100'}>
                              {log}
                            </span>
                        </div>
                    ))}
                    <div className="h-2" /> {/* Spacer */}
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-3xl filter" />
                 <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/5 rounded-full blur-3xl filter" />
            </div>

        </section>
      </main>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className={`
                bg-slate-900 border rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden
                ${isOptimal ? 'border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.3)]' : 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)]'}
           `}>
              {/* Confetti / Light Effect */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isOptimal ? 'from-transparent via-green-500 to-transparent' : 'from-transparent via-yellow-500 to-transparent'}`} />
              
              {isOptimal ? (
                  <CheckCircle size={64} className="mx-auto text-green-500 mb-4 animate-bounce" />
              ) : (
                  <Award size={64} className="mx-auto text-yellow-500 mb-4 animate-pulse" />
              )}
              
              <h2 className="text-2xl font-bold text-white mb-2">
                  {isOptimal ? "PERFECT EXECUTION" : "MISSION COMPLETED"}
              </h2>
              
              <p className="text-slate-400 mb-6 text-sm">
                  {isOptimal 
                    ? "Your code is optimized for maximum efficiency." 
                    : `You used ${program.length} blocks. The optimal solution uses ${currentLevel.optimalBlocks}.`}
              </p>
              
              <div className="flex flex-col gap-3">
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
                      {currentLevelId < LEVELS.length ? "NEXT MISSION" : "RESTART CAMPAIGN"}
                  </button>

                  {!isOptimal && (
                      <button 
                        onClick={loadSolution}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-yellow-400 font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
                      >
                         <Eye size={18} />
                         VIEW OPTIMAL SOLUTION
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