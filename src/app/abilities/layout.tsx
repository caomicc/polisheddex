export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="py-12 px-4 lg:p-4">{children}</div>;
}
