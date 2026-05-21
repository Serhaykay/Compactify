import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import DiffPage from "@/pages/diff";
import BeautifyPage from "@/pages/beautify";
import LandingPage from "@/pages/landing";
import { ThemeProvider } from "@/contexts/theme";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Landing page — no chrome */}
      <Route path="/" component={LandingPage} />

      {/* App pages — wrapped in Layout */}
      <Route path="/diff">
        <Layout><DiffPage /></Layout>
      </Route>
      <Route path="/beautify">
        <Layout><BeautifyPage /></Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
