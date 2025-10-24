import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Check from "./pages/Check";
import Verdicts from "./pages/Verdicts";
import VerdictDetail from "./pages/VerdictDetail";
import Explorer from "./pages/Explorer";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route 
          path="/dashboard" 
          element={<AnalyticsDashboard />} 
        />
          <Route path="/check" element={<Check />} />
          <Route path="/verdicts" element={<Verdicts />} />
          <Route path="/verdicts/:id" element={<VerdictDetail />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
