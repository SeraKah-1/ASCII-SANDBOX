import React, { useState, useEffect } from 'react';
import { useSocialStore } from '../store/useSocialStore';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Lightbulb, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export function SlideDeck() {
  const { slides } = useSocialStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance to latest slide when new one is added, UNLESS user is manually browsing
  useEffect(() => {
    if (slides.length > 0) {
      const timer = setTimeout(() => {
        setCurrentIndex(slides.length - 1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [slides.length]);

  const currentSlide = slides[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(slides.length - 1, prev + 1));
  };

  if (!currentSlide) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-8 text-center">
        <div className="text-zinc-500 text-sm italic">
          <p className="mb-2">Menunggu visualisasi...</p>
          <p className="text-xs opacity-50">Diskusi sedang berlangsung untuk menghasilkan slide.</p>
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'challenge': return <AlertTriangle className="text-red-400" size={24} />;
      case 'solution': return <CheckCircle className="text-emerald-400" size={24} />;
      case 'implementation': return <Zap className="text-yellow-400" size={24} />;
      default: return <Lightbulb className="text-blue-400" size={24} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'challenge': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'solution': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'implementation': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col">
      {/* Header / Navigation */}
      <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrev} 
            disabled={currentIndex === 0}
            className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-mono text-zinc-500">
            SLIDE {currentIndex + 1} / {slides.length}
          </span>
          <button 
            onClick={handleNext} 
            disabled={currentIndex === slides.length - 1}
            className="p-1 hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getColor(currentSlide.type)}`}>
          {getIcon(currentSlide.type)}
          {currentSlide.type}
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 p-8 flex flex-col justify-center relative overflow-y-auto bg-gradient-to-br from-zinc-900 to-zinc-950">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-3xl mx-auto"
          >
            <div className="mb-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Phase: {currentSlide.phase}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight tracking-tight">
              {currentSlide.title}
            </h2>
            <ul className="space-y-6">
              {currentSlide.content.map((point, i) => (
                <motion.li 
                  key={`${currentSlide.id}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 text-lg md:text-xl text-zinc-300 leading-relaxed group"
                >
                  <span className={`mt-2 w-2 h-2 rounded-full shrink-0 transition-transform group-hover:scale-150 ${
                    currentSlide.type === 'challenge' ? 'bg-red-500' :
                    currentSlide.type === 'solution' ? 'bg-emerald-500' :
                    currentSlide.type === 'implementation' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span>{point}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-zinc-800 w-full">
        <motion.div 
          className="h-full bg-zinc-600"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
