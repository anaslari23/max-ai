
import { pipeline, env, PipelineType } from '@huggingface/transformers';

// Configure Hugging Face Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

// Define proper types for model configurations
interface BaseModelConfig {
  task: PipelineType;
  model: string;
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
    quantized: true
  },
  sentimentAnalysis: {
    task: 'text-classification' as PipelineType,
    model: 'distilbert-base-uncased-finetuned-sst-2-english'
  },
  questionAnswering: {
    task: 'question-answering' as PipelineType,
    model: 'distilbert-base-cased-distilled-squad'
  }
};

class ModelInference {
  private models: Map<string, any> = new Map();
  private isInitializing: Map<string, boolean> = new Map();
  private initPromises: Map<string, Promise<any>> = new Map();

  constructor() {
    // Initialize log message
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
    
    try {
      console.log(`Loading ${modelType} model: ${modelConfig.model}`);
      
      // Create initialization promise
      const initPromise = (async () => {
        try {
          // Load the model using transformers.js pipeline
          // Use proper typing and check if the model has the quantized property
          const options = 'quantized' in modelConfig ? 
            { quantized: modelConfig.quantized } : 
            {};
          
          const model = await pipeline(
            modelConfig.task,
            modelConfig.model,
            options
          );
          
          this.models.set(modelType, model);
          console.log(`${modelType} model loaded successfully`);
          return model;
        } catch (error) {
          console.error(`Error loading ${modelType} model:`, error);
          throw error;
        } finally {
          this.isInitializing.set(modelType, false);
        }
      })();
      
      this.initPromises.set(modelType, initPromise);
      return initPromise;
    } catch (error) {
      this.isInitializing.set(modelType, false);
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
        return_full_text: false
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
   * Check if a specific model is loaded
   */
  public isModelLoaded(modelType: string): boolean {
    return this.models.has(modelType);
  }

  /**
   * Get the loading status of all models
   */
  public getModelStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const modelType in MODELS) {
      status[modelType] = this.models.has(modelType);
    }
    
    return status;
  }
}

// Create singleton instance
const modelInference = new ModelInference();
export default modelInference;
