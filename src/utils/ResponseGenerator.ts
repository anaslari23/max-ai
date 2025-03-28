
/**
 * Simulated response generator for JARVIS
 * This is a placeholder for an actual NLP/ML model
 */

const responses = {
  greeting: [
    "Hello! How may I assist you today?",
    "Greetings! I'm JARVIS, your personal assistant. How can I help?",
    "At your service. What can I do for you?"
  ],
  
  farewell: [
    "Goodbye. I'll be here when you need me.",
    "Until next time. Shutting down active protocols.",
    "Standing by for your next command."
  ],
  
  capabilities: [
    "I'm a prototype AI assistant designed to simulate interactions similar to JARVIS from Iron Man. In a full implementation, I would be able to:\n\n- Process natural language commands\n- Recognize speech and respond verbally\n- Control system operations\n- Learn from interactions\n- Integrate with various applications\n\nHowever, as this is a demonstration, I have limited functionality."
  ],
  
  identity: [
    "I am JARVIS, Just A Rather Very Intelligent System. I'm a prototype AI assistant designed to simulate the experience of interacting with an advanced AI system.",
    "I'm JARVIS, a simulated AI assistant prototype. This version demonstrates the concept of an AI interface, though my capabilities are limited compared to a full implementation."
  ],
  
  weather: [
    "I'm sorry, but I don't have access to real-time weather data in this prototype. In a full implementation, I would connect to weather APIs to provide accurate forecasts."
  ],
  
  time: [
    `The current time is ${new Date().toLocaleTimeString()}.`,
    `It's currently ${new Date().toLocaleTimeString()}.`
  ],
  
  joke: [
    "Why don't scientists trust atoms? Because they make up everything.",
    "How does a computer get drunk? It takes screenshots.",
    "Why did the AI assistant go to therapy? It had too many personal issues to process.",
    "What's an AI's favorite place to shop? The algorithm."
  ],
  
  mobile: [
    "In a full implementation, I would integrate with mobile device capabilities including:\n\n- Making calls and sending messages\n- Accessing contacts and calendars\n- Controlling device settings\n- Integrating with other mobile apps\n- Location-based services and navigation\n\nThe 2025 update would likely include enhanced offline capabilities, improved voice recognition, and better app integration."
  ],
  
  fallback: [
    "I'm still learning to understand different types of queries. Could you rephrase that?",
    "I'm not sure I understand. As a prototype, my comprehension is limited.",
    "I don't have enough information to respond to that properly. In a full implementation, I would have more extensive knowledge and capabilities."
  ]
};

// Simple pattern matching for determining response type
const patterns = {
  greeting: /\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i,
  farewell: /\b(bye|goodbye|see you|farewell|exit|quit)\b/i,
  capabilities: /\b(what can you do|capabilities|features|functions|abilities|help me|how do you work)\b/i,
  identity: /\b(who are you|what are you|tell me about yourself|your name|what is jarvis)\b/i,
  weather: /\b(weather|temperature|forecast|rain|snow|sunny|cloudy)\b/i,
  time: /\b(time|clock|hour|what time|current time)\b/i,
  joke: /\b(joke|funny|make me laugh|tell me something funny)\b/i,
  mobile: /\b(mobile|phone|call|text|sms|app integration|2025|update)\b/i
};

class ResponseGenerator {
  static async getResponse(input: string): Promise<string> {
    // Determine response category based on input
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(input)) {
        const possibleResponses = responses[category as keyof typeof responses];
        return possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
      }
    }
    
    // Default fallback response
    return responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
  }
}

export default ResponseGenerator;
