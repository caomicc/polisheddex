import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polished Crystal Wiki',
  description: 'Community wiki for Pokémon Polished Crystal ROM hack',
};

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return <div className="mb-10 p-2 lg:p-4">{children}</div>;
}
