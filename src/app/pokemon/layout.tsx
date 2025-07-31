export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="pokemon-page-background p-2 lg:p-4">{children}</div>;
}
