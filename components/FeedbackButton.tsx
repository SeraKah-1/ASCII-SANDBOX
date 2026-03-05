'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, X, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL;

  const handleSend = () => {
    if (!feedback.trim() || !feedbackEmail) return;
    
    const subject = encodeURIComponent('User Feedback - ASCII Sandbox');
    const body = encodeURIComponent(feedback);
    window.location.href = `mailto:${feedbackEmail}?subject=${subject}&body=${body}`;
    
    setFeedback('');
    setIsOpen(false);
  };

  if (!feedbackEmail) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        title="Give Feedback"
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Smile size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">Give Feedback</h3>
                    <p className="text-xs text-zinc-500">Help us improve the sandbox</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What's on your mind? Found a bug? Have a feature request?"
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
                
                <button
                  onClick={handleSend}
                  disabled={!feedback.trim()}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <Send size={16} />
                  SEND VIA EMAIL
                </button>
                
                <p className="text-[10px] text-center text-zinc-500">
                  This will open your default email client to send the message.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
