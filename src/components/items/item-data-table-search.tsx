'use client';

import React, { Suspense } from 'react';
import { ItemDataTable } from './item-data-table';
import { itemColumns } from './item-columns';
import { AnyItemData } from '@/types/types';

interface ItemDataTableSearchProps {
  items: AnyItemData[];
}

const ItemDataTableSearch: React.FC<ItemDataTableSearchProps> = ({ items }) => {
  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading items...</div>}>
      <ItemDataTable columns={itemColumns} data={items} />
    </Suspense>
  );
};

export default ItemDataTableSearch;
