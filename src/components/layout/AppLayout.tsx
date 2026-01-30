import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Alquileres", href: "/properties", icon: Building2 },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <span className="font-semibold text-foreground hidden sm:block">
                Gestión de Alquileres
              </span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Exit Button */}
            <NavLink
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-smooth"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
