
class VoiceRecognition {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private wakeWords: string[] = ['hey max', 'wake up max', 'good morning max', 'hi max', 'hello max', 'max'];
  private onWakeCallback: (() => void) | null = null;
  private onResultCallback: ((text: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private lastTranscript: string = '';
  
  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // @ts-ignore - Type definition issue with SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      let transcript = '';
      
      // Get the most recent result
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      transcript = transcript.toLowerCase().trim();
      console.log("Raw transcript:", transcript);
      
      if (transcript !== this.lastTranscript) {
        this.lastTranscript = transcript;
        
        // Check for wake words
        if (this.checkForWakeWords(transcript)) {
          console.log("Wake word detected");
          if (this.onWakeCallback) {
            this.onWakeCallback();
          }
        }
        
        // Pass the full transcript to callback if provided
        if (this.onResultCallback) {
          this.onResultCallback(transcript);
        }
      }
    };
    
    this.recognition.onend = () => {
      console.log("Recognition session ended");
      if (this.isListening) {
        console.log("Restarting recognition because isListening is true");
        this.recognition?.start();
      }
      
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };
  }
  
  private checkForWakeWords(transcript: string): boolean {
    return this.wakeWords.some(wake => transcript.includes(wake));
  }
  
  public start() {
    if (!this.recognition) {
      console.error('Speech recognition not initialized.');
      return;
    }
    
    this.isListening = true;
    try {
      this.recognition.start();
      console.log('Voice recognition started, listening for wake words...');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }
  
  public stop() {
    if (!this.recognition) return;
    
    this.isListening = false;
    this.recognition.stop();
    console.log('Voice recognition stopped.');
  }
  
  public onWake(callback: () => void) {
    this.onWakeCallback = callback;
  }
  
  public onResult(callback: (text: string) => void) {
    this.onResultCallback = callback;
  }
  
  public onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }
  
  public isActive(): boolean {
    return this.isListening;
  }
}

export default VoiceRecognition;
