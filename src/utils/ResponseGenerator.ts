
/**
 * Enhanced response generator for Max AI Assistant
 */
import modelInference from './ModelInference';
import weatherService from './WeatherService';
import directionsService from './DirectionsService';
import conversationMemory from './ConversationMemory';
import randomConversation from './RandomConversation';

interface ResponseData {
  text: string;
  shouldSpeak: boolean;
}

const responses = {
  greeting: [
    "Hello! I'm Max, your personal assistant. How may I help you today?",
    "Hey there! Max at your service. What can I do for you?",
    "Good day! This is Max. How can I assist you?"
  ],
  
  farewell: [
    "Goodbye. I'll be here when you need me.",
    "Talk to you later! Just say 'Hey Max' when you need me.",
    "Have a great day! Call me anytime."
  ],
  
  capabilities: [
    "I'm Max, your advanced AI assistant designed to help with various tasks. I can:\n\n- Process natural language commands\n- Recognize speech and respond verbally\n- Answer questions on many topics\n- Check the weather and get directions\n- Tell you the time and date\n- Perform calculations\n- Tell jokes and fun facts\n- Set reminders and alarms\n\nJust ask and I'll do my best to help you!"
  ],
  
  identity: [
    "I'm Max, your personal AI assistant. I'm designed to help you with information, tasks, and to make your digital life easier.",
    "My name is Max. I'm an AI assistant focused on being helpful, accurate, and easy to talk to. Unlike other assistants, I'm designed to be more conversational and natural."
  ],
  
  weather: [
    "I'd be happy to check the weather for you. What location would you like the weather for?"
  ],
  
  time: [
    `The current time is ${new Date().toLocaleTimeString()}.`,
    `It's currently ${new Date().toLocaleTimeString()}.`
  ],
  
  date: [
    `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
    `It's ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.`
  ],
  
  joke: [
    "Why don't scientists trust atoms? Because they make up everything.",
    "How does a computer get drunk? It takes screenshots.",
    "What did the ocean say to the beach? Nothing, it just waved.",
    "Why don't eggs tell jokes? They'd crack each other up.",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "Why did the bicycle fall over? Because it was two tired.",
    "Why couldn't the leopard play hide and seek? Because he was always spotted.",
    "What's orange and sounds like a parrot? A carrot."
  ],
  
  music: [
    "I'd be happy to play some music for you. In a full implementation, I would integrate with music services like Spotify or Apple Music.",
    "What kind of music are you in the mood for? In a full implementation, I would connect to your preferred music service."
  ],
  
  mobile: [
    "I can integrate with your mobile device to:\n\n- Make calls and send messages\n- Access contacts and calendars\n- Control device settings\n- Set reminders and alarms\n- Provide directions and navigation\n\nJust let me know what you need help with."
  ],
  
  reminder: [
    "I'd be happy to set a reminder for you. What would you like me to remind you about, and when?",
    "I'll remember that for you. Is there a specific time you'd like to be reminded?"
  ],
  
  directions: [
    "I can help you with directions. Where are you starting from and where would you like to go?"
  ],
  
  calculation: {
    add: (a: number, b: number) => `${a} plus ${b} equals ${a + b}`,
    subtract: (a: number, b: number) => `${a} minus ${b} equals ${a - b}`,
    multiply: (a: number, b: number) => `${a} multiplied by ${b} equals ${a * b}`,
    divide: (a: number, b: number) => b !== 0 ? `${a} divided by ${b} equals ${a / b}` : "I can't divide by zero",
  },
  
  thanks: [
    "You're welcome! Is there anything else you need?",
    "Glad I could help! Let me know if you need anything else.",
    "My pleasure! What else can I assist you with today?"
  ],
  
  // We'll use our RandomConversation.ts instead of these hardcoded facts
  facts: [],
  
  fallback: [
    "I'm still improving my understanding of different topics. Could you rephrase that?",
    "I'm not sure I understand completely. Could you provide more details?",
    "I'm learning more every day, but I don't have enough information to respond to that properly yet."
  ]
};

