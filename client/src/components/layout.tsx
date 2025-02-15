import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Plus, Settings } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold">Housing Aggregator</a>
          </Link>
          <nav className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/new-listing">
                <Plus className="mr-2 h-4 w-4" />
                New Listing
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          © 2024 Housing Aggregator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
