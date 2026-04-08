import { DashboardLayout } from "@/components/layout/DashboardLayout";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
