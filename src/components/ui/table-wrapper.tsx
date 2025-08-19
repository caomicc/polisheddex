import React from 'react';
import { cn } from '@/lib/utils';
import { BentoGridNoLink } from './bento-box';

interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const TableWrapper: React.FC<TableWrapperProps> = ({ children, className }) => {
  return (
    <BentoGridNoLink
      className={cn(
        // 'bg-white backdrop-blur-xl shadow-none rounded-xl p-0 overflow-hidden',
        // 'border-neutral-200 dark:border-white/[0.2] dark:bg-black',
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </BentoGridNoLink>
  );
};

export default TableWrapper;
