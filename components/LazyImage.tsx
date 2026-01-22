import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './UIComponents';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  width?: string | number;
  height?: string | number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  width,
  height,
  loading = 'lazy',
  onLoad,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (entry.intersectionRatio > 0) {
            setIsLoaded(true);
          }
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-space-900/50' : 'bg-paper-200'}`}>
          {placeholder || <div className={`w-full h-full ${isDark ? 'animate-pulse bg-space-800/30' : 'animate-pulse bg-paper-100/50'}`} />}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default LazyImage;
