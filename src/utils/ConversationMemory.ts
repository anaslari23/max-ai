/**
 * Enhanced conversation memory for Max AI Assistant
 * Allows for more natural, contextual conversations by storing conversation history
 */

interface MemoryEntry {
  input: string;
  response: string;
  timestamp: Date;
  topic?: string;
}

class ConversationMemory {
  private shortTermMemory: MemoryEntry[] = [];
  private topics: Set<string> = new Set();
  private entities: Map<string, string> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private memorySize: number = 10;

  /**
   * Add a new conversation exchange to memory
   */
  public addExchange(input: string, response: string, topic?: string): void {
    const entry: MemoryEntry = {
      input,
      response,
      timestamp: new Date(),
      topic
    };

    // Add to short-term memory
    this.shortTermMemory.unshift(entry);
    
    // Keep memory size limited
    if (this.shortTermMemory.length > this.memorySize) {
      this.shortTermMemory.pop();
    }
    
    // Add topic if available
    if (topic) {
      this.topics.add(topic);
    }
    
    // Extract entities from input
    this.extractEntities(input);
  }

  /**
   * Extract and store potential entities from user input
   */
  private extractEntities(input: string): void {
    // Simple entity extraction (could be expanded with NLP in a real system)
    const nameMatch = input.match(/my name is (\w+)/i);
    if (nameMatch && nameMatch[1]) {
      this.entities.set('userName', nameMatch[1]);
    }

    const locationMatch = input.match(/I (?:am|live) (?:in|at|near) ([a-zA-Z\s]+)/i);
    if (locationMatch && locationMatch[1]) {
      this.entities.set('userLocation', locationMatch[1]);
    }
  }

  /**
   * Get recent conversation history
   */
  public getRecentHistory(count: number = 3): MemoryEntry[] {
    return this.shortTermMemory.slice(0, count);
  }

  /**
   * Set a user preference
   */
  public setUserPreference(key: string, value: any): void {
    this.userPreferences.set(key, value);
  }

  /**
   * Get a user preference
   */
  public getUserPreference(key: string): any {
    return this.userPreferences.get(key);
  }

  /**
   * Get a specific entity value if known
   */
  public getEntity(key: string): string | undefined {
    return this.entities.get(key);
  }

  /**
   * Get all known entities
   */
  public getAllEntities(): Map<string, string> {
    return new Map(this.entities);
  }

  /**
   * Get all topics discussed
   */
  public getTopics(): string[] {
    return Array.from(this.topics);
  }

  /**
   * Check if the conversation has discussed a specific topic
   */
  public hasTopic(topic: string): boolean {
    return this.topics.has(topic);
  }

  /**
   * Clear all memory
   */
  public clearMemory(): void {
    this.shortTermMemory = [];
    this.topics.clear();
    this.entities.clear();
  }

  /**
   * Generate a context-aware greeting based on memory
   */
  public generateContextualGreeting(): string {
    const userName = this.entities.get('userName');
    const userLocation = this.entities.get('userLocation');
    const greetings = [
      "Hi, I'm Max! How can I help you today?",
      "Hey there! Max at your service. What can I do for you?",
      "Hello! I'm Max, your personal assistant. How may I assist you?",
      "Max here, ready to help! What do you need?",
      "Good day! Max at your service. How can I be of assistance?"
    ];
    
    if (userName) {
      return `Hello ${userName}! How can I help you today?`;
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

// Export a singleton instance
const conversationMemory = new ConversationMemory();
export default conversationMemory;
