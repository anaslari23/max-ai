// Fix for WebGPU API property not existing in TypeScript definition
interface NavigatorWithGPU extends Navigator {
  gpu?: {
    requestAdapter: () => Promise<any>;
  };
}

class ModelInference {
  private models: Record<string, { 
    model: any, 
    status: 'not_loaded' | 'loading' | 'ready' | 'error',
    lastUsed: Date
  }> = {};

  private webGPUSupported: boolean = false;

  constructor() {
    // Check for WebGPU support
    this.webGPUSupported = typeof (navigator as NavigatorWithGPU).gpu !== 'undefined';
    console.log("WebGPU supported:", this.webGPUSupported);
  }

  public getModelStatus(): Record<string, 'not_loaded' | 'loading' | 'ready' | 'error'> {
    const statuses: Record<string, 'not_loaded' | 'loading' | 'ready' | 'error'> = {};
    for (const modelType in this.models) {
      if (this.models.hasOwnProperty(modelType)) {
        statuses[modelType] = this.models[modelType].status;
      }
    }
    return statuses;
  }

  public getAvailableModels(): Record<string, { status: 'not_loaded' | 'loading' | 'ready' | 'error', lastUsed: Date }> {
    return this.models;
  }

  public async processInferenceRequest(modelType: string, data: any): Promise<any> {
    if (!this.models[modelType] || this.models[modelType].status !== 'ready') {
      console.warn(`Model ${modelType} not loaded or not ready for inference.`);
      return null;
    }
    
    try {
      // Simulate inference processing with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update last used timestamp
      this.models[modelType].lastUsed = new Date();
      
      // Simulate returning a result
      return {
        result: `Inference result from ${modelType} with data: ${JSON.stringify(data)}`
      };
    } catch (error) {
      console.error(`Error processing inference request for model ${modelType}:`, error);
      return null;
    }
  }
  
  public async preloadModel(modelType: 'textGeneration' | 'imageGeneration' | 'speechRecognition'): Promise<boolean> {
    console.log(`Preloading model: ${modelType}`);
    
    // Mark model as loading
    if (!this.models[modelType]) {
      this.models[modelType] = {
        model: null,
        status: 'loading',
        lastUsed: new Date()
      };
    } else {
      this.models[modelType].status = 'loading';
    }
    
    try {
      // Simulate model loading with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if WebGPU is available for accelerated inference
      const useGPU = this.webGPUSupported;
      
      console.log(`Model ${modelType} loaded successfully. Using GPU: ${useGPU}`);
      
      this.models[modelType] = {
        model: {}, // This would be the actual model in a real implementation
        status: 'ready',
        lastUsed: new Date()
      };
      
      return true;
    } catch (error) {
      console.error(`Error loading model ${modelType}:`, error);
      this.models[modelType].status = 'error';
      return false;
    }
  }

  public supportsWebGPU(): boolean {
    return this.webGPUSupported;
  }

  private async checkWebGPUSupport(): Promise<boolean> {
    if (typeof (navigator as NavigatorWithGPU).gpu === 'undefined') {
      return false;
    }
    
    try {
      const adapter = await (navigator as NavigatorWithGPU).gpu?.requestAdapter();
      return adapter !== null;
    } catch (e) {
      console.error('Error checking WebGPU support:', e);
      return false;
    }
  }
  
  public setModelStatus(modelType: string, status: 'not_loaded' | 'loading' | 'ready' | 'error') {
    if (this.models[modelType]) {
      this.models[modelType].status = status;
    }
  }
}

export default new ModelInference();
