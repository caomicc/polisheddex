export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="pokemon-page-background min-h-screen py-2 px-4 lg:p-4">{children}</div>;
}
