'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { wikiCategories } from '@/data/wiki/wiki-categories';
import { Menu, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { WikiCategorySlug } from '@/types/wiki';

interface WikiLayoutProps {
  children: React.ReactNode;
  activeCategory?: WikiCategorySlug;
}

export function WikiLayout({ children, activeCategory }: WikiLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex gap-6 lg:gap-8 min-h-screen">
      {/* Sidebar */}
      <div>
        {/* Mobile Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-40 p-3 rounded-full bg-blue-600 dark:bg-blue-700 text-white shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Sidebar Content */}
        <aside
          className={`${
            sidebarOpen ? 'flex' : 'hidden lg:flex'
          } fixed lg:relative inset-0 lg:inset-auto z-30 lg:z-0 flex-col w-full lg:w-64 pt-6 pb-6 px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-r border-white/20 dark:border-slate-700/30 lg:rounded-lg lg:bg-white/40 dark:lg:bg-slate-900/40 lg:border-white/60 dark:lg:border-slate-700/50`}
        >
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <Link href="/wiki" className="font-bold text-xl text-slate-900 dark:text-white">
              📚 Wiki
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {wikiCategories.map((category) => {
              const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{
                className?: string;
              }>;

              return (
                <Link
                  key={category.slug}
                  href={`/wiki/${category.slug}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    activeCategory === category.slug
                      ? 'bg-blue-500/20 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{category.title}</p>
                    <p className="text-xs opacity-75">{category.articleCount} artículos</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-white/20 dark:border-slate-700/30">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              💡 Presiona{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs">
                Ctrl K
              </kbd>{' '}
              para buscar
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-0 lg:pr-6 max-w-4xl">
        {children}
      </div>
    </div>
  );
}
