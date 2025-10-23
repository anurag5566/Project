
import React from 'react';
import { HandCursorController } from './components/HandCursorController';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto text-center">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">
            Cursor Movement on Object Motion
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            Use hand gestures to control a cursor with AI and your webcam.
          </p>
        </header>
        <main>
          <HandCursorController />
        </main>
        <footer className="mt-8 text-sm text-gray-500">
            <p>Powered by React, Tailwind CSS, and Google's MediaPipe.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
