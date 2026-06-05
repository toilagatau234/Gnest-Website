'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import {
  CatalogCategory,
  CatalogItem,
  DbCategory,
  DEFAULT_CATEGORIES,
  DEFAULT_ITEMS,
  getCatalogFromCategories,
} from './data';
import { getCategories } from './services/categories';

interface CategoriesContextType {
  categories: DbCategory[];
  catalog: Record<string, CatalogCategory>;
  loading: boolean;
  addCategory: (
    id: string,
    title: string,
    parentId: string | null,
    type: 'product' | 'service',
    hasFilters: boolean
  ) => Promise<void>;
  updateCategory: (id: string, updates: Partial<DbCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  seedDefaultCategories: () => Promise<void>;
  isDbHealthy: boolean;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<DbCategory[]>(DEFAULT_CATEGORIES);
  const [catalog, setCatalog] = useState<Record<string, CatalogCategory>>(
    getCatalogFromCategories(DEFAULT_CATEGORIES, DEFAULT_ITEMS)
  );
  const [loading, setLoading] = useState(true);
  const [isDbHealthy, setIsDbHealthy] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const dbCats = await getCategories();

        // 1. Map Categories
        const mappedCategories: DbCategory[] = dbCats.map((c) => {
          const parentCat = c.parent_id ? dbCats.find((p) => p.id === c.parent_id) : null;
          const parentSlug = parentCat ? parentCat.slug : null;

          return {
            id: c.slug,
            title: c.name,
            type: c.type as 'product' | 'service',
            hasFilters: c.has_filters,
            parentId: parentSlug,
            sortOrder: c.sort_order,
          };
        });

        setCategories(mappedCategories);
        setCatalog(getCatalogFromCategories(mappedCategories, []));
        setIsDbHealthy(true);
      } catch (err) {
        console.warn('Failed to load categories/products from Supabase. Falling back to default data.', err);
        setCategories(DEFAULT_CATEGORIES);
        setCatalog(getCatalogFromCategories(DEFAULT_CATEGORIES, DEFAULT_ITEMS));
        setIsDbHealthy(false);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const syncCategories = (nextCategories: DbCategory[], items: CatalogItem[] = DEFAULT_ITEMS) => {
    setCategories(nextCategories);
    setCatalog(getCatalogFromCategories(nextCategories, items));
  };

  const addCategory = async (
    id: string,
    title: string,
    parentId: string | null,
    type: 'product' | 'service',
    hasFilters: boolean
  ) => {
    const sanitizedId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const nextSortOrder =
      categories.length > 0 ? Math.max(...categories.map((category) => category.sortOrder)) + 1 : 1;

    syncCategories([
      ...categories,
      {
        id: sanitizedId,
        title,
        type,
        hasFilters,
        parentId: parentId || null,
        sortOrder: nextSortOrder,
      },
    ]);
  };

  const updateCategory = async (id: string, updates: Partial<DbCategory>) => {
    syncCategories(
      categories.map((category) => (category.id === id ? { ...category, ...updates } : category))
    );
  };

  const deleteCategory = async (id: string) => {
    syncCategories(categories.filter((category) => category.id !== id));
  };

  const seedDefaultCategories = async () => {
    syncCategories(DEFAULT_CATEGORIES);
    alert('Đã nạp lại danh mục mặc định. Lưu vào Supabase sẽ làm ở phase admin CRUD.');
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        catalog,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        seedDefaultCategories,
        isDbHealthy,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}
