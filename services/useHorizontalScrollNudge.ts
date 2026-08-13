import { useEffect, useRef, useState } from 'react';

/**
 * Hook to apply a subtle idle scroll spring nudge animation to scrollable components.
 * Halts animation during interaction and resumes after a specified rest period.
 * Automatically halts when off-screen or when prefers-reduced-motion is active.
 * 
 * @param staggerDelay Milliseconds to delay initial start cycle to prevent uniform row bouncing.
 */
export const useHorizontalScrollNudge = (staggerDelay = 0) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [isInteracting, setIsInteracting] = useState(false);
  
  const idleTimeoutRef = useRef<any>(null);
  const scrollTimeoutRef = useRef<any>(null);
  const isVisibleRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resetIdleTimer = () => {
    if (prefersReducedMotion) return;
    
    // Clear existing idle timer
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    // If user is currently touching or scrolling, don't start the idle nudge timer yet
    if (isInteracting || !isVisibleRef.current) {
      setAnimationClass('');
      return;
    }

    // Set new idle timer of 3.5 seconds
    idleTimeoutRef.current = setTimeout(() => {
      if (isInteracting || !isVisibleRef.current) return;
      
      // Trigger animation
      setAnimationClass('animate-scroll-nudge');
      
      // Clear class after animation completes (600ms)
      setTimeout(() => {
        setAnimationClass('');
        // Recursively trigger next loop cycle
        resetIdleTimer();
      }, 700);
      
    }, 3500 + staggerDelay);
  };

  // Listen to interaction state change
  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [isInteracting]);

  // Set up intersection observer and event listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion) return;

    // 1. Intersection Observer (Only animate when visible)
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry.isIntersecting;
        resetIdleTimer();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);

    // 2. Interaction Handlers
    const startInteraction = () => {
      setIsInteracting(true);
      setAnimationClass('');
    };

    const endInteraction = () => {
      // Small timeout to allow momentum scrolling to settle
      setTimeout(() => {
        setIsInteracting(false);
      }, 100);
    };

    const handleScroll = () => {
      setIsInteracting(true);
      setAnimationClass('');
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, 200); // 200ms of no scroll events means scrolling stopped
    };

    el.addEventListener('touchstart', startInteraction, { passive: true });
    el.addEventListener('touchend', endInteraction, { passive: true });
    el.addEventListener('mousedown', startInteraction, { passive: true });
    el.addEventListener('mouseup', endInteraction, { passive: true });
    el.addEventListener('scroll', handleScroll, { passive: true });

    // Initial timer start
    resetIdleTimer();

    return () => {
      observer.disconnect();
      el.removeEventListener('touchstart', startInteraction);
      el.removeEventListener('touchend', endInteraction);
      el.removeEventListener('mousedown', startInteraction);
      el.removeEventListener('mouseup', endInteraction);
      el.removeEventListener('scroll', handleScroll);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [prefersReducedMotion]);

  return {
    ref: containerRef,
    animationClass
  };
};
