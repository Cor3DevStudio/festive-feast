import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountSidebar from "@/components/account/AccountSidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <AccountSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
