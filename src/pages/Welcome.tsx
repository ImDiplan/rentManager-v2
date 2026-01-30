import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-lg mx-4 animate-fade-in">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-border/20">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-3 text-balance">
            Sistema de Gestión de Alquileres
          </h1>
          
          {/* Subtitle */}
          <p className="text-muted-foreground text-center mb-8 text-balance">
            Administra tus propiedades, inquilinos y pagos de forma simple y eficiente
          </p>
          
          {/* CTA Button */}
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full h-12 text-base font-medium transition-smooth hover:scale-[1.02]"
            size="lg"
          >
            Ingresar al Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
