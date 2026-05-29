'use client';

import React, { createContext, useContext, useState } from 'react';

import {
  CatalogCategory,
  CatalogItem,
  DbCategory,
  DEFAULT_CATEGORIES,
  DEFAULT_ITEMS,
  getCatalogFromCategories,
} from './data';

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
    alert('Da nap lai danh muc mac dinh. Luu database Supabase se lam o phase admin CRUD.');
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        catalog,
        loading: false,
        addCategory,
        updateCategory,
        deleteCategory,
        seedDefaultCategories,
        isDbHealthy: false,
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
