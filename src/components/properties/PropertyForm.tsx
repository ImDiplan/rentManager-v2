import { useState, useEffect } from "react";
import { PropertyWithTenant, DOCUMENT_TYPES } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateProperty, useUpdateProperty, useUploadDocument } from "@/hooks/useProperties";
import { Upload, X, Loader2 } from "lucide-react";
import { addMonths, format, setDate as setDateFn } from "date-fns";

interface PropertyFormProps {
  open: boolean;
  onClose: () => void;
  property?: PropertyWithTenant | null;
}

// Phone formatting utility for Dominican Republic
const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

// Email validation utility
const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const PropertyForm = ({ open, onClose, property }: PropertyFormProps) => {
  const isEditing = !!property;
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const uploadDocument = useUploadDocument();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    rooms: 1,
    monthly_rent: 0,
    status: "Disponible" as "Disponible" | "Ocupado",
    payment_day: 1,
  });

  const [tenantData, setTenantData] = useState({
    name: "",
    phone: "",
    email: "",
    contract_start: "",
    contract_end: "",
  });

  const [documents, setDocuments] = useState<Record<string, File | null>>({});

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        address: property.address,
        rooms: property.rooms,
        monthly_rent: property.monthly_rent,
        status: property.status,
        payment_day: property.payment_day || 1,
      });

      if (property.tenant) {
        setTenantData({
          name: property.tenant.name,
          phone: property.tenant.phone || "",
          email: property.tenant.email || "",
          contract_start: property.tenant.contract_start || "",
          contract_end: property.tenant.contract_end || "",
        });
      }
    } else {
      // Reset form for new property
      setFormData({
        name: "",
        address: "",
        rooms: 1,
        monthly_rent: 0,
        status: "Disponible",
        payment_day: 1,
      });
      setTenantData({
        name: "",
        phone: "",
        email: "",
        contract_start: "",
        contract_end: "",
      });
      setDocuments({});
    }
  }, [property, open]);

  const calculateNextPaymentDate = (paymentDay: number) => {
    const today = new Date();
    let nextPayment = setDateFn(today, paymentDay);
    if (nextPayment <= today) {
      nextPayment = addMonths(nextPayment, 1);
    }
    return format(nextPayment, "yyyy-MM-dd");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const propertyPayload = {
      ...formData,
      next_payment_date:
        formData.status === "Ocupado"
          ? calculateNextPaymentDate(formData.payment_day)
          : null,
      payment_status:
        formData.status === "Ocupado" ? ("Pendiente" as const) : null,
    };

    const tenantPayload =
      formData.status === "Ocupado"
        ? {
            name: tenantData.name,
            phone: tenantData.phone || null,
            email: tenantData.email || null,
            contract_start: tenantData.contract_start || null,
            contract_end: tenantData.contract_end || null,
          }
        : null;

    try {
      let propertyId = property?.id;

      if (isEditing && propertyId) {
        await updateProperty.mutateAsync({
          id: propertyId,
          property: propertyPayload,
          tenant: tenantPayload,
        });
      } else {
        const newProperty = await createProperty.mutateAsync({
          property: propertyPayload,
          tenant: tenantPayload,
        });
        propertyId = newProperty.id;
      }

      // Upload documents
      for (const [type, file] of Object.entries(documents)) {
        if (file && propertyId) {
          await uploadDocument.mutateAsync({
            propertyId,
            file,
            type: type as any,
          });
        }
      }

      onClose();
    } catch (error) {
      // Error handled in mutations
    }
  };

  const isLoading =
    createProperty.isPending ||
    updateProperty.isPending ||
    uploadDocument.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Propiedad" : "Agregar Nueva Propiedad"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Information */}
          <div className="section-muted space-y-4">
            <h3 className="font-medium text-foreground">
              Información de la Propiedad
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Propiedad <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Apartamento Centro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección <span className="text-destructive">*</span></Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Ej: Calle Principal #123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rooms">Habitaciones</Label>
                <Input
                  id="rooms"
                  type="number"
                  min="1"
                  value={formData.rooms}
                  onChange={(e) =>
                    setFormData({ ...formData, rooms: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_rent">Alquiler Mensual (RD$) <span className="text-destructive">*</span></Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthly_rent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_rent: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "Disponible" | "Ocupado") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Ocupado">Ocupado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_day">Día de Pago (1-31)</Label>
                <Input
                  id="payment_day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.payment_day}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_day: Math.min(31, Math.max(1, parseInt(e.target.value) || 1)),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Tenant Information - Only show if occupied */}
          {formData.status === "Ocupado" && (
            <div className="section-muted space-y-4">
              <h3 className="font-medium text-foreground">
                Información del Inquilino
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_name">Nombre del Inquilino <span className="text-destructive">*</span></Label>
                  <Input
                    id="tenant_name"
                    value={tenantData.name}
                    onChange={(e) =>
                      setTenantData({ ...tenantData, name: e.target.value })
                    }
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant_phone">Teléfono</Label>
                  <Input
                    id="tenant_phone"
                    value={tenantData.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setTenantData({ ...tenantData, phone: formatted });
                    }}
                    placeholder="809-555-0000"
                    maxLength="12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant_email">Correo Electrónico</Label>
                  <Input
                    id="tenant_email"
                    type="email"
                    value={tenantData.email}
                    onChange={(e) =>
                      setTenantData({ ...tenantData, email: e.target.value })
                    }
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_start">Inicio del Contrato</Label>
                  <Input
                    id="contract_start"
                    type="date"
                    value={tenantData.contract_start}
                    onChange={(e) =>
                      setTenantData({
                        ...tenantData,
                        contract_start: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contract_end">Fin del Contrato</Label>
                  <Input
                    id="contract_end"
                    type="date"
                    value={tenantData.contract_end}
                    onChange={(e) =>
                      setTenantData({
                        ...tenantData,
                        contract_end: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div className="section-muted space-y-4">
            <h3 className="font-medium text-foreground">Documentos (Opcional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENT_TYPES.map((docType) => (
                <div key={docType.value} className="space-y-2">
                  <Label>{docType.label}</Label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-accent transition-smooth">
                        <Upload className="w-4 h-4" />
                        <span className="truncate">
                          {documents[docType.value]?.name || "Sin archivo"}
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setDocuments({
                            ...documents,
                            [docType.value]: file || null,
                          });
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </label>
                    {documents[docType.value] && (
                      <button
                        type="button"
                        onClick={() =>
                          setDocuments({
                            ...documents,
                            [docType.value]: null,
                          })
                        }
                        className="p-2 text-muted-foreground hover:text-destructive transition-smooth"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Actualizar" : "Guardar Alquiler"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyForm;
