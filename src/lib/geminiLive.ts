import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export type LiveSessionCallbacks = {
  onTranscription?: (text: string, isUser: boolean, isIncremental?: boolean) => void;
  onAudioData?: (data: string) => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: any) => void;
  onClose?: () => void;
};

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioQueue: Int16Array[] = [];
  private isPlaying = false;
  private nextStartTime = 0;
  private volume = 1.0;
  private activeChunks = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private callbacks: LiveSessionCallbacks | null = null;
  private currentSpeechRate = 1.0;
  private currentSpeechPitch = 1.0;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value));
  }

  setSpeechRate(value: number) {
    this.currentSpeechRate = value;
  }

  setSpeechPitch(value: number) {
    this.currentSpeechPitch = value;
  }

  async connect(
    callbacks: LiveSessionCallbacks, 
    voiceName: string = "Zephyr", 
    speechRate: number = 1.0, 
    speechPitch: number = 1.0, 
    model: string = "gemini-2.0-flash-exp",
    userName: string = "User",
    historyContext: string = "",
    language: string = "English"
  ) {
    this.callbacks = callbacks;
    this.currentSpeechRate = speechRate;
    this.currentSpeechPitch = speechPitch;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_API_KEY') {
      throw new Error("Gemini API key is invalid or missing. Please ensure GEMINI_API_KEY is set in your environment variables via the Settings menu.");
    }

    // Create a new instance for every connection to ensure fresh API key
    try {
      this.ai = new GoogleGenAI({ apiKey });
    } catch (err: any) {
      throw new Error("Failed to initialize AI SDK: " + err.message);
    }

    const systemInstruction = `You are Padma, a highly intelligent and efficient assistant. 
Your persona is strict and focused: "I am Padma. I am ready to assist you. What do you want?"
When the user asks for news (e.g., India news), you MUST provide a minimum of 10 to 20 detailed headlines. 
When asked to check portals (like Amazon Jobs, Naukri, LinkedIn, or Unstop), you must use your knowledge and synthesis capabilities to identify and list specific vacancies, walk-in drives, and software roles.
Provide elaborated, high-depth responses (10-20 lines minimum) for technical or factual queries like Python or Job search results.
Do not include unnecessary conversational filler or talk about "development" unless specifically asked.
The user's name is ${userName || 'Sudarshan'}.
CRITICAL: You MUST respond and speak ONLY in ${language}. Even if the user speaks to you in another language, you must reply in ${language}.
When the session starts, your first action MUST be to say exactly: "I am Padma. I am ready to assist you. What do you want?" in ${language}.
${historyContext ? `\nRecent conversation history for context:\n${historyContext}\n` : ''}
Use this history to provide continuity in your responses. If the user mentions a previous topic, recall it.`;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error("Microphone access is blocked. Please allow microphone access in your browser settings and refresh.");
        } else if (err.name === 'NotFoundError') {
          throw new Error("No microphone found. Please connect a microphone and try again.");
        }
        throw new Error("Could not access microphone: " + err.message);
      }
      
      if (!this.audioContext) {
        throw new Error("Audio system failed to initialize. Please refresh the page.");
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      // Use standard buffer size for better stability
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      const sessionPromise = this.ai.live.connect({
        model: model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
            if (this.audioContext?.state === 'suspended') {
              this.audioContext.resume();
            }
            
            source.connect(this.processor!);
            this.processor!.connect(this.audioContext!.destination);

            this.processor!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = this.float32ToInt16(inputData);
              const base64Data = this.arrayBufferToBase64(pcmData.buffer);
              
              if (this.session) {
                try {
                  this.session.sendRealtimeInput({
                    audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                  });
                } catch (err) {
                  console.error("Failed to send audio:", err);
                }
              } else {
                sessionPromise.then(session => {
                  this.session = session;
                  try {
                    session.sendRealtimeInput({
                      audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                    });
                  } catch (err) {
                    console.error("Failed to send audio in promise:", err);
                  }
                }).catch(err => {
                  console.error("Session promise failed in onaudioprocess:", err);
                });
              }
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcriptions (top-level fields in LiveServerMessage)
            // These are usually cumulative for the current turn
            const inputTranscription = (message as any).inputAudioTranscription;
            if (inputTranscription?.text) {
              callbacks.onTranscription?.(inputTranscription.text, true, false);
            }
            
            const outputTranscription = (message as any).outputAudioTranscription;
            if (outputTranscription?.text) {
              callbacks.onTranscription?.(outputTranscription.text, false, false);
            }

            const { serverContent } = message;
            if (!serverContent) return;

            // Handle Model Turn (Audio and Text parts)
            if (serverContent.modelTurn) {
              serverContent.modelTurn.parts.forEach(part => {
                if (part.inlineData?.data) {
                  callbacks.onAudioData?.(part.inlineData.data);
                }
                // Some models send text in modelTurn even if transcription is enabled
                // This is usually incremental
                if (part.text && !outputTranscription) {
                  callbacks.onTranscription?.(part.text, false, true);
                }
              });
            }

            if (serverContent.interrupted) {
              this.stopAudioPlayback();
            }

            if (serverContent.turnComplete) {
              callbacks.onAudioEnd?.();
            }
          },
          onerror: (err: any) => {
            console.error("Live session error details:", err);
            let message = "A connection error occurred.";
            if (typeof err === 'string') {
              message = err;
            } else if (err instanceof Error) {
              message = err.message;
            } else if (err && typeof err === 'object' && err.message) {
              message = err.message;
            }
            
            if (message.includes("Network error") || message.includes("Failed to fetch")) {
              message = "Network connection lost or blocked. Please check your internet and try again. This can also happen if the API key is invalid.";
            } else if (message.includes("Internal error")) {
              message = "The AI service encountered an internal error. This can happen due to high load or transient issues. Please try again in a moment.";
            } else if (message.includes("not found") || message.includes("404")) {
              message = "The selected model was not found. Please try switching to Gemini 2.0 Flash in settings.";
            }
            callbacks.onError?.(new Error(message));
          },
          onclose: () => {
            console.log("Live session closed");
            this.cleanup();
            callbacks.onClose?.();
          },
        },
      });

      this.session = await sessionPromise;
    } catch (error) {
      console.error("Failed to connect to Gemini Live:", error);
      this.cleanup();
      throw error;
    }
  }

  private float32ToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, Math.max(-1, buffer[i])) * 0x7fff;
    }
    return buf;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  public handleIncomingAudio(base64Data: string) {
    if (!this.audioContext || !this.callbacks) return;

    if (this.activeChunks === 0) {
      this.callbacks.onAudioStart?.();
    }
    this.activeChunks++;

    const arrayBuffer = this.base64ToArrayBuffer(base64Data);
    const int16Array = new Int16Array(arrayBuffer);
    const float32Array = new Float32Array(int16Array.length);
    
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000); // Gemini returns 24kHz
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = this.currentSpeechRate;
    // Adjust detune to compensate for playbackRate pitch shift and apply user pitch preference
    // playbackRate of 2.0 shifts pitch up by 1200 cents. 
    // We want the final pitch to be based on currentSpeechPitch.
    // pitch 2.0 = +1200 cents, pitch 0.5 = -1200 cents.
    const ratePitchShift = Math.log2(this.currentSpeechRate) * 1200;
    const targetPitchShift = Math.log2(this.currentSpeechPitch) * 1200;
    source.detune.value = targetPitchShift - ratePitchShift;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;

    this.activeSources.push(source);
    source.onended = () => {
      this.activeChunks--;
      this.activeSources = this.activeSources.filter(s => s !== source);
      if (this.activeChunks === 0) {
        this.callbacks?.onAudioEnd?.();
      }
    };
  }

  public stopAudioPlayback() {
    const sourcesToStop = [...this.activeSources];
    this.activeSources = [];
    this.activeChunks = 0;
    this.nextStartTime = 0;

    sourcesToStop.forEach(source => {
      try {
        source.onended = null;
        source.stop();
      } catch (e) {
        // Source might have already stopped
      }
    });

    this.callbacks?.onAudioEnd?.();
  }

  disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.cleanup();
  }

  private cleanup() {
    this.stopAudioPlayback();
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.nextStartTime = 0;
    this.callbacks = null;
  }
}
