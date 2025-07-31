export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="mb-10 p-2 lg:p-4">{children}</div>;
}
