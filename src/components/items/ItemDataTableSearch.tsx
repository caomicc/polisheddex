'use client';

import React from 'react';
import { ItemDataTable } from './item-data-table';
import { itemColumns } from './item-columns';
import { AnyItemData } from '@/types/types';

interface ItemDataTableSearchProps {
  items: AnyItemData[];
}

const ItemDataTableSearch: React.FC<ItemDataTableSearchProps> = ({ items }) => {
  return <ItemDataTable columns={itemColumns} data={items} />;
};

export default ItemDataTableSearch;
