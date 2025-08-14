'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface ThinkingStep {
  title: string;
  content: string;
}

interface ThinkingProps {
  steps: ThinkingStep[];
  isVisible?: boolean;
}

export function Thinking({ steps, isVisible = true }: ThinkingProps) {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setVisibleSteps((prev) => {
        if (prev < steps.length) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 300);

    return () => clearInterval(timer);
  }, [steps.length, isVisible]);

  if (!isVisible || steps.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader 
        className="pb-2 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <div className="thinking-dots">
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
          </div>
          Thinking...
          <span className="ml-auto text-xs">
            {isExpanded ? '▼' : '▶'}
          </span>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {steps.slice(0, visibleSteps).map((step, index) => (
            <div 
              key={index} 
              className="thinking-step"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    {step.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {visibleSteps < steps.length && (
            <div className="flex justify-center py-2">
              <div className="thinking-pulse w-4 h-4 bg-blue-400 rounded-full"></div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}