import { VoiceProfile } from '../types';
import { Play, User, UserCheck, Antenna, Brain, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';

interface VoiceProfileCardProps {
  key?: string | number;
  profile: VoiceProfile;
  onSelect: (id: string) => void;
  onEdit: (profile: VoiceProfile) => void;
}

export default function VoiceProfileCard({ profile, onSelect, onEdit }: VoiceProfileCardProps) {
  const icons = {
    female: User,
    male: UserCheck,
    neutral: Brain,
    antenna: Antenna,
  };

  const Icon = icons[profile.gender];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`p-6 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md cursor-pointer border-2 relative ${
        profile.selected
          ? 'bg-white border-primary/20'
          : 'bg-surface-container-low border-transparent hover:bg-white hover:border-primary/20'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div
          onClick={() => onSelect(profile.id)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
            profile.gender === 'female'
              ? 'bg-tertiary-container/30 text-tertiary'
              : profile.gender === 'male'
              ? 'bg-primary-container/30 text-primary'
              : profile.gender === 'antenna'
              ? 'bg-secondary-container/30 text-secondary'
              : 'bg-outline-variant/30 text-outline'
          }`}
        >
          <Icon size={24} />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(profile);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <Settings2 size={18} />
          </button>
          <button 
            onClick={() => onSelect(profile.id)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-sm"
          >
            <Play size={18} fill="currentColor" />
          </button>
        </div>
      </div>
      <div onClick={() => onSelect(profile.id)}>
        <h3 className="text-lg font-bold text-on-surface mb-1">{profile.name}</h3>
        <p className="text-sm text-outline-variant mb-4 line-clamp-2">{profile.description}</p>
        
        {profile.characteristics && (
          <div className="flex flex-wrap gap-1 mb-4">
            {profile.characteristics.split(',').map((char, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-surface-container text-[9px] font-bold uppercase text-outline-variant">
                {char.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {profile.id.includes('custom') && (
            <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-[10px] font-bold uppercase tracking-wider text-secondary">
              Neural Clone
            </span>
          )}
          {profile.selected ? (
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary">
              Active Profile
            </span>
          ) : (
            <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              SELECT PROFILE
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
