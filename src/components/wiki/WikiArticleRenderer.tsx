'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Lightbulb, Info, Code } from 'lucide-react';

export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-semibold text-sm">
          {number}
        </span>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="ml-11 text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
      <div className="flex gap-3">
        <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-900 dark:text-emerald-200">{children}</div>
      </div>
    </div>
  );
}

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-200">{children}</div>
      </div>
    </div>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
      <div className="flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 dark:text-blue-200">{children}</div>
      </div>
    </div>
  );
}

export function Success({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 p-4 rounded-lg bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50">
      <div className="flex gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-green-900 dark:text-green-200">{children}</div>
      </div>
    </div>
  );
}

export function CodeBlock({
  children,
  language = 'plaintext',
}: {
  children: string;
  language?: string;
}) {
  return (
    <div className="my-4 rounded-lg overflow-hidden bg-slate-900 dark:bg-slate-950 border border-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-slate-100 font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-200/50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
      {children}
    </kbd>
  );
}

export function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <img src={src} alt={alt} className="w-full h-auto" />
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}
