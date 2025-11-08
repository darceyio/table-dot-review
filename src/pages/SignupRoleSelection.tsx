import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, UserCircle, Users } from "lucide-react";

export default function SignupRoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'owner',
      title: 'I own a restaurant',
      description: 'Manage your venue, staff, and customer feedback',
      icon: Store,
      color: 'from-coral-500/20 to-coral-600/20',
      iconColor: 'text-coral-600',
      path: '/signup/owner'
    },
    {
      id: 'server',
      title: "I'm a server",
      description: 'Receive tips and connect with customers',
      icon: UserCircle,
      color: 'from-sky-500/20 to-sky-600/20',
      iconColor: 'text-sky-600',
      path: '/signup/server'
    },
    {
      id: 'customer',
      title: "I'm a diner",
      description: 'Track your reviews and favorite places',
      icon: Users,
      color: 'from-mint-500/20 to-mint-600/20',
      iconColor: 'text-mint-600',
      path: '/signup/customer'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Join Table.Review
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Choose your role to get started in under 2 minutes
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 hover:border-primary/50 bg-card/80 backdrop-blur-sm"
                onClick={() => navigate(role.path)}
              >
                <CardHeader className="space-y-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mx-auto transition-transform group-hover:scale-110`}>
                    <Icon className={`h-8 w-8 ${role.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl text-center">
                    {role.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth/login')}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
