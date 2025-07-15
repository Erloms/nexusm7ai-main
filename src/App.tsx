import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute"; // Import ProtectedRoute
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Image from "./pages/Image";
import Voice from "./pages/Voice";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome"; // Import DashboardHome
import Admin from "./pages/Admin";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster /> 
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="*" element={<NotFound />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardHome />} /> {/* Default dashboard content */}
                {/* Add other dashboard sub-routes here if they exist, e.g.: */}
                {/* <Route path="ai-assistant" element={<DashboardAI />} /> */}
                {/* <Route path="settings" element={<DashboardSettings />} /> */}
                {/* <Route path="members" element={<DashboardMembers />} /> */}
              </Route>
              <Route path="/chat" element={<Chat />} />
              <Route path="/image" element={<Image />} />
              <Route path="/voice" element={<Voice />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;