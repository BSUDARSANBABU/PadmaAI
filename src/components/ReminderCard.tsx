import { Reminder } from '../types';
import { motion } from 'motion/react';
import React from 'react';

interface ReminderCardProps {
  key?: string | number;
  reminder: Reminder;
  onToggle: (id: string) => void;
}

export default function ReminderCard({ reminder, onToggle }: ReminderCardProps) {
  const priorityColors = {
    high: 'text-error',
    normal: 'text-primary',
    smart: 'text-tertiary',
  };

  const priorityLabels = {
    high: 'High Priority',
    normal: 'Normal',
    smart: 'Smart Suggestion',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="p-6 bg-surface-container-low rounded-xl group hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={reminder.completed}
          onChange={() => onToggle(reminder.id)}
          className="mt-1.5 rounded-sm border-primary text-primary focus:ring-primary w-5 h-5 cursor-pointer"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-widest ${priorityColors[reminder.priority]}`}>
              {priorityLabels[reminder.priority]}
            </span>
            <span className="text-xs text-on-surface-variant">{reminder.time}</span>
          </div>
          <p className={`text-on-surface font-semibold text-lg leading-tight mb-2 ${reminder.completed ? 'line-through opacity-50' : ''}`}>
            {reminder.title}
          </p>
          <div className="flex gap-2">
            {reminder.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-surface-container-lowest rounded text-[10px] font-bold text-on-surface-variant uppercase">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
