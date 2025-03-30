
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeJSBubbleProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

const ThreeJSBubble: React.FC<ThreeJSBubbleProps> = ({ 
  isListening, 
  isSpeaking, 
  isProcessing, 
  onClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bubbleRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number>(0);

  // Set up Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true  // Transparent background
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create main bubble
    const bubbleGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    
    // Create shimmering material
    const bubbleMaterial = new THREE.MeshPhongMaterial({
      color: 0x6A00FF, // Purple base color
      emissive: 0x3A0088,
      specular: 0x00FFFF, // Teal specular
      shininess: 40,
      transparent: true,
      opacity: 0.8,
    });
    
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    scene.add(bubble);
    bubbleRef.current = bubble;

    // Add an inner bubble for a layered effect
    const innerBubbleGeometry = new THREE.SphereGeometry(1.2, 48, 48);
    const innerBubbleMaterial = new THREE.MeshPhongMaterial({
      color: 0x00FFFF, // Teal
      emissive: 0x005555,
      transparent: true,
      opacity: 0.4,
    });
    const innerBubble = new THREE.Mesh(innerBubbleGeometry, innerBubbleMaterial);
    bubble.add(innerBubble);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x222244, 1);
    scene.add(ambientLight);

    // Add directional light for shimmering effect
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Add point light inside the bubble for glow
    const pointLight = new THREE.PointLight(0x00FFFF, 1, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Create particles around the bubble
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    
    const positionArray = new Float32Array(particleCount * 3);
    const sizeArray = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Position particles in a sphere around the main bubble
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.random() * 1.5;
      
      positionArray[i * 3] = Math.sin(angle1) * Math.cos(angle2) * radius;
      positionArray[i * 3 + 1] = Math.sin(angle1) * Math.sin(angle2) * radius;
      positionArray[i * 3 + 2] = Math.cos(angle1) * radius;
      
      // Random sizes for particles
      sizeArray[i] = Math.random() * 0.1 + 0.02;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x00FFFF,
      size: 0.1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation function
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (bubbleRef.current) {
        // Rotate bubble slowly
        bubbleRef.current.rotation.y += 0.005;
        bubbleRef.current.rotation.x += 0.002;
        
        // Subtle pulsing effect
        const pulseFactor = 1 + Math.sin(Date.now() * 0.001) * 0.05;
        bubbleRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
      }

      if (particlesRef.current) {
        // Rotate particles in opposite direction
        particlesRef.current.rotation.y -= 0.002;
        
        // Update particle positions for floating effect
        const positions = particlesRef.current.geometry.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
          const i3 = i * 3;
          positions.array[i3 + 1] += Math.sin(Date.now() * 0.001 + i * 0.1) * 0.002;
        }
        positions.needsUpdate = true;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  // Update effects based on state
  useEffect(() => {
    if (!bubbleRef.current || !particlesRef.current) return;

    // Update bubble appearance based on state
    if (isListening) {
      // Bright teal when listening
      (bubbleRef.current.material as THREE.MeshPhongMaterial).color.set(0x00FFFF);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).emissive.set(0x007777);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).opacity = 0.9;
      
      // More energetic particles
      (particlesRef.current.material as THREE.PointsMaterial).color.set(0x00FFFF);
      (particlesRef.current.material as THREE.PointsMaterial).size = 0.15;
    } else if (isSpeaking) {
      // Light purple when speaking
      (bubbleRef.current.material as THREE.MeshPhongMaterial).color.set(0x9370DB);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).emissive.set(0x4B0082);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).opacity = 0.85;
      
      // Moderate particles
      (particlesRef.current.material as THREE.PointsMaterial).color.set(0x9370DB);
      (particlesRef.current.material as THREE.PointsMaterial).size = 0.12;
    } else if (isProcessing) {
      // Blue when processing
      (bubbleRef.current.material as THREE.MeshPhongMaterial).color.set(0x1E90FF);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).emissive.set(0x0000FF);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).opacity = 0.7;
      
      // Steady particles
      (particlesRef.current.material as THREE.PointsMaterial).color.set(0x1E90FF);
      (particlesRef.current.material as THREE.PointsMaterial).size = 0.1;
    } else {
      // Default deep purple
      (bubbleRef.current.material as THREE.MeshPhongMaterial).color.set(0x6A00FF);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).emissive.set(0x3A0088);
      (bubbleRef.current.material as THREE.MeshPhongMaterial).opacity = 0.8;
      
      // Calm particles
      (particlesRef.current.material as THREE.PointsMaterial).color.set(0x00FFFF);
      (particlesRef.current.material as THREE.PointsMaterial).size = 0.1;
    }
  }, [isListening, isSpeaking, isProcessing]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full cursor-pointer"
      onClick={onClick}
      aria-label="MAX AI Assistant - Click to activate voice interface"
    />
  );
};

export default ThreeJSBubble;
