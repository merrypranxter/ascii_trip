/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Type, 
  Sparkles, 
  Settings2, 
  Download, 
  RefreshCw, 
  Github,
  Image as ImageIcon,
  Check,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
  Palette,
  Camera
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { CHAR_SETS, CharSet, STYLE_PRESETS, StylePreset, ColorMode } from './types';
import { generateAsciiFromPrompt } from './services/gemini';

export default function App() {
  const [inputMode, setInputMode] = useState<'prompt' | 'image'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [activeSets, setActiveSets] = useState<CharSet[]>(['ascii', 'symbols']);
  const [intensity, setIntensity] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [resolution, setResolution] = useState(100);
  const [activePreset, setActivePreset] = useState<StylePreset | 'custom'>('custom');
  const [zoom, setZoom] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>('monotone');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const applyPreset = (preset: StylePreset) => {
    setActivePreset(preset);
    setActiveSets(STYLE_PRESETS[preset].sets);
    setIntensity(STYLE_PRESETS[preset].intensity);
  };

  const toggleSet = (set: CharSet) => {
    setActivePreset('custom');
    setActiveSets(prev => 
      prev.includes(set) ? prev.filter(s => s !== set) : [...prev, set]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setInputMode('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateArt = async () => {
    if (activeSets.length === 0) return;
    setIsGenerating(true);
    
    try {
      if (inputMode === 'prompt') {
        const art = await generateAsciiFromPrompt(prompt, activeSets);
        const cleaned = art.replace(/```[a-z]*\n?|```/g, '');
        setResult(cleaned);
      } else if (image) {
        await processImageToAscii();
      }
    } catch (error) {
      console.error(error);
      setResult("Error generating art. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const processImageToAscii = async () => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = image!;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const aspectRatio = img.height / img.width;
        const width = resolution;
        const height = Math.floor(width * aspectRatio * 0.5);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        let ascii = '';
        const combinedChars = activeSets.flatMap(set => CHAR_SETS[set]);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            const avg = (r + g + b) / 3;
            
            const noise = (Math.random() - 0.5) * (intensity / 2);
            const brightness = Math.max(0, Math.min(255, avg + noise));
            
            const charIndex = Math.floor((brightness / 255) * (combinedChars.length - 1));
            ascii += combinedChars[charIndex];
          }
          ascii += '\n';
        }
        setResult(ascii);
        resolve();
      };
    });
  };

  const takeScreenshot = async () => {
    if (!outputRef.current) return;
    const canvas = await html2canvas(outputRef.current, {
      backgroundColor: '#000000',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = 'ascii-trip-screenshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const renderAscii = () => {
    if (!result) return null;

    if (colorMode === 'monotone') {
      return result;
    }

    return result.split('\n').map((line, lineIdx) => (
      <div key={lineIdx} className="flex">
        {line.split('').map((char, charIdx) => {
          let color = 'inherit';
          if (colorMode === 'multicolored') {
            const hue = (lineIdx * 5 + charIdx * 2) % 360;
            color = `hsl(${hue}, 100%, 70%)`;
          } else if (colorMode === 'trippy-gradient') {
            const hue = (Math.sin(lineIdx * 0.1 + charIdx * 0.1) * 180 + 180) % 360;
            color = `hsl(${hue}, 100%, 60%)`;
          }
          return (
            <span key={charIdx} style={{ color }} className="ascii-char">
              {char}
            </span>
          );
        })}
      </div>
    ));
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-trip-art.txt';
    a.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="w-full flex flex-col items-center mb-12 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <h1 className="text-6xl md:text-8xl font-black glitch-text tracking-tighter italic uppercase mb-2">
            ASCII TRIP
          </h1>
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 0.9, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-4 -right-8 text-trippy-pink"
          >
            <Sparkles size={48} />
          </motion.div>
        </motion.div>
        <p className="text-trippy-cyan font-mono text-sm tracking-widest uppercase opacity-80">
          Weird Creative Typographic Art Generator
        </p>
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-6">
          <section className="gradient-border">
            <div className="p-6 space-y-6">
              <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg">
                <button 
                  onClick={() => setInputMode('prompt')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all",
                    inputMode === 'prompt' ? "bg-trippy-purple text-white" : "hover:bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Type size={18} /> Prompt
                </button>
                <button 
                  onClick={() => setInputMode('image')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all",
                    inputMode === 'image' ? "bg-trippy-purple text-white" : "hover:bg-zinc-800 text-zinc-400"
                  )}
                >
                  <ImageIcon size={18} /> Image
                </button>
              </div>

              {inputMode === 'prompt' ? (
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-500 uppercase">Artistic Prompt</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe something weird... like a melting clock in a digital forest"
                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-trippy-pink transition-colors resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-trippy-cyan transition-colors overflow-hidden group"
                  >
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                    ) : (
                      <>
                        <Upload className="text-zinc-600 mb-2" />
                        <span className="text-xs text-zinc-500 font-mono">UPLOAD SOURCE</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-mono text-zinc-500 uppercase">Style Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(STYLE_PRESETS) as StylePreset[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => applyPreset(p)}
                      className={cn(
                        "py-2 rounded-md text-[10px] font-bold uppercase transition-all border",
                        activePreset === p 
                          ? "bg-trippy-pink text-white border-trippy-pink" 
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-zinc-500 uppercase">Character Sets</label>
                  <Settings2 size={14} className="text-zinc-600" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CHAR_SETS) as CharSet[]).map((set) => (
                    <button
                      key={set}
                      onClick={() => toggleSet(set)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all border",
                        activeSets.includes(set) 
                          ? "bg-trippy-cyan text-black border-trippy-cyan" 
                          : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600"
                      )}
                    >
                      {set}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-mono text-zinc-500 uppercase flex items-center gap-2">
                  <Palette size={12} /> Color Mode
                </label>
                <div className="flex gap-2">
                  {(['monotone', 'multicolored', 'trippy-gradient'] as ColorMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setColorMode(mode)}
                      className={cn(
                        "flex-1 py-2 rounded-md text-[9px] font-bold uppercase transition-all border",
                        colorMode === mode 
                          ? "bg-trippy-green text-black border-trippy-green" 
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {mode.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase">
                  <span>Trippiness</span>
                  <span className="text-trippy-pink">{intensity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full accent-trippy-pink"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-mono text-zinc-500 uppercase">
                  <span>Resolution</span>
                  <span className="text-trippy-cyan">{resolution}px</span>
                </div>
                <input 
                  type="range" 
                  min="40" 
                  max="200" 
                  step="10"
                  value={resolution}
                  onChange={(e) => setResolution(parseInt(e.target.value))}
                  className="w-full accent-trippy-cyan"
                />
              </div>

              <button 
                onClick={generateArt}
                disabled={isGenerating || (inputMode === 'prompt' && !prompt) || (inputMode === 'image' && !image)}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-trippy-green transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isGenerating ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <>
                    <Zap size={20} className="group-hover:fill-current" />
                    MANIFEST ART
                  </>
                )}
              </button>
            </div>
          </section>

          <div className="flex items-center justify-center gap-4 text-zinc-600">
            <button className="hover:text-white transition-colors flex items-center gap-1 text-xs font-mono">
              <Github size={14} /> GITHUB CONTEXT (WIP)
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl min-h-[600px] relative flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black/50 backdrop-blur-md z-10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-zinc-800 rounded-md p-1">
                  <button 
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    className="p-1 hover:text-trippy-cyan transition-colors"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-[10px] font-mono w-12 text-center text-zinc-400">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                    className="p-1 hover:text-trippy-cyan transition-colors"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={takeScreenshot}
                    disabled={!result}
                    className="flex items-center gap-2 px-3 py-1 bg-zinc-800 hover:bg-trippy-purple text-white rounded-md text-[10px] font-bold uppercase transition-all disabled:opacity-0"
                  >
                    <Camera size={14} /> Capture
                  </button>
                  <button 
                    onClick={downloadResult}
                    disabled={!result}
                    className="p-1 hover:text-trippy-cyan transition-colors disabled:opacity-0"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-black relative">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    ref={outputRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ascii-container p-8"
                    style={{ 
                      transform: `scale(${zoom})`,
                      fontSize: `${Math.max(4, 12 - resolution/20)}px`,
                      color: colorMode === 'monotone' ? `hsl(${200 + intensity}, 100%, 70%)` : 'inherit'
                    }}
                  >
                    {renderAscii()}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 space-y-4"
                  >
                    <div className="w-24 h-24 border-4 border-zinc-800 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles size={40} />
                    </div>
                    <p className="font-mono text-xs uppercase tracking-widest">Waiting for manifestation...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-zinc-600 text-[10px] font-mono uppercase tracking-[0.3em]">
        Stay Weird • ASCII TRIP v1.1 • Built with Gemini
      </footer>
    </div>
  );
}
