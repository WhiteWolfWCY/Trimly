import HeaderComponent from "@/components/Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div>
        <HeaderComponent /> 
        {children}
    </div>
  );
}
