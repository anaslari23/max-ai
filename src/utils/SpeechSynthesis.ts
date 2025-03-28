
class SpeechSynthesis {
  private synthesis: Window['speechSynthesis'];
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;
  
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Some browsers require a listener for voiceschanged
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
    }
  }
  
  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    
    // Try to find a good male voice for Max
    this.preferredVoice = this.voices.find(voice => 
      voice.name.includes('Daniel') || 
      voice.name.includes('Google UK English Male') ||
      voice.name.includes('Microsoft David')
    ) || null;
    
    if (!this.preferredVoice && this.voices.length > 0) {
      // Fallback to first available voice
      this.preferredVoice = this.voices[0];
    }
  }
  
  public speak(text: string, onEnd?: () => void) {
    if (!this.synthesis) {
      console.error('Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    if (onEnd) {
      utterance.onend = onEnd;
    }
    
    this.synthesis.speak(utterance);
    
    return {
      cancel: () => this.synthesis.cancel()
    };
  }
  
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
  
  public setVoice(voice: SpeechSynthesisVoice) {
    this.preferredVoice = voice;
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
