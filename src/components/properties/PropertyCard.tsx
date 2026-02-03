import { PropertyWithTenant } from "@/types/property";
import { Eye, Pencil, Trash2, MapPin, DollarSign, User, Calendar, CreditCard } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays, differenceInMonths, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDeleteProperty } from "@/hooks/useProperties";
import { toast } from "sonner";

interface PropertyCardProps {
  property: PropertyWithTenant;
  onView: (property: PropertyWithTenant) => void;
  onEdit: (property: PropertyWithTenant) => void;
}

const getPaymentStatusBadge = (status: string | null, nextPaymentDate: string | null) => {
  // If status is explicitly set to Atrasado or Pagado, use it
  if (status === "Atrasado") {
    return { label: "Atrasado", className: "badge-destructive" };
  }
  
  if (status === "Pagado") {
    return { label: "Pagado", className: "badge-success" };
  }
  
  // For Pendiente or null, calculate days remaining
  if (nextPaymentDate) {
    const today = new Date();
    const paymentDate = parseISO(nextPaymentDate);
    
    if (isBefore(paymentDate, today)) {
      return { label: "Atrasado", className: "badge-destructive" };
    }
    
    const daysUntilPayment = Math.ceil(
      (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilPayment > 0) {
      const dayLabel = daysUntilPayment === 1 ? "día" : "días";
      const isUrgent = daysUntilPayment <= 5;
      return { 
        label: isUrgent ? `⏰ Vence en ${daysUntilPayment} ${dayLabel}` : `Vence en ${daysUntilPayment} ${dayLabel}`, 
        className: isUrgent ? "badge-urgent-payment" : "badge-warning" 
      };
    }
  }
  
  return { label: "Pendiente", className: "badge-warning" };
};

const getDaysUntilPayment = (nextPaymentDate: string | null) => {
  if (!nextPaymentDate) return null;
  
  const today = new Date();
  const paymentDate = parseISO(nextPaymentDate);
  const daysUntilPayment = Math.ceil(
    (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysUntilPayment > 0 ? daysUntilPayment : null;
};

const getContractExpirationInfo = (contractEnd: string | null) => {
  if (!contractEnd) return null;
  
  const today = new Date();
  const endDate = parseISO(contractEnd);
  const monthsUntilEnd = differenceInMonths(endDate, today);
  
  // Show if 3 months or less remaining
  if (monthsUntilEnd >= 0 && monthsUntilEnd <= 3) {
    const monthLabel = monthsUntilEnd === 1 ? "mes" : "meses";
    return { label: `📋 Contrato vence en ${monthsUntilEnd} ${monthLabel}`, type: "months" };
  }
  
  return null;
};

const PropertyCard = ({ property, onView, onEdit }: PropertyCardProps) => {
  const isOccupied = property.status === "Ocupado";
  const paymentBadge = isOccupied
    ? getPaymentStatusBadge(property.payment_status, property.next_payment_date)
    : null;
  const deleteProperty = useDeleteProperty();
  
  const contractExpirationInfo = getContractExpirationInfo(property.tenant?.contract_end || null);

  const handleDelete = async () => {
    if (window.confirm(`¿Está seguro de que desea eliminar la propiedad "${property.name}"?`)) {
      try {
        await deleteProperty.mutateAsync(property.id);
        toast.success("Propiedad eliminada exitosamente");
      } catch (error) {
        toast.error("Error al eliminar la propiedad");
      }
    }
  };

  return (
    <div className="card-elevated p-5 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            isOccupied ? "bg-destructive/10 text-destructive" : "badge-success"
          )}
        >
          {property.status}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(property)}
            className="action-btn text-muted-foreground hover:text-primary"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(property)}
            className="action-btn text-muted-foreground hover:text-primary"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProperty.isPending}
            className="action-btn text-muted-foreground hover:text-destructive disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Property Name */}
      <h3 className="font-semibold text-foreground mb-3 line-clamp-1">
        {property.name}
      </h3>

      {/* Property Details */}
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{property.address}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-foreground">
            RD$ {property.monthly_rent.toLocaleString("es-DO")}
          </span>
          <span>/mes</span>
        </div>

        {isOccupied && property.tenant && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground flex-1">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{property.tenant.name}</span>
              </div>
              {contractExpirationInfo !== null && (
                <div className="badge-contract-expiring">
                  {contractExpirationInfo.label}
                </div>
              )}
            </div>

            {property.next_payment_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>
                  Próximo pago:{" "}
                  {format(parseISO(property.next_payment_date), "d MMM yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            )}

            {paymentBadge && (
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <span className={paymentBadge.className}>{paymentBadge.label}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
