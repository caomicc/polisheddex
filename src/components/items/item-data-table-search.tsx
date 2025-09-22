'use client';

import React, { Suspense } from 'react';
import { ItemDataTable } from './item-data-table';
import { itemColumns } from './item-columns';
import { useFaithfulPreference } from '@/hooks/useFaithfulPreference';
import { ItemsManifest } from '@/types/new';

interface ItemDataTableSearchProps {
  items: ItemsManifest[];
}
const ItemDataTableSearch: React.FC<ItemDataTableSearchProps> = ({ items }) => {
  const { showFaithful } = useFaithfulPreference();

  const version = showFaithful ? 'faithful' : 'polished';

  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading items...</div>}>
      <ItemDataTable columns={itemColumns(version)} data={items} />
    </Suspense>
  );
};

export default ItemDataTableSearch;
