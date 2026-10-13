export default function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="studio-theme h-full w-full bg-background">{children}</div>
  );
}
