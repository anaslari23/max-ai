import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Brain, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import AudioVisualizer from './AudioVisualizer';
import ResponseGenerator from '../utils/ResponseGenerator';
import VoiceRecognition from '../utils/VoiceRecognition';
import SpeechSynthesis from '../utils/SpeechSynthesis';

const MaxCore: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'max', content: string, timestamp: Date }[]>([
    { type: 'max', content: 'Hello, I am Max. Say "Hey Max" or type your message to begin.', timestamp: new Date() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecognition = useRef<VoiceRecognition | null>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  // Initialize voice recognition and speech synthesis
  useEffect(() => {
    voiceRecognition.current = new VoiceRecognition();
    speechSynthesis.current = new SpeechSynthesis();
    
    // Set up wake word detection
    voiceRecognition.current.onWake(() => {
      if (!isListening && !isProcessing) {
        // Play wake sound or notification
        toast({
          title: "Hey there!",
          description: "Max is listening...",
          duration: 3000,
        });
        startListening();
      }
    });
    
    // Auto-start voice recognition on page load
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
    
    return () => {
      if (voiceRecognition.current) {
        voiceRecognition.current.stop();
      }
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  // Start listening for voice input
  const startListening = () => {
    setIsListening(true);
    console.log("Starting to listen...");
    
    // Visual feedback
    toast({
      title: "I'm listening",
      description: "Speak now...",
      duration: 3000,
    });
    
    if (voiceRecognition.current) {
      voiceRecognition.current.onResult((text) => {
        console.log("Received text:", text);
        // Filter out wake words from the transcript
        const cleanedText = text.replace(/hey max|wake up max|good morning max|hi max|hello max|max/gi, '').trim();
        if (cleanedText) {
          console.log("Cleaned text:", cleanedText);
          setInput(cleanedText);
          
          // Automatically send the message after receiving voice input
          handleSend(cleanedText);
          stopListening();
        }
      });
      
      // Set a timeout to stop listening if no input is received
      setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 8000); // Extend listening time to 8 seconds
    }
  };
  
  // Stop listening for voice input
  const stopListening = () => {
    console.log("Stopping listening");
    setIsListening(false);
    if (voiceRecognition.current) {
      // Reset the result handler
      voiceRecognition.current.onResult(() => {});
    }
  };

  // Process user input and generate response
  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    console.log("Processing user input:", text);
    
    // Add user message
    const userMessage = { type: 'user' as const, content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Generate AI response
      setTimeout(async () => {
        const response = await ResponseGenerator.getResponse(text);
        console.log("Generated response:", response);
        setIsTyping(false);
        setIsProcessing(false);
        
        // Add Max response
        const maxMessage = { type: 'max' as const, content: response.text, timestamp: new Date() };
        setMessages(prev => [...prev, maxMessage]);
        
        // Speak the response if needed
        if (response.shouldSpeak && speechSynthesis.current) {
          console.log("Speaking response");
          setIsSpeaking(true);
          speechSynthesis.current.speak(response.text, () => {
            setIsSpeaking(false);
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Error generating response:', error);
      setIsTyping(false);
      setIsProcessing(false);
      
      // Add error message
      const errorMessage = { 
        type: 'max' as const, 
        content: 'I apologize, but I encountered an error processing your request.', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-900 to-black">
      {/* Top Status Bar */}
      <div className="w-full p-3 bg-black/40 backdrop-blur-md border-b border-blue-500/30 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isSpeaking || isListening ? 'bg-green-500 animate-pulse' : 'bg-blue-500 animate-pulse-slow'}`} />
          <span className="text-blue-400 font-semibold tracking-wider text-xs md:text-sm">MAX {isSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : 'ACTIVE'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-blue-300">{new Date().toLocaleDateString()}</span>
          <span className="text-xs text-blue-200">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* Information Panel */}
        <div className="glass rounded-lg p-4 mb-4 text-center">
          <h1 className="text-2xl font-bold text-blue-400 glow-text mb-2">MAX</h1>
          <p className="text-sm text-gray-300">Your Personal AI Assistant</p>
          <p className="text-xs text-gray-400 mt-2">
            Say "Hey Max" or use the microphone button to activate voice commands
          </p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] md:max-w-[70%] rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600/20 text-white' 
                    : 'glass text-blue-100'
                }`}
              >
                <div className={`text-xs mb-1 ${message.type === 'user' ? 'text-gray-300' : 'text-blue-400'}`}>
                  {message.type === 'user' ? 'You' : 'MAX'} • {formatTime(message.timestamp)}
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="glass rounded-lg p-3 max-w-[80%]">
                <div className="text-xs mb-1 text-blue-400">
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

        {/* Visualizer */}
        <div className="mb-4">
          <AudioVisualizer isActive={isListening || isProcessing || isTyping || isSpeaking} />
        </div>

        {/* Input Area */}
        <div className="relative">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`${isListening ? 'bg-green-500 text-white' : 'bg-gray-800 text-blue-400'} rounded-full`}
              onClick={toggleListening}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
            
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or use voice..."
                className="w-full p-3 pr-10 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                disabled={isProcessing}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 hover:bg-transparent"
                onClick={() => handleSend()}
                disabled={!input.trim() || isProcessing}
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="w-full p-2 bg-black/40 backdrop-blur-md border-t border-blue-500/30 flex justify-center space-x-4">
        <Tooltip>
          <Button variant="ghost" size="icon" className="text-blue-300">
            <Brain size={20} />
          </Button>
        </Tooltip>
        <Tooltip>
          <Button variant="ghost" size="icon" className="text-blue-200">
            <Zap size={20} />
          </Button>
        </Tooltip>
        <Tooltip>
          <Button variant="ghost" size="icon" className="text-blue-400">
            <Settings size={20} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default MaxCore;
