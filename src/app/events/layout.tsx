import { ReactNode } from 'react';

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <div className="p-2 lg:p-4">{children}</div>;
}
