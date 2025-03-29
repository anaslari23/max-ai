
import { pipeline, env, PipelineType } from '@huggingface/transformers';

// Configure Hugging Face Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 4; // Optimize WASM performance
env.backends.onnx.enableWebGPU = true; // Try to use WebGPU when available

// Enable WebGPU if available for maximum performance
try {
  if (navigator.gpu) {
    console.log("WebGPU is available, will be used for model inference when possible");
  }
} catch (e) {
  console.log("WebGPU not available, falling back to WASM");
}

// Define proper types for model configurations
interface BaseModelConfig {
  task: PipelineType;
  model: string;
  description?: string;
}

interface QuantizedModelConfig extends BaseModelConfig {
  quantized: boolean;
}

type ModelConfig = BaseModelConfig | QuantizedModelConfig;

// Available pre-trained models with proper typing
const MODELS: Record<string, ModelConfig> = {
  textGeneration: {
    task: 'text-generation' as PipelineType,
    model: 'HuggingFaceH4/zephyr-7b-beta',
    quantized: true,
    description: 'General purpose text generation model'
  },
  sentimentAnalysis: {
    task: 'text-classification' as PipelineType,
    model: 'distilbert-base-uncased-finetuned-sst-2-english',
    description: 'Analyze text sentiment (positive/negative)'
  },
  questionAnswering: {
    task: 'question-answering' as PipelineType,
    model: 'distilbert-base-cased-distilled-squad',
    description: 'Answer questions based on context'
  },
  summarization: {
    task: 'summarization' as PipelineType,
    model: 'facebook/bart-large-cnn',
    quantized: true,
    description: 'Summarize longer text passages'
  },
  textEmbeddings: {
    task: 'feature-extraction' as PipelineType,
    model: 'Xenova/all-MiniLM-L6-v2',
    description: 'Generate text embeddings for semantic search'
  }
};

class ModelInference {
  private models: Map<string, any> = new Map();
  private isInitializing: Map<string, boolean> = new Map();
  private initPromises: Map<string, Promise<any>> = new Map();
  private modelStatus: Map<string, 'not_loaded' | 'loading' | 'ready' | 'error'> = new Map();
  private failedAttempts: Map<string, number> = new Map();
  private maxRetries: number = 2;

  constructor() {
    // Initialize models status
    for (const modelType in MODELS) {
      this.modelStatus.set(modelType, 'not_loaded');
      this.failedAttempts.set(modelType, 0);
    }
    
    console.log('ModelInference initialized - ready to load models on demand');
  }

  /**
   * Load a model if it hasn't been loaded yet
   */
  private async loadModel(modelType: string): Promise<any> {
    const modelConfig = MODELS[modelType as keyof typeof MODELS];
    
    if (!modelConfig) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    // If model is already loaded, return it
    if (this.models.has(modelType)) {
      return this.models.get(modelType);
    }

    // If model is currently being initialized, wait for it
    if (this.isInitializing.get(modelType)) {
      return this.initPromises.get(modelType);
    }

    // Set initializing flag and create promise
    this.isInitializing.set(modelType, true);
    this.modelStatus.set(modelType, 'loading');
    
    try {
      console.log(`Loading ${modelType} model: ${modelConfig.model}`);
      
      // Create initialization promise
      const initPromise = (async () => {
        try {
          // Load the model using transformers.js pipeline
          // Use proper typing and check if the model has the quantized property
          const options: Record<string, any> = {};
          
          if ('quantized' in modelConfig) {
            options.quantized = modelConfig.quantized;
          }
          
          // Try to use WebGPU if available
          if (navigator.gpu) {
            try {
              options.device = 'webgpu';
            } catch (e) {
              console.log("WebGPU initialization failed, falling back to default");
            }
          }
          
          const model = await pipeline(
            modelConfig.task,
            modelConfig.model,
            options
          );
          
          this.models.set(modelType, model);
          this.modelStatus.set(modelType, 'ready');
          console.log(`${modelType} model loaded successfully`);
          return model;
        } catch (error) {
          console.error(`Error loading ${modelType} model:`, error);
          
          // Track failed attempts
          const attempts = (this.failedAttempts.get(modelType) || 0) + 1;
          this.failedAttempts.set(modelType, attempts);
          
          // If we haven't exceeded max retries, try again with fallback options
          if (attempts <= this.maxRetries) {
            console.log(`Retrying ${modelType} model load (attempt ${attempts}/${this.maxRetries})`);
            
            // Try again with simplified options (no quantization, no WebGPU)
            const fallbackOptions: Record<string, any> = {};
            
            const fallbackModel = await pipeline(
              modelConfig.task,
              modelConfig.model,
              fallbackOptions
            );
            
            this.models.set(modelType, fallbackModel);
            this.modelStatus.set(modelType, 'ready');
            console.log(`${modelType} model loaded successfully on retry`);
            return fallbackModel;
          }
          
          this.modelStatus.set(modelType, 'error');
          throw error;
        } finally {
          this.isInitializing.set(modelType, false);
        }
      })();
      
      this.initPromises.set(modelType, initPromise);
      return initPromise;
    } catch (error) {
      this.isInitializing.set(modelType, false);
      this.modelStatus.set(modelType, 'error');
      console.error(`Failed to initialize ${modelType} model:`, error);
      throw error;
    }
  }

