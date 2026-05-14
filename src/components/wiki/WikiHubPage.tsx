'use client';

import React from 'react';
import Link from 'next/link';
import { wikiCategories } from '@/data/wiki/wiki-categories';
import { wikiSearchIndex } from '@/data/wiki/search-index';
import * as Icons from 'lucide-react';
import { Search } from 'lucide-react';

export function WikiHubPage() {
  const featuredArticles = wikiSearchIndex.slice(0, 6);

  return (
    <div className="min-h-screen py-8 sm:py-12 lg:py-16">
      {/* Hero Section */}
      <section className="mb-12 sm:mb-16 lg:mb-20">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4">
            Centro de Ayuda Cuadra
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Aprende a usar todas las funciones de Cuadra para maximizar el potencial de tu negocio
          </p>
        </div>

        {/* Search Hint */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
              window.dispatchEvent(event);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all text-slate-700 dark:text-slate-300"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Buscar artículos...</span>
            <kbd className="ml-2 px-2 py-1 text-xs rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 font-mono">
              Ctrl K
            </kbd>
          </button>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mb-16 sm:mb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Categorías
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {wikiCategories.map((category) => {
            const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>;

            return (
              <Link key={category.slug} href={`/wiki/${category.slug}`}>
                <div
                  className={`group h-full p-6 rounded-lg bg-gradient-to-br ${category.accentColor} bg-opacity-10 dark:bg-opacity-5 border border-white/20 dark:border-slate-700/30 hover:border-white/40 dark:hover:border-slate-700/50 hover:bg-opacity-20 dark:hover:bg-opacity-10 transition-all cursor-pointer`}
                >
                  <div className="flex items-start gap-4 mb-3">
                    <IconComponent className="w-8 h-8 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {category.description}
                  </p>
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-white/30 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300 group-hover:bg-white/50 dark:group-hover:bg-slate-700/50 transition-colors">
                    {category.articleCount} artículos
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Articles */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Artículos Destacados
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {featuredArticles.map((article) => (
            <Link key={article.id} href={article.href}>
              <div className="group h-full p-6 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                <span className="inline-block mb-3 text-xs px-2 py-1 rounded-full bg-blue-500/20 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300">
                  {article.categoryTitle}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {article.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
