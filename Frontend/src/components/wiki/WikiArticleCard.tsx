'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { WikiSearchItem } from '@/types/wiki';

interface WikiArticleCardProps {
  article: WikiSearchItem;
  readingTimeMin?: number;
  tags?: string[];
}

export function WikiArticleCard({
  article,
  readingTimeMin = 5,
  tags = article.tags,
}: WikiArticleCardProps) {
  return (
    <Link href={article.href}>
      <div className="group p-6 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all hover:shadow-lg cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {article.title}
            </h3>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {article.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{readingTimeMin} min</span>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 2 && <span>+{tags.length - 2}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
