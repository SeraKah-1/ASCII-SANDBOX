import React, { useState, useEffect } from 'react';
import { useJourneyStore, JourneyScene } from '../store/useJourneyStore';
import { Plus, Trash2, Edit2, Save, FolderOpen, Check, X, Map, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { editJourneyScene } from '../lib/ai';

export const JourneySidebar = () => {
  const { 
    journey, setScene, currentSceneIndex, 
    updateScene, addScene, deleteScene,
    saveJourney, loadJourney, deleteJourney, loadSavedJourneys, savedJourneys
  } = useJourneyStore();

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);

  useEffect(() => {
    loadSavedJourneys();
  }, [loadSavedJourneys]);

  if (!journey) return null;

  const startEdit = (index: number, scene: JourneyScene) => {
    setIsEditing(index);
    setEditTitle(scene.title);
    setEditDesc(scene.description);
  };

  const saveEdit = (index: number) => {
    updateScene(index, { title: editTitle, description: editDesc });
    setIsEditing(null);
  };

  const handleAiEdit = async () => {
    if (!aiInstruction.trim()) return;
    setIsAiEditing(true);
    try {
      const updatedScene = await editJourneyScene(journey, currentSceneIndex, aiInstruction);
      updateScene(currentSceneIndex, updatedScene);
      setAiInstruction('');
    } catch (e) {
      console.error("AI Edit failed", e);
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleAddScene = () => {
    const newScene: JourneyScene = {
      id: Math.max(0, ...journey.scenes.map(s => s.id)) + 1,
      title: "New Scene",
      description: "Description of the new scene",
      positions: [], // Empty for now, or copy previous
      dialogue: []
    };
    addScene(newScene);
    // Optionally jump to it
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

       {/* Header */}
       <div className="p-4 border-b border-zinc-800 overflow-hidden">
         <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2 whitespace-nowrap">
           <Map size={16} /> 
           {!isCollapsed && "Diorama Architect"}
         </h2>
         {!isCollapsed && (
           <>
             <h3 className="text-lg font-bold text-purple-400 truncate">{journey.title}</h3>
             <p className="text-xs text-zinc-500 truncate">{journey.description}</p>
           </>
         )}
       </div>

       {/* AI Edit Section */}
       {!isCollapsed && (
         <div className="p-3 border-b border-zinc-800 bg-purple-500/5">
           <div className="flex gap-2">
             <input 
               value={aiInstruction}
               onChange={(e) => setAiInstruction(e.target.value)}
               placeholder="Ask AI to edit this scene..."
               className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
               onKeyDown={(e) => e.key === 'Enter' && handleAiEdit()}
             />
             <button 
               onClick={handleAiEdit}
               disabled={isAiEditing || !aiInstruction}
               className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded disabled:opacity-50"
             >
               {isAiEditing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
             </button>
           </div>
         </div>
       )}

       {/* Scene List */}
       <div className="flex-1 overflow-y-auto p-2 space-y-2 overflow-x-hidden">
         <AnimatePresence>
           {journey.scenes.map((scene, index) => (
             <motion.div
               key={scene.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, height: 0 }}
               className={`p-3 rounded border transition-colors group relative cursor-pointer ${
                 currentSceneIndex === index 
                   ? 'border-purple-500/50 bg-purple-500/10' 
                   : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
               }`}
               onClick={() => !isEditing && setScene(index)}
             >
               {isCollapsed ? (
                 <div className="flex justify-center font-mono text-xs text-zinc-500">
                   {(index + 1).toString().padStart(2, '0')}
                 </div>
               ) : (
                 isEditing === index ? (
                   <div className="space-y-2" onClick={e => e.stopPropagation()}>
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
                     <div className="flex justify-end gap-2">
                       <button onClick={() => setIsEditing(null)} className="p-1 text-zinc-500 hover:text-zinc-300"><X size={14} /></button>
                       <button onClick={() => saveEdit(index)} className="p-1 text-emerald-500 hover:text-emerald-400"><Check size={14} /></button>
                     </div>
                   </div>
                 ) : (
                   <>
                     <div className="flex justify-between items-start gap-2">
                       <div className="flex-1 min-w-0">
                         <h3 className={`text-xs font-bold mb-1 flex items-center gap-2 ${currentSceneIndex === index ? 'text-purple-300' : 'text-zinc-300'}`}>
                           <span className="text-zinc-600 font-mono shrink-0">{(index + 1).toString().padStart(2, '0')}</span>
                           <span className="truncate">{scene.title}</span>
                         </h3>
                         <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{scene.description}</p>
                       </div>
                       <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                         <button onClick={() => startEdit(index, scene)} className="p-1 text-zinc-500 hover:text-blue-400"><Edit2 size={12} /></button>
                         <button onClick={() => deleteScene(index)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 size={12} /></button>
                       </div>
                     </div>
                   </>
                 )
               )}
             </motion.div>
           ))}
         </AnimatePresence>

         {!isCollapsed && (
           <button 
             onClick={handleAddScene}
             className="w-full py-2 border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 rounded text-xs flex items-center justify-center gap-2 transition-colors"
           >
             <Plus size={14} /> Add Scene
           </button>
         )}
       </div>

       {/* Footer Actions */}
       {!isCollapsed && (
         <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-2">
           <div className="flex gap-2">
             <button 
               onClick={saveJourney}
               className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded text-xs flex items-center justify-center gap-2 transition-colors"
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
               <h3 className="text-sm font-bold text-zinc-200">Saved Journeys</h3>
               <button onClick={() => setShowLoadModal(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
               {savedJourneys.length === 0 ? (
                 <div className="text-center py-8 text-zinc-500 text-xs">No saved journeys found.</div>
               ) : (
                 savedJourneys.map(j => (
                   <div key={j.title} className="p-3 bg-zinc-950 border border-zinc-800 rounded hover:border-purple-500/50 transition-colors group flex justify-between items-center">
                     <div onClick={() => { loadJourney(j.title); setShowLoadModal(false); }} className="cursor-pointer flex-1">
                       <div className="text-sm font-bold text-zinc-300">{j.title}</div>
                       <div className="text-[10px] text-zinc-500">{j.scenes.length} Scenes</div>
                     </div>
                     <button onClick={() => deleteJourney(j.title)} className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
