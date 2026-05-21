import { Link, useLocation } from "wouter";
import { SplitSquareHorizontal, Wand2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="border-b border-border h-14 flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-6">
          {/* Logo — links back to landing */}
          <Link href="/" className="flex items-center gap-0 select-none">
            <span
              className="font-dancing text-[1.65rem] leading-none font-bold"
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Compactify
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/diff"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                location === "/diff"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
              data-testid="nav-diff"
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
              data-testid="nav-beautify"
            >
              <Wand2 className="w-4 h-4" />
              Beautify
            </Link>
          </nav>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-theme-toggle"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
