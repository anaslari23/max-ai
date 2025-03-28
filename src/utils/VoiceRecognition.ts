class VoiceRecognition {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private wakeWords: string[] = ['hey max', 'wake up max', 'good morning max', 'hi max', 'hello max', 'max'];
  private onWakeCallback: (() => void) | null = null;
  private onResultCallback: ((text: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private lastTranscript: string = '';
  private listenTimeout: NodeJS.Timeout | null = null;
  private confidenceThreshold: number = 0.5; // Minimum confidence threshold
  private consecutiveLowConfidence: number = 0;
  private maxConsecutiveLowConfidence: number = 3;
  
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
    this.recognition.maxAlternatives = 5; // Increased from 3 to 5 to get more alternatives
    
    this.recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      let confidence = 0;
      let bestTranscript = '';
      let bestConfidence = 0;
      
      // First, find the best result with highest confidence
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        isFinal = result.isFinal;
        
        // Check all alternatives for each result
        for (let j = 0; j < result.length; j++) {
          const alternative = result[j];
          if (alternative.confidence > bestConfidence) {
            bestConfidence = alternative.confidence;
            bestTranscript = alternative.transcript.toLowerCase().trim();
          }
        }
      }
      
      transcript = bestTranscript;
      confidence = bestConfidence;
      
      console.log("Raw transcript:", transcript, "Confidence:", confidence);
      
      // Handle confidence thresholds with forgiveness mechanism
      if (confidence >= this.confidenceThreshold) {
        this.consecutiveLowConfidence = 0; // Reset counter when we get good confidence
        
        if (transcript !== this.lastTranscript) {
          this.lastTranscript = transcript;
          
          // Check for wake words
          if (this.checkForWakeWords(transcript)) {
            console.log("Wake word detected with confidence:", confidence);
            if (this.onWakeCallback) {
              this.onWakeCallback();
              
              // Reset the timeout if we detect a wake word
              if (this.listenTimeout) {
                clearTimeout(this.listenTimeout);
                this.listenTimeout = null;
              }
            }
          }
          
          // Pass the full transcript to callback if provided
          if (this.onResultCallback) {
            this.onResultCallback(transcript);
          }
        }
      } else {
        // Still consider low confidence results if they contain wake words
        if (this.checkForWakeWords(transcript)) {
          console.log("Wake word detected with LOW confidence:", confidence, "- still processing");
          if (this.onWakeCallback) {
            this.onWakeCallback();
          }
        } else {
          this.consecutiveLowConfidence++;
          console.log("Low confidence transcript ignored:", transcript, "Confidence:", confidence, 
                      "Count:", this.consecutiveLowConfidence);
          
          // If we've had several consecutive low confidence results, try to use the best one anyway
          if (this.consecutiveLowConfidence >= this.maxConsecutiveLowConfidence && transcript.length > 5) {
            console.log("Using low confidence transcript after multiple attempts:", transcript);
            this.consecutiveLowConfidence = 0;
            
            if (this.onResultCallback) {
              this.onResultCallback(transcript);
            }
          }
        }
      }
      
      // If this is a final result and we're actively listening, extend the timeout
      if (isFinal && this.isListening && this.listenTimeout) {
        clearTimeout(this.listenTimeout);
        this.setListenTimeout(10000); // Increased timeout after each final result
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
      // Only set isListening to false for fatal errors
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isListening = false;
      }
    };
  }
  
  private checkForWakeWords(transcript: string): boolean {
    return this.wakeWords.some(wake => transcript.includes(wake));
  }
  
  private setListenTimeout(duration: number) {
    if (this.listenTimeout) {
      clearTimeout(this.listenTimeout);
    }
    
    this.listenTimeout = setTimeout(() => {
      console.log("Listen timeout reached, stopping listening");
      this.stopListening();
    }, duration);
  }
  
  private stopListening() {
    console.log("Stopping listening internally");
    this.isListening = false;
    if (this.recognition) {
      this.recognition.onresult = null;
      try {
        this.recognition.stop();
      } catch (e) {
        console.log("Error stopping recognition:", e);
      }
    }
    
    if (this.listenTimeout) {
      clearTimeout(this.listenTimeout);
      this.listenTimeout = null;
    }
    
    if (this.onEndCallback) {
      this.onEndCallback();
    }
  }
  
  public start() {
    if (!this.recognition) {
      console.error('Speech recognition not initialized.');
      return;
    }
    
    this.isListening = true;
    this.lastTranscript = '';
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
    if (this.listenTimeout) {
      clearTimeout(this.listenTimeout);
      this.listenTimeout = null;
    }
    try {
      this.recognition.stop();
    } catch (e) {
      console.log("Error stopping recognition:", e);
    }
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
  
  public setConfidenceThreshold(threshold: number) {
    if (threshold >= 0 && threshold <= 1) {
      this.confidenceThreshold = threshold;
    }
  }
  
  public setMaxConsecutiveLowConfidence(max: number) {
    if (max > 0) {
      this.maxConsecutiveLowConfidence = max;
    }
  }
}

export default VoiceRecognition;
