export type WikiCategorySlug =
  | 'primeros-pasos'
  | 'pos'
  | 'inventario'
  | 'clientes'
  | 'caja'
  | 'reportes'
  | 'gastos'
  | 'proveedores'
  | 'equipo'
  | 'sucursales'
  | 'precios-promos'
  | 'configuracion'
  | 'faq';

export interface WikiCategory {
  slug: WikiCategorySlug;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  articleCount: number;
}

export interface WikiArticle {
  slug: string;
  categorySlug: WikiCategorySlug;
  title: string;
  description: string;
  tags: string[];
  readingTimeMin: number;
  component: React.ComponentType;
  relatedSlugs?: string[];
}

export interface WikiSearchItem {
  id: string;
  categorySlug: WikiCategorySlug;
  categoryTitle: string;
  title: string;
  description: string;
  tags: string[];
  href: string;
}
