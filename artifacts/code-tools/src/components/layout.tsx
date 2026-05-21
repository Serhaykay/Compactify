import { Link, useLocation } from "wouter";
import { Terminal, SplitSquareHorizontal, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="border-b border-border h-14 flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
            <Terminal className="w-5 h-5" />
            <span className="font-semibold tracking-tight">Code Tools</span>
          </Link>
          
          <nav className="flex items-center gap-1">
            <Link 
              href="/" 
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                location === "/" 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <SplitSquareHorizontal className="w-4 h-4" />
              Diff
            </Link>
            <Link 
              href="/beautify" 
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                location === "/beautify" 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Wand2 className="w-4 h-4" />
              Beautify
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
