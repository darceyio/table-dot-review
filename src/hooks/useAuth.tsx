import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type UserRole = "admin" | "owner" | "manager" | "server" | "customer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleResolving, setRoleResolving] = useState(false);
  const navigate = useNavigate();

  // Resolve role strictly from the database to avoid accidental reassignment
  const fetchUserRole = async (uid: string): Promise<UserRole | null> => {
    const { data, error } = await supabase.rpc('get_user_role', { _user_id: uid });
    if (error) return null;
    return (data as UserRole) ?? null;
  };

  // Explicit role refresh function
  const refreshRole = async () => {
    if (!user) {
      setRole(null);
      return;
    }
    setRoleResolving(true);
    const r = await fetchUserRole(user.id);
    setRole(r);
    setRoleResolving(false);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setRoleResolving(true);
          // Fetch role without blocking auth callback
          setTimeout(async () => {
            const resolvedRole = await fetchUserRole(session.user.id);
            setRole(resolvedRole);
            setRoleResolving(false);
          }, 0);
        } else {
          setRole(null);
          setRoleResolving(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleResolving(true);
        const r = await fetchUserRole(session.user.id);
        setRole(r);
        setRoleResolving(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      loading: loading || roleResolving, 
      signOut, 
      refreshRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
