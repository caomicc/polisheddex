import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const TableWrapper: React.FC<TableWrapperProps> = ({ children, className }) => {
  return (
    <Card
      className={cn(
        'bg-white backdrop-blur-xl shadow-none rounded-2xl p-0 overflow-hidden',
        'border-neutral-200 dark:border-white/[0.2] dark:bg-black',
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
};

export default TableWrapper;
