export type View = 'home' | 'history' | 'settings' | 'help' | 'schedule';

export interface Reminder {
  id: string;
  title: string;
  priority: 'high' | 'normal' | 'smart';
  time: string;
  tags: string[];
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  type?: 'analysis' | 'standard';
  summary?: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male' | 'neutral' | 'antenna';
  selected: boolean;
  characteristics?: string;
  baseVoice?: 'Kore' | 'Fenrir' | 'Puck' | 'Charon' | 'Zephyr';
}