  /**
   * Generate text using the text generation model
   */
  public async generateText(prompt: string, maxLength: number = 100): Promise<string> {
    try {
      const model = await this.loadModel('textGeneration');
      const result = await model(prompt, {
        max_new_tokens: maxLength,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false,
        do_sample: true // Enable sampling for more creative responses
      });
      
      return result[0]?.generated_text || "I couldn't generate a response at this time.";
    } catch (error) {
      console.error('Error generating text:', error);
      return "I encountered an error while generating text. I'll use my backup response system instead.";
    }
  }

  /**
   * Analyze sentiment of a text
   */
  public async analyzeSentiment(text: string): Promise<{ label: string, score: number }> {
    try {
      const model = await this.loadModel('sentimentAnalysis');
      const result = await model(text);
      return result;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return { label: 'unknown', score: 0.5 };
    }
  }

  /**
   * Answer a question based on provided context
   */
  public async answerQuestion(question: string, context: string): Promise<{ answer: string, score: number }> {
    try {
      const model = await this.loadModel('questionAnswering');
      const result = await model({
        question,
        context
      });
      return result;
    } catch (error) {
      console.error('Error answering question:', error);
      return { answer: "I couldn't find an answer to that question.", score: 0 };
    }
  }
  
  /**
   * Summarize a longer text
   */
  public async summarizeText(text: string, maxLength: number = 100): Promise<string> {
    try {
      const model = await this.loadModel('summarization');
      const result = await model(text, {
        max_length: maxLength,
        min_length: 30,
      });
      
      return result[0]?.summary_text || "I couldn't summarize this text.";
    } catch (error) {
      console.error('Error summarizing text:', error);
      return "I encountered an error while summarizing this text.";
    }
  }
  
  /**
   * Generate text embeddings for semantic search
   */
  public async generateEmbeddings(text: string | string[]): Promise<number[][]> {
    try {
      const model = await this.loadModel('textEmbeddings');
      const result = await model(text, { pooling: 'mean', normalize: true });
      return Array.isArray(text) ? result.tolist() : [result.tolist()];
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Check if a specific model is loaded
   */
  public isModelLoaded(modelType: string): boolean {
    return this.models.has(modelType);
  }

  /**
   * Get the loading status of all models
   */
  public getModelStatus(): Record<string, 'not_loaded' | 'loading' | 'ready' | 'error'> {
    const status: Record<string, 'not_loaded' | 'loading' | 'ready' | 'error'> = {};
    
    for (const modelType in MODELS) {
      status[modelType] = this.modelStatus.get(modelType) || 'not_loaded';
    }
    
    return status;
  }
  
  /**
   * Pre-load a specific model for faster response later
   */
  public preloadModel(modelType: string): Promise<any> {
    if (!MODELS[modelType]) {
      return Promise.reject(new Error(`Unknown model type: ${modelType}`));
    }
    return this.loadModel(modelType);
  }
  
  /**
   * Get list of available models with descriptions
   */
  public getAvailableModels(): Record<string, { description: string, status: string }> {
    const result: Record<string, { description: string, status: string }> = {};
    
    for (const [modelType, config] of Object.entries(MODELS)) {
      result[modelType] = {
        description: config.description || 'No description available',
        status: this.modelStatus.get(modelType) || 'not_loaded'
      };
    }
    
    return result;
  }
}

// Create singleton instance
const modelInference = new ModelInference();
export default modelInference;
