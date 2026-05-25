'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CatalogCategory, CatalogItem } from './data';

interface ModalContextType {
  isCatalogOpen: boolean;
  activeCatalogSlug: string | null;
  openCatalog: (slug: string) => void;
  closeCatalog: () => void;
  
  isProductDetailOpen: boolean;
  activeProduct: CatalogItem | null;
  activeProductCategory: CatalogCategory | null;
  openProductDetail: (product: CatalogItem, category: CatalogCategory) => void;
  closeProductDetail: () => void;

  isContactModalOpen: boolean;
  openContactModal: () => void;
  closeContactModal: () => void;

  isCheckoutModalOpen: boolean;
  openCheckoutModal: () => void;
  closeCheckoutModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeCatalogSlug, setActiveCatalogSlug] = useState<string | null>(null);

  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<CatalogItem | null>(null);
  const [activeProductCategory, setActiveProductCategory] = useState<CatalogCategory | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const openContactModal = () => {
    setIsContactModalOpen(true);
    document.body.style.overflow = 'hidden';
  }

  const closeContactModal = () => {
    setIsContactModalOpen(false);
    if (!isCatalogOpen && !isProductDetailOpen && !isCheckoutModalOpen) {
      document.body.style.overflow = '';
    }
  }

  const openCheckoutModal = () => {
    setIsCheckoutModalOpen(true);
    document.body.style.overflow = 'hidden';
  }

  const closeCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    if (!isCatalogOpen && !isProductDetailOpen && !isContactModalOpen) {
      document.body.style.overflow = '';
    }
  }

  const openCatalog = (slug: string) => {
    setActiveCatalogSlug(slug);
    setIsCatalogOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeCatalog = () => {
    setIsCatalogOpen(false);
    setTimeout(() => setActiveCatalogSlug(null), 300); // transition timing
    if (!isProductDetailOpen) {
      document.body.style.overflow = '';
    }
  };

  const openProductDetail = (product: CatalogItem, category: CatalogCategory) => {
    setActiveProduct(product);
    setActiveProductCategory(category);
    setIsProductDetailOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeProductDetail = () => {
    setIsProductDetailOpen(false);
    setTimeout(() => {
      setActiveProduct(null);
      setActiveProductCategory(null);
    }, 300);
    if (!isCatalogOpen) {
      document.body.style.overflow = '';
    }
  };

  return (
    <ModalContext.Provider value={{
      isCatalogOpen, activeCatalogSlug, openCatalog, closeCatalog,
      isProductDetailOpen, activeProduct, activeProductCategory, openProductDetail, closeProductDetail,
      isContactModalOpen, openContactModal, closeContactModal,
      isCheckoutModalOpen, openCheckoutModal, closeCheckoutModal
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
