import { motion } from 'motion/react';

interface VoiceWaveProps {
  isListening?: boolean;
  isThinking?: boolean;
}

export default function VoiceWave({ isListening = false, isThinking = false }: VoiceWaveProps) {
  const bars = [
    { height: 32, opacity: 0.4 },
    { height: 56, opacity: 0.6 },
    { height: 80, opacity: 1.0 },
    { height: 64, opacity: 0.8 },
    { height: 40, opacity: 0.4 },
  ];

  return (
    <div className="w-full h-12 flex items-center justify-center gap-1">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className={`w-1.5 rounded-full ${isThinking ? 'bg-white/60' : 'bg-white'}`}
          initial={{ height: 6 }}
          animate={{
            height: isListening 
              ? [bar.height * 0.5, bar.height, bar.height * 0.5] 
              : isThinking 
                ? [12, 24, 12] 
                : 6,
          }}
          transition={{
            duration: isThinking ? 2 : 1.5,
            repeat: (isListening || isThinking) ? Infinity : 0,
            delay: i * (isThinking ? 0.2 : 0.1),
            ease: "easeInOut",
          }}
          style={{ opacity: (isListening || isThinking) ? bar.opacity : 0.3 }}
        />
      ))}
    </div>
  );
}
