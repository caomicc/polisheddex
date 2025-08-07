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
        'bg-white/30 backdrop-blur-xl dark:bg-white/5 rounded-2xl p-0 overflow-hidden',
        'border-indigo-300 dark:border-border border-2 shadow-lg',
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
};

export default TableWrapper;
