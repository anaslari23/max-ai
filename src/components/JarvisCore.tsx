
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Brain, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import AudioVisualizer from './AudioVisualizer';
import ResponseGenerator from '../utils/ResponseGenerator';

const JarvisCore: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'jarvis', content: string, timestamp: Date }[]>([
    { type: 'jarvis', content: 'Hello, I am JARVIS. How can I assist you today?', timestamp: new Date() }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Simulate voice recognition toggle
  const toggleListening = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Show notification when starting "voice recognition"
      console.log('Started listening...');
      setTimeout(() => {
        setIsListening(false);
        // Simulate receiving voice input
        handleSend('What can you do?');
      }, 5000);
    }
  };

  // Process user input and generate response
  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage = { type: 'user' as const, content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Generate AI response (simulated with delays)
      setTimeout(async () => {
        const response = await ResponseGenerator.getResponse(text);
        setIsTyping(false);
        setIsProcessing(false);
        
        // Add JARVIS response, making sure to extract the text property from ResponseData
        const jarvisMessage = { 
          type: 'jarvis' as const, 
          content: response.text, 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, jarvisMessage]);
      }, 1500);
    } catch (error) {
      console.error('Error generating response:', error);
      setIsTyping(false);
      setIsProcessing(false);
      
      // Add error message
      const errorMessage = { 
        type: 'jarvis' as const, 
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-jarvis-dark to-black">
      {/* Top Status Bar */}
      <div className="w-full p-3 bg-black/40 backdrop-blur-md border-b border-jarvis-primary/30 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-jarvis-primary animate-pulse-slow" />
          <span className="text-jarvis-primary font-semibold tracking-wider text-xs md:text-sm">JARVIS ACTIVE</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-jarvis-secondary">{new Date().toLocaleDateString()}</span>
          <span className="text-xs text-jarvis-accent">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* Information Panel */}
        <div className="glass rounded-lg p-4 mb-4 text-center">
          <h1 className="text-2xl font-bold text-jarvis-primary glow-text mb-2">J.A.R.V.I.S</h1>
          <p className="text-sm text-gray-300">Just A Rather Very Intelligent System</p>
          <p className="text-xs text-gray-400 mt-2">
            Prototype v0.1 - Local System Operation Only
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
                    ? 'bg-jarvis-secondary/20 text-white' 
                    : 'glass text-jarvis-accent'
                }`}
              >
                <div className={`text-xs mb-1 ${message.type === 'user' ? 'text-gray-300' : 'text-jarvis-primary'}`}>
                  {message.type === 'user' ? 'You' : 'JARVIS'} • {formatTime(message.timestamp)}
                </div>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="glass rounded-lg p-3 max-w-[80%]">
                <div className="text-xs mb-1 text-jarvis-primary">
                  JARVIS • {formatTime(new Date())}
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
          <AudioVisualizer isActive={isListening || isProcessing || isTyping} />
        </div>

        {/* Input Area */}
        <div className="relative">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={`${isListening ? 'bg-jarvis-primary text-white' : 'bg-gray-800 text-jarvis-primary'} rounded-full`}
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
                placeholder="Type your message..."
                className="w-full p-3 pr-10 bg-gray-800/50 border border-jarvis-primary/30 rounded-lg text-white focus:ring-2 focus:ring-jarvis-primary/50 focus:outline-none"
                disabled={isProcessing}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-jarvis-primary hover:text-jarvis-secondary hover:bg-transparent"
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
      <div className="w-full p-2 bg-black/40 backdrop-blur-md border-t border-jarvis-primary/30 flex justify-center space-x-4">
        <Tooltip>
          <Button variant="ghost" size="icon" className="text-jarvis-secondary">
            <Brain size={20} />
          </Button>
        </Tooltip>
        <Tooltip>
          <Button variant="ghost" size="icon" className="text-jarvis-accent">
            <Zap size={20} />
          </Button>
        </Tooltip>
        <Tooltip>
          <Button variant="ghost" size="icon" className="text-jarvis-primary">
            <Settings size={20} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default JarvisCore;
