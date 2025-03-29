
/**
 * Enhanced response generator for Max AI Assistant
 */
import modelInference from './ModelInference';
import weatherService from './WeatherService';
import directionsService from './DirectionsService';

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
  
  facts: [
    "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief.",
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
    "A day on Venus is longer than a year on Venus. It takes 243 Earth days to rotate once on its axis, but only 225 Earth days to orbit the Sun.",
    "Octopuses have three hearts, nine brains, and blue blood.",
    "The longest word in the English language without a vowel is 'rhythms'.",
    "Bananas are berries, but strawberries aren't."
  ],
  
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
  facts: /\b(tell me a fact|random fact|did you know|fun fact|interesting fact)\b/i
};

const calculationRegex = {
  add: /(\d+)\s*(plus|\+)\s*(\d+)/i,
  subtract: /(\d+)\s*(minus|\-)\s*(\d+)/i,
  multiply: /(\d+)\s*(times|multiplied by|\*)\s*(\d+)/i,
  divide: /(\d+)\s*(divided by|\/)\s*(\d+)/i
};

// Specific patterns for extracting entities from weather and directions queries
const weatherLocationPattern = /weather (?:in|at|for) ([a-zA-Z\s]+)/i;
const directionsPattern = /(?:directions|navigate|route) (?:from|to) ([a-zA-Z\s]+) (?:to|from) ([a-zA-Z\s]+)/i;

class ConversationContext {
  private topics: string[] = [];
  private lastTopic: string = '';
  private lastInput: string = '';
  private lastResponse: string = '';
  private consecutiveFallbacks: number = 0;
  private entityMemory: Map<string, string> = new Map();
  
  public addTopic(topic: string) {
    this.lastTopic = topic;
    if (!this.topics.includes(topic)) {
      this.topics.push(topic);
      if (this.topics.length > 5) {
        this.topics.shift(); // Keep only the 5 most recent topics
      }
    }
  }
  
  public getLastTopic(): string {
    return this.lastTopic;
  }
  
  public getTopics(): string[] {
    return [...this.topics];
  }
  
  public setLastInput(input: string) {
    this.lastInput = input;
  }
  
  public getLastInput(): string {
    return this.lastInput;
  }
  
  public setLastResponse(response: string) {
    this.lastResponse = response;
  }
  
  public getLastResponse(): string {
    return this.lastResponse;
  }
  
  public incrementFallbacks() {
    this.consecutiveFallbacks++;
  }
  
  public resetFallbacks() {
    this.consecutiveFallbacks = 0;
  }
  
  public getFallbackCount(): number {
    return this.consecutiveFallbacks;
  }
  
  public setEntity(type: string, value: string) {
    this.entityMemory.set(type, value);
  }
  
  public getEntity(type: string): string | undefined {
    return this.entityMemory.get(type);
  }
  
  public clear() {
    this.topics = [];
    this.lastTopic = '';
    this.lastInput = '';
    this.lastResponse = '';
    this.consecutiveFallbacks = 0;
    this.entityMemory.clear();
  }
}

class ResponseGenerator {
  private static context = new ConversationContext();
  private static useModelInference = true; // Toggle to use model inference
  
  static async getResponse(input: string): Promise<ResponseData> {
    // Store input in context
    this.context.setLastInput(input);
    
    // Normalize input
    const normalizedInput = input.toLowerCase().trim();
    
    // Check for calculation requests first
    const calculationResult = this.handleCalculation(normalizedInput);
    if (calculationResult) {
      this.context.resetFallbacks();
      return { text: calculationResult, shouldSpeak: true };
    }
    
    // Check for specific weather queries with location
    const weatherMatch = normalizedInput.match(weatherLocationPattern);
    if (weatherMatch && weatherMatch[1]) {
      try {
        const location = weatherMatch[1].trim();
        this.context.setEntity('weatherLocation', location);
        const weatherData = await weatherService.getWeather(location);
        const response = weatherService.generateWeatherResponse(weatherData);
        this.context.setLastResponse(response);
        this.context.resetFallbacks();
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
        this.context.setEntity('directionsFrom', from);
        this.context.setEntity('directionsTo', to);
        const directionsData = await directionsService.getDirections(from, to);
        const response = directionsService.generateDirectionsResponse(directionsData);
        this.context.setLastResponse(response);
        this.context.resetFallbacks();
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
        this.context.addTopic(cat);
        this.context.resetFallbacks();
        break;
      }
    }
    
    // If no category was found, try to use context from previous conversation
    if (!category) {
      const lastTopic = this.context.getLastTopic();
      if (lastTopic && patterns[lastTopic as keyof typeof patterns]?.test(normalizedInput)) {
        category = lastTopic;
        this.context.resetFallbacks();
      } else {
        category = 'fallback';
        this.context.incrementFallbacks();
      }
    }
    
    // Handle time requests with updated time
    if (category === 'time') {
      const now = new Date();
      const timeResponse = `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      this.context.setLastResponse(timeResponse);
      return { text: timeResponse, shouldSpeak: true };
    }
    
    // Handle date requests with updated date
    if (category === 'date') {
      const now = new Date();
      const dateResponse = `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
      this.context.setLastResponse(dateResponse);
      return { text: dateResponse, shouldSpeak: true };
    }
    
    // If we have multiple consecutive fallbacks, try to use model inference for better responses
    const useFallbackInference = this.context.getFallbackCount() > 1;
    
    // Try to use model inference for generating responses if it's a fallback
    // or for certain categories that benefit from more natural responses
    try {
      if (this.useModelInference && 
          (category === 'fallback' || 
           category === 'capabilities' || 
           category === 'identity' ||
           useFallbackInference)) {
        console.log('Using model inference for response generation');
        
        // Add some context to the prompt for better responses
        let prompt = `You are Max, an advanced AI assistant. The user says: "${input}". `;
        
        // Add conversation context for better context awareness
        if (this.context.getLastInput() && this.context.getLastResponse()) {
          prompt += `Recently, the user said "${this.context.getLastInput()}" and I responded "${this.context.getLastResponse()}". `;
        }
        
        if (category === 'capabilities') {
          prompt += 'Explain what you can do as an AI assistant in a friendly, conversational way.';
        } else if (category === 'identity') {
          prompt += 'Explain who you are in a friendly, conversational way.';
        } else {
          prompt += 'Respond in a helpful, friendly, and conversational way.';
        }
        
        try {
          const generatedText = await modelInference.generateText(prompt, 150);
          if (generatedText && generatedText.length > 10) {
            // Store response in context
            this.context.setLastResponse(generatedText);
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
        responseText = responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
      }
    } else {
      responseText = responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
    }
    
    // Store response in context
    this.context.setLastResponse(responseText);
    
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
    this.context.clear();
  }
  
  static setUseModelInference(use: boolean) {
    this.useModelInference = use;
  }
}

export default ResponseGenerator;
