import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, LayoutDashboard, Brain, LogOut, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import LanguageSelector from "@/components/LanguageSelector";

const Navbar = () => {
  const { user, isAdmin, displayName, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/report", label: t("nav.report"), icon: AlertTriangle },
    { to: "/ai-analyzer", label: t("nav.aiAnalyzer"), icon: Brain },
  ];

  if (isAdmin) {
    links.push({ to: "/admin/dashboard", label: t("nav.admin"), icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">RoadTracker</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(l.to) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector />
          <span className="text-sm text-muted-foreground">Hi, {displayName || user?.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> {t("nav.signOut")}
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t px-4 py-3 space-y-1 bg-card">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                isActive(l.to) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            <LanguageSelector />
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" /> {t("nav.signOut")}
          </Button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
