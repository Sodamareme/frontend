import { MainNav } from "@/components/main-nav";
import Image from "next/image";

export const Navbar = async () => {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={40}
            className="hidden md:block"
          />
          <p className="text-xl font-bold text-brand-orange">
            Promotion - 2025
          </p>
        </div>
        <MainNav className="mx-6" />
        <div className="ml-auto flex items-center space-x-4">
        </div>
      </div>
    </div>
  );
}