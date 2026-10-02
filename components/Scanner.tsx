
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, SwitchCamera, ArrowLeft, Zap, Sun, Moon, Hand, CheckCircle2, AlertCircle, Glasses, EyeOff, ScanLine } from 'lucide-react';

interface ScannerProps {
  onCapture: (image: string) => void;
  onCancel: () => void;
  mode?: 'face' | 'product';
}

const Scanner: React.FC<ScannerProps> = ({ onCapture, onCancel, mode = 'face' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(mode === 'product' ? 'environment' : 'user');

  // Quality Analysis State
  const [lightingStatus, setLightingStatus] = useState<'good' | 'too-dark' | 'too-bright'>('good');
  const [isStable, setIsStable] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const handleStreamSuccess = (mediaStream: MediaStream) => {
      setStream(mediaStream);
      if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
      setError(null);
  };

  const startCamera = async (cameraSide: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported (HTTPS required).");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
            facingMode: cameraSide,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
      });
      handleStreamSuccess(mediaStream);
    } catch (err) {
      console.warn("High-res camera failed, trying fallback...", err);
      try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraSide }
          });
          handleStreamSuccess(mediaStream);
      } catch (err2) {
          console.warn("Specific facing mode failed, trying generic...", err2);
          try {
              const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true
              });
              handleStreamSuccess(mediaStream);
          } catch (finalErr) {
              setError("Camera permission denied.");
          }
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  useEffect(() => {
      if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
      }
  }, [stream]);

  useEffect(() => {
    if (!isCameraActive && !error) {
        startCamera(facingMode);
    }
    return () => stopCamera();
  }, []);

  const toggleCameraFacingMode = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  // Real-time Analysis Loop
  useEffect(() => {
    let interval: number;
    let lastFrameData: Uint8ClampedArray | null = null;

    if (isCameraActive) {
        interval = window.setInterval(() => {
            if (!videoRef.current || videoRef.current.readyState !== 4) return;
            
            const canvas = canvasRef.current || document.createElement('canvas');
            if (!canvasRef.current) canvasRef.current = canvas;
            
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            try {
                ctx.drawImage(videoRef.current, 0, 0, 100, 100);
                const imageData = ctx.getImageData(0, 0, 100, 100);
                const data = imageData.data;
                
                let brightnessSum = 0;
                let diffSum = 0;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    brightnessSum += (r + g + b) / 3;

                    if (lastFrameData) {
                        diffSum += Math.abs(r - lastFrameData[i]) + Math.abs(g - lastFrameData[i+1]) + Math.abs(b - lastFrameData[i+2]);
                    }
                }
                
                const avgBrightness = brightnessSum / (data.length / 4);
                const motionScore = lastFrameData ? diffSum / data.length : 0;
                lastFrameData = data;

                // Thresholds refined for better sensitivity
                if (avgBrightness < 60) setLightingStatus('too-dark');
                else if (avgBrightness > 210) setLightingStatus('too-bright');
                else setLightingStatus('good');

                setIsStable(motionScore < 15);
            } catch (e) {
                // Ignore
            }
        }, 150); 
    }
    return () => clearInterval(interval);
  }, [isCameraActive]);

  const processImage = (source: CanvasImageSource, srcWidth: number, srcHeight: number) => {
    const canvas = document.createElement('canvas');
    const MAX_DIMENSION = 1200; 
    let width = srcWidth;
    let height = srcHeight;

    if (width > height) {
      if (width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      }
    } else {
      if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user' && mode === 'face') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.9);
    }
    return null;
  };

  const capturePhoto = () => {
    const strictMode = mode === 'face';
    if (strictMode) {
        if (lightingStatus === 'too-dark') {
            setCaptureError("Lighting is too dark. Please move to a brighter area.");
            setTimeout(() => setCaptureError(null), 3000);
            return;
        }
        if (!isStable) {
            setCaptureError("Hold still! The camera is shaking.");
            setTimeout(() => setCaptureError(null), 3000);
            return;
        }
        if (lightingStatus !== 'good') {
            const confirm = window.confirm("Conditions are not optimal. Capture anyway?");
            if (!confirm) return;
        }
    }

    if (videoRef.current) {
      const image = processImage(
        videoRef.current,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
      if (image) {
        setCapturedImage(image);
        setIsUploaded(false);
        stopCamera();
      }
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsUploaded(false);
    startCamera(facingMode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
           const canvas = document.createElement('canvas');
           const MAX_DIMENSION = 1200;
           let width = img.width;
           let height = img.height;
           if (width > height) {
               if (width > MAX_DIMENSION) { height = Math.round((height * MAX_DIMENSION) / width); width = MAX_DIMENSION; }
           } else {
               if (height > MAX_DIMENSION) { width = Math.round((width * MAX_DIMENSION) / height); height = MAX_DIMENSION; }
           }
           canvas.width = width;
           canvas.height = height;
           const ctx = canvas.getContext('2d');
           ctx?.drawImage(img, 0, 0, width, height);
           const resizedImage = canvas.toDataURL('image/jpeg', 0.9);
           if (resizedImage) {
             setCapturedImage(resizedImage);
             setIsUploaded(true);
             stopCamera();
           }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const isConditionsIdeal = lightingStatus === 'good' && isStable;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-stone-950 p-6 animate-fade-in relative z-[100]">
          <div className="bg-stone-900 p-8 rounded-3xl border border-stone-800 text-center max-w-md w-full">
             <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
             <h3 className="text-white font-serif text-xl mb-2">Camera Error</h3>
             <p className="text-stone-400 mb-6 text-sm">{error}</p>
             <button onClick={() => startCamera(facingMode)} className="w-full bg-stone-800 text-white py-3 rounded-xl mb-3">Retry</button>
             <button onClick={onCancel} className="w-full bg-white text-stone-900 py-3 rounded-xl font-bold">Cancel</button>
          </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-stone-950 relative overflow-hidden z-[100]">
      
      {/* --- HEADER --- */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 bg-gradient-to-b from-black/60 to-transparent">
         <button 
            onClick={onCancel}
            className="p-3 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all border border-white/10"
         >
            <ArrowLeft size={20} />
         </button>
         <div className="text-white pr-2">
            <h3 className="font-serif text-xl font-bold">{mode === 'face' ? 'Scan Face' : 'Scan Product'}</h3>
         </div>
      </div>

      {/* --- MAIN VIEWPORT --- */}
      <div className="w-full h-full absolute inset-0 bg-black">
        {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className={`w-full h-full object-contain ${facingMode === 'user' && !isUploaded ? 'scale-x-[-1]' : ''}`}
            />
        ) : isCameraActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover transition-transform duration-500 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
        ) : (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-10 h-10 border-4 border-sage-500 border-t-transparent rounded-full"></div>
            </div>
        )}
      </div>

      {/* --- OVERLAYS --- */}
      {!capturedImage && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
            
            {/* FACE GUIDE - SVG OVERLAY for "Specs Removal" visual hint */}
            {mode === 'face' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                   {/* Simplified Face Silhouette */}
                   <svg width="300" height="400" viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-white stroke-[1]">
                      <ellipse cx="100" cy="130" rx="70" ry="90" strokeDasharray="5 5" />
                      <path d="M70 110 L130 110" strokeWidth="0.5" strokeOpacity="0.5" /> {/* Eye Line */}
                      <path d="M90 150 L110 150" strokeWidth="0.5" strokeOpacity="0.5" /> {/* Nose Line */}
                   </svg>
                </div>
            )}

            {/* CHECKLIST INDICATORS (Top Right) */}
            <div className="absolute top-24 right-6 flex flex-col gap-2 items-end">
                {/* 1. Lighting */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 ${
                    lightingStatus === 'good' ? 'bg-black/40 border-green-500/30 text-green-400' : 'bg-black/60 border-red-500/30 text-red-400'
                }`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{lightingStatus === 'good' ? 'Lighting' : lightingStatus === 'too-dark' ? 'Low Light' : 'High Light'}</span>
                    {lightingStatus === 'good' ? <CheckCircle2 size={14} /> : (lightingStatus === 'too-dark' ? <Moon size={14} /> : <Sun size={14} />)}
                </div>

                {/* 2. Stability */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 ${
                    isStable ? 'bg-black/40 border-green-500/30 text-green-400' : 'bg-black/60 border-amber-500/30 text-amber-400'
                }`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{isStable ? 'Stable' : 'Shaking'}</span>
                    {isStable ? <CheckCircle2 size={14} /> : <Hand size={14} />}
                </div>

                {/* 3. Specs/Glasses Reminder (Persistent) */}
                {mode === 'face' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border border-blue-500/30 bg-black/40 text-blue-300 shadow-lg animate-pulse-slow">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Remove Specs</span>
                        <Glasses size={14} />
                    </div>
                )}
            </div>

            {/* ERROR TEXT */}
            {captureError && (
                <div className="absolute top-48 left-0 right-0 flex justify-center">
                    <div className="bg-red-500/80 backdrop-blur-md px-6 py-3 rounded-full border border-red-400 text-white font-bold text-sm shadow-2xl animate-fade-in text-center">
                        {captureError}
                    </div>
                </div>
            )}

            {/* RETICLE FRAME */}
            <div className="relative">
                <div className={`border-[1.5px] transition-all duration-500 ${
                    isConditionsIdeal 
                    ? 'border-emerald-400/90 shadow-[0_0_50px_rgba(52,211,153,0.3)]' 
                    : 'border-white/40'
                } ${
                    mode === 'product' ? 'w-64 h-64 rounded-3xl' : 'w-72 h-80 rounded-[3rem]'
                }`}>
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white -translate-x-0.5 -translate-y-0.5 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white translate-x-0.5 -translate-y-0.5 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white -translate-x-0.5 translate-y-0.5 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white translate-x-0.5 translate-y-0.5 rounded-br-xl"></div>
                </div>
            </div>
        </div>
      )}

      {/* --- FOOTER CONTROLS --- */}
      <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 flex justify-center items-center gap-10">
           
           {capturedImage ? (
             <>
               <button 
                 onClick={retakePhoto}
                 className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all font-medium border border-white/20"
               >
                 Retake
               </button>
               <button 
                 onClick={confirmPhoto}
                 className="px-8 py-3 rounded-full bg-white text-stone-900 hover:bg-stone-200 transition-all font-bold shadow-lg"
               >
                 Confirm
               </button>
             </>
           ) : (
             <>
               {/* Flip */}
               <button 
                onClick={toggleCameraFacingMode}
                className="p-3.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
               >
                 <SwitchCamera size={20} />
               </button>

               {/* Trigger */}
               <button 
                onClick={capturePhoto}
                className={`w-20 h-20 rounded-full border-[5px] flex items-center justify-center hover:scale-105 transition-all relative group ${
                    isConditionsIdeal ? 'border-white' : 'border-white/30'
                }`}
               >
                 <div className={`w-16 h-16 rounded-full transition-all duration-300 ${
                     isConditionsIdeal ? 'bg-white scale-100' : 'bg-transparent border-2 border-white/50 scale-90'
                 }`}></div>
               </button>

               {/* Upload */}
               <div className="relative">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
                  >
                    <Upload size={20} />
                  </button>
               </div>
             </>
           )}
      </div>

    </div>
  );
};

export default Scanner;