const patterns = {
  greeting: /\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i,
  farewell: /\b(bye|goodbye|see you|farewell|exit|quit)\b/i,
  capabilities: /\b(what can you do|capabilities|features|functions|abilities|help me|how do you work)\b/i,
  identity: /\b(who are you|what are you|tell me about yourself|your name|what is max)\b/i,
  weather: /\b(weather|temperature|forecast|rain|snow|sunny|cloudy|humidity|wind)\b/i,
  time: /\b(time|what time is it|current time|clock|hour)\b/i,
  date: /\b(date|what day is it|today|what is today|day of the week|calendar)\b/i,
  joke: /\b(joke|funny|make me laugh|tell me something funny)\b/i,
  music: /\b(play music|play song|music|song|playlist|artist)\b/i,
  mobile: /\b(mobile|phone|call|text|sms|app integration)\b/i,
  reminder: /\b(remind me|reminder|don't forget|remember to|set reminder|set alarm)\b/i,
  thanks: /\b(thanks|thank you|appreciate it|grateful)\b/i,
  calculation: /\b(calculate|compute|what is|how much is|solve|math|plus|minus|times|divided by)\b/i,
  directions: /\b(directions|navigate|how (do|can) I get to|route to|way to|map|distance|how far)\b/i,
  facts: /\b(tell me a fact|random fact|did you know|fun fact|interesting fact|tell me something interesting)\b/i,
  chat: /\b(let's chat|let's talk|tell me something|what's new|chat with me|talk to me|conversation)\b/i
};

// Extended pattern recognition
const personalQuestions = /\b(how are you|feeling|what do you think|your opinion|do you like|your favorite)\b/i;
const philosophicalQuestions = /\b(meaning of life|purpose|consciousness|philosophy|existence|reality|truth|knowledge)\b/i;
const learningQuestions = /\b(do you learn|how do you learn|learning|evolve|improve|get better)\b/i;

// Specific patterns for extracting entities from weather and directions queries
const weatherLocationPattern = /weather (?:in|at|for) ([a-zA-Z\s]+)/i;
const directionsPattern = /(?:directions|navigate|route) (?:from|to) ([a-zA-Z\s]+) (?:to|from) ([a-zA-Z\s]+)/i;

const calculationRegex = {
  add: /(\d+)\s*(plus|\+)\s*(\d+)/i,
  subtract: /(\d+)\s*(minus|\-)\s*(\d+)/i,
  multiply: /(\d+)\s*(times|multiplied by|\*)\s*(\d+)/i,
  divide: /(\d+)\s*(divided by|\/)\s*(\d+)/i
};

class ResponseGenerator {
  private static useModelInference = true; // Toggle to use model inference

  static async getResponse(input: string): Promise<ResponseData> {
    // Normalize input
    const normalizedInput = input.toLowerCase().trim();
    
    // Check for calculation requests first
    const calculationResult = this.handleCalculation(normalizedInput);
    if (calculationResult) {
      conversationMemory.addExchange(input, calculationResult, 'calculation');
      return { text: calculationResult, shouldSpeak: true };
    }
    
    // Check for specific weather queries with location
    const weatherMatch = normalizedInput.match(weatherLocationPattern);
    if (weatherMatch && weatherMatch[1]) {
      try {
        const location = weatherMatch[1].trim();
        const weatherData = await weatherService.getWeather(location);
        const response = weatherService.generateWeatherResponse(weatherData);
        conversationMemory.addExchange(input, response, 'weather');
        return { text: response, shouldSpeak: true };
      } catch (error) {
        console.error("Weather error:", error);
        return { text: "I couldn't get the weather information right now. Please try again later.", shouldSpeak: true };
      }
    }
    
    // Check for directions queries
    const directionsMatch = normalizedInput.match(directionsPattern);
    if (directionsMatch && directionsMatch[1] && directionsMatch[2]) {
      try {
        const from = directionsMatch[1].trim();
        const to = directionsMatch[2].trim();
        const directionsData = await directionsService.getDirections(from, to);
        const response = directionsService.generateDirectionsResponse(directionsData);
        conversationMemory.addExchange(input, response, 'directions');
        return { text: response, shouldSpeak: true };
      } catch (error) {
        console.error("Directions error:", error);
        return { text: "I couldn't get the directions right now. Please try again later.", shouldSpeak: true };
      }
    }
    
    // Determine response category based on input
    let category: string | null = null;
    
    for (const [cat, pattern] of Object.entries(patterns)) {
      if (pattern.test(normalizedInput)) {
        category = cat;
        break;
      }
    }
    
    // Special handling for random facts requests
    if (category === 'facts') {
      const factResponse = randomConversation.getRandomFact();
      conversationMemory.addExchange(input, factResponse, 'facts');
      return { text: factResponse, shouldSpeak: true };
    }
    
    // Special handling for jokes
    if (category === 'joke') {
      const jokeResponse = responses.joke[Math.floor(Math.random() * responses.joke.length)];
      conversationMemory.addExchange(input, jokeResponse, 'joke');
      return { text: jokeResponse, shouldSpeak: true };
    }
    
    // Check for personal questions about Max
    if (personalQuestions.test(normalizedInput)) {
      const personalResponse = randomConversation.getEmpatheticResponse();
      conversationMemory.addExchange(input, personalResponse, 'personal');
      return { text: personalResponse, shouldSpeak: true };
    }
    
    // Check for philosophical questions
    if (philosophicalQuestions.test(normalizedInput)) {
      const philosophicalResponse = randomConversation.getPhilosophicalResponse();
      conversationMemory.addExchange(input, philosophicalResponse, 'philosophical');
      return { text: philosophicalResponse, shouldSpeak: true };
    }
    
    // Check for learning questions
    if (learningQuestions.test(normalizedInput)) {
      const learningResponse = "I learn from every conversation we have. Each interaction helps me understand context better and improve my responses.";
      conversationMemory.addExchange(input, learningResponse, 'learning');
      return { text: learningResponse, shouldSpeak: true };
    }
    
    // Handle time requests with updated time
    if (category === 'time') {
      const now = new Date();
      const timeResponse = `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      conversationMemory.addExchange(input, timeResponse, 'time');
      return { text: timeResponse, shouldSpeak: true };
    }
    
    // Handle date requests with updated date
    if (category === 'date') {
      const now = new Date();
      const dateResponse = `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
      conversationMemory.addExchange(input, dateResponse, 'date');
      return { text: dateResponse, shouldSpeak: true };
    }
    
    // Try to generate a random conversational response if appropriate
    const randomResponse = randomConversation.generateRandomResponse(input);
    if (randomResponse) {
      conversationMemory.addExchange(input, randomResponse, 'random');
      return { text: randomResponse, shouldSpeak: true };
    }
    
    // Try to use model inference for generating responses
    try {
      if (this.useModelInference) {
        console.log('Using model inference for response generation');
        
        // Add conversation context for better responses
        let prompt = `You are Max, an advanced AI assistant. The user says: "${input}". `;
        
        // Add conversation history for context
        const recentHistory = conversationMemory.getRecentHistory(2);
        if (recentHistory.length > 0) {
          prompt += "Recent conversation: ";
          recentHistory.forEach(entry => {
            prompt += `User: "${entry.input}" You: "${entry.response}" `;
          });
        }
        
        prompt += 'Respond in a helpful, friendly, and conversational way.';
        
        try {
          const generatedText = await modelInference.generateText(prompt, 150);
          if (generatedText && generatedText.length > 10) {
            conversationMemory.addExchange(input, generatedText, 'model-generated');
            return { 
              text: generatedText,
              shouldSpeak: true
            };
          }
        } catch (error) {
          console.error('Error with model inference, falling back to template responses:', error);
        }
      }
    } catch (error) {
      console.error('Error in model inference path:', error);
    }
    
    // Get response based on category (fallback if model inference failed or isn't used)
    let responseText: string;
    
    // For certain categories, generate a random response from the array
    if (category && responses[category as keyof typeof responses]) {
      const possibleResponses = responses[category as keyof typeof responses];
      if (Array.isArray(possibleResponses)) {
        responseText = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
      } else {
        // Default to a general friendly response
        responseText = randomConversation.getConversationStarter();
      }
    } else {
      // No specific category matched, use a conversation starter
      responseText = randomConversation.getConversationStarter();
    }
    
    // Store in conversation memory
    conversationMemory.addExchange(input, responseText, category || 'general');
    
    return { 
      text: responseText,
      shouldSpeak: true
    };
  }
  
  private static handleCalculation(input: string): string | null {
    // Check for addition
    const addMatch = input.match(calculationRegex.add);
    if (addMatch) {
      const num1 = parseInt(addMatch[1]);
      const num2 = parseInt(addMatch[3]);
      return responses.calculation.add(num1, num2);
    }
    
    // Check for subtraction
    const subMatch = input.match(calculationRegex.subtract);
    if (subMatch) {
      const num1 = parseInt(subMatch[1]);
      const num2 = parseInt(subMatch[3]);
      return responses.calculation.subtract(num1, num2);
    }
    
    // Check for multiplication
    const mulMatch = input.match(calculationRegex.multiply);
    if (mulMatch) {
      const num1 = parseInt(mulMatch[1]);
      const num2 = parseInt(mulMatch[3]);
      return responses.calculation.multiply(num1, num2);
    }
    
    // Check for division
    const divMatch = input.match(calculationRegex.divide);
    if (divMatch) {
      const num1 = parseInt(divMatch[1]);
      const num2 = parseInt(divMatch[3]);
      return responses.calculation.divide(num1, num2);
    }
    
    return null;
  }
  
  static clearContext() {
    conversationMemory.clearMemory();
  }
  
  static setUseModelInference(use: boolean) {
    this.useModelInference = use;
  }
  
  static getContextualGreeting(): string {
    return conversationMemory.generateContextualGreeting();
  }
  
  static getWakeUpResponse(): string {
    return randomConversation.getWakeUpResponse();
  }
}

export default ResponseGenerator;
