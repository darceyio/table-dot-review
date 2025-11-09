import { Home, Building2, Users, BarChart3, User, ChevronDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Org {
  id: number;
  name: string;
  slug: string;
  country: string;
  currency: string;
}

interface StaffMember {
  id: string;
  displayName: string;
  avatar: string | null;
  isActive?: boolean;
}

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  organizations: Org[];
  selectedOrg: Org | null;
  onOrgChange: (orgId: string) => void;
  activeStaff: StaffMember[];
}

export function AppSidebar({
  activeTab,
  onTabChange,
  organizations,
  selectedOrg,
  onOrgChange,
  activeStaff,
}: AppSidebarProps) {
  const { state } = useSidebar();

  const navItems = [
    { id: "home", label: "Home", icon: Home, to: "/owner" },
    { id: "venues", label: "Venues", icon: Building2, to: "/owner" },
    { id: "staff", label: "Staff", icon: Users, to: "/owner" },
    { id: "analytics", label: "Analytics", icon: BarChart3, to: "/owner" },
    { id: "profile", label: "Profile", icon: User, to: "/owner" },
  ];

  const activeCount = activeStaff.filter(s => s.isActive).length;
  const topActiveStaff = activeStaff.filter(s => s.isActive).slice(0, 3);

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className={`hidden md:flex border-r border-border/40 ${
        isCollapsed ? "w-14" : "w-64"
      } transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="glass-panel">
        {/* Venue Selector */}
        {!isCollapsed && selectedOrg && organizations.length > 0 && (
          <div className="p-4 border-b border-border/40">
            <Select value={selectedOrg.id.toString()} onValueChange={onOrgChange}>
              <SelectTrigger className="w-full bg-background/50 border-border/40">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={() => onTabChange(item.id)}
                    >
                      <button className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all duration-300">
                        <Icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Active Servers Section */}
        {!isCollapsed && activeCount > 0 && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Active Now</SidebarGroupLabel>
            <SidebarGroupContent>
              <button
                onClick={() => onTabChange("staff")}
                className="w-full p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all duration-300 border border-border/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Active Servers
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {activeCount}
                  </Badge>
                </div>
                <div className="flex -space-x-2">
                  {topActiveStaff.map((staff) => (
                    <Avatar key={staff.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={staff.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {staff.displayName?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {activeCount > 3 && (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-medium">+{activeCount - 3}</span>
                    </div>
                  )}
                </div>
              </button>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
