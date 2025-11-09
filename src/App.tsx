import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Web3Provider } from "@/providers/Web3Provider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import SignupRoleSelection from "./pages/SignupRoleSelection";
import OwnerSignup from "./pages/OwnerSignup";
import ServerSignup from "./pages/ServerSignup";
import CustomerSignup from "./pages/CustomerSignup";
import Admin from "./pages/Admin";
import Owner from "./pages/Owner";
import OwnerProfile from "./pages/OwnerProfile";
import Server from "./pages/Server";
import ServerProfile from "./pages/ServerProfile";
import QRView from "./pages/QRView";
import InviteRedirect from "./pages/InviteRedirect";
import NotFound from "./pages/NotFound";
import VenueProfile from "./pages/VenueProfile";
import AuthRedirector from "./components/AuthRedirector";


const App = () => (
  <Web3Provider>
    <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AuthRedirector />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/signup" element={<SignupRoleSelection />} />
              <Route path="/signup/owner" element={<OwnerSignup />} />
              <Route path="/signup/server" element={<ServerSignup />} />
              <Route path="/signup/customer" element={<CustomerSignup />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner"
                element={
                  <ProtectedRoute allowedRoles={["owner", "manager"]}>
                    <Owner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/profile"
                element={
                  <ProtectedRoute allowedRoles={["owner", "manager"]}>
                    <OwnerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/server"
                element={
                  <ProtectedRoute allowedRoles={["server"]}>
                    <Server />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/server/profile"
                element={
                  <ProtectedRoute allowedRoles={["server"]}>
                    <ServerProfile />
                  </ProtectedRoute>
                }
              />
              <Route path="/r/:code" element={<QRView />} />
              <Route path="/venue/:slug" element={<VenueProfile />} />
              <Route path="/i/:token" element={<InviteRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  
);

export default App;
