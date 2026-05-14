'use client';

import React, { useEffect, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { wikiSearchIndex } from '@/data/wiki/search-index';
import { WikiSearchItem } from '@/types/wiki';
import { X, Search } from 'lucide-react';
import Link from 'next/link';

export function WikiSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<WikiSearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fuseRef = useRef<Fuse<WikiSearchItem> | null>(null);

  useEffect(() => {
    fuseRef.current = new Fuse(wikiSearchIndex, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'description', weight: 0.3 },
        { name: 'tags', weight: 0.15 },
        { name: 'categoryTitle', weight: 0.05 },
      ],
      threshold: 0.35,
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSelectedIndex(0);
      }

      if (isOpen) {
        if (e.key === 'Escape') {
          setIsOpen(false);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            window.location.href = results[selectedIndex].href;
            setIsOpen(false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedIndex(0);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (fuseRef.current) {
      const searchResults = fuseRef.current.search(query);
      setResults(searchResults.map((result) => result.item));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-lg shadow-xl bg-white/10 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 dark:border-slate-700/30">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar en la wiki..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 dark:hover:bg-slate-700/50 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && searchQuery && (
            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
              No se encontraron resultados para "{searchQuery}"
            </div>
          )}

          {results.length === 0 && !searchQuery && (
            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
              Comienza a escribir para buscar...
            </div>
          )}

          {results.map((item, index) => (
            <Link key={item.id} href={item.href}>
              <div
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-white/5 dark:border-slate-700/20 last:border-b-0 ${
                  index === selectedIndex
                    ? 'bg-blue-500/20 dark:bg-blue-600/20'
                    : 'hover:bg-white/5 dark:hover:bg-slate-700/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.categoryTitle}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Hint */}
        {results.length > 0 && (
          <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-500 border-t border-white/10 dark:border-slate-700/30 flex items-center justify-between">
            <span>Usa ↑↓ para navegar, Enter para seleccionar</span>
            <span className="text-slate-400">Esc para cerrar</span>
          </div>
        )}
      </div>
    </div>
  );
}
