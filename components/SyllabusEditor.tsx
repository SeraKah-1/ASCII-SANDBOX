import React, { useState, useEffect } from 'react';
import { useSocialStore, SyllabusItem } from '../store/useSocialStore';
import { generateSyllabus, generateSlideFromSyllabus, editSyllabusItem } from '../lib/ai';
import { Loader2, Plus, Trash2, Edit2, Play, Save, FolderOpen, Check, X, RefreshCw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SyllabusEditor = () => {
  const { 
    topic, setSyllabus, syllabus, isGeneratingSyllabus, setGeneratingSyllabus,
    isGeneratingSlides, setGeneratingSlides, addSlide, updateSyllabusItem,
    saveSession, loadSavedSessions, savedSessions, loadSession, deleteSession
  } = useSocialStore();
  
  const [inputTopic, setInputTopic] = useState(topic);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState<string | null>(null);

  useEffect(() => {
    loadSavedSessions();
  }, [loadSavedSessions]);

  const handleGenerateSyllabus = async () => {
    if (!inputTopic) return;
    setGeneratingSyllabus(true);
    try {
      const result = await generateSyllabus(inputTopic);
      const items: SyllabusItem[] = result.syllabus.map((s: any) => ({
        id: Math.random().toString(36).substring(7),
        title: s.title,
        description: s.description,
        status: 'pending'
      }));
      setSyllabus(items);
      useSocialStore.setState({ topic: inputTopic });
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSyllabus(false);
    }
  };

  const handleGenerateSlides = async () => {
    setGeneratingSlides(true);
    
    // Process sequentially
    for (const item of syllabus) {
      if (item.status === 'completed') continue;
      
      updateSyllabusItem(item.id, { status: 'generating' });
      try {
        const slideData = await generateSlideFromSyllabus(item.title, item.description, topic);
        if (slideData) {
          addSlide({
            title: slideData.title,
            content: slideData.content,
            type: slideData.type as any,
            phase: 'C1' // Default phase
          });
          updateSyllabusItem(item.id, { status: 'completed', slideId: 'generated' });
        } else {
           updateSyllabusItem(item.id, { status: 'error' });
        }
      } catch (e) {
        updateSyllabusItem(item.id, { status: 'error' });
      }
    }
    setGeneratingSlides(false);
  };

  const startEdit = (item: SyllabusItem) => {
    setIsEditing(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description);
  };

  const saveEdit = (id: string) => {
    updateSyllabusItem(id, { title: editTitle, description: editDesc });
    setIsEditing(null);
  };

  const handleAiEdit = async (item: SyllabusItem) => {
    if (!aiInstruction.trim()) return;
    setIsAiEditing(item.id);
    try {
      const updatedItem = await editSyllabusItem(item, aiInstruction);
      updateSyllabusItem(item.id, updatedItem);
      setAiInstruction('');
      setIsEditing(null); // Close manual edit if open
    } catch (e) {
      console.error("AI Edit failed", e);
    } finally {
      setIsAiEditing(null);
    }
  };

  const deleteItem = (id: string) => {
    const newSyllabus = syllabus.filter(i => i.id !== id);
    setSyllabus(newSyllabus);
  };

  const addItem = () => {
    const newItem: SyllabusItem = {
      id: Math.random().toString(36).substring(7),
      title: "Topik Baru",
      description: "Deskripsi topik baru",
      status: 'pending'
    };
    setSyllabus([...syllabus, newItem]);
    startEdit(newItem);
  };

  return (
    <motion.div 
      initial={{ width: 320 }}
      animate={{ width: isCollapsed ? 60 : 320 }}
      className="flex flex-col h-full bg-zinc-900/50 border-r border-zinc-800 shrink-0 relative transition-all duration-300"
    >
      {/* Collapse Toggle */}
      <button 
         onClick={() => setIsCollapsed(!isCollapsed)}
         className="absolute -right-3 top-4 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white z-10"
       >
         {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
       </button>

      <div className="p-4 border-b border-zinc-800 overflow-hidden">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 whitespace-nowrap">
          {!isCollapsed && "Course Architect"}
        </h2>
        
        {!isCollapsed && (
          <>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                placeholder="Masukkan Topik..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerateSyllabus}
                disabled={isGeneratingSyllabus || !inputTopic}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingSyllabus ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {isGeneratingSyllabus ? 'Drafting...' : 'Generate Syllabus'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 overflow-x-hidden">
        {isGeneratingSyllabus && !isCollapsed && (
           <div className="space-y-3 p-2">
             {[1, 2, 3].map(i => (
               <div key={i} className="animate-pulse space-y-2">
                 <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                 <div className="h-3 bg-zinc-800/50 rounded w-full"></div>
               </div>
             ))}
           </div>
        )}

        <AnimatePresence>
          {syllabus.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3 rounded border ${item.status === 'generating' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950'} group relative`}
            >
              {isCollapsed ? (
                <div className="flex justify-center font-mono text-xs text-zinc-500">
                   {(index + 1).toString().padStart(2, '0')}
                 </div>
              ) : (
                isEditing === item.id ? (
                  <div className="space-y-2">
                    <input 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-bold text-zinc-200"
                    />
                    <textarea 
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400 h-16 resize-none"
                    />
                    
                    {/* AI Edit Input inside Edit Mode */}
                    <div className="flex gap-2 pt-2 border-t border-zinc-800 border-dashed">
                       <input 
                         value={aiInstruction}
                         onChange={(e) => setAiInstruction(e.target.value)}
                         placeholder="AI Instruction..."
                         className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-200"
                         onKeyDown={(e) => e.key === 'Enter' && handleAiEdit(item)}
                       />
                       <button 
                         onClick={() => handleAiEdit(item)}
                         disabled={isAiEditing === item.id || !aiInstruction}
                         className="p-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded disabled:opacity-50"
                       >
                         {isAiEditing === item.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                       </button>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setIsEditing(null)} className="p-1 text-zinc-500 hover:text-zinc-300"><X size={14} /></button>
                      <button onClick={() => saveEdit(item.id)} className="p-1 text-emerald-500 hover:text-emerald-400"><Check size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-zinc-300 mb-1 flex items-center gap-2">
                          <span className="text-zinc-600 font-mono shrink-0">{(index + 1).toString().padStart(2, '0')}</span>
                          <span className="truncate">{item.title}</span>
                        </h3>
                        <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="p-1 text-zinc-500 hover:text-blue-400"><Edit2 size={12} /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    
                    {item.status === 'generating' && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-500">
                        <Loader2 size={10} className="animate-spin" />
                        Generating Slide...
                      </div>
                    )}
                    {item.status === 'completed' && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500">
                        <Check size={10} className="text-emerald-500" />
                        Slide Ready
                      </div>
                    )}
                    {item.status === 'error' && (
                      <div className="mt-2 text-[10px] text-red-500">
                        Failed to generate
                      </div>
                    )}
                  </>
                )
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!isCollapsed && syllabus.length > 0 && (
           <button 
             onClick={addItem}
             className="w-full py-2 border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 rounded text-xs flex items-center justify-center gap-2 transition-colors"
           >
             <Plus size={14} /> Add Topic
           </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-2">
          <button
            onClick={handleGenerateSlides}
            disabled={isGeneratingSlides || syllabus.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingSlides ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isGeneratingSlides ? 'Generating Visuals...' : 'Generate All Visuals'}
          </button>

          <div className="flex gap-2">
            <button 
              onClick={saveSession}
              disabled={syllabus.length === 0}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={14} /> Save to Local
            </button>
            <button 
              onClick={() => setShowLoadModal(true)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <FolderOpen size={14} /> Load
            </button>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-200">Saved Courses</h3>
              <button onClick={() => setShowLoadModal(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {savedSessions.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">No saved courses found.</div>
              ) : (
                savedSessions.map(session => (
                  <div key={session.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded hover:border-emerald-500/50 transition-colors group flex justify-between items-center">
                    <div onClick={() => { loadSession(session.id); setShowLoadModal(false); }} className="cursor-pointer flex-1">
                      <div className="text-sm font-bold text-zinc-300">{session.topic}</div>
                      <div className="text-[10px] text-zinc-500">{new Date(session.date).toLocaleDateString()} • {session.syllabus?.length || 0} Topics</div>
                    </div>
                    <button onClick={() => deleteSession(session.id)} className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
