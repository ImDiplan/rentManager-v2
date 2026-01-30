import { useState } from "react";
import { Document, DOCUMENT_TYPES } from "@/types/property";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;
  document: Document | null;
}

const DocumentViewerModal = ({ open, onClose, document }: DocumentViewerModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!document) return null;

  const getDocumentLabel = () => {
    const type = DOCUMENT_TYPES.find((t) => t.value === document.type);
    return type?.label || document.type;
  };

  const getFileExtension = () => {
    const fileName = document.file_name || document.file_url;
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ext;
  };

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Extract bucket and file path from Supabase URL
      // URL format: https://xxxxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
      const url = new URL(document.file_url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // Find the index where the bucket name starts (after 'object' and 'public')
      const objectIndex = pathParts.indexOf('object');
      const bucket = pathParts[objectIndex + 2];
      const filePath = pathParts.slice(objectIndex + 3).join('/');

      if (!bucket || !filePath) {
        toast.error("No se pudo determinar la ubicación del archivo");
        return;
      }

      // Download the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;

      // Create a blob and download
      const downloadUrl = window.URL.createObjectURL(data);
      const link = window.document.createElement("a");
      link.href = downloadUrl;
      link.download = document.file_name || `document.${getFileExtension()}`;
      window.document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      window.document.body.removeChild(link);

      toast.success("Documento descargado exitosamente");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Error al descargar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const isPDF = getFileExtension() === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif"].includes(getFileExtension() || "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0 flex-shrink-0">
          <DialogTitle>{getDocumentLabel()}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 px-6 py-4 overflow-hidden">
          {/* File Information */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg flex-shrink-0">
            <div>
              <p className="text-sm font-medium text-foreground">
                {document.file_name || "Documento sin nombre"}
              </p>
              <p className="text-xs text-muted-foreground">
                {getFileExtension()?.toUpperCase() || "Archivo"}
              </p>
            </div>
            <Button
              onClick={handleDownload}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isLoading ? "Descargando..." : "Descargar"}
            </Button>
          </div>

          {/* Document Preview */}
          <div className="flex-1 border rounded-lg bg-background flex items-center justify-center overflow-hidden">
            {isPDF ? (
              <iframe
                src={`${document.file_url}#toolbar=1`}
                className="w-full h-full border-0"
                title={document.file_name || "PDF Viewer"}
              />
            ) : isImage ? (
              <img
                src={document.file_url}
                alt={document.file_name || "Document"}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  No se puede previsualizar este tipo de archivo
                </p>
                <p className="text-sm text-muted-foreground">
                  Tipo: {getFileExtension()?.toUpperCase() || "Desconocido"}
                </p>
                <Button onClick={handleDownload} disabled={isLoading} variant="outline">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "Descargando..." : "Descargar documento"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;
