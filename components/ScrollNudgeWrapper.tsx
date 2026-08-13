import React from 'react';
import { useHorizontalScrollNudge } from '../services/useHorizontalScrollNudge';

interface ScrollNudgeWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerDelay?: number;
}

export const ScrollNudgeWrapper: React.FC<ScrollNudgeWrapperProps> = ({
  children,
  className = '',
  staggerDelay = 0,
  ...props
}) => {
  const { ref, animationClass } = useHorizontalScrollNudge(staggerDelay);

  return (
    <div
      ref={ref}
      className={`${className} ${animationClass}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};
