import React, { useState, useEffect, useRef } from 'react';
import { Loader } from 'lucide-react';

export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = '',
  onLoad,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gray-800 flex items-center justify-center ${placeholderClassName}`}>
          <Loader className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      )}
      
      {/* Actual Image - only load when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleLoad}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
