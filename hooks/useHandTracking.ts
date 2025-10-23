import { useState, useEffect, useRef, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12";

export interface CursorPosition {
  x: number;
  y: number;
}

export const useHandTracking = () => {
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
    // FIX: Explicitly initialize useRef with `undefined` to satisfy stricter type checks
    // that may expect an argument when a generic type is provided.
    const requestRef = useRef<number | undefined>(undefined);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const lastVideoTimeRef = useRef(-1);

    useEffect(() => {
        const createHandLandmarker = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
                );
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/latest/hand_landmarker.task`,
                        delegate: "GPU",
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                });
                handLandmarkerRef.current = landmarker;
            } catch (err) {
                console.error("Error initializing HandLandmarker:", err);
                if (err instanceof Error) {
                    setError(`Failed to initialize AI model: ${err.message}`);
                } else {
                    setError("An unknown error occurred while initializing the AI model.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        createHandLandmarker();

        return () => {
            handLandmarkerRef.current?.close();
        };
    }, []);

    const predictWebcam = useCallback(() => {
        const handLandmarker = handLandmarkerRef.current;
        const video = videoRef.current;

        if (!handLandmarker || !video || video.paused || video.ended) {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            return;
        }

        if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const results = handLandmarker.detectForVideo(video, performance.now());

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                const indexFingerTip = landmarks[8]; 

                if (indexFingerTip) {
                    // Adjust coordinates based on video dimensions.
                    // The horizontal position is inverted because the video feed is mirrored.
                    const newX = (1 - indexFingerTip.x) * video.offsetWidth;
                    const newY = indexFingerTip.y * video.offsetHeight;
                    setCursorPosition({ x: newX, y: newY });
                }
            }
        }
        
        requestRef.current = requestAnimationFrame(predictWebcam);
    }, []);

    const startTracking = useCallback((videoElement: HTMLVideoElement) => {
        videoRef.current = videoElement;
        if (handLandmarkerRef.current && videoRef.current) {
            lastVideoTimeRef.current = -1; // Reset time for new stream
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    }, [predictWebcam]);

    const stopTracking = useCallback(() => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = undefined;
            setCursorPosition(null);
        }
    }, []);

    return { isLoading, error, cursorPosition, startTracking, stopTracking };
};