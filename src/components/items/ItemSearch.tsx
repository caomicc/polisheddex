'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';

interface ItemSearchProps {
  initialSort: string;
  initialCategory: string;
  categories: string[];
  totalItems: number;
}

export default function ItemSearch({ 
  initialSort, 
  initialCategory, 
  categories, 
  totalItems 
}: ItemSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState(initialSort);
  const [category, setCategory] = useState(initialCategory);

  const updateFilters = useCallback((newSort: string, newCategory: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (newSort !== 'alphabetical') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    
    if (newCategory !== 'all') {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }

    const paramString = params.toString();
    const newUrl = paramString ? `/items?${paramString}` : '/items';
    router.push(newUrl);
  }, [router, searchParams]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    updateFilters(newSort, category);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    updateFilters(sort, newCategory);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="font-medium text-sm">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="price-low-high">Price (Low to High)</option>
            <option value="price-high-low">Price (High to Low)</option>
            <option value="category">Category</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="category-select" className="font-medium text-sm">
            Category:
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat === 'TM/HM' ? 'tm-hm' : cat.toLowerCase().replace(/\s+/g, '-')}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalItems} item{totalItems !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}
