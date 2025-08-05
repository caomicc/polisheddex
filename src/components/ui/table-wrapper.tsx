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
        'bg-white/90 backdrop-blur-xl dark:bg-black/5 rounded-2xl p-0 overflow-hidden',
        'border-2 shadow-2xl',
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
};

export default TableWrapper;
