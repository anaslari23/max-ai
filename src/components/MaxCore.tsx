
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import ThreeJSBubble from './ThreeJSBubble';
import ResponseGenerator from '../utils/ResponseGenerator';
import VoiceRecognition from '../utils/VoiceRecognition';
import SpeechSynthesis from '../utils/SpeechSynthesis';
import modelInference from '../utils/ModelInference';

const MaxCore: React.FC = () => {
  // States
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'max', content: string, timestamp: Date }[]>([
    { type: 'max', content: 'Hello, I am Max. Touch the hologram or type your message to begin.', timestamp: new Date() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecognition = useRef<VoiceRecognition | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();
  
  // Initialize components
  useEffect(() => {
    voiceRecognition.current = new VoiceRecognition();
    speechSynthesis.current = new SpeechSynthesis();
    
    if (voiceRecognition.current) {
      // Set more permissive settings for better wake word detection
      voiceRecognition.current.setConfidenceThreshold(0.25);
      voiceRecognition.current.setMaxConsecutiveLowConfidence(3);
      
      // Set up wake word detection
      voiceRecognition.current.onWake(() => {
        console.log("WAKE WORD DETECTED, ACTIVATING MAX");
        
        if (!isListening && !isProcessing) {
          // Expand the bubble when wake word is detected
          setShowChat(true);
          
          const wakeResponse = ResponseGenerator.getWakeUpResponse();
          setMessages(prev => [...prev, { 
            type: 'max', 
            content: wakeResponse, 
            timestamp: new Date() 
          }]);
          
          if (speechSynthesis.current) {
            setIsSpeaking(true);
            speechSynthesis.current.speak(wakeResponse, () => {
              setIsSpeaking(false);
              startListening();
            });
          } else {
            startListening();
          }
          
          toast({
            title: "Hey there!",
            description: "Max is listening...",
            duration: 3000,
          });
        }
      });
    }
    
    // Start voice recognition immediately
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
    }, 1000);
    
    // Try to load the AI model for better responses
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
  }, []);

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
      }, 15000);
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
    
    // Generate AI response with a slight typing delay for realism
    setTimeout(async () => {
      try {
        const response = await ResponseGenerator.getResponse(text);
        console.log("Generated response:", response);
        setIsTyping(false);
        setIsProcessing(false);
        
        const maxMessage = { type: 'max' as const, content: response.text, timestamp: new Date() };
        setMessages(prev => [...prev, maxMessage]);
        
        if (response.shouldSpeak && speechSynthesis.current) {
          console.log("Speaking response");
          setIsSpeaking(true);
          speechSynthesis.current.speak(response.text, () => {
            setIsSpeaking(false);
          });
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
    }, 800);
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

  const toggleChat = () => {
    setShowChat(!showChat);
    
    // If we're opening the chat, try to activate AI
    if (!showChat) {
      try {
        modelInference.preloadModel('textGeneration');
      } catch (e) {
        console.error("Error preloading model:", e);
      }
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
        
        {/* Centered hologram bubble */}
        <div className="fixed inset-0 flex items-center justify-center">
          {!showChat ? (
            // 3D Hologram center bubble
            <div 
              className="cursor-pointer w-80 h-80 rounded-full transition-all duration-500"
              onClick={toggleChat}
            >
              <ThreeJSBubble 
                isListening={isListening}
                isSpeaking={isSpeaking}
                isProcessing={isProcessing}
                onClick={toggleChat}
              />
            </div>
          ) : (
            // Chat interface
            <div className="absolute inset-x-4 bottom-4 top-16 bg-black/40 rounded-3xl backdrop-blur-lg border border-teal-500/20 shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="w-full p-4 bg-black/40 border-b border-teal-500/10 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${isSpeaking || isListening ? 'bg-teal-400 animate-pulse' : 'bg-purple-400 animate-pulse-slow'}`} />
                  <span className="text-teal-300 font-semibold tracking-wider text-xs md:text-sm">
                    MAX {isSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : 'READY'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={toggleChat}
                >
                  <X size={18} />
                </Button>
              </div>
              
              {/* Conversation area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl p-3 animate-fade-in ${
                        message.type === 'user' 
                          ? 'bg-blue-500/40 text-white backdrop-blur-sm border border-blue-400/30' 
                          : 'bg-purple-500/40 text-white backdrop-blur-sm border border-purple-400/30'
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {message.type === 'user' ? 'You' : 'MAX'} • {formatTime(message.timestamp)}
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
              
              {/* Input area */}
              <div className="p-4 border-t border-teal-500/10 bg-black/30">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`${isListening ? 'bg-teal-500 text-white animate-pulse' : 'bg-teal-950 text-teal-400 border-teal-800'} rounded-full hover:bg-teal-900 hover:text-teal-200`}
                    onClick={toggleListening}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>
                  
                  <div className="relative flex-1">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full p-3 pr-10 bg-black/60 backdrop-blur-sm border border-teal-900/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 min-h-[60px] max-h-[120px] resize-none"
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
            </div>
          )}
        </div>
        
        {/* Animated logo and brand in top-center */}
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-400 via-purple-400 to-blue-400 text-transparent bg-clip-text animate-pulse-slow">
            MAX AI ASSISTANT
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaxCore;
