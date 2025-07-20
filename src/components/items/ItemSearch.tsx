'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

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
            <Label htmlFor="sort-select" className="text-sm">Sort</Label>
            <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger id="sort-select" className="bg-white">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="price-low-high">Price (Low to High)</SelectItem>
              <SelectItem value="price-high-low">Price (High to Low)</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
            </Select>
        </div>

        <div className="flex items-center gap-2">
                      <Label htmlFor="sort-options" className="text-sm">Category</Label>
<Select value={category} onValueChange={(value) => handleCategoryChange(value)}>
            <SelectTrigger id="sort-options" className="bg-white">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
           {categories.map((cat) => (
              <SelectItem key={cat} value={cat === 'TM/HM' ? 'tm-hm' : cat.toLowerCase().replace(/\s+/g, '-')}>
                {cat}
              </SelectItem>
            ))}
              </SelectContent>
            </Select>
        </div>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalItems} item{totalItems !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}
