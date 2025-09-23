/**
 * Max Jarvis API - Frontend utility for communicating with enhanced backend
 * Provides all Jarvis capabilities through a clean TypeScript interface
 */

interface ChatResponse {
  response: string;
  intent: {
    intent: string;
    confidence: number;
  };
  entities: Record<string, string[]>;
  confidence: number;
  suggestions: string[];
  requires_action: boolean;
  emotion: {
    dominant_emotion: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  timestamp: string;
}

interface SystemInfo {
  system: {
    platform: string;
    system: string;
    release: string;
  };
  hardware: {
    cpu_count: number;
    memory_total: number;
  };
  status: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
    battery?: {
      percent: number;
      power_plugged: boolean;
    };
  };
}

interface VisionAnalysis {
  faces_detected: number;
  objects_detected: string[];
  scene_description: string;
  confidence: number;
  emotions?: string[];
}

interface TrainingProgress {
  model_type: string;
  progress: number;
  status: 'training' | 'completed' | 'error';
  metrics?: {
    accuracy: number;
    loss: number;
  };
}

class MaxJarvisAPI {
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('max_backend_url') : null;
    // Try LAN default if running in a browser context, otherwise fallback to localhost
    const defaultGuess = typeof window !== 'undefined' && window.location
      ? `${window.location.protocol}//${window.location.hostname}:5001`
      : 'http://localhost:5001';
    this.baseUrl = baseUrl || stored || defaultGuess;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
    try { if (typeof window !== 'undefined') window.localStorage.setItem('max_backend_url', url); } catch {}
  }

  // ===== Predictive Suggestions =====
  async getProposals(): Promise<{ proposals: Array<{ id: string; title: string; description: string; action: any; created_at: string }> } | { error: string }>{
    const res = await fetch(`${this.baseUrl}/api/predict/proposals`);
    return res.json();
  }

  async ackProposal(params: { id: string; decision: 'accept' | 'skip'; action?: any }): Promise<{ status: string; executed: boolean } | { error: string }>{
    const res = await fetch(`${this.baseUrl}/api/predict/ack`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
    });
    return res.json();
  }

  /**
   * Get aggregated learning/feedback status
   */
  async getLearningStatus(): Promise<{
    total_count: number;
    avg_score: number;
    last_24h: { count: number; avg_score: number };
    by_model: Array<{ model_type: string; count: number; avg_score: number }>;
    error?: string;
  }>{
    const res = await fetch(`${this.baseUrl}/api/learning/status`);
    return res.json();
  }

  // ===== Files (sandboxed in data/user_files) =====
  async filesList(pathRel: string = '.'): Promise<{ path: string; items: Array<{ name: string; is_dir: boolean; size: number }> } | { error: string }>{
    const url = `${this.baseUrl}/api/files/list?path=${encodeURIComponent(pathRel)}`;
    const res = await fetch(url);
    return res.json();
  }

  async filesCreate(params: { path: string; content: string; overwrite?: boolean }): Promise<{ status: string; path: string } | { error: string }>{
    const res = await fetch(`${this.baseUrl}/api/files/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
    });
    return res.json();
  }

  async filesMove(params: { src: string; dest: string; overwrite?: boolean }): Promise<{ status: string; src: string; dest: string } | { error: string }>{
    const res = await fetch(`${this.baseUrl}/api/files/move`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
    });
    return res.json();
  }

  async filesDelete(params: { path: string }): Promise<{ status: string } | { error: string }>{
    const res = await fetch(`${this.baseUrl}/api/files/delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
    });
    return res.json();
  }

  async filesSearch(params: { query: string; path?: string }): Promise<{ query: string; matches: string[] } | { error: string }>{
    const res = await fetch(`${this.baseUrl}/api/files/search`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
    });
    return res.json();
  }

  /**
   * Send an email via backend Gmail integration
   */
  async sendEmail(params: { to: string; subject: string; body: string; html?: string }): Promise<{ status: string } | { error: string }>{
    try {
      const response = await fetch(`${this.baseUrl}/api/integrations/gmail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event and return ICS content
   */
  async createCalendarEvent(params: { title: string; start_iso: string; end_iso: string; description?: string; location?: string }): Promise<{ ics: string } | { error: string }>{
    try {
      const response = await fetch(`${this.baseUrl}/api/integrations/calendar/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Send a chat message to Max AI with enhanced Jarvis NLP
   */
  async sendMessage(message: string, userId: string = 'default', context: string = ''): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId,
          context
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message to Max AI:', error);
      throw error;
    }
  }

  /**
   * Enroll a user's face with an image
   */
  async enrollFace(imageFile: File, userId: string = 'default'): Promise<{ status: string; user_id: string; faces_added: number } | { error: string }>{
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('user_id', userId);

      const response = await fetch(`${this.baseUrl}/api/face/enroll`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error enrolling face:', error);
      throw error;
    }
  }

  /**
   * Verify a user's face with an image
   */
  async verifyFace(imageFile: File, userId: string = 'default'): Promise<{ user_id: string; verified: boolean; distance: number; threshold: number } | { error: string }>{
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('user_id', userId);

      const response = await fetch(`${this.baseUrl}/api/face/verify`, {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error) {
      console.error('Error verifying face:', error);
      throw error;
    }
  }

  /**
   * Handle voice wake word detection
   */
  async handleWakeWord(confidence: number): Promise<{ status: string; response: string; should_speak: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/voice/wake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confidence })
      });

      return await response.json();
    } catch (error) {
      console.error('Error handling wake word:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive system information
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/api/system/info`);
      return await response.json();
    } catch (error) {
      console.error('Error getting system info:', error);
      throw error;
    }
  }

  /**
   * Open an application using system automation
   */
  async openApplication(appName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/system/apps/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ app_name: appName })
      });

      return await response.json();
    } catch (error) {
      console.error('Error opening application:', error);
      throw error;
    }
  }

  /**
   * Get list of running applications
   */
  async getRunningApplications(): Promise<{ apps: Array<{ pid: number; name: string; cpu_percent: number; memory_percent: number }> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/system/apps/running`);
      return await response.json();
    } catch (error) {
      console.error('Error getting running applications:', error);
      throw error;
    }
  }

  /**
   * Analyze image using computer vision
   */
  async analyzeImage(imageFile: File): Promise<VisionAnalysis> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${this.baseUrl}/api/vision/analyze`, {
        method: 'POST',
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Provide feedback for continuous learning
   */
  async provideFeedback(
    inputText: string,
    expectedOutput: string,
    actualOutput: string,
    feedbackScore: number,
    modelType: string = 'general'
  ): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/learning/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: inputText,
          expected_output: expectedOutput,
          actual_output: actualOutput,
          feedback_score: feedbackScore,
          model_type: modelType
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error providing feedback:', error);
      throw error;
    }
  }

  /**
   * Schedule automated tasks
   */
  async scheduleTask(
    taskName: string,
    scheduleType: 'daily' | 'hourly' | 'interval' | 'specific_time',
    scheduleTime?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/schedule/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_name: taskName,
          schedule_type: scheduleType,
          schedule_time: scheduleTime || '09:00'
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error scheduling task:', error);
      throw error;
    }
  }

  /**
   * Get or set user preferences
   */
  async getUserPreferences(userId: string = 'default'): Promise<{ preferences: Record<string, string> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/preferences?user_id=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  async setUserPreferences(preferences: Record<string, string>, userId: string = 'default'): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          preferences
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error setting user preferences:', error);
      throw error;
    }
  }

  /**
   * Trigger model training
   */
  async trainModels(modelTypes: string[] = ['nlp', 'vision', 'automation']): Promise<{ status: string; models: string[]; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/train/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_types: modelTypes })
      });

      return await response.json();
    } catch (error) {
      console.error('Error training models:', error);
      throw error;
    }
  }

  /**
   * Web search via backend (Wikipedia prioritized)
   */
  async webSearch(query: string, maxResults: number = 5): Promise<{ query: string; results: Array<{ source: string; title: string; url: string; snippet: string }> }>{
    try {
      const response = await fetch(`${this.baseUrl}/api/web/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, max_results: maxResults })
      });
      return await response.json();
    } catch (error) {
      console.error('Error performing web search:', error);
      throw error;
    }
  }

  /**
   * Summarize provided text or Wikipedia URL
   */
  async webSummarize(params: { text?: string; url?: string; max_sentences?: number }): Promise<{ summary: string; sentences: string[] } | { error: string }>{
    try {
      const response = await fetch(`${this.baseUrl}/api/web/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await response.json();
    } catch (error) {
      console.error('Error summarizing content:', error);
      throw error;
    }
  }

  /**
   * Run a multi-step workflow on the backend
   */
  async runWorkflow(steps: Array<{ type: string; data?: any }>): Promise<{ logs: string[]; results: any[] } | { error: string }>{
    try {
      const response = await fetch(`${this.baseUrl}/api/workflow/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      return await response.json();
    } catch (error) {
      console.error('Error running workflow:', error);
      throw error;
    }
  }

  /**
   * Check API status and available capabilities
   */
  async getStatus(): Promise<{
    status: string;
    timestamp: string;
    components: Record<string, boolean>;
    capabilities: string[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`);
      return await response.json();
    } catch (error) {
      console.error('Error getting API status:', error);
      throw error;
    }
  }

  /**
   * Enhanced conversation with context awareness
   */
  async enhancedConversation(
    message: string,
    conversationHistory: Array<{ type: string; content: string }>,
    userPreferences: Record<string, string> = {}
  ): Promise<ChatResponse> {
    try {
      // Create context from conversation history
      const context = conversationHistory
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.type}: ${msg.content}`)
        .join('\\n');

      // Send with enhanced context
      return await this.sendMessage(message, 'default', context);
    } catch (error) {
      console.error('Error in enhanced conversation:', error);
      throw error;
    }
  }

  /**
   * Batch operations for system automation
   */
  async executeSystemCommands(commands: Array<{ type: string; data: any }>): Promise<Array<{ success: boolean; result: any }>> {
    const results = [];
    
    for (const command of commands) {
      try {
        let result;
        
        switch (command.type) {
          case 'open_app':
            result = await this.openApplication(command.data.appName);
            break;
          case 'schedule_task':
            result = await this.scheduleTask(command.data.name, command.data.type, command.data.time);
            break;
          case 'analyze_image':
            result = await this.analyzeImage(command.data.imageFile);
            break;
          default:
            result = { success: false, error: 'Unknown command type' };
        }
        
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, result: { error: error.message } });
      }
    }
    
    return results;
  }
}

export { MaxJarvisAPI };
export type { ChatResponse, SystemInfo, VisionAnalysis, TrainingProgress };
