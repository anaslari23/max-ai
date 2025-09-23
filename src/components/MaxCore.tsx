
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import ThreeJSBubble from './ThreeJSBubble';
import FaceAuth from './FaceAuth';
import StatusPanel from './StatusPanel';
import SystemControlPanel from './SystemControlPanel';
import WebSearchPanel from './WebSearchPanel';
import PreferencesPanel from './PreferencesPanel';
import WorkflowPanel from './WorkflowPanel';
import AudioVisualizer from './AudioVisualizer';
import FilesPanel from './FilesPanel';
import PredictPanel from './PredictPanel';
import ResponseGenerator from '../utils/ResponseGenerator';
import VoiceRecognition from '../utils/VoiceRecognition';
import SpeechSynthesis from '../utils/SpeechSynthesis';
import modelInference from '../utils/ModelInference';
import { MaxJarvisAPI } from '../utils/MaxJarvisAPI';

const MaxCore: React.FC = () => {
  // States
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'max', content: string, timestamp: Date }[]>([
    { type: 'max', content: "Hello, I'm Max. Say 'Hey Max' to wake me, or tap the mic to speak.", timestamp: new Date() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [rated, setRated] = useState<Set<number>>(new Set());
  const [micAllowed, setMicAllowed] = useState<boolean | null>(null);
  // Voice UX prefs
  const [enableChime, setEnableChime] = useState(true);
  const [chimeVolume, setChimeVolume] = useState(0.2);
  const [autoListenAfterWake, setAutoListenAfterWake] = useState(true);
  const [allowBargeIn, setAllowBargeIn] = useState(true);
  const [silenceTimeoutMs, setSilenceTimeoutMs] = useState(12000);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecognition = useRef<VoiceRecognition | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();
  const apiRef = useRef<MaxJarvisAPI | null>(null);
  
  // Initialize components
  useEffect(() => {
    voiceRecognition.current = new VoiceRecognition();
    speechSynthesis.current = new SpeechSynthesis();
    apiRef.current = new MaxJarvisAPI();
    // Prepare audio context for beeps
    try {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not available', e);
    }
    
    if (voiceRecognition.current) {
      // Set more permissive settings for better wake word detection
      voiceRecognition.current.setConfidenceThreshold(0.25);
      voiceRecognition.current.setMaxConsecutiveLowConfidence(3);
      
      // Set up wake word detection
      voiceRecognition.current.onWake(() => {
        console.log("WAKE WORD DETECTED, ACTIVATING MAX");
        
        if (!authenticated) return;
        // Barge-in: interrupt speech if allowed
        if (allowBargeIn && isSpeaking && speechSynthesis.current) {
          try { speechSynthesis.current.cancel(); } catch {}
          setIsSpeaking(false);
        }
        // Short wake beep
        playBeep(880, 0.06, 0.08);
        if (!isListening && !isProcessing) {
          const wakeResponse = ResponseGenerator.getWakeUpResponse();
          // Auto-listen: skip speaking the wake response if enabled
          if (autoListenAfterWake) {
            playBeep(1320, 0.04, 0.06);
            startListening();
          } else {
            setMessages(prev => [...prev, { type: 'max', content: wakeResponse, timestamp: new Date() }]);
            if (speechSynthesis.current) {
              setIsSpeaking(true);
              speechSynthesis.current.speak(wakeResponse, () => {
                setIsSpeaking(false);
                playBeep(1320, 0.04, 0.06);
                startListening();
              });
            } else {
              playBeep(1320, 0.04, 0.06);
              startListening();
            }
          }
          
          toast({
            title: "Hey there!",
            description: "Max is listening...",
            duration: 3000,
          });
        }
      });
    }
    
    // Start voice recognition after authentication & check microphone permission
    if (authenticated) {
      checkMicPermission();
      setTimeout(() => {
        if (voiceRecognition.current) {
          try {
            voiceRecognition.current.start();
            console.log("Voice recognition started and listening for wake words");
            toast({
              title: "Voice Recognition Active",
              description: "Say 'Hey Max' to activate me",
              duration: 5000,
            });
          } catch (e) {
            console.error("Failed to start voice recognition:", e);
            toast({
              title: "Voice Recognition Failed",
              description: "Please check microphone permissions",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      }, 500);
    }
    
    // Try to load the AI model for better responses (can be preloaded regardless)
    try {
      modelInference.preloadModel('textGeneration');
    } catch (e) {
      console.error("Error preloading AI model:", e);
    }
    
    return () => {
      if (voiceRecognition.current) {
        voiceRecognition.current.stop();
      }
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, [authenticated]);

  const checkMicPermission = async () => {
    try {
      // Try to get a silent audio stream to infer permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicAllowed(true);
    } catch (e) {
      console.warn('Microphone permission denied or unavailable', e);
      setMicAllowed(false);
    }
  };

  const requestMicPermission = async () => {
    setMicAllowed(null);
    await checkMicPermission();
  };

  const playBeep = (freq: number, attack = 0.02, release = 0.08) => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || !enableChime) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, chimeVolume)), now + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
      o.start(now);
      o.stop(now + attack + release + 0.01);
    } catch (e) {
      // No-op
    }
  };

  // Apply saved user preferences (voice, rate, pitch, voice UX) once authenticated
  useEffect(() => {
    const applyPrefs = async () => {
      if (!authenticated || !apiRef.current || !speechSynthesis.current) return;
      try {
        const res = await apiRef.current.getUserPreferences('default');
        const prefs = res.preferences || {};
        const synth = speechSynthesis.current;
        // Retry up to 5 times to ensure voices are loaded
        let attempts = 0;
        let voices = synth.getVoices();
        while (voices.length === 0 && attempts < 5) {
          await new Promise(r => setTimeout(r, 300));
          voices = synth.getVoices();
          attempts++;
        }
        if (prefs.voice_name) {
          const v = voices.find(v => v.name === prefs.voice_name);
          if (v) synth.setVoice(v);
        }
        if (prefs.voice_rate) {
          const rate = parseFloat(prefs.voice_rate);
          if (!Number.isNaN(rate)) synth.setRate(rate);
        }
        if (prefs.voice_pitch) {
          const pitch = parseFloat(prefs.voice_pitch);
          if (!Number.isNaN(pitch)) synth.setPitch(pitch);
        }
        if (typeof prefs.enable_chime !== 'undefined') setEnableChime(String(prefs.enable_chime).toLowerCase() !== 'false');
        if (typeof prefs.chime_volume !== 'undefined') {
          const vol = parseFloat(prefs.chime_volume);
          if (!Number.isNaN(vol)) setChimeVolume(vol);
        }
        if (typeof prefs.auto_listen_after_wake !== 'undefined') setAutoListenAfterWake(String(prefs.auto_listen_after_wake).toLowerCase() !== 'false');
        if (typeof prefs.allow_barge_in !== 'undefined') setAllowBargeIn(String(prefs.allow_barge_in).toLowerCase() !== 'false');
        if (typeof prefs.silence_timeout_ms !== 'undefined') {
          const sto = parseInt(prefs.silence_timeout_ms, 10);
          if (!Number.isNaN(sto)) setSilenceTimeoutMs(sto);
        }
      } catch (e) {
        console.warn('Failed to apply preferences', e);
      }
    };
    applyPrefs();
  }, [authenticated]);

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    setIsListening(true);
    console.log("Starting to listen...");
    playBeep(1046.5, 0.02, 0.06);
    
    toast({
      title: "I'm listening",
      description: "Speak now...",
      duration: 3000,
    });
    
    if (voiceRecognition.current) {
      voiceRecognition.current.onResult((text) => {
        console.log("Received user speech:", text);
        if (text && text.length > 2) {
          const wakeWordPattern = /\b(hey max|wake up max|good morning max|hi max|hello max|max)\b/gi;
          const cleanedText = text.replace(wakeWordPattern, '').trim();
          
          if (cleanedText && cleanedText.length > 2) {
            console.log("Processing user text:", cleanedText);
            setInput(cleanedText);
            
            setTimeout(() => {
              handleSend(cleanedText);
              stopListening();
            }, 500);
          } else {
            console.log("Text too short after cleaning, continuing to listen");
            if (isListening) {
              setTimeout(() => {
                if (isListening) {
                  stopListening();
                }
              }, 5000);
            }
          }
        }
      });
      
      setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, Math.max(4000, silenceTimeoutMs));
    }
  };

  const stopListening = () => {
    console.log("Stopping listening");
    setIsListening(false);
    if (voiceRecognition.current) {
      voiceRecognition.current.onResult(() => {});
    }
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    console.log("Processing user input:", text);
    
    const userMessage = { type: 'user' as const, content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setIsTyping(true);
    
    // Generate AI response with a dynamic thinking pause for realism
    const processResponse = async () => {
      try {
        let replyText = '';
        let speak = false;
        let emotion: 'calm' | 'neutral' | 'serious' | 'excited' | 'friendly' = 'neutral';
        if (authenticated && apiRef.current) {
          // Prefer backend chat for intents/entities/context
          const chat = await apiRef.current.sendMessage(text, 'default');
          replyText = chat.response || '...';
          speak = true;
          // Map backend emotion to speech preset
          const em = (chat.emotion?.dominant_emotion || '').toLowerCase();
          const sentiment = (chat.emotion?.sentiment || '').toLowerCase();
          if (em.includes('joy') || sentiment === 'positive') emotion = 'friendly';
          else if (em.includes('anger') || em.includes('fear')) emotion = 'serious';
          else if (em.includes('surprise')) emotion = 'excited';
          else if (em.includes('sad')) emotion = 'calm';
          else emotion = 'neutral';
        } else {
          // Fallback to local response generator
          const response = await ResponseGenerator.getResponse(text);
          replyText = response.text;
          speak = response.shouldSpeak;
        }
        console.log("Generated response:", replyText);
        setIsTyping(false);
        setIsProcessing(false);
        
        const maxMessage = { type: 'max' as const, content: replyText, timestamp: new Date() };
        setMessages(prev => [...prev, maxMessage]);
        
        if (speak && speechSynthesis.current) {
          console.log("Speaking response");
          setIsSpeaking(true);
          // Use emotional TTS when available
          if ((speechSynthesis.current as any).speakWithEmotion) {
            (speechSynthesis.current as any).speakWithEmotion(replyText, emotion, () => {
              setIsSpeaking(false);
            });
          } else {
            speechSynthesis.current.speak(replyText, () => {
              setIsSpeaking(false);
            });
          }
        }
      } catch (error) {
        console.error('Error generating response:', error);
        setIsTyping(false);
        setIsProcessing(false);
        
        const errorMessage = { 
          type: 'max' as const, 
          content: 'I apologize, but I encountered an error processing your request.', 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, errorMessage]);
        
        if (speechSynthesis.current) {
          setIsSpeaking(true);
          speechSynthesis.current.speak(errorMessage.content, () => {
            setIsSpeaking(false);
          });
        }
      }
    };

    // Dynamic thinking pause based on expected output length (rough estimate)
    const estimatedLen = Math.max(40, Math.min(400, text.length * 6));
    const thinkingDelay = Math.min(2500, 600 + estimatedLen * 4); // cap at ~2.5s
    setTimeout(processResponse, thinkingDelay);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleChatInput = () => {
    setShowChatInput(!showChatInput);
  };

  const submitFeedback = async (msgIndex: number, positive: boolean) => {
    try {
      if (!apiRef.current) return;
      if (rated.has(msgIndex)) return;
      // Find the closest previous user message as input_text
      const msg = messages[msgIndex];
      if (!msg || msg.type !== 'max') return;
      let userInput = '';
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (messages[i].type === 'user') { userInput = messages[i].content; break; }
      }
      // Provide feedback to backend
      await apiRef.current.provideFeedback(
        userInput || '', // input_text
        '',              // expected_output (optional)
        msg.content,     // actual_output
        positive ? 1.0 : 0.0,
        'general'
      );
      const next = new Set(rated);
      next.add(msgIndex);
      setRated(next);
      toast({ title: positive ? 'Thanks for the feedback!' : 'Feedback noted', duration: 2000 });
    } catch (e) {
      console.error('Feedback error', e);
      toast({ title: 'Failed to submit feedback', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Main Background with dark gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-[#0F0F1B] to-[#151530] overflow-hidden">
        {/* Animated background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-900/10 blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-[30rem] h-[30rem] rounded-full bg-teal-900/10 blur-3xl"></div>
          <div className="absolute top-2/3 left-1/2 w-80 h-80 rounded-full bg-blue-900/10 blur-3xl"></div>
        </div>
        
        {/* Center area with all interactive elements */}
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4">
            {/* Logo title - no animation */}
            <div className="mb-8">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">
                MAX AI ASSISTANT
              </div>
            </div>
            
            {/* Bubble and Chat area - Combined in one view */}
            <div className="relative w-full flex flex-col md:flex-row items-center gap-6">
              {/* 3D Hologram Bubble - always present */}
              <div className="w-60 h-60 md:w-80 md:h-80 relative z-10">
                <ThreeJSBubble 
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isProcessing={isProcessing}
                  onClick={() => authenticated ? startListening() : undefined}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`${isListening ? 'bg-teal-500 text-white' : 'bg-teal-900/50 text-teal-400 border-teal-800'} rounded-full hover:bg-teal-700`}
                    onClick={() => authenticated ? toggleListening() : undefined}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>
                </div>
              </div>
              
              {/* Chat area - always visible */
              }
              <div className="w-full md:max-w-xl bg-black/40 rounded-2xl backdrop-blur-md border border-teal-500/20 shadow-2xl overflow-hidden flex flex-col h-[400px] md:h-[500px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                {/* Chat header */}
                <div className="w-full p-3 bg-black/40 border-b border-teal-500/10 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${isSpeaking || isListening ? 'bg-teal-400 animate-pulse' : 'bg-purple-400'}`} />
                    <span className="text-teal-300 font-semibold tracking-wider text-xs md:text-sm">
                      {authenticated ? (
                        <>MAX {isSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : 'READY'}</>
                      ) : (
                        <>MAX SECURED • AUTH REQUIRED</>
                      )}
                    </span>
                    {/* Voice waveform when speaking */}
                    <div className="hidden md:block h-6">
                      <AudioVisualizer isActive={isSpeaking} />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                    onClick={toggleChatInput}
                  >
                    <MessageSquare size={18} />
                  </Button>
                </div>
                
                {/* Welcome header (visible after authentication) */
                }
                {authenticated && (
                  <div className="mb-2 rounded-2xl border border-white/10 bg-gradient-to-r from-teal-600/20 via-purple-600/20 to-indigo-600/20 p-4 text-white/90">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-white/60">Welcome back</div>
                        <div className="text-xl font-semibold">MAX is ready to help</div>
                        <div className="text-sm text-white/70">Say 'Hey Max' to begin. You can also run a quick research chain or manage your files.</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="bg-white/10 hover:bg-white/20" onClick={toggleChatInput}>
                          <MessageSquare className="mr-1 h-4 w-4" /> Start Chat
                        </Button>
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => {
                            const el = document.getElementById('dashboard-panels');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                        >
                          <span className="mr-1">⚡</span> Open Tools
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice status banner */}
                {authenticated && (
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      {isListening ? (
                        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-teal-400" />
                      ) : (
                        <span className="inline-flex h-2 w-2 rounded-full bg-white/40" />
                      )}
                      <span>
                        {isListening
                          ? "Listening… speak now (say anything without the wake word)"
                          : "Say 'Hey Max' to wake me"}
                        {isSpeaking ? ' • Speaking…' : ''}
                        {isProcessing ? ' • Thinking…' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={toggleListening}>
                        {isListening ? <><MicOff className="mr-1 h-4 w-4"/> Stop</> : <><Mic className="mr-1 h-4 w-4"/> Listen</>}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Conversation area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          message.type === 'user' 
                            ? 'bg-blue-500/40 text-white backdrop-blur-sm border border-blue-400/30' 
                            : 'bg-purple-500/40 text-white backdrop-blur-sm border border-purple-400/30'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1 flex items-center justify-between gap-2">
                          <span>{message.type === 'user' ? 'You' : 'MAX'} • {formatTime(message.timestamp)}</span>
                          {message.type === 'max' && (
                            <span className="flex items-center gap-1">
                              <button
                                className={`px-1 rounded hover:bg-white/10 ${rated.has(index) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Good response"
                                onClick={() => submitFeedback(index, true)}
                                disabled={rated.has(index)}
                              >👍</button>
                              <button
                                className={`px-1 rounded hover:bg-white/10 ${rated.has(index) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Needs improvement"
                                onClick={() => submitFeedback(index, false)}
                                disabled={rated.has(index)}
                              >👎</button>
                            </span>
                          )}
                        </div>
                        <div className="text-sm">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-purple-500/40 backdrop-blur-sm rounded-2xl p-3 max-w-[80%] border border-purple-400/30">
                        <div className="text-xs opacity-70 mb-1">
                          MAX • {formatTime(new Date())}
                        </div>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Input area - conditionally shown */}
                {showChatInput && authenticated && (
                  <div className="p-3 border-t border-teal-500/10 bg-black/30">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="w-full p-3 pr-10 bg-black/60 backdrop-blur-sm border border-teal-900/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 min-h-[50px] max-h-[100px] resize-none"
                          disabled={isProcessing}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 hover:text-teal-200 hover:bg-transparent"
                          onClick={() => handleSend()}
                          disabled={!input.trim() || isProcessing}
                        >
                          <Send size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Panels below main area */}
            {authenticated && (
              <div id="dashboard-panels" className="mt-6 grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                <StatusPanel />
                <SystemControlPanel />
                <WebSearchPanel />
                <PreferencesPanel />
                <WorkflowPanel />
                <FilesPanel />
                <PredictPanel />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Floating mic control */}
      {authenticated && (
        <div className="pointer-events-auto fixed bottom-6 right-6 z-50">
          <Button
            size="icon"
            className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 ${isListening ? 'bg-teal-600 hover:bg-teal-500' : 'bg-white/10 hover:bg-white/20'} border border-white/20`}
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff className="h-6 w-6 text-white"/> : <Mic className="h-6 w-6 text-white"/>}
          </Button>
        </div>
      )}
      {/* Face authentication overlay */}
      {!authenticated && (
        <FaceAuth
          userId="default"
          onVerified={() => {
            setAuthenticated(true);
            // Voice-first onboarding: add message, speak, and start listening
            const greet = "Identity verified. I'm ready. Say 'Hey Max' to wake me, or tap the mic to speak.";
            setMessages(prev => [...prev, { type: 'max', content: greet, timestamp: new Date() }]);
            try {
              if (speechSynthesis.current) {
                setIsSpeaking(true);
                speechSynthesis.current.speak(greet, () => setIsSpeaking(false));
              }
            } catch (e) {
              console.warn('Speech synthesis unavailable after auth', e);
            }
            // Start wake-word listener shortly after auth
            setTimeout(() => {
              try {
                voiceRecognition.current?.start();
                setIsListening(false); // idle until wake word
              } catch (e) {
                console.warn('Voice recognition start failed after auth', e);
              }
            }, 400);
          }}
        />
      )}
    </div>
  );
};

export default MaxCore;
