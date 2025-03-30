
import { useEffect } from 'react';
import MaxCore from '@/components/MaxCore';

const Index = () => {
  useEffect(() => {
    document.title = 'MAX AI Assistant';
    
    // Preload necessary models on page load
    const preloadModels = async () => {
      try {
        const modelInference = (await import('@/utils/ModelInference')).default;
        modelInference.preloadModel('textGeneration');
      } catch (error) {
        console.error('Error preloading models:', error);
      }
    };
    
    preloadModels();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <MaxCore />
    </div>
  );
};

export default Index;
