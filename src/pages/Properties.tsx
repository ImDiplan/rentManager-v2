import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyForm from "@/components/properties/PropertyForm";
import PropertyViewModal from "@/components/properties/PropertyViewModal";
import { useProperties, useDeleteProperty } from "@/hooks/useProperties";
import { PropertyWithTenant } from "@/types/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Properties = () => {
  const { data: properties, isLoading } = useProperties();
  const deleteProperty = useDeleteProperty();

  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithTenant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  // Filter properties based on search
  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    if (!searchQuery) return properties;

    const query = searchQuery.toLowerCase();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.tenant?.name.toLowerCase().includes(query)
    );
  }, [properties, searchQuery]);

  const handleView = (property: PropertyWithTenant) => {
    setSelectedProperty(property);
    setViewModalOpen(true);
  };

  const handleEdit = (property: PropertyWithTenant) => {
    setSelectedProperty(property);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedProperty(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedProperty(null);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedProperty(null);
  };

  const handleDelete = async () => {
    if (propertyToDelete) {
      await deleteProperty.mutateAsync(propertyToDelete);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alquileres</h1>
            <p className="text-muted-foreground">
              Gestiona todas tus propiedades
            </p>
          </div>

          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Propiedad
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dirección o inquilino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-muted mb-4">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              {searchQuery ? "No se encontraron propiedades" : "Sin propiedades"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Intenta con otro término de búsqueda"
                : "Agrega tu primera propiedad para comenzar"}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Propiedad
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PropertyForm
        open={formOpen}
        onClose={handleCloseForm}
        property={selectedProperty}
      />

      <PropertyViewModal
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        property={selectedProperty}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos
              relacionados, incluyendo información del inquilino y documentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Properties;
