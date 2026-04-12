import { Request, Response } from 'express';
import * as models from './models';

// Reminder Views
export const getReminders = (req: Request, res: Response) => {
  res.json(models.reminders);
};

export const createReminder = (req: Request, res: Response) => {
  const newReminder: models.Reminder = {
    id: Date.now().toString(),
    ...req.body,
    completed: false
  };
  models.reminders.push(newReminder);
  res.status(201).json(newReminder);
};

export const updateReminder = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = models.reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    models.reminders[index] = { ...models.reminders[index], ...req.body };
    res.json(models.reminders[index]);
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
};

export const deleteReminder = (req: Request, res: Response) => {
  const { id } = req.params;
  const index = models.reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    models.reminders.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
};

// Chat History Views
export const getChatHistory = (req: Request, res: Response) => {
  res.json(models.chatHistory);
};

export const addChatMessage = (req: Request, res: Response) => {
  const newMessage: models.ChatMessage = {
    id: Date.now().toString(),
    ...req.body,
    timestamp: new Date().toLocaleTimeString()
  };
  models.chatHistory.push(newMessage);
  res.status(201).json(newMessage);
};

// Voice Profile Views
export const getVoiceProfiles = (req: Request, res: Response) => {
  res.json(models.voiceProfiles);
};

export const selectVoiceProfile = (req: Request, res: Response) => {
  const { id } = req.params;
  models.voiceProfiles.forEach(p => p.selected = (p.id === id));
  res.json(models.voiceProfiles);
};
