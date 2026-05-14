'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCategoryBySlug } from '@/data/wiki/wiki-categories';
import { WikiCategorySlug } from '@/types/wiki';

interface WikiBreadcrumbProps {
  categorySlug?: WikiCategorySlug;
  categoryTitle?: string;
  articleTitle?: string;
}

export function WikiBreadcrumb({
  categorySlug,
  categoryTitle,
  articleTitle,
}: WikiBreadcrumbProps) {
  const category = categorySlug ? getCategoryBySlug(categorySlug) : null;
  const displayCategoryTitle = categoryTitle || category?.title;

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link href="/wiki" className="text-blue-600 dark:text-blue-400 hover:underline">
        Wiki
      </Link>

      {displayCategoryTitle && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          {articleTitle ? (
            <Link
              href={`/wiki/${categorySlug}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {displayCategoryTitle}
            </Link>
          ) : (
            <span className="text-slate-900 dark:text-white font-medium">
              {displayCategoryTitle}
            </span>
          )}
        </>
      )}

      {articleTitle && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-medium truncate">
            {articleTitle}
          </span>
        </>
      )}
    </nav>
  );
}
