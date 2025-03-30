
import { useEffect } from 'react';
import MaxCore from '@/components/MaxCore';

const Index = () => {
  useEffect(() => {
    document.title = 'MAX AI Assistant';
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <MaxCore />
    </div>
  );
};

export default Index;
