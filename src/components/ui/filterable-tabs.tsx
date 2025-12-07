'use client';

import { ReactNode, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
}

interface FilterableTabsProps<T> {
  tabs: Tab[];
  defaultValue: string;
  data: T[];
  filterFn: (data: T[], tabValue: string) => T[];
  renderContent: (filteredData: T[]) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function FilterableTabs<T>({
  tabs,
  defaultValue,
  data,
  filterFn,
  renderContent,
  emptyMessage = 'No data available',
  className,
}: FilterableTabsProps<T>) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <Tabs
      defaultValue={defaultValue}
      className={cn('w-full', className)}
      onValueChange={setActiveTab}
    >
      <TabsList className="mb-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => {
        const filteredData = filterFn(data, tab.value);

        return (
          <TabsContent key={tab.value} value={tab.value}>
            {filteredData.length > 0 ? (
              renderContent(filteredData)
            ) : (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-4">
                {emptyMessage}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
