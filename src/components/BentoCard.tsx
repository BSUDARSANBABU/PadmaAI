import { LucideIcon, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import React, { ReactNode } from 'react';

interface BentoCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  value?: string;
  hasAction?: boolean;
  children?: ReactNode;
}

export default function BentoCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  value,
  hasAction,
  children,
}: BentoCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-surface-container-low p-6 rounded-lg transition-all hover:bg-surface-container cursor-pointer group"
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center ${iconColor} editorial-shadow group-hover:scale-110 transition-transform`}
        >
          <Icon size={28} />
        </div>
        <div>
          <h4 className="font-bold text-on-surface">{title}</h4>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      {value && (
        <div className="flex items-end justify-between">
          <span className="text-4xl font-headline font-black text-on-surface">{value}</span>
          {hasAction && (
            <span className="text-sm font-semibold text-primary flex items-center gap-1">
              Execute <ArrowRight size={14} />
            </span>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}
