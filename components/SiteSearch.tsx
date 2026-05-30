'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Package } from 'lucide-react';
import { CatalogCategory, CatalogItem } from '@/lib/data';
import { useModal } from '@/lib/context';
import { useCategories } from '@/lib/categories-context';

interface SearchResult {
  product: CatalogItem;
  category: CatalogCategory;
  categorySlug: string;
}

export function SiteSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { openProductDetail } = useModal();
  const { catalog } = useCategories();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      const timer = setTimeout(() => {
        setResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const searchTerm = debouncedQuery.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search across all categories
    Object.entries(catalog).forEach(([slug, category]) => {
      category.items.forEach(item => {
        if (item.name.toLowerCase().includes(searchTerm)) {
          newResults.push({
            product: item,
            category,
            categorySlug: slug
          });
        }
      });
    });

    // Simulate a brief API fetch duration so the visual transition feels robust and polished
    const timer = setTimeout(() => {
      setResults(newResults);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [debouncedQuery, catalog]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  const handleResultClick = (result: SearchResult) => {
    handleClose();
    openProductDetail(result.product, result.category);
  };

  return (
    <div className="relative flex items-center" ref={searchRef}>
      {!isOpen ? (
        <button 
          onClick={handleOpen}
          className="p-2 text-dtl-dark hover:text-dtl-red transition-colors rounded-full hover:bg-dtl-bg-alt flex items-center justify-center"
          aria-label="Tìm kiếm sản phẩm"
        >
          <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 md:w-[280px] transition-all bg-dtl-bg-alt rounded-full px-3 py-1.5 border border-dtl-border">
          <Search className="w-4 h-4 text-dtl-gray shrink-0" strokeWidth={2.5} />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.trim().length >= 2) {
                setIsSearching(true);
              } else {
                setIsSearching(false);
              }
            }}
            placeholder="Tìm theo tên..."
            className="bg-transparent border-none outline-none text-[13px] w-full text-dtl-dark font-medium placeholder:text-dtl-gray/70"
          />
          {isSearching ? (
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-dtl-red animate-spin shrink-0"></div>
          ) : (
            <button onClick={handleClose} className="p-1 text-dtl-gray hover:text-dtl-red shrink-0" aria-label="Đóng tìm kiếm">
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {/* Search Suggestions Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-[calc(100%+14px)] right-0 w-[100vw] md:w-[380px] max-h-[60vh] bg-white border border-dtl-border shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-lg overflow-y-auto z-50 md:-right-2 right-[-20px] sm:right-0">
          {isSearching ? (
            <div className="p-4 space-y-3">
              <div className="text-[11px] font-bold text-dtl-red uppercase tracking-wider animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-dtl-red animate-ping"></span>
                Đang tìm chi tiết sản phẩm...
              </div>
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex gap-3 items-center animate-pulse">
                  <div className="w-[42px] h-[42px] bg-slate-100 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                    <div className="h-2.5 bg-slate-100 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="p-2.5 border-b border-dtl-border bg-dtl-bg-alt sticky top-0 z-10 font-bold text-[12px] text-dtl-navy flex items-center justify-between">
                <span>Gợi ý sản phẩm ({results.length})</span>
                {results.length > 5 && (
                  <span className="text-[10px] text-dtl-gray font-normal bg-white border px-1.5 py-0.5 rounded">Hiển thị 5 kết quả đầu</span>
                )}
              </div>
              
              {results.length > 0 ? (
                <ul className="py-1">
                  {results.slice(0, 5).map((result, idx) => {
                    const primaryImg = (result.product.imgs && result.product.imgs[0]) || result.product.img;
                    
                    return (
                      <li key={idx}>
                        <button 
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-dtl-bg-alt transition-colors group border-b border-dtl-border last:border-b-0"
                        >
                          <div className="w-[42px] h-[42px] shrink-0 bg-white border border-dtl-border rounded overflow-hidden flex items-center justify-center p-1">
                            {primaryImg ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={primaryImg}
                                  alt={result.product.name}
                                  fill
                                  sizes="42px"
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <Package className="w-5 h-5 text-dtl-gray/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-dtl-dark group-hover:text-dtl-red truncate leading-tight">
                              {result.product.name}
                            </div>
                            <div className="text-[11px] text-dtl-gray mt-1 truncate flex gap-1.5 items-center">
                              <span className="font-semibold text-dtl-navy bg-dtl-border/50 px-1.5 rounded">{result.category.title}</span>
                              {result.product.dungTich && <span className="opacity-80">{result.product.dungTich}</span>}
                              {result.product.price && (
                                <span className="ml-auto font-extrabold text-dtl-red text-[12px]">
                                  {result.product.price.toLocaleString('vi-VN')}đ
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-8 text-center text-[13px] text-dtl-gray">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Không tìm thấy sản phẩm nào phù hợp.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
