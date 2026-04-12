import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Trash2, Info } from 'lucide-react';
import { VoiceProfile } from '../types';

interface VoiceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: VoiceProfile) => void;
  onDelete?: (id: string) => void;
  profile?: VoiceProfile | null;
}

export default function VoiceProfileModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  profile
}: VoiceProfileModalProps) {
  const [formData, setFormData] = useState<Partial<VoiceProfile>>({
    name: '',
    description: '',
    gender: 'female',
    characteristics: '',
    baseVoice: 'Kore'
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setFormData({
        name: '',
        description: '',
        gender: 'female',
        characteristics: '',
        baseVoice: 'Kore'
      });
    }
  }, [profile, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    onSave({
      id: profile?.id || Date.now().toString(),
      name: formData.name!,
      description: formData.description!,
      gender: formData.gender as any || 'neutral',
      characteristics: formData.characteristics || '',
      baseVoice: formData.baseVoice as any || 'Zephyr',
      selected: profile?.selected || false
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-surface-container flex items-center justify-between bg-surface-container-lowest">
              <h2 className="text-xl font-bold font-headline text-on-surface">
                {profile ? 'Edit Voice Profile' : 'Create Voice Profile'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-2">
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider">Profile Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Muse"
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl border-none ring-1 ring-surface-container focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the personality and tone..."
                  className="w-full h-24 p-4 bg-surface-container-low rounded-xl border-none ring-1 ring-surface-container focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline-variant uppercase tracking-wider">Gender / Persona</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full h-12 px-4 bg-surface-container-low rounded-xl border-none ring-1 ring-surface-container focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="neutral">Neutral</option>
                    <option value="antenna">Antenna (Synth)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline-variant uppercase tracking-wider">Base Engine</label>
                  <select
                    value={formData.baseVoice}
                    onChange={e => setFormData({ ...formData, baseVoice: e.target.value as any })}
                    className="w-full h-12 px-4 bg-surface-container-low rounded-xl border-none ring-1 ring-surface-container focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="Kore">Kore (Soft)</option>
                    <option value="Fenrir">Fenrir (Deep)</option>
                    <option value="Puck">Puck (Energetic)</option>
                    <option value="Charon">Charon (Neutral)</option>
                    <option value="Zephyr">Zephyr (Default)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider">Voice Characteristics</label>
                <input
                  type="text"
                  value={formData.characteristics}
                  onChange={e => setFormData({ ...formData, characteristics: e.target.value })}
                  placeholder="e.g., Warm, Ethereal, Precise"
                  className="w-full h-12 px-4 bg-surface-container-low rounded-xl border-none ring-1 ring-surface-container focus:ring-2 focus:ring-primary transition-all"
                />
                <p className="text-[10px] text-outline-variant flex items-center gap-1 mt-1">
                  <Info size={10} /> Separate characteristics with commas.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-surface-container">
                <label className="text-xs font-bold text-outline-variant uppercase tracking-wider">Voice Sample (Optional)</label>
                <div className="p-6 rounded-xl bg-surface-container-low border-2 border-dashed border-surface-container flex flex-col items-center justify-center text-center gap-2 hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Save size={20} className="rotate-[-90deg]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">Upload Audio Sample</p>
                    <p className="text-[10px] text-on-surface-variant">Used for neural calibration</p>
                  </div>
                  <input type="file" className="hidden" accept="audio/*" />
                </div>
              </div>
            </form>

            <div className="p-6 bg-surface-container-lowest border-t border-surface-container flex items-center justify-between">
              {profile && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(profile.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-error hover:bg-error/10 rounded-xl transition-colors text-sm font-bold"
                >
                  <Trash2 size={18} />
                  Delete Profile
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Save size={18} />
                  {profile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
