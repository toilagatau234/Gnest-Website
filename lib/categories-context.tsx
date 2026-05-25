'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { DEFAULT_CATEGORIES, DEFAULT_ITEMS, CatalogCategory, CatalogItem, getCatalogFromCategories, DbCategory } from './data';
import { OperationType, handleFirestoreError, useFirebase } from './firebase-provider';

interface CategoriesContextType {
  categories: DbCategory[];
  catalog: Record<string, CatalogCategory>;
  loading: boolean;
  addCategory: (id: string, title: string, parentId: string | null, type: 'product' | 'service', hasFilters: boolean) => Promise<void>;
  updateCategory: (id: string, updates: Partial<DbCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  seedDefaultCategories: () => Promise<void>;
  isDbHealthy: boolean;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useFirebase();
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [catalog, setCatalog] = useState<Record<string, CatalogCategory>>({});
  const [loading, setLoading] = useState(true);
  const [isDbHealthy, setIsDbHealthy] = useState(true);

  // Monitor the categories collection in Firestore
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveCategories: DbCategory[] = [];
      snapshot.forEach((doc) => {
        liveCategories.push({
          id: doc.id,
          ...doc.data()
        } as DbCategory);
      });

      if (liveCategories.length > 0) {
        setCategories(liveCategories);
        setCatalog(getCatalogFromCategories(liveCategories, DEFAULT_ITEMS));
      } else {
        // Fallback to static defaults
        setCategories(DEFAULT_CATEGORIES);
        setCatalog(getCatalogFromCategories(DEFAULT_CATEGORIES, DEFAULT_ITEMS));
      }
      setLoading(false);
      setIsDbHealthy(true);
    }, (error) => {
      console.warn("Firestore categories stream failed (likely offline/unconfigured):", error);
      // Fallback
      setCategories(DEFAULT_CATEGORIES);
      setCatalog(getCatalogFromCategories(DEFAULT_CATEGORIES, DEFAULT_ITEMS));
      setLoading(false);
      setIsDbHealthy(false);
    });

    return () => unsubscribe();
  }, []);

  const addCategory = async (id: string, title: string, parentId: string | null, type: 'product' | 'service', hasFilters: boolean) => {
    try {
      const sanitizedId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const docRef = doc(db, 'categories', sanitizedId);
      const nextSortOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sortOrder)) + 1 : 1;
      
      const newCat: DbCategory = {
        id: sanitizedId,
        title,
        type,
        hasFilters,
        parentId: parentId || null,
        sortOrder: nextSortOrder
      };

      await setDoc(docRef, newCat);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `categories/${id}`);
    }
  };

  const updateCategory = async (id: string, updates: Partial<DbCategory>) => {
    try {
      const docRef = doc(db, 'categories', id);
      await setDoc(docRef, updates, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const docRef = doc(db, 'categories', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const seedDefaultCategories = async () => {
    if (!isAdmin) {
      alert("Chỉ quản trị viên mới có quyền khởi tạo hệ thống.");
      return;
    }

    try {
      const batch = writeBatch(db);
      
      DEFAULT_CATEGORIES.forEach((cat) => {
        const docRef = doc(db, 'categories', cat.id);
        batch.set(docRef, {
          title: cat.title,
          type: cat.type,
          hasFilters: cat.hasFilters,
          parentId: cat.parentId || null,
          sortOrder: cat.sortOrder
        });
      });

      await batch.commit();
      alert("Đã đồng bộ hóa 24 danh mục chuẩn Đại Tài Lợi vào cơ sở dữ liệu thành công!");
    } catch (err) {
      console.error("Lỗi khởi tạo dữ liệu:", err);
      alert("Không thể kết nối đến cơ sở dữ liệu. Vui lòng kiểm tra cấu hình Firebase của bạn.");
    }
  };

  return (
    <CategoriesContext.Provider value={{
      categories,
      catalog,
      loading,
      addCategory,
      updateCategory,
      deleteCategory,
      seedDefaultCategories,
      isDbHealthy
    }}>
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
