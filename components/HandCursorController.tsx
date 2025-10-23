import React, { useState, useRef } from 'react';
import { useHandTracking, CursorPosition } from '../hooks/useHandTracking';

const CustomCursor: React.FC<{ position: CursorPosition | null }> = ({ position }) => {
  if (!position) {
    return null;
  }
  return (
    <div
      className="absolute w-8 h-8 rounded-full bg-blue-400 bg-opacity-50 border-2 border-blue-300 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75 ease-out shadow-lg"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      aria-hidden="true"
    />
  );
};

const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.776 48.776 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);


export const HandCursorController: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const { isLoading: isModelLoading, error: modelError, cursorPosition, startTracking, stopTracking } = useHandTracking();

    const handleStartCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                setCameraError(null);
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = async () => {
                        if (videoRef.current) {
                             try {
                                await videoRef.current.play();
                                setIsCameraOn(true);
                                startTracking(videoRef.current);
                            } catch (playErr) {
                                console.error("Error playing video:", playErr);
                                setCameraError("Could not start camera stream. Please ensure permissions are granted and no other app is using the camera.");
                            }
                        }
                    };
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                if (err instanceof Error) {
                    setCameraError(`Error accessing webcam: ${err.message}. Please check permissions.`);
                } else {
                    setCameraError("An unknown error occurred while accessing the webcam.");
                }
            }
        } else {
            setCameraError("Your browser does not support webcam access.");
        }
    };

    const handleStopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        stopTracking();
    };
    
    const error = cameraError || modelError;

    const getStatusMessage = () => {
        if (isModelLoading) return 'Loading AI model...';
        if (modelError) return 'Could not load AI model.';
        if (isCameraOn) return 'Point your index finger at the camera.';
        return 'Click "Start Camera" to begin.';
    };

    return (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-2xl border border-gray-700 w-full max-w-3xl mx-auto">
            <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden flex items-center justify-center">
                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    playsInline
                    muted
                />
                 {!isCameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                         <CameraIcon className="w-16 h-16 mb-4 text-gray-500" />
                         <p>Camera is off</p>
                    </div>
                )}
                <CustomCursor position={cursorPosition} />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-400 text-center sm:text-left">
                   {getStatusMessage()}
                </div>
                <div className="flex gap-4">
                    {!isCameraOn ? (
                        <button
                            onClick={handleStartCamera}
                            disabled={isModelLoading || !!modelError}
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {isModelLoading ? 'Loading...' : modelError ? 'Error' : 'Start Camera'}
                        </button>
                    ) : (
                        <button
                            onClick={handleStopCamera}
                            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors"
                        >
                            Stop Camera
                        </button>
                    )}
                </div>
            </div>

            {error && (
                 <div className="mt-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg text-sm" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
};
