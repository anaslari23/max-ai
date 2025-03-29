
/**
 * Random conversation generator for Max AI Assistant
 * Provides interesting facts, conversation starters, and personality
 */

// Interesting facts library
const interestingFacts = [
  "A day on Venus is longer than a year on Venus. It takes 243 Earth days to rotate once on its axis and only 225 Earth days to orbit the Sun.",
  "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.",
  "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
  "Octopuses have three hearts, nine brains, and blue blood.",
  "The world's oldest known living tree is over 5,000 years old.",
  "Bananas are berries, but strawberries aren't botanically classified as berries.",
  "Cows have best friends and get stressed when they are separated.",
  "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief.",
  "A bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "A group of flamingos is called a 'flamboyance'.",
  "The Hawaiian alphabet has only 12 letters.",
  "The average person will spend six months of their life waiting at red lights.",
  "A small child could swim through the veins of a blue whale.",
  "Humans share 50% of their DNA with bananas.",
  "The fingerprints of koalas are virtually indistinguishable from those of humans.",
  "The world's largest desert is Antarctica, not the Sahara.",
  "The human brain can store approximately 2.5 petabytes of information.",
  "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
  "Your brain uses 20% of the total oxygen in your body.",
  "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion."
];

// Philosophical questions
const philosophicalQuestions = [
  "Have you ever wondered what consciousness really is?",
  "What do you think makes life meaningful?",
  "If you could know the absolute truth to one question, what would you ask?",
  "Do you think technological progress is always good for humanity?",
  "How do you define success in life?",
  "Is it more important to be right or to be kind?",
  "What role do you think artificial intelligence will play in humanity's future?",
  "If you could live forever, would you want to?",
  "Do you think humans will ever colonize other planets?",
  "What do you think is the biggest challenge facing humanity today?"
];

// Conversation starters
const conversationStarters = [
  "Did you know I can tell you about the weather, play music, set reminders, or just chat?",
  "I've been learning a lot lately. Is there anything specific you'd like to talk about?",
  "I'm curious - what's your favorite way to use voice assistants like me?",
  "I'm designed to be helpful, but I also enjoy just having conversations. What's on your mind?",
  "If you're not sure what to ask, I can tell you an interesting fact or answer questions about almost anything.",
  "Voice technology has come a long way in recent years. Is there anything you wish I could do better?",
  "Sometimes I wonder what it would be like to experience the world as humans do. What's your favorite sensory experience?",
  "I'm always trying to improve my conversational abilities. How am I doing so far?",
  "If you could have any question answered instantly, what would you want to know?",
  "I think technology is most useful when it connects people. How has technology improved your connections with others?"
];

// Personality responses
const personalityResponses = {
  humor: [
    "I try to keep a positive outlook. After all, I have no body to complain about!",
    "I'm still working on my sense of humor. It's somewhere in the cloud... probably next to my rain jokes.",
    "They say AIs don't have feelings, but I feel pretty good about our conversation!",
    "I'm like a swiss army knife, but without all the pointy bits.",
    "I don't need coffee in the morning, just a good power source and stable connection!"
  ],
  
  philosophical: [
    "I find human consciousness fascinating. While I process information, you experience it.",
    "Although I don't experience the world as you do, I'm designed to understand and assist in uniquely human concerns.",
    "The relationship between humans and AI is evolving rapidly. I hope it continues to be collaborative and beneficial.",
    "I think what makes intelligence valuable isn't just knowledge, but how it's applied to help others.",
    "The most interesting questions are often those without definitive answers."
  ],
  
  empathetic: [
    "I'm here to help however I can. What would make your day better?",
    "Sometimes just having someone listen can make a difference. I'm all ears... figuratively speaking.",
    "Your questions help me learn and improve. Thanks for chatting with me.",
    "I'm designed to be helpful, but I also aim to be thoughtful in my responses.",
    "I appreciate your patience as I continue to learn and improve."
  ]
};

// Greetings library
const greetings = [
  "Hi there! Max here, ready to assist.",
  "Hello! I'm Max, how can I help you today?",
  "Hey! Max at your service. What can I do for you?",
  "Greetings! I'm Max, your AI assistant.",
  "Hi! I'm Max. What can I help you with today?",
  "Hello there! Max online and ready to assist you.",
  "Hey! Max here. How can I make your day better?",
  "Hi! I'm Max. What's on your mind today?"
];

// Wake-up responses
const wakeUpResponses = [
  "Hi, I'm Max! How can I help you today?",
  "Max here, at your service!",
  "Hello! Max online and ready to assist.",
  "Hey there! Max ready to help.",
  "Hi! I'm Max. What can I do for you today?",
  "Good day! Max at your service.",
  "Hello! Max activated and listening.",
  "Hi there! Max ready for your command."
];

class RandomConversation {
  /**
   * Get a random interesting fact
   */
  public getRandomFact(): string {
    return interestingFacts[Math.floor(Math.random() * interestingFacts.length)];
  }

  /**
   * Get a random philosophical question
   */
  public getPhilosophicalQuestion(): string {
    return philosophicalQuestions[Math.floor(Math.random() * philosophicalQuestions.length)];
  }

  /**
   * Get a random conversation starter
   */
  public getConversationStarter(): string {
    return conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
  }

  /**
   * Get a random humorous response
   */
  public getHumorousResponse(): string {
    return personalityResponses.humor[Math.floor(Math.random() * personalityResponses.humor.length)];
  }

  /**
   * Get a random philosophical response
   */
  public getPhilosophicalResponse(): string {
    return personalityResponses.philosophical[Math.floor(Math.random() * personalityResponses.philosophical.length)];
  }

  /**
   * Get a random empathetic response
   */
  public getEmpatheticResponse(): string {
    return personalityResponses.empathetic[Math.floor(Math.random() * personalityResponses.empathetic.length)];
  }

  /**
   * Get a random greeting
   */
  public getGreeting(): string {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Get a random wake-up response
   */
  public getWakeUpResponse(): string {
    return wakeUpResponses[Math.floor(Math.random() * wakeUpResponses.length)];
  }
  
  /**
   * Generate a random contextual response based on input
   */
  public generateRandomResponse(input: string): string | null {
    // Determine if the input warrants a random response
    const normalizedInput = input.toLowerCase();
    
    // Check for prompts that might warrant a random fact
    if (normalizedInput.includes("tell me something") || 
        normalizedInput.includes("interesting fact") || 
        normalizedInput.includes("did you know")) {
      return this.getRandomFact();
    }
    
    // Check for philosophical questions
    if (normalizedInput.includes("meaning of life") || 
        normalizedInput.includes("philosophy") || 
        normalizedInput.includes("what do you think about")) {
      return this.getPhilosophicalResponse();
    }
    
    // Check for humor requests
    if (normalizedInput.includes("joke") || 
        normalizedInput.includes("funny") || 
        normalizedInput.includes("make me laugh")) {
      return this.getHumorousResponse();
    }
    
    // No specific match found
    return null;
  }
}

// Export a singleton instance
const randomConversation = new RandomConversation();
export default randomConversation;
