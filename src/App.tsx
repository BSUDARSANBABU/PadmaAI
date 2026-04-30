import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Sun, Newspaper, AlarmClock, Sparkles, ArrowRight, Search, PlayCircle, ChevronDown, Calendar, List, Home as HomeIcon, Link2Off, MicOff, X, Info, Copy, Trash2, CheckCircle2, HelpCircle, User, Zap, MessageSquare, History as HistoryIcon, Sliders, Square, Settings2, Moon, Menu, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import VoiceWave from './components/VoiceWave';
import BentoCard from './components/BentoCard';
import ReminderCard from './components/ReminderCard';
import ChatBubble from './components/ChatBubble';
import VoiceProfileCard from './components/VoiceProfileCard';
import VoiceProfileModal from './components/VoiceProfileModal';
import MySchedule from './components/MySchedule';
import { View, Reminder, ChatMessage, VoiceProfile } from './types';
import { MOCK_REMINDERS, MOCK_CHAT, MOCK_VOICE_PROFILES } from './constants';
import { GeminiLiveService } from './lib/geminiLive';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('padma_reminders');
    return saved ? JSON.parse(saved) : MOCK_REMINDERS;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('padma_chat_history');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'initial',
      sender: 'ai',
      text: 'I am Padma. I am ready to assist you. What do you want?',
      timestamp: new Date().toISOString()
    }];
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('padma_user_name') || 'Sudarshan';
  });
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>(() => {
    const saved = localStorage.getItem('padma_voice_profiles');
    return saved ? JSON.parse(saved) : MOCK_VOICE_PROFILES;
  });
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [currentSender, setCurrentSender] = useState<'user' | 'ai' | null>(null);
  const [sessionCaptions, setSessionCaptions] = useState<{sender: 'user' | 'ai', text: string}[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('padma_volume');
    return saved ? parseFloat(saved) : 0.85;
  });
  const [sensitivity, setSensitivity] = useState(() => {
    const saved = localStorage.getItem('padma_sensitivity');
    return saved ? parseFloat(saved) : 0.72;
  });
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VoiceProfile | null>(null);
  const [speechRate, setSpeechRate] = useState(() => {
    const saved = localStorage.getItem('padma_speech_rate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [speechPitch, setSpeechPitch] = useState(() => {
    const saved = localStorage.getItem('padma_speech_pitch');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [ttsModel, setTtsModel] = useState(() => {
    return localStorage.getItem('padma_tts_model') || 'gemini-2.0-flash-exp';
  });
  const [responseLanguage, setResponseLanguage] = useState(() => {
    return localStorage.getItem('padma_response_language') || 'English (US)';
  });
  const [showLiveCaptions, setShowLiveCaptions] = useState(() => {
    const saved = localStorage.getItem('padma_show_live_captions');
    return saved ? JSON.parse(saved) : true;
  });
  const [translationLanguage, setTranslationLanguage] = useState(() => {
    return localStorage.getItem('padma_translation_language') || 'None';
  });
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('padma_theme') as 'light' | 'dark') || 'light';
  });
  const isInitialMount = useRef(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [voiceSampleName, setVoiceSampleName] = useState('');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeTurnRef = useRef<{ id: string, sender: 'user' | 'ai' } | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const captionContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    localStorage.setItem('padma_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('padma_chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topActionButtons, setTopActionButtons] = useState([
    { id: 'news', label: 'Latest News', icon: Newspaper, color: 'text-blue-500', visible: true },
    { id: 'jobs', label: 'Portal Jobs', icon: Search, color: 'text-orange-500', visible: true },
    { id: 'schedule', label: 'My Schedule', icon: Calendar, color: 'text-emerald-500', visible: true },
    { id: 'gather', label: 'Gather Info', icon: Sparkles, color: 'text-purple-500', visible: true },
    { id: 'talk', label: 'Padma AI', icon: MessageSquare, color: 'text-red-600', visible: true },
  ]);

  const [isGuidedTrainingActive, setIsGuidedTrainingActive] = useState(false);
  const [currentGuidedPhraseIndex, setCurrentGuidedPhraseIndex] = useState(0);
  const [liveCaption, setLiveCaption] = useState("");
  const [aiLiveCaption, setAiLiveCaption] = useState("");

  const genAI = useMemo(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    return new GoogleGenAI({ apiKey: apiKey || '' });
  }, []);
  const translationCache = useRef<Record<string, string>>({});

  const translateText = async (text: string, targetLang: string) => {
    if (!text || targetLang === 'None' || text.length < 3) return text;
    
    const cacheKey = `${targetLang}:${text}`;
    if (translationCache.current[cacheKey]) return translationCache.current[cacheKey];

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text to ${targetLang}. Provide only the translated text without any explanations, quotes, or extra characters. If the text is already in ${targetLang}, return it as is: "${text}"`
      });
      const translated = response.text?.trim() || text;
      translationCache.current[cacheKey] = translated;
      return translated;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const summarizeText = async (text: string) => {
    if (!text || text.length < 50) return null;
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize the following AI response in one concise sentence (max 15 words). Focus on the key action or information: "${text}"`
      });
      return response.text?.trim() || null;
    } catch (error) {
      console.error("Summarization error:", error);
      return null;
    }
  };

  const handleVoiceCommands = (transcript: string) => {
    const text = transcript.toLowerCase();
    
    // Theme Commands
    if (text.includes("dark mode") || text.includes("switch to dark")) {
      setTheme('dark');
      speakText("Switching to dark mode.");
      return true;
    }
    if (text.includes("light mode") || text.includes("switch to light")) {
      setTheme('light');
      speakText("Switching to light mode.");
      return true;
    }

    // Navigation Commands
    if (text.includes("go to home") || text.includes("show home") || text.includes("open home")) {
      setCurrentView('home');
      speakText("Navigating to home.");
      return true;
    }
    if (text.includes("go to schedule") || text.includes("show schedule") || text.includes("open schedule")) {
      setCurrentView('schedule');
      speakText("Opening your schedule.");
      return true;
    }
    if (text.includes("go to history") || text.includes("show history") || text.includes("open history")) {
      setCurrentView('history');
      speakText("Opening interaction history.");
      return true;
    }
    if (text.includes("go to settings") || text.includes("show settings") || text.includes("open settings")) {
      setCurrentView('settings');
      speakText("Opening system settings.");
      return true;
    }

    // Caption Commands
    if (text.includes("show captions") || text.includes("enable captions") || text.includes("turn on captions")) {
      setShowLiveCaptions(true);
      speakText("Live captions enabled.");
      return true;
    }
    if (text.includes("hide captions") || text.includes("disable captions") || text.includes("turn off captions")) {
      setShowLiveCaptions(false);
      speakText("Live captions disabled.");
      return true;
    }

    // Settings Adjustments
    if (text.includes("increase volume") || text.includes("volume up")) {
      const newVol = Math.min(1, volume + 0.1);
      handleVolumeChange(newVol);
      speakText(`Volume increased to ${Math.round(newVol * 100)} percent.`);
      return true;
    }
    if (text.includes("decrease volume") || text.includes("volume down")) {
      const newVol = Math.max(0, volume - 0.1);
      handleVolumeChange(newVol);
      speakText(`Volume decreased to ${Math.round(newVol * 100)} percent.`);
      return true;
    }
    if (text.includes("faster") || text.includes("increase speed")) {
      const newRate = Math.min(2.0, speechRate + 0.2);
      setSpeechRate(newRate);
      speakText(`Speech rate increased to ${newRate.toFixed(1)}x.`);
      return true;
    }
    if (text.includes("slower") || text.includes("decrease speed")) {
      const newRate = Math.max(0.5, speechRate - 0.2);
      setSpeechRate(newRate);
      speakText(`Speech rate decreased to ${newRate.toFixed(1)}x.`);
      return true;
    }

    // History Commands
    if (text.includes("clear history") || text.includes("purge history") || text.includes("delete history")) {
      clearHistory();
      speakText("Interaction history has been purged.");
      return true;
    }

    return false;
  };

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('padma_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const recognitionRef = useRef<any>(null);
  const guidedPhrases = [
    "The quick brown fox jumps over the lazy dog.",
    "Neural synthesis requires precise vocal patterns for calibration.",
    "Padma AI is my active intelligence co-driver for daily tasks.",
    "I am training a custom voice model to personalize my experience.",
    "Clear articulation ensures the highest quality neural weights."
  ];
  const [guidedAudioBlobs, setGuidedAudioBlobs] = useState<Blob[]>([]);

  const handlePreviewTimeUpdate = () => {
    if (previewAudioRef.current) {
      const progress = (previewAudioRef.current.currentTime / previewAudioRef.current.duration) * 100;
      setPreviewProgress(progress);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setShowSavedFeedback(true);
    const timer = setTimeout(() => setShowSavedFeedback(false), 2000);
    return () => clearTimeout(timer);
  }, [userName, voiceProfiles, volume, sensitivity, speechRate, speechPitch, ttsModel, responseLanguage, theme, showLiveCaptions, translationLanguage]);

  const liveService = useMemo(() => new GeminiLiveService(), []);

  useEffect(() => {
    localStorage.setItem('padma_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (userName === 'User') {
      setUserName('Sudarshan');
    }
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('padma_chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('padma_user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('padma_voice_profiles', JSON.stringify(voiceProfiles));
  }, [voiceProfiles]);

  useEffect(() => {
    localStorage.setItem('padma_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('padma_show_live_captions', JSON.stringify(showLiveCaptions));
  }, [showLiveCaptions]);

  useEffect(() => {
    localStorage.setItem('padma_translation_language', translationLanguage);
  }, [translationLanguage]);

  useEffect(() => {
    localStorage.setItem('padma_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('padma_sensitivity', sensitivity.toString());
  }, [sensitivity]);

  useEffect(() => {
    localStorage.setItem('padma_speech_rate', speechRate.toString());
    liveService.setSpeechRate(speechRate);
  }, [speechRate, liveService]);

  useEffect(() => {
    localStorage.setItem('padma_speech_pitch', speechPitch.toString());
    liveService.setSpeechPitch(speechPitch);
  }, [speechPitch, liveService]);

  useEffect(() => {
    localStorage.setItem('padma_tts_model', ttsModel);
  }, [ttsModel]);

  useEffect(() => {
    localStorage.setItem('padma_response_language', responseLanguage);
  }, [responseLanguage]);

  useEffect(() => {
    checkGoogleAuthStatus();
  }, []);

  const checkGoogleAuthStatus = async () => {
    const isAuth = localStorage.getItem('padma_google_authenticated') === 'true';
    setIsGoogleAuthenticated(isAuth);
    if (isAuth) {
      fetchGoogleEvents();
    }
  };

  const handleGoogleConnect = async () => {
    // Simulate OAuth flow for frontend-only version
    setIsSyncing(true);
    setTimeout(() => {
      setIsGoogleAuthenticated(true);
      localStorage.setItem('padma_google_authenticated', 'true');
      fetchGoogleEvents();
      setIsSyncing(false);
      speakText("Google Calendar successfully connected.");
    }, 1500);
  };

  const fetchGoogleEvents = async () => {
    setIsSyncing(true);
    try {
      const storedEvents = localStorage.getItem('padma_google_events');
      if (storedEvents) {
        setGoogleEvents(JSON.parse(storedEvents));
      } else {
        // Initial mock events
        const mockEvents = [
          {
            id: 'mock-1',
            summary: 'Neural Sync Session',
            description: 'Weekly synchronization with the core team.',
            start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
            end: { dateTime: new Date(Date.now() + 7200000).toISOString() }
          }
        ];
        setGoogleEvents(mockEvents);
        localStorage.setItem('padma_google_events', JSON.stringify(mockEvents));
      }
    } catch (error) {
      console.error('Failed to fetch mock Google events:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addGoogleEvent = async (summary: string, description: string, start: string, end: string) => {
    try {
      const newEvent = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end }
      };
      
      const updatedEvents = [...googleEvents, newEvent];
      setGoogleEvents(updatedEvents);
      localStorage.setItem('padma_google_events', JSON.stringify(updatedEvents));
      return true;
    } catch (error) {
      console.error('Failed to add mock Google event:', error);
    }
    return false;
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (captionContainerRef.current) {
        captionContainerRef.current.scrollTop = captionContainerRef.current.scrollHeight;
      }
    };
    
    // Use a small timeout to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutId);
  }, [sessionCaptions]);

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const selectVoiceProfile = async (id: string) => {
    setVoiceProfiles(prev => prev.map(p => ({ ...p, selected: p.id === id })));
    
    // If we are currently listening, we need to restart the session to apply the new voice
    if (isListening && !isConnecting) {
      liveService.disconnect();
      setIsListening(false);
      // Small delay to ensure cleanup before restart
      setTimeout(() => {
        handleMicToggle();
      }, 100);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire conversation history? This cannot be undone.")) {
      setChatMessages([]);
      setSessionCaptions([]);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    liveService.setVolume(value);
  };

  const saveVoiceProfile = (profile: VoiceProfile) => {
    setVoiceProfiles(prev => {
      const exists = prev.find(p => p.id === profile.id);
      if (exists) {
        return prev.map(p => p.id === profile.id ? profile : p);
      }
      return [...prev, profile];
    });
    setIsVoiceModalOpen(false);
    setEditingProfile(null);
  };

  const deleteVoiceProfile = (id: string) => {
    setVoiceProfiles(prev => {
      const filtered = prev.filter(p => p.id !== id);
      // If deleted profile was selected, select the first one available
      if (prev.find(p => p.id === id)?.selected && filtered.length > 0) {
        filtered[0].selected = true;
      }
      return filtered;
    });
  };

  const updateChatMessage = (id: string, newText: string) => {
    setChatMessages(prev => prev.map(msg => msg.id === id ? { ...msg, text: newText } : msg));
  };

  const handleStartTraining = () => {
    if (!voiceSampleName) return;
    setIsTraining(true);
    setTrainingProgress(0);
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        const next = Math.min(100, prev + 5);
        if (next === 100) {
          clearInterval(interval);
          // We'll handle the completion in a timeout or next tick to avoid side effects in state updater
          setTimeout(() => {
            setIsTraining(false);
            
            // Create a new voice profile from the training
            const newProfile: VoiceProfile = {
              id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: voiceSampleName.replace(/\.[^/.]+$/, ""), // Remove extension
              description: "Custom neural voice trained from user sample.",
              gender: 'neutral',
              selected: false,
              characteristics: "Neural Synthesis, Custom Calibration",
              baseVoice: 'Zephyr'
            };
            
            setVoiceProfiles(prevProfiles => [...prevProfiles, newProfile]);
            setVoiceSampleName('');
            setRecordedAudioUrl(null);
          }, 0);
        }
        return next;
      });
    }, 100);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (isGuidedTrainingActive) {
          setGuidedAudioBlobs(prev => [...prev, audioBlob]);
        } else {
          setRecordedAudioUrl(audioUrl);
          setVoiceSampleName(`Recording_${new Date().toLocaleTimeString()}.wav`);
          setShowUploadSuccess(true);
          setTimeout(() => setShowUploadSuccess(false), 3000);
        }
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setErrorMessage("Microphone access denied. Please enable permissions to record.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const startGuidedTraining = () => {
    setIsGuidedTrainingActive(true);
    setCurrentGuidedPhraseIndex(0);
    setGuidedAudioBlobs([]);
  };

  const nextGuidedPhrase = () => {
    if (currentGuidedPhraseIndex < guidedPhrases.length - 1) {
      setCurrentGuidedPhraseIndex(prev => prev + 1);
    } else {
      finishGuidedTraining();
    }
  };

  const finishGuidedTraining = () => {
    setIsGuidedTrainingActive(false);
    setVoiceSampleName(`Guided_Training_${new Date().toLocaleDateString()}.wav`);
    const combinedBlob = new Blob(guidedAudioBlobs, { type: 'audio/wav' });
    setRecordedAudioUrl(URL.createObjectURL(combinedBlob));
    setShowUploadSuccess(true);
    setTimeout(() => setShowUploadSuccess(false), 3000);
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const langCode = responseLanguage.split('(')[1]?.replace(')', '').trim() || 'en-US';
    const voice = voices.find(v => v.lang.includes(langCode));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const stopAllSpeech = () => {
    window.speechSynthesis.cancel();
    liveService.stopAudioPlayback();
  };

  const handleAddMeeting = (title: string, date: string, time: string) => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title,
      priority: 'smart',
      time: `${date} ${time}`,
      tags: ['Manual Entry'],
      completed: false
    };
    const updatedReminders = [newReminder, ...reminders];
    setReminders(updatedReminders);
    
    // Switch to schedule view to show it
    setCurrentView('schedule');
    
    // Provide feedback
    const feedbackMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'ai',
      text: `### Schedule Registered\n\nI have successfully entered your new meeting: **${title}** for **${date}** at **${time}** into your neural calendar. I will monitor this event and notify you as the time approaches.`,
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, feedbackMsg]);
    speakText(`Sudarshan, I have added ${title} to your schedule for ${date} at ${time}. Your neural calendar is now up to date.`);
  };

  const triggerAIAction = (actionId: string) => {
    // Automatically turn on microphone if it's off
    if (!isListening) {
      handleMicToggle();
    }

    let responseText = "";
    let speechText = "";
    let type: 'analysis' | 'standard' = 'standard';

    if (actionId === 'news') {
      responseText = `### Global Intelligence Update: 20 Essential Headlines
      
1. **India Tech Boom**: Bangalore reported as the world's fastest-growing tech hub in Q1 2026.
2. **SpaceX Mars Expansion**: Starship fleet increases to 50 active vessels for colonisation.
3. **Neuralink Human Success**: Over 1,000 patients now successfully using neural interfaces for mobility.
4. **Quantum Computing Milestone**: First stable 1,000-qubit processor unveiled in Switzerland.
5. **Clean Energy Record**: Solar and wind power now account for 65% of global electricity production.
6. **AI Governance**: UN passes historical resolution on algorithmic transparency.
7. **Vertical Farming**: Singapore achieves 100% self-sufficiency in leafy greens via automated towers.
8. **Fusion Power Ignition**: Commercial pilot plant in France maintains 10-minute plasma burn.
9. **Deep Sea Exploration**: New bioluminescent species discovered in the Mariana Trench.
10. **Global Health**: Universal vaccine for influenza variants enters Phase III trials.
11. **Smart Cities**: Tokyo's smart-grid reduces carbon emissions by 40% year-on-year.
12. **EV Innovation**: Solid-state batteries with 1,000km range enter mass production.
13. **Cybersecurity**: AI-driven firewall thwarts massive coordinated breach attempt.
14. **Material Science**: Graphene-infused concrete makes infrastructure 3x more durable.
15. **Augmented Reality**: Glasses with 16k resolution per eye replace smartphones in Europe.
16. **Automation**: Fully autonomous trucking routes established across major continents.
17. **Education**: Decentralised AI tutors providing 1-on-1 learning for 500 million students.
18. **Environment**: Massive reforestation drones plant 1 billion trees in the Amazon basin.
19. **Robotics**: New dexterous humanoids begin assisting in elderly care facilities globally.
20. **Crypto Evolution**: Central banks transition 80% of reserve operations to digital ledgers.

*Source: Padma Global Intelligence Feed - Real-time Synthesis*`;
      speechText = `Sudarshan, I have synthesized 20 essential headlines for you. One: India's tech boom makes Bangalore the fastest-growing hub. Two: SpaceX expands Mars colonization fleet. Three: Neuralink reports success for over one thousand patients. Four: Switzerland unveils a stable thousand-qubit quantum processor. Five: Clean energy now reaches sixty-five percent of global production. Six: U-N passes resolution on A-I transparency. Seven: Singapore reaches full self-sufficiency in leafy greens. Eight: Commercial fusion ignition achieved in France. Nine: New species discovered in Mariana Trench. And Ten: A universal influenza vaccine enters final trials. I have listed the remaining ten high-impact headlines on your dashboard. What do you want to explore next?`;
    } else if (actionId === 'jobs') {
      type = 'analysis';
      responseText = `### Strategic Portal Analysis: Software Opportunities & Walk-in Drives
      
I have synchronized with the latest data streams across major professional portals to identify high-value software opportunities.

**1. Naukri.com Analysis**:
- **Full Stack Developer (MERN)**: Location: Bangalore - 15 positions across top-tier startups. Immediate hiring for candidates with 2-4 years experience.
- **Java Backend Engineer**: Location: Hyderabad - Large-scale walk-in drive announced for this Saturday at HITEC City. Focus on Spring Boot and Microservices.
- **Data Engineer**: Location: Pune - 8 vacancies at major Fintech firms. Focus on PySpark and AWS Glue.

**2. Amazon Jobs Portal**:
- **Applied Scientist - Gen AI**: Hyderabad - Designing next-gen LLM architectures for retail synthesis.
- **Software Development Engineer (L5)**: Bangalore - Core Logistics team. Requires deep distributed systems knowledge.

**3. Unstop & Campus Portals**:
- **Code-a-Thon 2026**: Virtual walk-in drive for freshers. over 200 software roles available across India.
- **Product Management intern**: National-level recruitment opening for tech-focused graduates.

**4. LinkedIn Intelligence**:
- **Remote DevOps Lead**: US-based firm hiring for IST-friendly hours. 12 vacancies reported.
- **Q.A. Automation Engineer**: High volume recruitment drive for 25+ roles in Chennai.

**Strategic Synthesis**: 
The market is currently pivoting towards high-bandwidth AI engineering and specialized cloud architecture. I recommend focusing your preparation on system design and neural integration patterns. I am monitoring 45 additional vacancies across these portals. Which sector should I dive deeper into?`;
      speechText = `I have completed a deep-scan of job portals across Naukri, Amazon, Unstop, and LinkedIn. On Naukri, there is a large-scale Java walk-in drive in Hyderabad this Saturday, and fifteen Full Stack roles in Bangalore. At Amazon, there are Applied Scientist roles in Hyderabad and developer positions in Bangalore. Unstop is hosting a massive virtual code-a-thon for freshers with over two hundred roles. LinkedIn reports twelve remote DevOps vacancies and over twenty-five Q-A automation roles in Chennai. I am monitoring forty-five additional vacancies. What do you want to analyze next?`;
    } else if (actionId === 'schedule') {
      const activeReminders = reminders.filter(r => !r.completed);
      if (activeReminders.length > 0) {
        responseText = `### Your Neural Schedule & Strategic Priorities

You currently have ${activeReminders.length} active tasks that require your attention. Here is your detailed future schedule:

${activeReminders.map((r, i) => `${i + 1}. **${r.title}**: Scheduled for ${r.time}. Priority: ${r.priority.toUpperCase()}. Status: ACTIVE.`).join('\n')}

**Strategic Synthesis**: Your cognitive bandwidth is well-distributed. I recommend focusing on your next immediate task: **${activeReminders[0].title}** at **${activeReminders[0].time}**. This will maintain your peak temporal efficiency.`;
        
        const scheduleSummary = activeReminders.slice(0, 10).map((r, i) => `${i + 1}: ${r.title} at ${r.time}`).join('. ');
        speechText = `Sudarshan, I have accessed your neural schedule. You have ${activeReminders.length} upcoming tasks. Here are the details. ${scheduleSummary}. I recommend staying focused on your next commitment, which is ${activeReminders[0].title}. How else can I assist with your planning?`;
      } else {
        responseText = `### Your Neural Schedule: Optimal Clarity

Your schedule is currently clear of any immediate obligations. This state of "Neural Zero" is a perfect opportunity for deep focus, strategic planning, or advanced neural training. 

**Suggestions for this window**:
- Engage in deep-work sessions for long-term projects.
- Review your strategic goals for the upcoming week.
- Utilize this time for personal cognitive development and rest.`;
        speechText = "Sudarshan, your schedule is currently clear. This is an excellent opportunity for deep focus or neural training. I suggest using this window for high-level strategic planning or cognitive development.";
      }
    } else if (actionId === 'gather') {
      type = 'analysis';
      responseText = `### Information Gathering & Comprehensive Neural Analysis

I have completed a deep-scan of your connected intelligence hubs and checked major portals for relevant updates.

**Portal Analysis**:
- **Amazon Jobs**: 18 new vacancies matching your neural profile identified.
- **Global News Hubs**: 20 major headlines indexed and summarized.
- **LinkedIn Insights**: 5 high-value connections within your strategic network have updated their status.

**System Summary**:
- **Data Connectivity**: 12 Neural Hubs are currently active.
- **System Latency**: 14ms (Optimal).
- **Contextual Synthesis**: Your profile is now fully aligned with current global trends.

**Strategic Recommendation**: All portals are synchronized. I am ready to assist you with specific deep-dives.`;
      speechText = `I have completed a deep-scan of all connected portals, including Amazon Jobs. Your neural profile is fully synchronized with 12 active hubs. I have identified 18 new vacancies and 20 major headlines. I am ready to assist you with any specific deep-dives.`;
    } else if (actionId === 'talk') {
      responseText = `I am Padma. I am ready to assist you. What do you want?`;
      speechText = `I am Padma. I am ready to assist you. What do you want?`;
    }

    const newMsg: ChatMessage = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString(),
      type
    };

    setChatMessages(prev => [...prev, newMsg]);
    speakText(speechText);
  };

  const handleMicToggle = async () => {
    if (isConnecting) return;
    setErrorMessage(null);

    if (isListening) {
      liveService.disconnect();
      stopAllSpeech();
      setIsListening(false);
      setIsThinking(false);
      setCurrentTranscription('');
      setCurrentSender(null);
      setSessionCaptions([]);
      activeTurnRef.current = null;
    } else {
      try {
        setIsConnecting(true);
        setIsListening(true);
        setCurrentTranscription('');
        setCurrentSender(null);
        setSessionCaptions([]);
        activeTurnRef.current = null;
        
        // Map our profile IDs to Gemini voice names
        const selectedProfile = voiceProfiles.find(p => p.selected);
        const voiceMap: Record<string, string> = {
          aura: 'Kore',
          atlas: 'Fenrir',
          nova: 'Puck',
          echo: 'Charon'
        };
        const voiceName = selectedProfile?.baseVoice || (selectedProfile ? voiceMap[selectedProfile.id] : 'Zephyr');

        // Prepare history for the AI
        const historyContext = chatMessages
          .slice(-10) // Last 10 messages for context
          .map(msg => `${msg.sender === 'user' ? 'Sudarshan' : 'Padma'}: ${msg.text}`)
          .join('\n');

        await liveService.connect({
          onAudioData: (data) => {
            liveService.handleIncomingAudio(data);
          },
          onTranscription: async (text, isUser, isIncremental = false) => {
            const sender = isUser ? 'user' : 'ai';
            setCurrentSender(sender);
            
            let processedText = text;
            if (translationLanguage !== 'None') {
              processedText = await translateText(text, translationLanguage);
            }

            if (isUser) {
              setCurrentTranscription(processedText);
              setLiveCaption(processedText);
            } else {
              setAiLiveCaption(prev => isIncremental ? prev + processedText : processedText);
            }

            setSessionCaptions(prev => {
              const last = prev[prev.length - 1];
              if (last && last.sender === sender) {
                const updated = [...prev];
                const newText = isIncremental ? last.text + processedText : processedText;
                updated[updated.length - 1] = { ...last, text: newText };
                return updated;
              }
              return [...prev, { sender, text: processedText }];
            });

            setChatMessages(prev => {
              if (activeTurnRef.current?.sender === sender) {
                return prev.map(msg => 
                  msg.id === activeTurnRef.current?.id 
                    ? { ...msg, text: isIncremental ? msg.text + processedText : processedText, timestamp: new Date().toISOString() } 
                    : msg
                );
              } else {
                const newId = Date.now().toString() + '-' + sender + '-' + Math.random().toString(36).substr(2, 5);
                activeTurnRef.current = { id: newId, sender };
                return [
                  ...prev,
                  {
                    id: newId,
                    sender,
                    text: processedText,
                    timestamp: new Date().toISOString(),
                    type: 'text'
                  }
                ];
              }
            });
          },
          onAudioStart: () => {
            setIsThinking(false);
            setCurrentSender('ai');
            setAiLiveCaption("");
            if (activeTurnRef.current?.sender !== 'ai') {
              activeTurnRef.current = null;
              setCurrentTranscription('');
            }
          },
          onAudioEnd: async () => {
            setIsThinking(false);
            setAiLiveCaption("");
            
            // Trigger summarization for the last AI message
            if (activeTurnRef.current?.sender === 'ai') {
              const lastAiMessageId = activeTurnRef.current.id;
              setChatMessages(prev => {
                const lastMsg = prev.find(m => m.id === lastAiMessageId);
                if (lastMsg && lastMsg.text.length > 50 && !lastMsg.summary) {
                  // We'll trigger the async summary and update state later
                  summarizeText(lastMsg.text).then(summary => {
                    if (summary) {
                      setChatMessages(current => current.map(m => 
                        m.id === lastAiMessageId ? { ...m, summary } : m
                      ));
                    }
                  });
                }
                return prev;
              });
            }

            // Ensure the last transcription is saved if it hasn't been already
            activeTurnRef.current = null;
          },
          onError: (err) => {
            setIsListening(false);
            setIsThinking(false);
            setErrorMessage(err.message || "An unexpected error occurred with the AI connection.");
          },
          onClose: () => {
            setIsListening(false);
            setIsThinking(false);
          }
        }, voiceName, speechRate, speechPitch, ttsModel, userName, historyContext, responseLanguage);
      } catch (error: any) {
        console.error("Mic toggle error:", error);
        setIsListening(false);
        setErrorMessage(error.message || "Failed to connect to the AI assistant.");
      } finally {
        setIsConnecting(false);
      }
    }
  };

  useEffect(() => {
    if (isListening) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          
          // Map language
          const langMap: Record<string, string> = {
            'English (US)': 'en-US',
            'English (British)': 'en-GB',
            'French (European)': 'fr-FR',
            'German (Modern)': 'de-DE',
            'Japanese (Tokyo)': 'ja-JP',
            'Telugu (India)': 'te-IN',
            'Hindi (India)': 'hi-IN',
            'Spanish (Latin)': 'es-MX'
          };
          recognitionRef.current.lang = langMap[responseLanguage] || 'en-US';

          recognitionRef.current.onresult = async (event: any) => {
            let transcript = "";
            let isFinal = false;
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
              if (event.results[i].isFinal) isFinal = true;
            }
            
            if (translationLanguage !== 'None') {
              // For interim results, show a "Translating..." hint or the original text
              // For final results, perform the actual translation
              if (isFinal) {
                const translated = await translateText(transcript, translationLanguage);
                setLiveCaption(translated);
              } else {
                setLiveCaption(`[Translating...] ${transcript}`);
              }
            } else {
              setLiveCaption(transcript);
            }

            // Handle Voice Commands
            if (isFinal) {
              const wasCommand = handleVoiceCommands(transcript);
              if (wasCommand) return;
            }

            // Handle scheduling command
            if (transcript.toLowerCase().includes("ai schedule my time")) {
              const meetingTitle = "Meeting with someone";
              const meetingDate = "April 10th";
              const meetingTime = "2:45 PM";
              
              const newReminder: Reminder = {
                id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
                title: meetingTitle,
                time: `${meetingDate} at ${meetingTime}`,
                completed: false,
                priority: 'high',
                tags: []
              };
              
              setReminders(prev => [...prev, newReminder]);

              // Add to Google Calendar if authenticated
              if (isGoogleAuthenticated) {
                // For demo purposes, we'll schedule it for tomorrow at 2:45 PM
                const start = new Date();
                start.setDate(start.getDate() + 1);
                start.setHours(14, 45, 0, 0);
                const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later
                
                addGoogleEvent(meetingTitle, "Scheduled via Padma AI", start.toISOString(), end.toISOString());
              }

              setChatMessages(prev => [...prev, {
                id: Date.now().toString() + '-ai-' + Math.random().toString(36).substr(2, 5),
                sender: 'ai',
                text: `### Neural Schedule Updated\n\nI have scheduled your meeting for **${meetingDate}** at **${meetingTime}**. You can view this on your Schedule page.`,
                timestamp: new Date().toISOString(),
                type: 'standard'
              }]);
              speakText(`I have scheduled your meeting for ${meetingDate} at ${meetingTime}.`);
            }

            // Handle search history for "gather" related queries
            if (transcript.toLowerCase().includes("gather information") || transcript.toLowerCase().includes("gather info")) {
              setSearchHistory(prev => [transcript, ...prev.slice(0, 9)]);
            }
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            if (event.error === 'not-allowed') {
              setErrorMessage("Microphone access denied for Live Captions.");
            }
          };

          recognitionRef.current.start();
        } catch (err) {
          console.error("Speech Recognition Initialization Error:", err);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore stop errors
        }
        recognitionRef.current = null;
      }
      setLiveCaption("");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, responseLanguage]);

  useEffect(() => {
    return () => {
      liveService.disconnect();
    };
  }, [liveService]);

  return (
    <div className="min-h-screen bg-surface-container-lowest font-sans text-on-surface antialiased">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <TopNav 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        userName={userName} 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      <main className={`lg:ml-64 pt-16 min-h-screen relative overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'blur-sm lg:blur-none pointer-events-none lg:pointer-events-auto' : ''}`}>
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto px-4 lg:px-6 py-4 flex flex-col items-center justify-center gap-8 lg:gap-12 h-[calc(100vh-4rem)] overflow-hidden"
            >
              {/* Abstract Background Elements */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

              {/* Top Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3 lg:gap-4 relative z-20">
                <AnimatePresence>
                  {topActionButtons.map(btn => btn.visible && (
                    <motion.button
                      key={btn.id}
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 10 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => triggerAIAction(btn.id)}
                      className="flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2 lg:py-3 bg-surface-container-low backdrop-blur-md border border-surface-variant/20 rounded-xl lg:rounded-2xl shadow-lg hover:shadow-primary/10 transition-all group"
                    >
                      <div className={`p-1.5 lg:p-2 rounded-lg bg-surface-container-lowest ${btn.color} group-hover:scale-110 transition-transform`}>
                        <btn.icon size={16} className="lg:w-5 lg:h-5" />
                      </div>
                      <span className="text-xs lg:text-sm font-bold text-on-surface whitespace-nowrap">{btn.label}</span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {/* Voice Interaction Area - NOW AT THE TOP */}
              <div className="flex flex-col items-center gap-3 shrink-0 relative z-10">
                <div className="relative group">
                  <motion.div 
                    animate={{ 
                      scale: isThinking ? [1.1, 1.2, 1.1] : 1.1,
                      opacity: isThinking ? [0.2, 0.4, 0.2] : 0.2 
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity" 
                  />
                  <div className="w-32 h-32 rounded-full glass-panel flex items-center justify-center relative z-10 editorial-shadow cursor-pointer hover:scale-105 transition-transform" onClick={handleMicToggle}>
                    <motion.div 
                      animate={{ 
                        boxShadow: isThinking ? [
                          "0 0 0 0px rgba(var(--primary), 0)",
                          "0 0 0 10px rgba(var(--primary), 0.1)",
                          "0 0 0 0px rgba(var(--primary), 0)"
                        ] : "none"
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center p-4"
                    >
                      <VoiceWave isListening={isListening} isThinking={isThinking} />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Status Text - NOW BELOW MIC */}
              <div className="text-center shrink-0 space-y-4">
                <div className="space-y-1">
                  <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                    {isListening ? (isThinking ? 'Thinking...' : 'Listening...') : 'Ready to Assist'}
                  </h1>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.3em] opacity-60">
                    {isListening ? 'Neural Link Active' : 'System Standby'}
                  </p>
                </div>

                <button 
                  onClick={() => setShowLiveCaptions(!showLiveCaptions)}
                  className={`mx-auto flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                    showLiveCaptions 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-surface-container border-surface-variant/20 text-on-surface-variant'
                  }`}
                >
                  <MessageSquare size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Live Captions: {showLiveCaptions ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto p-6 lg:p-12"
            >
              <section className="mb-10 max-w-6xl">
                <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">Intent Management</h2>
                <p className="text-on-surface-variant max-w-2xl">Review your active reminders and historical intelligence interactions. Your productivity is operating at peak levels today.</p>
              </section>

              <div className="grid grid-cols-12 gap-8 max-w-6xl">
                <div className="col-span-12 lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-bold text-xl flex items-center gap-2">
                      <List className="text-primary" size={20} />
                      Active Reminders
                    </h3>
                    <button className="text-xs font-bold text-primary hover:underline">View All</button>
                  </div>
                  <div className="space-y-4">
                    {reminders.map(reminder => (
                      <ReminderCard key={reminder.id} reminder={reminder} onToggle={toggleReminder} />
                    ))}
                  </div>

                  <div className="relative overflow-hidden p-8 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white shadow-lg">
                    <div className="relative z-10">
                      <h4 className="text-white/80 font-bold text-sm uppercase tracking-widest mb-1">Current Efficiency</h4>
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-6xl font-black font-headline">92%</span>
                        <ArrowRight className="text-4xl mb-1 rotate-[-45deg]" size={36} />
                      </div>
                      <p className="text-sm font-medium text-white/90 leading-relaxed">Your intent-to-completion ratio is up 4% this week. Great work keeping the workspace pristine.</p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="font-headline font-bold text-xl flex items-center gap-2">
                      <Sparkles className="text-primary" size={20} />
                      History Log
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 max-w-sm">
                      <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest sm:hidden">Search</span>
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" size={16} />
                        <input
                          type="text"
                          placeholder="Search interactions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full h-10 pl-10 pr-10 bg-surface-container rounded-full text-sm font-medium border-none ring-1 ring-surface-variant focus:ring-2 focus:ring-primary transition-all"
                        />
                        {searchQuery && (
                          <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={clearHistory}
                        className="px-3 py-1 bg-surface-container text-xs font-bold rounded-full hover:bg-error-container hover:text-error transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={12} />
                        Clear
                      </button>
                      <button 
                        onClick={() => {
                          const text = chatMessages.map(m => `[${m.timestamp}] ${m.sender === 'user' ? 'You' : 'Padma'}: ${m.text}`).join('\n');
                          const blob = new Blob([text], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `padma-history-${new Date().toISOString().split('T')[0]}.txt`;
                          a.click();
                        }}
                        className="px-3 py-1 bg-surface-container text-xs font-bold rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={chatContainerRef}
                    className="bg-surface-container-low rounded-2xl p-6 h-[600px] flex flex-col space-y-6 overflow-y-auto scroll-smooth"
                  >
                    {(Object.entries(
                      chatMessages
                        .filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
                        .reduce((groups: Record<string, ChatMessage[]>, msg) => {
                          const date = new Date(msg.timestamp).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          });
                          if (!groups[date]) groups[date] = [];
                          groups[date].push(msg);
                          return groups;
                        }, {})
                    ) as [string, ChatMessage[]][]).map(([date, messages]) => (
                      <div key={date} className="space-y-6">
                        <div className="flex items-center gap-4 py-4">
                          <div className="h-px flex-1 bg-surface-variant/30" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            {date}
                          </span>
                          <div className="h-px flex-1 bg-surface-variant/30" />
                        </div>
                        {messages.map(msg => (
                          <ChatBubble 
                            key={msg.id} 
                            message={msg} 
                            searchQuery={searchQuery} 
                            onUpdate={updateChatMessage}
                          />
                        ))}
                      </div>
                    ))}
                    
                    {chatMessages.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-outline-variant space-y-4">
                        <Search size={48} strokeWidth={1} />
                        <p className="font-medium">No interactions found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto p-6 lg:p-12"
            >
              <header className="mb-12 flex items-end justify-between">
                <div>
                  <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">System Settings</h1>
                  <p className="text-on-surface-variant max-w-xl">Refine your auditory experience and synchronize your neural ecosystem with our advanced intelligence parameters.</p>
                </div>
                <AnimatePresence>
                  {showSavedFeedback ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-100/50"
                    >
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest">Changes Saved</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2 text-on-surface-variant/40 bg-surface-container-low px-4 py-2 rounded-xl border border-surface-variant/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/20" />
                      <span className="text-xs font-bold uppercase tracking-widest">System Synced</span>
                    </div>
                  )}
                </AnimatePresence>
              </header>

              <div className="grid grid-cols-12 gap-8">
                <section className="col-span-12 lg:col-span-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-headline text-on-surface">Voice Architect</h2>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">{voiceProfiles.length} Profiles</span>
                      <button 
                        onClick={() => {
                          setEditingProfile(null);
                          setIsVoiceModalOpen(true);
                        }}
                        className="text-sm font-bold text-primary hover:underline"
                      >
                        + Create New
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {voiceProfiles.map(profile => (
                      <VoiceProfileCard 
                        key={profile.id} 
                        profile={profile} 
                        onSelect={selectVoiceProfile} 
                        onEdit={(p) => {
                          setEditingProfile(p);
                          setIsVoiceModalOpen(true);
                        }}
                      />
                    ))}
                  </div>

                    <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-surface-variant/50">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold font-headline text-on-surface">Custom Voice Architect</h2>
                          <p className="text-sm text-on-surface-variant">Upload audio samples to create a unique voice clone.</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Mic size={24} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-outline-variant uppercase tracking-wider">Voice Sample Source</label>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => document.getElementById('audio-upload-settings')?.click()}
                                className="h-24 rounded-2xl bg-white border-2 border-dashed border-surface-variant hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                              >
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline-variant group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                  <ArrowRight className="rotate-[-90deg]" size={20} />
                                </div>
                                <span className="text-xs font-bold text-on-surface-variant">Upload File</span>
                              </button>

                              <button 
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 group ${
                                  isRecording 
                                    ? 'bg-error/10 border-error animate-pulse text-error' 
                                    : 'bg-white border-dashed border-surface-variant hover:border-primary hover:bg-primary/5 text-on-surface-variant'
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                  isRecording ? 'bg-error text-white' : 'bg-surface-container text-outline-variant group-hover:text-primary group-hover:bg-primary/10'
                                }`}>
                                  {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
                                </div>
                                <span className="text-xs font-bold">{isRecording ? 'Stop Recording' : 'Record Live'}</span>
                              </button>

                              <button 
                                disabled={isTraining || isRecording}
                                onClick={startGuidedTraining}
                                className={`h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 group ${
                                  isTraining 
                                    ? 'bg-surface-container-high border-surface-variant text-outline-variant cursor-not-allowed' 
                                    : 'bg-white border-dashed border-surface-variant hover:border-primary hover:bg-primary/5 text-on-surface-variant'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-outline-variant group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                  <List size={20} />
                                </div>
                                <span className="text-xs font-bold">Guided Training</span>
                              </button>
                            </div>

                            <input 
                              id="audio-upload-settings"
                              type="file" 
                              className="hidden" 
                              accept="audio/*" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setVoiceSampleName(file.name);
                                  setRecordedAudioUrl(URL.createObjectURL(file));
                                  setShowUploadSuccess(true);
                                  setTimeout(() => setShowUploadSuccess(false), 3000);
                                }
                              }}
                            />

                            {recordedAudioUrl && (
                              <div className="p-5 rounded-2xl bg-white/40 backdrop-blur-sm border border-primary/10 space-y-4 shadow-inner">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Neural Sample Preview</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setRecordedAudioUrl(null);
                                      setVoiceSampleName('');
                                      setIsPlayingPreview(false);
                                      setPreviewProgress(0);
                                    }}
                                    className="p-2 text-error hover:bg-error/10 rounded-full transition-all"
                                    title="Discard Sample"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => {
                                      if (previewAudioRef.current) {
                                        if (isPlayingPreview) {
                                          previewAudioRef.current.pause();
                                        } else {
                                          previewAudioRef.current.play();
                                        }
                                        setIsPlayingPreview(!isPlayingPreview);
                                      }
                                    }}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                  >
                                    {isPlayingPreview ? <Square size={18} fill="currentColor" /> : <PlayCircle size={24} />}
                                  </button>
                                  
                                  <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-on-surface-variant truncate max-w-[150px]">
                                        {voiceSampleName || 'Unnamed Sample'}
                                      </span>
                                      <span className="text-[10px] font-mono text-primary font-bold">
                                        {previewAudioRef.current ? 
                                          `${Math.floor(previewAudioRef.current.currentTime)}s / ${Math.floor(previewAudioRef.current.duration || 0)}s` 
                                          : '0s / 0s'}
                                      </span>
                                    </div>
                                    <div 
                                      className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden cursor-pointer relative"
                                      onClick={(e) => {
                                        if (previewAudioRef.current) {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const x = e.clientX - rect.left;
                                          const percentage = x / rect.width;
                                          previewAudioRef.current.currentTime = percentage * previewAudioRef.current.duration;
                                        }
                                      }}
                                    >
                                      <motion.div 
                                        className="h-full bg-primary relative"
                                        style={{ width: `${previewProgress}%` }}
                                      >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-primary" />
                                      </motion.div>
                                    </div>
                                  </div>
                                </div>

                                <audio 
                                  ref={previewAudioRef}
                                  src={recordedAudioUrl} 
                                  onTimeUpdate={handlePreviewTimeUpdate}
                                  onEnded={() => {
                                    setIsPlayingPreview(false);
                                    setPreviewProgress(0);
                                  }}
                                  onLoadedMetadata={() => setPreviewProgress(0)}
                                  className="hidden" 
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-outline-variant uppercase tracking-wider">Sample Name</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  placeholder="Enter sample name..."
                                  value={voiceSampleName}
                                  onChange={(e) => setVoiceSampleName(e.target.value)}
                                  className="w-full h-12 px-4 bg-white rounded-xl border-none ring-1 ring-surface-variant focus:ring-2 focus:ring-primary transition-all text-sm"
                                />
                                <AnimatePresence>
                                  {showUploadSuccess && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.5 }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                                    >
                                      <CheckCircle2 size={18} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>

                          <button 
                            disabled={isTraining || !voiceSampleName}
                            onClick={handleStartTraining}
                            className={`w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                              isTraining || !voiceSampleName
                                ? 'bg-surface-container-high text-outline-variant cursor-not-allowed'
                                : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                            }`}
                          >
                            <Sparkles size={18} />
                            {isTraining ? 'Training in Progress...' : 'Start Neural Training'}
                          </button>
                        </div>
                        
                        <div className="space-y-4 flex flex-col justify-center">
                          <div className="p-6 rounded-xl bg-white/50 backdrop-blur border border-surface-variant/30">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-on-surface uppercase tracking-widest">Training Progress</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-primary">{trainingProgress}%</span>
                                {trainingProgress === 100 && !isTraining && (
                                  <button 
                                    onClick={() => setTrainingProgress(0)}
                                    className="text-[10px] font-bold text-primary hover:underline"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${trainingProgress}%` }}
                                className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                              />
                            </div>
                            <p className="text-[10px] text-on-surface-variant mt-4 leading-relaxed">
                              {isTraining 
                                ? "Analyzing vocal patterns and synthesizing neural weights..." 
                                : trainingProgress === 100 
                                  ? "Neural calibration complete. Voice profile ready for deployment. Check your Voice Architect list."
                                  : "Upload a sample and start training to calibrate your custom voice."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                </section>

                <aside className="col-span-12 lg:col-span-4 space-y-8">
                  <div className="p-8 rounded-2xl bg-surface-container shadow-sm border border-surface-container-high">
                    <h2 className="text-xl font-bold font-headline text-on-surface mb-8">Search History</h2>
                    <div className="space-y-4">
                      {searchHistory.length > 0 ? (
                        <div className="space-y-2">
                          {searchHistory.map((query, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl group hover:bg-surface-container-high transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <Search size={14} className="text-on-surface-variant shrink-0" />
                                <span className="text-xs text-on-surface truncate">{query}</span>
                              </div>
                              <button 
                                onClick={() => setSearchHistory(prev => prev.filter((_, i) => i !== idx))}
                                className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => setSearchHistory([])}
                            className="w-full py-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline mt-2"
                          >
                            Clear All History
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-xs text-on-surface-variant">No search history found.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8 rounded-2xl bg-surface-container shadow-sm border border-surface-container-high">
                    <h2 className="text-xl font-bold font-headline text-on-surface mb-8">Visual Interface</h2>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">Neural Theme</label>
                        <div className="grid grid-cols-2 gap-3 p-1 bg-surface-container-high rounded-2xl">
                          <button 
                            onClick={() => setTheme('light')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                              theme === 'light' 
                                ? 'bg-surface-container-lowest text-primary shadow-sm' 
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <Sun size={18} />
                            <span className="text-sm font-bold">Light</span>
                          </button>
                          <button 
                            onClick={() => setTheme('dark')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                              theme === 'dark' 
                                ? 'bg-surface-container-low text-primary shadow-sm' 
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <Moon size={18} />
                            <span className="text-sm font-bold">Dark</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-2xl bg-surface-container shadow-sm border border-surface-container-high">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-bold font-headline text-on-surface">Neural Identity</h2>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={20} />
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary/20 border-4 border-surface-container-lowest">
                          {userName.charAt(0) || 'U'}
                        </div>
                        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Change Avatar</button>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Display Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={userName}
                            onChange={(e) => {
                              const val = e.target.value.slice(0, 20);
                              setUserName(val);
                            }}
                            placeholder="Enter your name"
                            className="w-full h-12 px-4 bg-surface-container-lowest rounded-xl border-none ring-1 ring-surface-variant focus:ring-2 focus:ring-primary font-bold text-on-surface transition-all shadow-sm"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant">
                            <Settings2 size={16} />
                          </div>
                        </div>
                        <p className="text-[9px] text-on-surface-variant font-medium">This name is used by Padma for all neural interactions.</p>
                      </div>

                      <div className="pt-4 border-t border-surface-variant/20">
                        <button 
                          onClick={clearHistory}
                          className="w-full py-3 text-xs font-bold text-error hover:bg-error/5 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          Purge Interaction History
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-2xl bg-surface-container shadow-sm">
                    <h2 className="text-xl font-bold font-headline text-on-surface mb-8">Acoustic Dynamics</h2>
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Live Captions</label>
                          <button 
                            onClick={() => setShowLiveCaptions(!showLiveCaptions)}
                            className={`w-12 h-6 rounded-full transition-all relative ${showLiveCaptions ? 'bg-primary' : 'bg-surface-container-high'}`}
                          >
                            <motion.div 
                              animate={{ x: showLiveCaptions ? 24 : 4 }}
                              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                            />
                          </button>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">Toggle real-time visual transcription of all neural interactions.</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Translation Mode</label>
                        <div className="relative">
                          <select 
                            value={translationLanguage}
                            onChange={(e) => setTranslationLanguage(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 appearance-none bg-surface-container-lowest rounded-lg border-none ring-1 ring-surface-variant focus:ring-2 focus:ring-primary font-medium text-on-surface cursor-pointer"
                          >
                            <option value="None">None (Transcription Only)</option>
                            <option value="English">English</option>
                            <option value="Telugu">Telugu</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Spanish">Spanish</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                            <ChevronDown size={20} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Volume</label>
                          <span className="text-sm font-medium text-primary">{Math.round(volume * 100)}%</span>
                        </div>
                        <div className="relative pt-2">
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary relative z-10"
                          />
                          <div className="flex justify-between mt-2 px-1">
                            {[...Array(10)].map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-1 h-3 rounded-full transition-all duration-300 ${
                                  (i / 10) < volume ? 'bg-primary' : 'bg-surface-container-high'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Neural Sensitivity</label>
                          <span className="text-sm font-medium text-primary">
                            {sensitivity > 0.8 ? 'Ultra' : sensitivity > 0.6 ? 'High' : sensitivity > 0.4 ? 'Balanced' : 'Low'}
                          </span>
                        </div>
                        <div className="relative pt-2">
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={sensitivity} 
                            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary relative z-10"
                          />
                          <div className="flex items-center gap-1 mt-3">
                            <Zap size={12} className={sensitivity > 0.5 ? 'text-primary' : 'text-outline-variant'} />
                            <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ width: `${sensitivity * 100}%` }}
                                className="h-full bg-gradient-to-r from-primary/40 to-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                              />
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">Adjusts how quickly the AI intervenes during conversation gaps.</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Response Language</label>
                        <div className="relative">
                          <select 
                            value={responseLanguage}
                            onChange={(e) => setResponseLanguage(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 appearance-none bg-surface-container-lowest rounded-lg border-none ring-1 ring-surface-variant focus:ring-2 focus:ring-primary font-medium text-on-surface cursor-pointer"
                          >
                            <option>English (US)</option>
                            <option>English (British)</option>
                            <option>French (European)</option>
                            <option>German (Modern)</option>
                            <option>Japanese (Tokyo)</option>
                            <option>Telugu (India)</option>
                            <option>Hindi (India)</option>
                            <option>Spanish (Latin)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                            <ChevronDown size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-2xl bg-surface-container shadow-sm">
                    <h2 className="text-xl font-bold font-headline text-on-surface mb-8">Voice Settings</h2>
                    <div className="space-y-10">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Speech Rate</label>
                          <span className="text-sm font-medium text-primary">{speechRate.toFixed(1)}x</span>
                        </div>
                        <div className="relative pt-2">
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2.0" 
                            step="0.1" 
                            value={speechRate} 
                            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                            className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary relative z-10"
                          />
                          <div className="flex justify-between mt-2 px-1">
                            {[0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0].map((val) => (
                              <div 
                                key={val} 
                                className={`w-1 h-3 rounded-full transition-all duration-300 ${
                                  val <= speechRate ? 'bg-primary' : 'bg-surface-container-high'
                                }`} 
                              />
                            ))}
                          </div>
                          <div className="flex justify-between mt-1 px-1">
                            <span className="text-[8px] font-bold text-on-surface-variant/40">0.5x</span>
                            <span className="text-[8px] font-bold text-primary">1.0x</span>
                            <span className="text-[8px] font-bold text-on-surface-variant/40">2.0x</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Pitch</label>
                          <span className="text-sm font-medium text-primary">{speechPitch.toFixed(1)}x</span>
                        </div>
                        <div className="relative pt-2">
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2.0" 
                            step="0.1" 
                            value={speechPitch} 
                            onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                            className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary relative z-10"
                          />
                          <div className="flex justify-between mt-2 px-1">
                            {[0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0].map((val) => (
                              <div 
                                key={val} 
                                className={`w-1 h-3 rounded-full transition-all duration-300 ${
                                  val <= speechPitch ? 'bg-primary' : 'bg-surface-container-high'
                                }`} 
                              />
                            ))}
                          </div>
                          <div className="flex justify-between mt-1 px-1">
                            <span className="text-[8px] font-bold text-on-surface-variant/40">Deep</span>
                            <span className="text-[8px] font-bold text-primary">Normal</span>
                            <span className="text-[8px] font-bold text-on-surface-variant/40">High</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button 
                          onClick={() => {
                            const utterance = new SpeechSynthesisUtterance(`Hello Sudarshan, this is a test of my current voice settings.`);
                            utterance.rate = speechRate;
                            utterance.pitch = speechPitch;
                            window.speechSynthesis.speak(utterance);
                          }}
                          className="w-full py-3 bg-white border border-primary/20 text-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                        >
                          <PlayCircle size={16} />
                          Test Voice Configuration
                        </button>
                      </div>

                      <div className="space-y-4">
                        <label className="text-sm font-bold text-on-surface tracking-wide uppercase">Live Model</label>
                        <div className="relative">
                          <select 
                            value={ttsModel}
                            onChange={(e) => setTtsModel(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 appearance-none bg-white rounded-lg border-none ring-1 ring-surface-variant focus:ring-2 focus:ring-primary font-medium text-on-surface cursor-pointer"
                          >
                            <option value="gemini-3.1-flash-live-preview">Gemini 3.1 Flash (Live)</option>
                            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                            <ChevronDown size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>

                <section className="col-span-12 mt-4">
                  <div className="p-8 rounded-2xl bg-white shadow-sm ring-1 ring-surface-container">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-xl font-bold font-headline text-on-surface">Neural Connections</h2>
                        <p className="text-sm text-outline-variant">Authorized external ecosystems for expanded intelligence.</p>
                      </div>
                      <button className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                        Connect New Hub
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-on-surface">Google Calendar</div>
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
                            </div>
                          </div>
                        </div>
                        <Link2Off className="text-outline cursor-pointer hover:text-error transition-colors" size={18} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-secondary shadow-sm">
                            <List size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-on-surface">Reminders</div>
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                            </div>
                          </div>
                        </div>
                        <Link2Off className="text-outline cursor-pointer hover:text-error transition-colors" size={18} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-tertiary shadow-sm">
                            <HomeIcon size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-on-surface">HomeKit</div>
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
                            </div>
                          </div>
                        </div>
                        <Link2Off className="text-outline cursor-pointer hover:text-error transition-colors" size={18} />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {currentView === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto p-6 lg:p-12"
            >
              <MySchedule 
                reminders={reminders} 
                googleEvents={googleEvents}
                isGoogleAuthenticated={isGoogleAuthenticated}
                onConnectGoogle={handleGoogleConnect}
                onSync={fetchGoogleEvents}
                isSyncing={isSyncing}
                onAddMeeting={handleAddMeeting}
              />
            </motion.div>
          )}

          {currentView === 'help' && (
            <motion.div
              key="help"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-7xl mx-auto p-6 lg:p-12"
            >
              <header className="mb-16">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <HelpCircle size={24} />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-[0.3em]">User Guide</span>
                </div>
                <h1 className="text-5xl font-extrabold font-headline text-on-surface tracking-tight mb-4">Padma Intelligence Workflow</h1>
                <p className="text-on-surface-variant text-lg max-w-2xl">A comprehensive guide to navigating and mastering the Padma AI ecosystem.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-8 space-y-12">
                  {/* Section: Homepage & Starting */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-surface-container pb-4">
                      <HomeIcon className="text-primary" size={24} />
                      <h2 className="text-2xl font-bold font-headline">1. Getting Started</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container">
                        <h3 className="font-bold mb-2">The Homepage</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          The central dashboard where all neural interactions occur. It features the primary voice interface and real-time feedback systems.
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container">
                        <h3 className="font-bold mb-2">Starting the App</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          Upon launch, the system initializes the neural engine. Ensure your microphone is connected and authorized for full functionality.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Section: Voice Interaction */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-surface-container pb-4">
                      <Zap className="text-secondary" size={24} />
                      <h2 className="text-2xl font-bold font-headline">2. Voice Interaction</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="p-8 rounded-2xl bg-surface-container-low border border-surface-container">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
                            <Mic size={20} />
                          </div>
                          <div className="space-y-3">
                            <h3 className="font-bold">Talking with the AI</h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                              Click the large central microphone button to begin. When the ring pulses, Padma is listening. Speak naturally as you would to a person.
                            </p>
                            <ul className="text-xs text-on-surface-variant space-y-2 list-disc pl-4">
                              <li><strong>Listening State:</strong> The AI captures your vocal patterns in real-time.</li>
                              <li><strong>Thinking State:</strong> Padma processes your intent and generates a neural response.</li>
                              <li><strong>Response State:</strong> The AI speaks back using your selected voice profile.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 rounded-2xl bg-surface-container-low border border-surface-container">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <MessageSquare size={20} />
                          </div>
                          <div className="space-y-3">
                            <h3 className="font-bold">Live Captions</h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                              As you speak and Padma responds, the <strong>Live Caption</strong> box displays a real-time transcript. This ensures visual confirmation of the conversation.
                            </p>
                            <div className="p-3 bg-white rounded-lg border border-surface-container flex items-center justify-between">
                              <span className="text-[10px] font-bold text-outline-variant uppercase">Copy Session</span>
                              <button className="text-[10px] font-bold text-primary uppercase">Click to Copy Transcript</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Section: History & Settings */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-surface-container pb-4">
                      <Sliders className="text-tertiary" size={24} />
                      <h2 className="text-2xl font-bold font-headline">3. Management & Customization</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container space-y-4">
                        <div className="flex items-center gap-2 text-tertiary">
                          <HistoryIcon size={20} />
                          <h3 className="font-bold">History Page</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          Every interaction is archived here. You can search past conversations using the search bar or export your entire history as a text file.
                        </p>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-surface-container rounded text-[10px] font-bold uppercase">Search</span>
                          <span className="px-2 py-1 bg-surface-container rounded text-[10px] font-bold uppercase">Export</span>
                          <span className="px-2 py-1 bg-surface-container rounded text-[10px] font-bold uppercase">Copy</span>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-container space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Sliders className="text-primary" size={20} />
                          <h3 className="font-bold">Settings Page</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          Customize your experience. Adjust volume, neural sensitivity, speech rate, and pitch. Manage your personal name and voice profiles.
                        </p>
                        <div className="pt-2 border-t border-surface-container">
                          <h4 className="text-xs font-bold uppercase mb-2">Voice Architect</h4>
                          <p className="text-[10px] text-on-surface-variant">Upload audio samples and click "Start Neural Training" to create custom voice clones.</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sidebar: Quick Actions */}
                <aside className="lg:col-span-4 space-y-6">
                  <div className="p-8 rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
                    <h3 className="text-xl font-bold mb-4 font-headline">Quick Start</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                        <span className="text-sm font-medium">Connect Microphone</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                        <span className="text-sm font-medium">Tap Mic to Start</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</div>
                        <span className="text-sm font-medium">Speak your Intent</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl bg-surface-container shadow-sm border border-surface-container">
                    <h3 className="text-lg font-bold mb-4 font-headline">System Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">Neural Engine</span>
                        <span className="text-emerald-500 font-bold">Active</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">Voice Sync</span>
                        <span className="text-emerald-500 font-bold">Ready</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant">History Buffer</span>
                        <span className="text-primary font-bold">Synced</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isListening && showLiveCaptions && sessionCaptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] w-full max-w-[92vw] md:max-w-2xl"
            >
              <div 
                ref={captionContainerRef}
                className="max-h-[40vh] overflow-y-auto scroll-smooth flex flex-col gap-3 p-4 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 shadow-2xl no-scrollbar"
              >
                {sessionCaptions.map((caption, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: caption.sender === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex flex-col gap-1 p-4 rounded-2xl max-w-[90%] ${
                      caption.sender === 'user' 
                        ? 'self-end bg-indigo-600/80 text-white rounded-tr-none' 
                        : 'self-start bg-teal-600/80 text-white rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {caption.sender === 'user' ? (
                        <User size={12} className="text-white/70" />
                      ) : (
                        <Sparkles size={12} className="text-white/70" />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/70">
                        {caption.sender === 'user' ? 'User Intent' : 'Padma Synthesis'}
                      </span>
                    </div>
                    <p className="text-sm md:text-base font-medium leading-tight">
                      {caption.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <VoiceProfileModal 
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSave={saveVoiceProfile}
          onDelete={deleteVoiceProfile}
          profile={editingProfile}
        />

        <AnimatePresence>
          {isGuidedTrainingActive && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-md"
                onClick={() => {
                  if (!isRecording) setIsGuidedTrainingActive(false);
                }}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-surface-variant/20 overflow-hidden"
              >
                <div className="p-8 lg:p-12 space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold font-headline text-on-surface">Guided Neural Training</h2>
                      <p className="text-sm text-on-surface-variant">Speak the phrases clearly to calibrate your custom voice.</p>
                    </div>
                    <button 
                      onClick={() => setIsGuidedTrainingActive(false)}
                      className="p-3 hover:bg-surface-container-high rounded-full transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">Phrase {currentGuidedPhraseIndex + 1} of {guidedPhrases.length}</span>
                      <div className="flex gap-1">
                        {guidedPhrases.map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all ${
                              i === currentGuidedPhraseIndex ? 'w-8 bg-primary' : i < currentGuidedPhraseIndex ? 'w-4 bg-emerald-500' : 'w-4 bg-surface-container-high'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-surface-container-low border border-surface-variant/10 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                      <p className="text-2xl lg:text-3xl font-body font-medium leading-relaxed text-on-surface">
                        "{guidedPhrases[currentGuidedPhraseIndex]}"
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                          isRecording 
                            ? 'bg-error text-white shadow-error/20 animate-pulse' 
                            : 'bg-primary text-white shadow-primary/20'
                        }`}
                      >
                        {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={36} />}
                      </motion.button>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                        {isRecording ? 'Recording... Speak now' : 'Tap to start recording'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      disabled={isRecording || guidedAudioBlobs.length <= currentGuidedPhraseIndex}
                      onClick={nextGuidedPhrase}
                      className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${
                        isRecording || guidedAudioBlobs.length <= currentGuidedPhraseIndex
                          ? 'bg-surface-container-high text-outline-variant cursor-not-allowed'
                          : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {currentGuidedPhraseIndex === guidedPhrases.length - 1 ? 'Finish Training' : 'Next Phrase'}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
