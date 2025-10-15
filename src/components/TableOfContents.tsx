"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TocHeading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const normalizedHeadings = useMemo(() => {
    return headings.filter((heading) => heading.id && heading.text);
  }, [headings]);

  useEffect(() => {
    if (!normalizedHeadings.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
          return;
        }

        const nearest = [...entries]
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
        if (nearest?.target?.id) {
          setActiveId(nearest.target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    normalizedHeadings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [normalizedHeadings]);

  if (!normalizedHeadings.length) {
    return null;
  }

  return (
    <nav className="hidden lg:block">
      <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          On this page
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          {normalizedHeadings.map((heading) => {
            const isActive = heading.id === activeId;
            const indent = heading.level === 3 ? "pl-6" : "pl-2";
            return (
              <li key={heading.id} className={`${indent}`}>
                <Link
                  href={`#${heading.id}`}
                  className={`group flex items-start gap-2 rounded-md py-1 transition-colors ${isActive ? "text-blue-600" : "hover:text-blue-600"}`}
                >
                  <span
                    className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isActive ? "bg-blue-600" : "bg-slate-300 group-hover:bg-blue-300"}`}
                  />
                  <span className="flex-1 leading-snug">{heading.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
