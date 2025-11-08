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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Infer a role from the user's email when no role is set yet
  const inferRoleFromEmail = (email?: string | null): UserRole | null => {
    if (!email) return null;
    const e = email.toLowerCase();
    if (e.includes("+server@")) return "server";
    if (e.includes("+owner@")) return "owner";
    // Do not auto-assign admin via email for safety
    return null; // could fallback to "customer" if desired
  };

  // Ensure the user has a role; if missing, try to infer and assign one
  const ensureUserRole = async (uid: string, email?: string | null): Promise<UserRole | null> => {
    const { data, error } = await supabase.rpc('get_user_role', { _user_id: uid });
    if (!error && data) return data as UserRole;

    const inferred = inferRoleFromEmail(email);
    if (inferred) {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: uid, role: inferred });
      if (!insertError) return inferred;
    }
    return null;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch or infer-and-assign role without blocking auth callback
          setTimeout(async () => {
            const resolvedRole = await ensureUserRole(session.user.id, session.user.email);
            setRole(resolvedRole);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const r = await ensureUserRole(session.user.id, session.user.email);
        setRole(r);
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
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
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
