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

// Mock Database State
export let reminders: Reminder[] = [
  {
    id: '1',
    title: 'Review quarterly projection report',
    priority: 'high',
    time: '10:30 AM',
    tags: ['Finance'],
    completed: false,
  }
];

export let chatHistory: ChatMessage[] = [];

export let voiceProfiles: VoiceProfile[] = [
  {
    id: 'aura',
    name: 'Aura',
    description: 'Soothing, ethereal tones.',
    gender: 'female',
    selected: true,
    characteristics: 'Soft, Ethereal',
    baseVoice: 'Kore',
  }
];
