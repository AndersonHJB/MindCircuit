import React, { useEffect, useRef, useState } from 'react';
import { Camera, ScanFace, Hand } from 'lucide-react';

interface GestureCamProps {
  onGesture: (gesture: string) => void;
  active: boolean;
}

const GestureCam: React.FC<GestureCamProps> = ({ onGesture, active }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [lastDetected, setLastDetected] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!active) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Camera access denied or missing", err);
        setStreamActive(false);
      }
    };

    if (active) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setStreamActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [active]);

  // Simulate gesture detection loop visuals
  useEffect(() => {
    if (!active || !streamActive) return;
    
    const interval = setInterval(() => {
      // In a real app, this is where ML inference would happen.
      // For this UI demo, we just pulsate the "Scanning" UI.
    }, 2000);
    return () => clearInterval(interval);
  }, [active, streamActive]);


  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg group">
      {/* Camera Feed */}
      {active ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
           <Camera size={32} className="mb-2" />
           <span className="text-xs uppercase tracking-widest">Sensor Offline</span>
        </div>
      )}

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2 text-cyan-400 animate-pulse">
            <ScanFace size={16} />
            <span className="text-[10px] font-mono font-bold tracking-widest">GESTURE_LINK</span>
          </div>
          <div className={`h-2 w-2 rounded-full ${streamActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>

        <div className="space-y-1">
             {/* Simulated Gesture Feed Log */}
             {streamActive && (
               <div className="text-[10px] font-mono text-green-400/80">
                  <p>TRACKING_HAND_R... OK</p>
                  <p>CONFIDENCE: 98%</p>
               </div>
             )}
        </div>
      </div>

      {/* Scan Line Animation */}
      {active && streamActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
      )}
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GestureCam;