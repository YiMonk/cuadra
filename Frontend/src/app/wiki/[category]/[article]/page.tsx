import React, { Suspense } from 'react';
import { WikiLayout } from '@/components/wiki/WikiLayout';
import { WikiBreadcrumb } from '@/components/wiki/WikiBreadcrumb';
import { wikiCategories, getCategoryBySlug } from '@/data/wiki/wiki-categories';
import { wikiSearchIndex } from '@/data/wiki/search-index';
import { WikiCategorySlug } from '@/types/wiki';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { articleComponents } from '@/data/wiki/article-components';

export async function generateStaticParams() {
  return wikiSearchIndex.map((article) => ({
    category: article.categorySlug,
    article: article.id.replace(`${article.categorySlug}-`, ''),
  }));
}

interface PageProps {
  params: Promise<{
    category: WikiCategorySlug;
    article: string;
  }>;
}

function ArticleLoading() {
  return (
    <div className="py-12 text-center">
      <div className="inline-block animate-spin">
        <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-blue-400 rounded-full" />
      </div>
    </div>
  );
}

export default async function ArticlePage({
  params,
}: PageProps) {
  const { category, article: articleId } = await params;
  const categoryData = getCategoryBySlug(category);
  const fullArticleId = `${category}-${articleId}`;
  const articleMeta = wikiSearchIndex.find((a) => a.id === fullArticleId);
  const ArticleComponent = articleComponents[fullArticleId as keyof typeof articleComponents];

  if (!categoryData || !articleMeta || !ArticleComponent) {
    return (
      <WikiLayout activeCategory={category}>
        <div className="py-12 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Artículo no encontrado
          </h1>
          <Link
            href={`/wiki/${category}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Volver a {categoryData?.title}
          </Link>
        </div>
      </WikiLayout>
    );
  }

  // Find previous and next articles
  const categoryArticles = wikiSearchIndex.filter((a) => a.categorySlug === category);
  const currentIndex = categoryArticles.findIndex((a) => a.id === fullArticleId);
  const prevArticle = currentIndex > 0 ? categoryArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < categoryArticles.length - 1 ? categoryArticles[currentIndex + 1] : null;

  return (
    <WikiLayout activeCategory={category}>
      <article className="py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <WikiBreadcrumb
            categorySlug={category}
            categoryTitle={categoryData.title}
            articleTitle={articleMeta.title}
          />

          <div className="mt-6 mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {articleMeta.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{articleMeta.tags.length || 5} min de lectura</span>
              </div>
              {articleMeta.tags && articleMeta.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {articleMeta.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-slate-200/50 dark:bg-slate-700/50"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none mb-12">
          <Suspense fallback={<ArticleLoading />}>
            <ArticleComponent />
          </Suspense>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10 dark:border-slate-700/30">
          {prevArticle ? (
            <Link href={prevArticle.href} className="flex-1">
              <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all group">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </div>
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {prevArticle.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextArticle ? (
            <Link href={nextArticle.href} className="flex-1">
              <div className="p-4 rounded-lg bg-white/40 dark:bg-slate-800/30 border border-white/60 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all group text-right">
                <div className="flex items-center justify-end gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {nextArticle.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </article>
    </WikiLayout>
  );
}
