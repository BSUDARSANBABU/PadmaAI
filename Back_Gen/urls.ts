import { Router } from 'express';
import * as views from './views';

const router = Router();

// Reminder URLs
router.get('/reminders', views.getReminders);
router.post('/reminders', views.createReminder);
router.put('/reminders/:id', views.updateReminder);
router.delete('/reminders/:id', views.deleteReminder);

// Chat History URLs
router.get('/chat-history', views.getChatHistory);
router.post('/chat-history', views.addChatMessage);

// Voice Profile URLs
router.get('/voice-profiles', views.getVoiceProfiles);
router.put('/voice-profiles/:id/select', views.selectVoiceProfile);

export default router;
