import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Property, Tenant, Document, PropertyWithTenant } from "@/types/property";
import { toast } from "sonner";

// Fetch all properties with tenants
export const useProperties = () => {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async (): Promise<PropertyWithTenant[]> => {
      // Fetch properties
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;

      // Fetch tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*");

      if (tenantsError) throw tenantsError;

      // Fetch documents
      const { data: documents, error: documentsError } = await supabase
        .from("documents")
        .select("*");

      if (documentsError) throw documentsError;

      // Combine data
      return (properties as Property[]).map((property) => ({
        ...property,
        tenant: (tenants as Tenant[]).find((t) => t.property_id === property.id) || null,
        documents: (documents as Document[]).filter((d) => d.property_id === property.id),
      }));
    },
  });
};

// Create property
export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      property,
      tenant,
    }: {
      property: Omit<Property, "id" | "created_at" | "updated_at">;
      tenant?: Omit<Tenant, "id" | "property_id" | "created_at" | "updated_at"> | null;
    }) => {
      // Insert property
      const { data: newProperty, error: propertyError } = await supabase
        .from("properties")
        .insert(property)
        .select()
        .single();

      if (propertyError) throw propertyError;

      // Insert tenant if occupied
      if (tenant && property.status === "Ocupado") {
        const { error: tenantError } = await supabase.from("tenants").insert({
          ...tenant,
          property_id: newProperty.id,
        });

        if (tenantError) throw tenantError;
      }

      return newProperty;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Propiedad creada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al crear la propiedad: " + error.message);
    },
  });
};

// Update property
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      property,
      tenant,
    }: {
      id: string;
      property: Partial<Property>;
      tenant?: Partial<Tenant> | null;
    }) => {
      // Update property
      const { error: propertyError } = await supabase
        .from("properties")
        .update(property)
        .eq("id", id);

      if (propertyError) throw propertyError;

      // Handle tenant
      if (property.status === "Ocupado" && tenant) {
        // Check if tenant exists
        const { data: existingTenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("property_id", id)
          .maybeSingle();

        if (existingTenant) {
          // Update tenant
          const { error: tenantError } = await supabase
            .from("tenants")
            .update(tenant)
            .eq("property_id", id);

          if (tenantError) throw tenantError;
        } else {
          // Create new tenant
          const { error: tenantError } = await supabase.from("tenants").insert({
            ...tenant,
            property_id: id,
            name: tenant.name || "",
          });

          if (tenantError) throw tenantError;
        }
      } else if (property.status === "Disponible") {
        // Delete tenant if status changed to available
        await supabase.from("tenants").delete().eq("property_id", id);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Propiedad actualizada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar la propiedad: " + error.message);
    },
  });
};

// Delete property
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Propiedad eliminada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar la propiedad: " + error.message);
    },
  });
};

// Update payment status
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payment_status,
      next_payment_date,
    }: {
      id: string;
      payment_status: "Pagado" | "Pendiente" | "Atrasado";
      next_payment_date?: string;
    }) => {
      const updateData: Partial<Property> = { payment_status };
      if (next_payment_date) {
        updateData.next_payment_date = next_payment_date;
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Estado de pago actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar el estado de pago: " + error.message);
    },
  });
};

// Upload document
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      file,
      type,
    }: {
      propertyId: string;
      file: File;
      type: Document["type"];
    }) => {
      const fileName = `${propertyId}/${type}_${Date.now()}_${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Save document record
      const { error: docError } = await supabase.from("documents").insert({
        property_id: propertyId,
        type,
        file_url: urlData.publicUrl,
        file_name: file.name,
      });

      if (docError) throw docError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Documento subido exitosamente");
    },
    onError: (error) => {
      toast.error("Error al subir el documento: " + error.message);
    },
  });
};
