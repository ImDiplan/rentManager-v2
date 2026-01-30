import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useProperties } from "@/hooks/useProperties";
import {
  Building2,
  Users,
  DollarSign,
  FileWarning,
  AlertCircle,
  Calendar,
  Loader2,
} from "lucide-react";
import { format, parseISO, addMonths, isBefore, isAfter, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { data: properties, isLoading } = useProperties();
  const navigate = useNavigate();

  // Calculate stats
  const stats = useMemo(() => {
    if (!properties) {
      return {
        totalProperties: 0,
        totalTenants: 0,
        monthlyIncome: 0,
        expiringContracts: 0,
      };
    }

    const today = new Date();
    const threeMonthsFromNow = addMonths(today, 3);

    const occupiedProperties = properties.filter((p) => p.status === "Ocupado");
    const totalRent = occupiedProperties.reduce(
      (sum, p) => sum + p.monthly_rent,
      0
    );

    const expiringContracts = properties.filter(
      (p) =>
        p.tenant?.contract_end &&
        isBefore(parseISO(p.tenant.contract_end), threeMonthsFromNow) &&
        isAfter(parseISO(p.tenant.contract_end), today)
    );

    return {
      totalProperties: properties.length,
      totalTenants: occupiedProperties.length,
      monthlyIncome: totalRent * 0.1, // 10% commission
      expiringContracts: expiringContracts.length,
    };
  }, [properties]);

  // Get contracts expiring soon
  const expiringContractsList = useMemo(() => {
    if (!properties) return [];

    const today = new Date();
    const threeMonthsFromNow = addMonths(today, 3);

    return properties
      .filter(
        (p) =>
          p.tenant?.contract_end &&
          isBefore(parseISO(p.tenant.contract_end), threeMonthsFromNow) &&
          isAfter(parseISO(p.tenant.contract_end), today)
      )
      .sort((a, b) => {
        const dateA = a.tenant?.contract_end ? parseISO(a.tenant.contract_end) : today;
        const dateB = b.tenant?.contract_end ? parseISO(b.tenant.contract_end) : today;
        return dateA.getTime() - dateB.getTime();
      });
  }, [properties]);

  // Get recent activity (overdue or soon due payments)
  const recentActivity = useMemo(() => {
    if (!properties) return [];

    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);

    return properties
      .filter((p) => {
        if (p.status !== "Ocupado" || !p.next_payment_date) return false;
        const paymentDate = parseISO(p.next_payment_date);
        
        // Include if overdue or within next 7 days
        return (
          isBefore(paymentDate, today) ||
          (isBefore(paymentDate, sevenDaysFromNow) && p.payment_status !== "Pagado")
        );
      })
      .map((p) => ({
        ...p,
        isOverdue: p.next_payment_date
          ? isBefore(parseISO(p.next_payment_date), today)
          : false,
      }))
      .sort((a, b) => {
        const dateA = a.next_payment_date ? parseISO(a.next_payment_date) : today;
        const dateB = b.next_payment_date ? parseISO(b.next_payment_date) : today;
        return dateA.getTime() - dateB.getTime();
      });
  }, [properties]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    {
      label: "Total de Propiedades",
      value: stats.totalProperties,
      icon: Building2,
      color: "text-primary",
    },
    {
      label: "Total de Inquilinos",
      value: stats.totalTenants,
      icon: Users,
      color: "text-success",
    },
    {
      label: "Ingreso Mensual (10%)",
      value: `RD$ ${stats.monthlyIncome.toLocaleString("es-DO")}`,
      icon: DollarSign,
      color: "text-warning",
    },
    {
      label: "Contratos por Vencer",
      value: stats.expiringContracts,
      icon: FileWarning,
      color: "text-destructive",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido!
          </h1>
          <p className="text-muted-foreground">
            Aquí está lo que está pasando con tus propiedades hoy.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiring Contracts */}
          <div className="card-elevated p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-warning" />
              Contratos por Vencer
            </h2>

            {expiringContractsList.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No hay contratos por vencer en los próximos 3 meses.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringContractsList.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-smooth cursor-pointer"
                    onClick={() => navigate("/properties")}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {property.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {property.tenant?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-warning">
                        {property.tenant?.contract_end &&
                          format(
                            parseISO(property.tenant.contract_end),
                            "d MMM yyyy",
                            { locale: es }
                          )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card-elevated p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Actividad Reciente
            </h2>

            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No hay pagos pendientes o atrasados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-smooth cursor-pointer"
                    onClick={() => navigate("/properties")}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {property.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {property.tenant?.name} • RD${" "}
                        {property.monthly_rent.toLocaleString("es-DO")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          property.isOverdue
                            ? "badge-destructive"
                            : "badge-warning"
                        )}
                      >
                        {property.isOverdue ? "Atrasado" : "Próximo"}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {property.next_payment_date &&
                          format(
                            parseISO(property.next_payment_date),
                            "d MMM",
                            { locale: es }
                          )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
