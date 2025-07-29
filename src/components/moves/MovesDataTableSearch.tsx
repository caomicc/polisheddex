'use client';

import React, { Suspense } from 'react';
import { MovesDataTable } from './moves-data-table';
import { moveColumns } from './moves-columns';
import { MoveDescription } from '@/types/types';

interface MovesDataTableSearchProps {
  moves: MoveDescription[];
}

const MovesDataTableSearch: React.FC<MovesDataTableSearchProps> = ({ moves }) => {
  return (
    <Suspense fallback={<div className="flex justify-center py-8">Loading moves...</div>}>
      <MovesDataTable columns={moveColumns} data={moves} />
    </Suspense>
  );
};

export default MovesDataTableSearch;
