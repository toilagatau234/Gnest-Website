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
import { getProducts } from './services/products';

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
        const dbProds = await getProducts();

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

        // 2. Map Products
        const mappedItems: CatalogItem[] = dbProds.map((p) => {
          const cat = p.category_id ? dbCats.find((c) => c.id === p.category_id) : null;
          const categorySlug = cat ? cat.slug : '';

          const specsObj = p.specs && typeof p.specs === 'object' ? (p.specs as Record<string, any>) : {};

          const activeImages = (p.product_images || [])
            .filter((img) => img.is_active)
            .sort((a, b) => a.sort_order - b.sort_order);
          const imageUrls = activeImages.map((img) => img.public_url).filter(Boolean) as string[];
          const primaryImg = activeImages.find((img) => img.is_primary) || activeImages[0];
          const primaryImageUrl = primaryImg ? primaryImg.public_url : '/placeholder.svg';

          const bulkDiscountsList = (p.product_bulk_discounts || [])
            .filter((d) => d.is_active)
            .sort((a, b) => a.min_quantity - b.min_quantity)
            .map((d) => ({
              threshold: d.min_quantity,
              pricePerUnit: d.price_per_unit,
            }));

          return {
            id: p.slug,
            name: p.name,
            img: primaryImageUrl || null,
            imgs: imageUrls.length > 0 ? imageUrls : undefined,
            dungTich: specsObj.dungTich ? String(specsObj.dungTich) : undefined,
            quyCach: specsObj.quyCach ? String(specsObj.quyCach) : undefined,
            phiNap: specsObj.phiNap ? String(specsObj.phiNap) : undefined,
            loaiNap: specsObj.loaiNap ? String(specsObj.loaiNap) : undefined,
            color: specsObj.color ? String(specsObj.color) : undefined,
            desc: p.description || '',
            price: p.price ?? undefined,
            stock: p.stock ?? 0,
            bulkDiscounts: bulkDiscountsList.length > 0 ? bulkDiscountsList : undefined,
            categoryId: categorySlug,
          };
        });

        setCategories(mappedCategories);
        setCatalog(getCatalogFromCategories(mappedCategories, mappedItems));
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
    alert('Da nap lai danh muc mac dinh. Luu database Supabase se lam o phase admin CRUD.');
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
