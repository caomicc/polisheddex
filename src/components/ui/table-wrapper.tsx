import React from 'react';
import { cn } from '@/lib/utils';

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const TableWrapper: React.FC<TableWrapperProps> = ({ children, className }) => {
  return <div className={cn('overflow-x-auto', className)}>{children}</div>;
};

export default TableWrapper;
