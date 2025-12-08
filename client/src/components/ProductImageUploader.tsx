import { useState, useCallback, useEffect } from "react";
import { Camera, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ObjectUploader } from "./ObjectUploader";
import { apiRequest } from "@/lib/queryClient";

interface ProductImageUploaderProps {
  currentImageUrl?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
}

export function ProductImageUploader({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  disabled = false,
}: ProductImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const getUploadUrl = useCallback(async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  }, []);

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
  }, []);

  const handleUploadError = useCallback(() => {
    setIsUploading(false);
  }, []);

  const normalizeObjectPath = useCallback((signedUrl: string): string => {
    try {
      const url = new URL(signedUrl);
      const pathname = url.pathname;
      const uploadsMatch = pathname.match(/\/uploads\/([a-f0-9-]+)/i);
      if (uploadsMatch) {
        return `/objects/uploads/${uploadsMatch[1]}`;
      }
      return signedUrl.split("?")[0];
    } catch {
      return signedUrl.split("?")[0];
    }
  }, []);

  const handleUploadComplete = useCallback(
    (result: { successful?: Array<{ uploadURL?: string }> }) => {
      setIsUploading(false);
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        if (uploadedFile.uploadURL) {
          const normalizedPath = normalizeObjectPath(uploadedFile.uploadURL);
          setPreviewUrl(normalizedPath);
          onImageUploaded(normalizedPath);
        }
      }
    },
    [onImageUploaded, normalizeObjectPath]
  );

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl(null);
    onImageRemoved?.();
  }, [onImageRemoved]);

  const getImageSrc = (url: string | null): string | null => {
    if (!url) return null;
    if (url.startsWith("/objects/")) {
      return url;
    }
    if (url.startsWith("https://")) {
      return url;
    }
    return url;
  };

  const imageSrc = getImageSrc(previewUrl);

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-muted rounded-md overflow-hidden border border-border">
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt="Product preview"
              className="w-full h-full object-cover"
              data-testid="img-product-preview"
            />
            {!disabled && (
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                type="button"
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2" />
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={10485760}
          allowedFileTypes={["image/*"]}
          onGetUploadParameters={getUploadUrl}
          onUploadStart={handleUploadStart}
          onComplete={handleUploadComplete}
          onError={handleUploadError}
          buttonVariant="outline"
          buttonSize="default"
          disabled={disabled || isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Enviar Imagem
        </ObjectUploader>

        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={10485760}
          allowedFileTypes={["image/*"]}
          onGetUploadParameters={getUploadUrl}
          onUploadStart={handleUploadStart}
          onComplete={handleUploadComplete}
          onError={handleUploadError}
          buttonVariant="outline"
          buttonSize="default"
          disabled={disabled || isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </ObjectUploader>
      </div>
    </div>
  );
}
