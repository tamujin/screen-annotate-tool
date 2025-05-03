import React, { useState, useEffect, useRef } from 'react';
import { ScreenSource, Annotation, AnnotationType, ColorOption } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Use this approach for TypeScript to access Electron
declare global {
  interface Window {
    require: (module: string) => any;
  }
}

const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

interface AnnotationEditorProps {
  source: ScreenSource;
  onBack: () => void;
}

const COLORS: ColorOption[] = [
  { id: '1', value: '#ff0000', name: 'Red', shortcut: '1' },
  { id: '2', value: '#00ff00', name: 'Green', shortcut: '2' },
  { id: '3', value: '#0000ff', name: 'Blue', shortcut: '3' },
  { id: '4', value: '#ffff00', name: 'Yellow', shortcut: '4' },
  { id: '5', value: '#ff00ff', name: 'Magenta', shortcut: '5' },
  { id: '6', value: '#00ffff', name: 'Cyan', shortcut: '6' },
  { id: '7', value: '#ffffff', name: 'White', shortcut: '7' },
  { id: '8', value: '#000000', name: 'Black', shortcut: '8' },
];

const AnnotationEditor: React.FC<AnnotationEditorProps> = ({ source, onBack }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotationType, setActiveAnnotationType] = useState<AnnotationType>('arrow');
  const [activeColor, setActiveColor] = useState<string>(COLORS[0].value);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [textPosition, setTextPosition] = useState<{ x: number, y: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const captureScreen = async () => {
      try {
        // Create a video element to capture the screen
        const video = document.createElement('video');
        video.autoplay = true;
        video.style.display = 'none';
        document.body.appendChild(video);

        // Get the stream from the selected source
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
            }
          } as any
        });

        video.srcObject = stream;

        // Wait for the video to load metadata
        video.onloadedmetadata = () => {
          // Create a canvas to draw the video frame
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Draw the current video frame to the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert the canvas to a data URL
            const dataUrl = canvas.toDataURL('image/png');
            setScreenImage(dataUrl);
            
            // Stop the stream and clean up
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(video);
          }
        };
      } catch (error) {
        console.error('Error capturing screen:', error);
        setStatusMessage('Failed to capture screen. Please try again.');
      }
    };

    captureScreen();

    // Set up keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Tool shortcuts
      if (key === 'a') setActiveAnnotationType('arrow');
      if (key === 'c') setActiveAnnotationType('circle');
      if (key === 'r') setActiveAnnotationType('rectangle');
      if (key === 't') setActiveAnnotationType('text');
      
      // Color shortcuts
      const colorOption = COLORS.find(color => color.shortcut === key);
      if (colorOption) setActiveColor(colorOption.value);
      
      // Undo (Ctrl+Z)
      if (e.ctrlKey && key === 'z') {
        setAnnotations(prev => prev.slice(0, -1));
      }
      
      // Save (Ctrl+S)
      if (e.ctrlKey && key === 's') {
        handleSave();
        e.preventDefault();
      }
      
      // Escape to cancel drawing or text input
      if (key === 'escape') {
        if (textPosition) {
          setTextPosition(null);
        } else if (isDrawing) {
          setIsDrawing(false);
          setCurrentAnnotation(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [source, isDrawing, textPosition]);

  // Effect to draw annotations when they change
  useEffect(() => {
    if (!canvasRef.current || !screenImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all annotations
    annotations.forEach(drawAnnotation.bind(null, ctx));
    
    // Draw the current annotation if drawing
    if (isDrawing && currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation);
    }
    
  }, [annotations, currentAnnotation, isDrawing, screenImage]);

  // Function to draw a single annotation
  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { type, color, startX, startY, endX = startX, endY = startY } = annotation;
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    
    switch (type) {
      case 'arrow':
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw the arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const headLength = 15;
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle - Math.PI / 7),
          endY - headLength * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 7),
          endY - headLength * Math.sin(angle + Math.PI / 7)
        );
        ctx.lineTo(endX, endY);
        ctx.fill();
        break;
        
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        );
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
        
      case 'rectangle':
        const width = endX - startX;
        const height = endY - startY;
        ctx.beginPath();
        ctx.rect(startX, startY, width, height);
        ctx.stroke();
        break;
        
      case 'text':
        if (annotation.text) {
          ctx.font = '16px Arial';
          ctx.fillText(annotation.text, startX, startY);
        }
        break;
    }
  };

  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (textPosition) return; // Skip if we're entering text
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    
    if (activeAnnotationType === 'text') {
      setTextPosition({ x, y });
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 100);
      return;
    }
    
    setCurrentAnnotation({
      id: uuidv4(),
      type: activeAnnotationType,
      color: activeColor,
      startX: x,
      startY: y,
      endX: x,
      endY: y
    });
  };

  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || textPosition) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentAnnotation({
      ...currentAnnotation,
      endX: x,
      endY: y
    });
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation || textPosition) return;
    
    setAnnotations([...annotations, currentAnnotation]);
    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  // Handle text submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (textPosition && textInput.trim()) {
      const newAnnotation: Annotation = {
        id: uuidv4(),
        type: 'text',
        color: activeColor,
        startX: textPosition.x,
        startY: textPosition.y,
        text: textInput.trim()
      };
      
      setAnnotations([...annotations, newAnnotation]);
      setTextInput('');
      setTextPosition(null);
    }
  };

  // Save the annotated image
  const handleSave = async () => {
    if (!canvasRef.current || !screenImage) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Load the screenshot into an image
    const img = new Image();
    img.src = screenImage;
    
    await new Promise<void>((resolve) => {
      img.onload = () => {
        // Set canvas size to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Draw all annotations
        annotations.forEach(drawAnnotation.bind(null, ctx));
        
        resolve();
      };
    });
    
    try {
      // Convert the canvas to a data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      if (!ipcRenderer) {
        // Fallback for browser environment (for development)
        const link = document.createElement('a');
        link.download = 'screenshot.png';
        link.href = dataUrl;
        link.click();
        setStatusMessage('Screenshot downloaded');
        return;
      }
      
      // Save the image using Electron
      const result = await ipcRenderer.invoke('save-screenshot', dataUrl);
      
      if (result.success) {
        setStatusMessage(`Screenshot saved to ${result.filePath}`);
      } else {
        setStatusMessage(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving image:', error);
      setStatusMessage('Error saving the screenshot. Please try again.');
    }
  };

  // Clear all annotations
  const handleClear = () => {
    setAnnotations([]);
  };

  if (!screenImage) {
    return <div className="placeholder-text">Capturing screen...</div>;
  }

  return (
    <div className="app-container">
      <div className="toolbar">
        <button onClick={onBack}>Back</button>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div 
            className={`annotation-button ${activeAnnotationType === 'arrow' ? 'active' : ''}`}
            onClick={() => setActiveAnnotationType('arrow')}
            title="Arrow (A)"
          >
            ➡️ Arrow
          </div>
          
          <div 
            className={`annotation-button ${activeAnnotationType === 'circle' ? 'active' : ''}`}
            onClick={() => setActiveAnnotationType('circle')}
            title="Circle (C)"
          >
            ⭕ Circle
          </div>
          
          <div 
            className={`annotation-button ${activeAnnotationType === 'rectangle' ? 'active' : ''}`}
            onClick={() => setActiveAnnotationType('rectangle')}
            title="Rectangle (R)"
          >
            🔲 Rectangle
          </div>
          
          <div 
            className={`annotation-button ${activeAnnotationType === 'text' ? 'active' : ''}`}
            onClick={() => setActiveAnnotationType('text')}
            title="Text (T)"
          >
            🔤 Text
          </div>
        </div>
        
        <div className="color-picker">
          <span>Color:</span>
          {COLORS.map((color) => (
            <div
              key={color.id}
              className={`color-swatch ${color.value === activeColor ? 'active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => setActiveColor(color.value)}
              title={`${color.name} (${color.shortcut})`}
            />
          ))}
        </div>
        
        <button onClick={handleClear}>Clear All</button>
        <button onClick={handleSave}>Save (Ctrl+S)</button>
        
        <div className="keyboard-shortcuts">
          A: Arrow | C: Circle | R: Rectangle | T: Text | 1-8: Colors | Ctrl+Z: Undo
        </div>
      </div>
      
      <div className="canvas-container">
        {screenImage && (
          <>
            <img
              ref={imageRef}
              src={screenImage}
              alt="Screen capture"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              onLoad={() => {
                if (canvasRef.current && imageRef.current) {
                  const imgWidth = imageRef.current.naturalWidth;
                  const imgHeight = imageRef.current.naturalHeight;
                  canvasRef.current.width = imgWidth;
                  canvasRef.current.height = imgHeight;
                }
              }}
            />
            
            <canvas
              ref={canvasRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            {textPosition && (
              <form
                onSubmit={handleTextSubmit}
                style={{
                  position: 'absolute',
                  left: textPosition.x,
                  top: textPosition.y,
                  zIndex: 10
                }}
              >
                <input
                  ref={textInputRef}
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onBlur={handleTextSubmit}
                  placeholder="Enter text..."
                  style={{
                    background: 'white',
                    border: `2px solid ${activeColor}`,
                    padding: '5px',
                    minWidth: '200px'
                  }}
                  autoFocus
                />
              </form>
            )}
          </>
        )}
      </div>
      
      <div className="status-bar">
        {statusMessage || `Tool: ${activeAnnotationType} | Color: ${COLORS.find(c => c.value === activeColor)?.name || activeColor}`}
      </div>
    </div>
  );
};

export default AnnotationEditor; 