import React from 'react';
import { WikiLayout } from '@/components/wiki/WikiLayout';
import { WikiBreadcrumb } from '@/components/wiki/WikiBreadcrumb';
import { WikiArticleCard } from '@/components/wiki/WikiArticleCard';
import { wikiCategories, getCategoryBySlug } from '@/data/wiki/wiki-categories';
import { getSearchIndexForCategory } from '@/data/wiki/search-index';
import { WikiCategorySlug } from '@/types/wiki';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export async function generateStaticParams() {
  return wikiCategories.map((category) => ({
    category: category.slug,
  }));
}

interface PageProps {
  params: Promise<{
    category: WikiCategorySlug;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categoryData = getCategoryBySlug(category);
  const articles = getSearchIndexForCategory(category);

  if (!categoryData) {
    return (
      <WikiLayout>
        <div className="py-12 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Categoría no encontrada
          </h1>
          <Link href="/wiki" className="text-blue-600 dark:text-blue-400 hover:underline">
            Volver a la wiki
          </Link>
        </div>
      </WikiLayout>
    );
  }

  return (
    <WikiLayout activeCategory={category}>
      <div className="py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <WikiBreadcrumb categorySlug={category} />

          <div className="mt-6 mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-2">
              {categoryData.title}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {categoryData.description}
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {articles.map((article) => (
              <WikiArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No hay artículos en esta categoría aún
            </p>
            <Link href="/wiki" className="text-blue-600 dark:text-blue-400 hover:underline">
              Volver a la wiki
            </Link>
          </div>
        )}
      </div>
    </WikiLayout>
  );
}
