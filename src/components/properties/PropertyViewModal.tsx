import { PropertyWithTenant, DOCUMENT_TYPES, Document } from "@/types/property";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Home,
  DollarSign,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  CreditCard,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUpdatePaymentStatus, useDeleteProperty } from "@/hooks/useProperties";
import { addMonths, setDate as setDateFn } from "date-fns";
import DocumentViewerModal from "./DocumentViewerModal";
import { useState } from "react";
import { toast } from "sonner";

interface PropertyViewModalProps {
  open: boolean;
  onClose: () => void;
  property: PropertyWithTenant | null;
}

const PropertyViewModal = ({ open, onClose, property }: PropertyViewModalProps) => {
  const updatePaymentStatus = useUpdatePaymentStatus();
  const deleteProperty = useDeleteProperty();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  const handleDelete = async () => {
    if (property && window.confirm(`¿Está seguro de que desea eliminar la propiedad "${property.name}"?`)) {
      try {
        await deleteProperty.mutateAsync(property.id);
        onClose();
        toast.success("Propiedad eliminada exitosamente");
      } catch (error) {
        toast.error("Error al eliminar la propiedad");
      }
    }
  };

  if (!property) return null;

  const isOccupied = property.status === "Ocupado";

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Pagado":
        return "badge-success";
      case "Atrasado":
        return "badge-destructive";
      default:
        return "badge-warning";
    }
  };

  const getPaymentStatusLabel = (status: string | null) => {
    if (status === "Atrasado" || status === "Pagado") {
      return status;
    }
    
    if (property.next_payment_date) {
      const today = new Date();
      const paymentDate = parseISO(property.next_payment_date);
      const daysUntilPayment = Math.ceil(
        (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilPayment > 0) {
        const dayLabel = daysUntilPayment === 1 ? "día" : "días";
        const isUrgent = daysUntilPayment <= 5;
        return isUrgent ? `⏰ Vence en ${daysUntilPayment} ${dayLabel}` : `Vence en ${daysUntilPayment} ${dayLabel}`;
      }
    }
    
    return "Pendiente";
  };

  const getPaymentStatusBadgeClass = (status: string | null) => {
    if (status === "Pagado") return "badge-success";
    if (status === "Atrasado") return "badge-destructive";
    
    // For pending status, check if urgent (5 days or less)
    if (property.next_payment_date) {
      const today = new Date();
      const paymentDate = parseISO(property.next_payment_date);
      const daysUntilPayment = Math.ceil(
        (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilPayment > 0 && daysUntilPayment <= 5) {
        return "badge-urgent-payment";
      }
    }
    
    return "badge-warning";
  };

  const handleMarkAsPaid = async () => {
    if (!property.payment_day) return;

    // Calculate next payment date
    const today = new Date();
    let nextPayment = setDateFn(today, property.payment_day);
    if (nextPayment <= today) {
      nextPayment = addMonths(nextPayment, 1);
    }
    nextPayment = addMonths(nextPayment, 1);

    await updatePaymentStatus.mutateAsync({
      id: property.id,
      payment_status: "Pagado",
      next_payment_date: format(nextPayment, "yyyy-MM-dd"),
    });
    onClose();
  };

  const handleCancelPayment = async () => {
    if (property) {
      await updatePaymentStatus.mutateAsync({
        id: property.id,
        payment_status: "Pendiente",
        next_payment_date: property.next_payment_date,
      });
      onClose();
    }
  };

  const getDocumentByType = (type: string, owner: 'tenant' | 'guarantor' = 'tenant') => {
    return property.documents?.find(
      (doc) => doc.type === type && (doc.document_owner || 'tenant') === owner
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-2">
            <DialogTitle>{property.name}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteProperty.isPending}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Eliminar propiedad"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              isOccupied
                ? "bg-destructive/10 text-destructive"
                : "badge-success"
            )}
          >
            {property.status}
          </span>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Details */}
          <div className="section-muted space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <Home className="w-4 h-4" />
              Información de la Propiedad
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{property.address}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>{property.rooms} habitación(es)</span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  RD$ {property.monthly_rent.toLocaleString("es-DO")}
                </span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Día de pago: {property.payment_day || "No definido"}</span>
              </div>
            </div>
          </div>

          {/* Tenant Information */}
          {isOccupied && property.tenant && (
            <div className="section-muted space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Información del Inquilino
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>{property.tenant.name}</span>
                </div>

                {property.tenant.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{property.tenant.phone}</span>
                  </div>
                )}

                {property.tenant.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{property.tenant.email}</span>
                  </div>
                )}

                {property.tenant.contract_start && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Inicio:{" "}
                      {format(parseISO(property.tenant.contract_start), "d MMM yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}

                {property.tenant.contract_end && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Fin:{" "}
                      {format(parseISO(property.tenant.contract_end), "d MMM yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guarantor Information */}
          {isOccupied && property.guarantor && (
            <div className="section-muted space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Información del Garante
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>{property.guarantor.name}</span>
                </div>

                {property.guarantor.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{property.guarantor.phone}</span>
                  </div>
                )}

                {property.guarantor.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>{property.guarantor.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Status */}
          {isOccupied && (
            <div className="section-muted space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Estado de Pago
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Estado:</span>
                    <span className={getPaymentStatusBadgeClass(property.payment_status)}>
                      {getPaymentStatusLabel(property.payment_status)}
                    </span>
                  </div>
                  {property.next_payment_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Próximo pago:{" "}
                        {format(parseISO(property.next_payment_date), "d MMM yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {property.payment_status !== "Pagado" && (
                  <Button
                    size="sm"
                    onClick={handleMarkAsPaid}
                    disabled={updatePaymentStatus.isPending}
                  >
                    Marcar como Pagado
                  </Button>
                )}
                {property.payment_status === "Pagado" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelPayment}
                    disabled={updatePaymentStatus.isPending}
                  >
                    Cancelar Pago
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="section-muted space-y-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos del Inquilino
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DOCUMENT_TYPES.map((docType) => {
                const doc = getDocumentByType(docType.value, 'tenant');
                return (
                  <div
                    key={docType.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg border text-sm",
                      doc
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <span
                      className={cn(
                        doc ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {docType.label}
                    </span>
                    {doc ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setDocumentModalOpen(true);
                        }}
                        className="text-primary hover:underline h-auto p-0"
                      >
                        Ver
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        No adjunto
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guarantor Documents */}
          {isOccupied && property.guarantor && (
            <div className="section-muted space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentos del Garante
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DOCUMENT_TYPES.map((docType) => {
                  const doc = getDocumentByType(docType.value, 'guarantor');
                  return (
                    <div
                      key={docType.value}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg border text-sm",
                        doc
                          ? "border-success/30 bg-success/5"
                          : "border-border bg-muted/30"
                      )}
                    >
                      <span
                        className={cn(
                          doc ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {docType.label}
                      </span>
                      {doc ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setDocumentModalOpen(true);
                          }}
                          className="text-primary hover:underline h-auto p-0"
                        >
                          Ver
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          No adjunto
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      </Dialog>
      <DocumentViewerModal
        open={documentModalOpen}
        onClose={() => {
          setDocumentModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </>
  );
};

export default PropertyViewModal;
