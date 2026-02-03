import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get basename from environment or window location
const getBasename = () => {
  const isDev = import.meta.env.DEV;
  if (isDev) return "/";
  
  // For GitHub Pages with repo name in URL
  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(s => s);
  
  // If the first segment is not just a domain/IP, treat it as repo name
  if (segments.length > 0 && !segments[0].includes(".") && segments[0] !== "hogar-gestionado-main") {
    return "/" + segments[0] + "/";
  }
  return "/";
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={getBasename()}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
