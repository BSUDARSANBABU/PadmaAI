import { Reminder, ChatMessage, VoiceProfile } from './types';

export const MOCK_REMINDERS: Reminder[] = [];

export const MOCK_CHAT: ChatMessage[] = [];

export const MOCK_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'zephyr',
    name: 'Zephyr',
    description: 'The default balanced voice engine.',
    gender: 'neutral',
    selected: true,
    characteristics: 'Balanced, Clear, Default',
    baseVoice: 'Zephyr',
  }
];
