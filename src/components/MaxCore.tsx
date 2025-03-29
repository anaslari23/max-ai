
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Brain, Settings, Info, MessageCircle, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import AudioVisualizer from './AudioVisualizer';
import ResponseGenerator from '../utils/ResponseGenerator';
import VoiceRecognition from '../utils/VoiceRecognition';
import SpeechSynthesis from '../utils/SpeechSynthesis';
import modelInference from '../utils/ModelInference';
import randomConversation from '../utils/RandomConversation';
import conversationMemory from '../utils/ConversationMemory';

const MaxCore: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'max', content: string, timestamp: Date }[]>([
    { type: 'max', content: 'Hello, I am Max. Say "Hey Max" or type your message to begin.', timestamp: new Date() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [showFullInterface, setShowFullInterface] = useState(false);
  const [bubbleSize, setBubbleSize] = useState(80); // Base size for the bubble
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecognition = useRef<VoiceRecognition | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    voiceRecognition.current = new VoiceRecognition();
    speechSynthesis.current = new SpeechSynthesis();
    
    if (voiceRecognition.current) {
      voiceRecognition.current.setConfidenceThreshold(0.3);
      voiceRecognition.current.setMaxConsecutiveLowConfidence(3);
    }
    
    voiceRecognition.current.onWake(() => {
      if (!isListening && !isProcessing) {
        // Expand the bubble when wake word is detected
        setShowFullInterface(true);
        
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
    
    setTimeout(() => {
      if (voiceRecognition.current) {
        voiceRecognition.current.start();
        console.log("Voice recognition started");
        toast({
          title: "Voice Recognition Active",
          description: "Say 'Hey Max' to activate me",
          duration: 5000,
        });
      }
    }, 1000);
    
    // Set a timer to occasionally initiate conversation if there's been a lull
    const inactivityTimer = setInterval(() => {
      const lastMessageTime = messages[messages.length - 1]?.timestamp || new Date(0);
      const timeSinceLastMessage = new Date().getTime() - lastMessageTime.getTime();
      
      // If it's been more than 5 minutes since the last message and we're not in the middle of something
      if (timeSinceLastMessage > 5 * 60 * 1000 && !isListening && !isProcessing && !isSpeaking) {
        const randomFact = randomConversation.getRandomFact();
        const factMessage = `Here's something interesting: ${randomFact}`;
        
        setMessages(prev => [...prev, { 
          type: 'max', 
          content: factMessage, 
          timestamp: new Date() 
        }]);
        
        if (speechSynthesis.current) {
          setIsSpeaking(true);
          speechSynthesis.current.speak(factMessage, () => {
            setIsSpeaking(false);
          });
        }
      }
    }, 10 * 60 * 1000); // Check every 10 minutes
    
    // Add bubble animation effect
    const pulseInterval = setInterval(() => {
      if (!isListening && !isProcessing && !isSpeaking) {
        setBubbleSize(prev => prev === 80 ? 85 : 80); // Subtle pulsing effect when idle
      }
    }, 2000);
    
    return () => {
      if (voiceRecognition.current) {
        voiceRecognition.current.stop();
      }
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
      clearInterval(inactivityTimer);
      clearInterval(pulseInterval);
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Animate bubble size based on speech/listening status
    if (isListening) {
      setBubbleSize(100); // Larger while listening
    } else if (isSpeaking) {
      setBubbleSize(95); // Medium-large while speaking
    } else if (isProcessing) {
      setBubbleSize(90); // Medium while processing
    } else if (!showFullInterface) {
      setBubbleSize(80); // Back to normal when idle
    }
  }, [isListening, isSpeaking, isProcessing, showFullInterface]);

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
        console.log("Received text:", text);
        if (text && text.length > 2) {
          const wakeWordPattern = /\b(hey max|wake up max|good morning max|hi max|hello max|max)\b/gi;
          const cleanedText = text.replace(wakeWordPattern, '').trim();
          
          if (cleanedText && cleanedText.length > 2) {
            console.log("Cleaned text:", cleanedText);
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
      }, 20000); // Extended to 20 seconds for better conversation
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
    
    try {
      if (text.toLowerCase().includes('use model') || text.toLowerCase().includes('advanced mode')) {
        setIsModelLoading(true);
        toast({
          title: "Loading AI Models",
          description: "This might take a moment as I download the needed models...",
          duration: 5000,
        });
        
        try {
          await modelInference.generateText("Hello", 5);
          ResponseGenerator.setUseModelInference(true);
          setIsModelLoading(false);
          
          setIsTyping(false);
          setIsProcessing(false);
          
          const maxMessage = { 
            type: 'max' as const, 
            content: "I've activated my advanced AI models! I can now provide more natural and detailed responses to your questions.", 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, maxMessage]);
          
          if (speechSynthesis.current) {
            setIsSpeaking(true);
            speechSynthesis.current.speak(maxMessage.content, () => {
              setIsSpeaking(false);
            });
          }
          
          return;
        } catch (error) {
          console.error("Error loading models:", error);
          setModelError("Couldn't load advanced AI models");
          setIsModelLoading(false);
          
          const maxMessage = { 
            type: 'max' as const, 
            content: "I tried to activate my advanced models, but encountered an error. I'll continue using my standard response system.", 
            timestamp: new Date() 
          };
          
          setIsTyping(false);
          setIsProcessing(false);
          setMessages(prev => [...prev, maxMessage]);
          
          if (speechSynthesis.current) {
            setIsSpeaking(true);
            speechSynthesis.current.speak(maxMessage.content, () => {
              setIsSpeaking(false);
            });
          }
          
          return;
        }
      }
      
      setTimeout(async () => {
        const response = await ResponseGenerator.getResponse(text);
        console.log("Generated response:", response);
        setIsTyping(false);
        setIsProcessing(false);
        
        // Add the exchange to memory
        conversationMemory.addExchange(text, response.text);
        
        const maxMessage = { type: 'max' as const, content: response.text, timestamp: new Date() };
        setMessages(prev => [...prev, maxMessage]);
        
        if (response.shouldSpeak && speechSynthesis.current) {
          console.log("Speaking response");
          setIsSpeaking(true);
          speechSynthesis.current.speak(response.text, () => {
            setIsSpeaking(false);
          });
        }
      }, 800);
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
    }
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

  const toggleInterface = () => {
    setShowFullInterface(!showFullInterface);
  };

  const handleFooterButtonClick = (action: string) => {
    let responseText = '';
    
    switch (action) {
      case 'brain':
        responseText = randomConversation.getRandomFact();
        break;
      case 'message':
        responseText = randomConversation.getConversationStarter();
        break;
      case 'zap':
        responseText = "My advanced features are ready to help you. Ask me about weather, directions, calculations, or just chat!";
        break;
      case 'info':
        responseText = "I'm Max, your AI assistant. I can help with information, directions, weather, calculations and more. Just ask!";
        break;
      case 'settings':
        responseText = "If this were a full implementation, you could customize my voice, appearance, and behavior here.";
        break;
      default:
        return;
    }
    
    const maxMessage = { type: 'max' as const, content: responseText, timestamp: new Date() };
    setMessages(prev => [...prev, maxMessage]);
    
    if (speechSynthesis.current) {
      setIsSpeaking(true);
      speechSynthesis.current.speak(responseText, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Floating Bubble UI */}
      {!showFullInterface ? (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div 
            className="bubble-glow animate-float pointer-events-auto cursor-pointer"
            style={{ 
              width: `${bubbleSize}px`, 
              height: `${bubbleSize}px`,
              transition: 'width 0.3s, height 0.3s' 
            }}
            onClick={toggleInterface}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className={`h-3 w-3 rounded-full ${isSpeaking || isListening ? 'bg-green-400 animate-pulse' : 'bg-purple-400 animate-pulse-slow'}`} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black overflow-hidden">
          {/* Animated background circles */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-600 opacity-10 blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-blue-500 opacity-10 blur-3xl animate-pulse-slow"></div>
            <div className="absolute top-2/3 left-1/2 w-64 h-64 rounded-full bg-cyan-400 opacity-10 blur-3xl animate-pulse-slow"></div>
          </div>
          
          {/* Header bar */}
          <div className="w-full p-3 bg-black/40 backdrop-blur-md border-b border-purple-500/30 flex justify-between items-center z-10">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isSpeaking || isListening ? 'bg-green-400 animate-pulse' : 'bg-purple-400 animate-pulse-slow'}`} />
              <span className="text-purple-300 font-semibold tracking-wider text-xs md:text-sm">
                MAX {isModelLoading ? 'LOADING MODELS' : isSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : 'READY'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 transition-all"
                onClick={toggleInterface}
              >
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden flex flex-col p-4">
            {/* AI assistant info card */}
            <div className="backdrop-blur-lg bg-purple-500/10 rounded-2xl p-4 mb-4 text-center border border-purple-500/20 shadow-lg shadow-purple-500/10">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300 mb-2">MAX</h1>
              <p className="text-sm text-gray-300">Your Personal AI Assistant</p>
              <p className="text-xs text-gray-400 mt-2">
                Say "Hey Max" or use the microphone button to activate voice commands
              </p>
              {isModelLoading && (
                <div className="mt-2 text-xs text-yellow-300">
                  Loading AI models... This might take a moment.
                </div>
              )}
              {modelError && (
                <div className="mt-2 text-xs text-red-400">
                  {modelError}
                </div>
              )}
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-3 animate-fade-in ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-br from-indigo-600/40 to-indigo-900/40 backdrop-blur-md text-white border border-indigo-400/20 shadow-lg shadow-indigo-500/10' 
                        : 'bg-gradient-to-br from-purple-500/30 to-blue-600/30 backdrop-blur-md text-blue-100 border border-blue-400/20 shadow-lg shadow-blue-500/10'
                    }`}
                  >
                    <div className={`text-xs mb-1 ${message.type === 'user' ? 'text-indigo-300' : 'text-purple-300'}`}>
                      {message.type === 'user' ? 'You' : 'MAX'} • {formatTime(message.timestamp)}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-br from-purple-500/30 to-blue-600/30 backdrop-blur-md rounded-2xl p-3 max-w-[80%] border border-blue-400/20 shadow-lg shadow-blue-500/10">
                    <div className="text-xs mb-1 text-purple-300">
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

            {/* Audio visualizer */}
            <div className="mb-4">
              <AudioVisualizer isActive={isListening || isProcessing || isTyping || isSpeaking} />
            </div>

            {/* Input area */}
            <div className="relative">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`${isListening ? 'bg-green-500/80 text-white animate-pulse' : 'bg-purple-900/50 text-purple-300'} rounded-full border border-purple-400/30 shadow-md hover:bg-purple-700/50 transition-all duration-300`}
                  onClick={toggleListening}
                  disabled={isModelLoading}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isModelLoading ? "Loading AI models..." : "Type your message or use voice..."}
                    className="w-full p-3 pr-10 bg-purple-900/20 backdrop-blur-md border border-purple-500/30 rounded-full text-white focus:ring-2 focus:ring-purple-500/50 focus:outline-none shadow-inner"
                    disabled={isProcessing || isModelLoading}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-100 hover:bg-transparent"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isProcessing || isModelLoading}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="w-full p-2 bg-black/40 backdrop-blur-md border-t border-purple-500/30 flex justify-center space-x-6">
            <Tooltip>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 transition-all"
                onClick={() => handleFooterButtonClick('brain')}
              >
                <Brain size={20} />
              </Button>
            </Tooltip>
            <Tooltip>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-blue-300 hover:text-blue-100 hover:bg-blue-500/20 transition-all"
                onClick={() => handleFooterButtonClick('message')}
              >
                <MessageCircle size={20} />
              </Button>
            </Tooltip>
            <Tooltip>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 transition-all"
                onClick={() => handleFooterButtonClick('zap')}
              >
                <Zap size={20} />
              </Button>
            </Tooltip>
            <Tooltip>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20 transition-all"
                onClick={() => handleFooterButtonClick('info')}
              >
                <Info size={20} />
              </Button>
            </Tooltip>
            <Tooltip>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-purple-400 hover:text-purple-200 hover:bg-purple-500/20 transition-all"
                onClick={() => handleFooterButtonClick('settings')}
              >
                <Settings size={20} />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaxCore;
