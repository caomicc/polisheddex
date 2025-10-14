import { ReactNode } from 'react';

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <div className="mb-10 pb-12 px-4 lg:p-4">{children}</div>;
}
