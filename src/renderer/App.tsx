import React, { useState, useEffect } from 'react';
import ScreenSelector from './components/ScreenSelector';
import AnnotationEditor from './components/AnnotationEditor';
import { ScreenSource } from './types';

// Use this approach for TypeScript to access Electron
declare global {
  interface Window {
    require: (module: string) => any;
  }
}

const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const App: React.FC = () => {
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<ScreenSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScreenSources = async () => {
      try {
        if (!ipcRenderer) {
          console.error('Electron IPC is not available');
          setIsLoading(false);
          return;
        }
        
        const sources = await ipcRenderer.invoke('get-screen-sources');
        setScreenSources(sources);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to get screen sources:', error);
        setIsLoading(false);
      }
    };

    loadScreenSources();
  }, []);

  const handleSourceSelect = (source: ScreenSource) => {
    setSelectedSource(source);
  };

  const handleBack = () => {
    setSelectedSource(null);
  };

  return (
    <div className="app-container">
      {!selectedSource ? (
        <ScreenSelector 
          sources={screenSources} 
          onSelect={handleSourceSelect} 
          isLoading={isLoading} 
        />
      ) : (
        <AnnotationEditor 
          source={selectedSource} 
          onBack={handleBack} 
        />
      )}
    </div>
  );
};

export default App; 