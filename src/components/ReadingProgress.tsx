"use client";

import { useEffect, useState } from "react";

interface ReadingProgressProps {
  targetId: string;
}

export default function ReadingProgress({ targetId }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) {
      setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const { top, height } = target.getBoundingClientRect();
      const distance = height - viewportHeight;
      if (distance <= 0) {
        setProgress(100);
        return;
      }
      const offset = Math.min(Math.max(-top, 0), distance);
      const percentage = Math.round((offset / distance) * 100);
      setProgress(Number.isFinite(percentage) ? percentage : 0);
    };

    calculateProgress();

    window.addEventListener("scroll", calculateProgress, { passive: true });
    window.addEventListener("resize", calculateProgress);

    return () => {
      window.removeEventListener("scroll", calculateProgress);
      window.removeEventListener("resize", calculateProgress);
    };
  }, [targetId]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-1 bg-slate-200/70">
      <div
        className="h-full origin-left bg-blue-600 transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
