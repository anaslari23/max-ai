/**
 * Enhanced response generator for Max AI Assistant
 */
import modelInference from './ModelInference';

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
    "I'm Max, your advanced AI assistant designed to help with various tasks. I can:\n\n- Process natural language commands\n- Recognize speech and respond verbally\n- Answer questions on many topics\n- Remember our conversation context\n- Perform basic calculations\n- Tell jokes and fun facts\n\nI'm constantly learning and improving to serve you better."
  ],
  
  identity: [
    "I'm Max, your personal AI assistant. I'm designed to help you with information, tasks, and to make your digital life easier.",
    "My name is Max. I'm an AI assistant focused on being helpful, accurate, and easy to talk to. Unlike other assistants, I'm designed to be more conversational and natural."
  ],
  
  weather: [
    "I'd be happy to check the weather for you. In a full implementation, I would connect to weather APIs to provide accurate forecasts."
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
    "I told my wife she was drawing her eyebrows too high. She looked surprised."
  ],
  
  music: [
    "I'd be happy to play some music for you. In a full implementation, I would integrate with music services like Spotify or Apple Music.",
    "What kind of music are you in the mood for? In a full implementation, I would connect to your preferred music service."
  ],
  
  mobile: [
    "I can integrate with your mobile device to:\n\n- Make calls and send messages\n- Access contacts and calendars\n- Control device settings\n- Set reminders and alarms\n- Provide directions and navigation\n\nJust let me know what you need help with."
  ],
  
  reminder: [
    "I'd be happy to set a reminder for you. In a full implementation, I would access your calendar and create a reminder.",
    "I'll remember that for you. Is there a specific time you'd like to be reminded?"
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
  weather: /\b(weather|temperature|forecast|rain|snow|sunny|cloudy)\b/i,
  time: /\b(time|what time is it|current time|clock|hour)\b/i,
  date: /\b(date|what day is it|today|what is today|day of the week)\b/i,
  joke: /\b(joke|funny|make me laugh|tell me something funny)\b/i,
  music: /\b(play music|play song|music|song|playlist|artist)\b/i,
  mobile: /\b(mobile|phone|call|text|sms|app integration)\b/i,
  reminder: /\b(remind me|reminder|don't forget|remember to|set reminder|set alarm)\b/i,
  thanks: /\b(thanks|thank you|appreciate it|grateful)\b/i,
  calculation: /\b(calculate|compute|what is|how much is|solve|math|plus|minus|times|divided by)\b/i
};

const calculationRegex = {
  add: /(\d+)\s*(plus|\+)\s*(\d+)/i,
  subtract: /(\d+)\s*(minus|\-)\s*(\d+)/i,
  multiply: /(\d+)\s*(times|multiplied by|\*)\s*(\d+)/i,
  divide: /(\d+)\s*(divided by|\/)\s*(\d+)/i
};

class ConversationContext {
  private topics: string[] = [];
  private lastTopic: string = '';
  private lastInput: string = '';
  private lastResponse: string = '';
  private consecutiveFallbacks: number = 0;
  
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
  
  public clear() {
    this.topics = [];
    this.lastTopic = '';
    this.lastInput = '';
    this.lastResponse = '';
    this.consecutiveFallbacks = 0;
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
    
    if (category === 'time') {
      responseText = `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (category === 'date') {
      responseText = `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
    } else {
      const possibleResponses = responses[category as keyof typeof responses];
      if (Array.isArray(possibleResponses)) {
        responseText = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
      } else {
        responseText = responses.fallback[Math.floor(Math.random() * responses.fallback.length)];
      }
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
