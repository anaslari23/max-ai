
class SpeechSynthesis {
  private synthesis: Window['speechSynthesis'];
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private isLoaded: boolean = false;
  
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Some browsers require a listener for voiceschanged
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
        this.isLoaded = true;
      };
    }
    
    // Set initial rate and pitch for clearer speech
    this.rate = 0.95; // Slightly slower for better clarity
    this.pitch = 1.0; // Natural pitch
  }
  
  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    console.log("Available voices:", this.voices.length);
    
    // Try to find a good male voice for Max
    this.preferredVoice = this.voices.find(voice => 
      voice.name.includes('Daniel') || 
      voice.name.includes('Google UK English Male') ||
      voice.name.includes('Microsoft David') ||
      voice.name.includes('Alex')
    ) || null;
    
    if (!this.preferredVoice && this.voices.length > 0) {
      // Try to find any good quality voice as a fallback
      const qualityVoices = this.voices.filter(v => 
        v.name.includes('Google') || 
        v.name.includes('Microsoft') ||
        v.name.includes('Alex') ||
        v.name.includes('Samantha')
      );
      
      if (qualityVoices.length > 0) {
        this.preferredVoice = qualityVoices[0];
      } else {
        // Last resort: use first available voice
        this.preferredVoice = this.voices[0];
      }
    }
    
    if (this.preferredVoice) {
      console.log("Selected voice:", this.preferredVoice.name);
      this.isLoaded = true;
    } else {
      console.warn("No preferred voice could be selected");
    }
  }
  
  public speak(text: string, onEnd?: () => void) {
    if (!this.synthesis) {
      console.error('Speech synthesis not supported');
      if (onEnd) onEnd();
      return;
    }
    
    // If this is the first time, try to load voices again if they're not loaded yet
    if (!this.isLoaded) {
      this.loadVoices();
    }
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    // Add pauses at punctuation to make speech more natural
    const processedText = this.addPauses(text);
    
    const utterance = new SpeechSynthesisUtterance(processedText);
    
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = 1.0;
    
    if (onEnd) {
      utterance.onend = onEnd;
      
      // Safety timeout in case onend doesn't fire
      setTimeout(() => {
        if (this.synthesis.speaking) {
          // If still speaking after timeout, force end
          console.log("Forcing speech end due to timeout");
          this.synthesis.cancel();
          onEnd();
        }
      }, Math.max(text.length * 80, 15000)); // Longer timeout for longer text
    }
    
    this.synthesis.speak(utterance);
    
    return {
      cancel: () => this.synthesis.cancel()
    };
  }
  
  // Helper method to add slight pauses at punctuation
  private addPauses(text: string): string {
    // Add commas at logical places for pauses
    return text
      .replace(/\.\s+/g, '. , ') // Add pause after periods
      .replace(/\!\s+/g, '! , ') // Add pause after exclamation marks
      .replace(/\?\s+/g, '? , ') // Add pause after question marks
      .replace(/,\s+/g, ', , '); // Add pause after commas
  }
  
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
  
  public setVoice(voice: SpeechSynthesisVoice) {
    this.preferredVoice = voice;
  }
  
  public setRate(rate: number) {
    if (rate >= 0.5 && rate <= 2.0) {
      this.rate = rate;
    }
  }
  
  public setPitch(pitch: number) {
    if (pitch >= 0.5 && pitch <= 2.0) {
      this.pitch = pitch;
    }
  }
  
  public cancel() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
  
  public isPaused(): boolean {
    return this.synthesis ? this.synthesis.paused : false;
  }
  
  public isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }
}

export default SpeechSynthesis;
