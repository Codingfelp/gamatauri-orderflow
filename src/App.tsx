import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OnlineStatus } from "@/components/OnlineStatus";
import { ActiveOrderProvider } from "@/contexts/ActiveOrderContext";
import { InstallPrompt } from "@/components/InstallPrompt";

const Order = lazy(() => import("./pages/Order"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Success = lazy(() => import("./pages/Success"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Auth = lazy(() => import("./pages/Auth"));
const Orders = lazy(() => import("./pages/Orders"));
const Settings = lazy(() => import("./pages/Settings"));
const Install = lazy(() => import("./pages/Install"));
const Offline = lazy(() => import("./pages/Offline"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminSync = lazy(() => import("./pages/AdminSync"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ActiveOrderProvider>
      <TooltipProvider>
        <OnlineStatus />
        <InstallPrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Order />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/success" element={<Success />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/install" element={<Install />} />
              <Route path="/offline" element={<Offline />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/admin-sync" element={<AdminSync />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ActiveOrderProvider>
  </QueryClientProvider>
);

export default App;
