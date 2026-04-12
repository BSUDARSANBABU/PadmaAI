import { ChatMessage } from '../types';
import { Sparkles, Copy, Check, Pencil, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { ReactNode, useState } from 'react';

interface ChatBubbleProps {
  key?: string | number;
  message: ChatMessage;
  searchQuery?: string;
  onUpdate?: (id: string, newText: string) => void;
}

export default function ChatBubble({ message, searchQuery = '', onUpdate }: ChatBubbleProps) {
  const isAI = message.sender === 'ai';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(message.id, editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 text-black rounded-sm px-0.5">{part}</mark> 
            : part
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-1 max-w-[85%] ${isAI ? 'self-start items-start' : 'self-end items-end'}`}
    >
      <div className="flex items-center gap-2 mb-1 px-1">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isAI ? 'text-primary' : 'text-slate-500'}`}>
          {isAI ? 'Padma' : 'Sudarshan'}
        </span>
      </div>
      <div
        className={`group relative p-4 rounded-t-2xl shadow-sm text-sm leading-relaxed w-full ${
          isAI
            ? 'bg-surface-container-lowest text-on-surface rounded-br-2xl border-l-4 border-primary'
            : 'bg-primary text-white rounded-bl-2xl'
        }`}
      >
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className={`p-1.5 rounded-lg ${
                  isAI 
                    ? 'bg-surface-container text-outline-variant hover:text-primary' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
                title="Edit message"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-lg ${
                  isAI 
                    ? 'bg-surface-container text-outline-variant hover:text-primary' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
                title="Copy to clipboard"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </>
          )}
        </div>

        {message.type === 'analysis' && (
          <div className="flex items-center gap-2 mb-2 text-primary font-bold">
            <Sparkles size={14} />
            Analysis Complete
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={`w-full p-2 rounded-lg text-sm bg-transparent border focus:ring-2 focus:outline-none min-h-[80px] ${
                isAI ? 'border-surface-variant focus:ring-primary text-on-surface' : 'border-white/20 focus:ring-white/50 text-white'
              }`}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  isAI ? 'bg-surface-container text-on-surface hover:bg-surface-container-high' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  isAI ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white text-primary hover:bg-white/90'
                }`}
              >
                <Save size={12} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {highlightText(message.text, searchQuery)}
          </div>
        )}
      </div>
      <span className="text-[10px] text-slate-400 font-medium">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
  );
}
