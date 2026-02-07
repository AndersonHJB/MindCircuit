import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Box, HelpCircle, CheckCircle, XCircle, Terminal } from 'lucide-react';
import GridMap from './components/GridMap';
import CodeBlocks from './components/CodeBlocks';
import { LEVELS } from './constants';
import { compileProgram, executeStep, getInitialState } from './services/engine';
import { Block, BlockType, RobotState } from './types';

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
                    title="Reset Simulation"
                 >
                     <RotateCcw size={18} />
                 </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
               <div className="mb-2 flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Program Sequence</span>
                  <span className="text-[10px] text-slate-500 font-mono">DRAG & DROP READY</span>
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
           <div className="bg-slate-900 border border-green-500/30 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(34,197,94,0.2)] text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent" />
              
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-2">MISSION ACCOMPLISHED</h2>
              <p className="text-slate-400 mb-6 text-sm">Sequence executed successfully.</p>
              
              <button 
                onClick={() => {
                   if (currentLevelId < LEVELS.length) {
                       setCurrentLevelId(id => id + 1);
                   } else {
                       setCurrentLevelId(1); // Loop back
                   }
                   setShowWinModal(false);
                }}
                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
              >
                  {currentLevelId < LEVELS.length ? "PROCEED TO NEXT LEVEL" : "RESTART CAMPAIGN"}
              </button>
           </div>
        </div>
      )}

      {/* Crash Overlay - Just a subtle flash */}
      {robotState.crashed && (
         <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center bg-red-900/20 backdrop-blur-[2px]">
             <div className="bg-black/90 text-red-500 px-8 py-4 rounded-xl border border-red-500 font-mono font-bold flex items-center gap-3 shadow-2xl animate-shake">
                 <XCircle size={24} /> 
                 <span>CRITICAL FAILURE: COLLISION</span>
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