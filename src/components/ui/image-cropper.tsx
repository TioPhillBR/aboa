import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
  aspectRatio?: number;
  circularCrop?: boolean;
  outputSize?: number; // Tamanho final do output em pixels (width = height para ratio 1:1)
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropper({
  imageSrc,
  open,
  onClose,
  onCropComplete,
  aspectRatio = 1,
  circularCrop = false,
  outputSize = 400,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
  const [imgNaturalHeight, setImgNaturalHeight] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state quando o dialog abre com nova imagem
  useEffect(() => {
    if (open && imageSrc) {
      setScale(1);
      setRotate(0);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [open, imageSrc]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
      setImgNaturalWidth(naturalWidth);
      setImgNaturalHeight(naturalHeight);
      
      const newCrop = centerAspectCrop(width, height, aspectRatio);
      setCrop(newCrop);
    },
    [aspectRatio],
  );

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleRotateLeft = () => {
    setRotate((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotate((prev) => prev + 90);
  };

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  };

  // Função melhorada para gerar imagem cortada mantendo proporção
  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    // Criar canvas offscreen
    const offscreen = document.createElement('canvas');
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    // Calcular escala entre imagem exibida e natural
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Dimensões do crop na imagem natural
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Calcular dimensões finais mantendo aspect ratio
    let finalWidth = outputSize;
    let finalHeight = outputSize;
    
    if (aspectRatio !== 1) {
      if (aspectRatio > 1) {
        finalHeight = outputSize / aspectRatio;
      } else {
        finalWidth = outputSize * aspectRatio;
      }
    }

    // Configurar canvas final
    offscreen.width = finalWidth;
    offscreen.height = finalHeight;

    // Configurações de qualidade
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fundo branco para evitar transparência em JPG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Aplicar transformações
    ctx.save();
    
    // Mover para o centro para rotação
    ctx.translate(finalWidth / 2, finalHeight / 2);
    
    // Aplicar rotação
    ctx.rotate((rotate * Math.PI) / 180);
    
    // Voltar ao canto superior esquerdo
    ctx.translate(-finalWidth / 2, -finalHeight / 2);

    // Desenhar a imagem cortada com scale aplicado
    // Precisamos criar um canvas temporário para aplicar o crop primeiro
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;

    // Tamanho do canvas temporário baseado no crop escalado
    tempCanvas.width = cropWidth * scale;
    tempCanvas.height = cropHeight * scale;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    // Aplicar scale ao desenhar no canvas temporário
    tempCtx.save();
    tempCtx.scale(scale, scale);
    
    // Desenhar a parte cortada da imagem original
    tempCtx.drawImage(
      image,
      cropX / scale + (cropWidth - cropWidth / scale) / 2, // Ajustar posição X com zoom
      cropY / scale + (cropHeight - cropHeight / scale) / 2, // Ajustar posição Y com zoom
      cropWidth / scale,
      cropHeight / scale,
      0,
      0,
      cropWidth,
      cropHeight
    );
    
    tempCtx.restore();

    // Desenhar o canvas temporário no canvas final, redimensionando
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
      0,
      0,
      finalWidth,
      finalHeight
    );

    ctx.restore();

    return new Promise((resolve) => {
      offscreen.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.92,
      );
    });
  }, [completedCrop, rotate, scale, aspectRatio, outputSize]);

  // Abordagem alternativa mais simples - usar a imagem visível diretamente
  const getCroppedImgSimple = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Calcular dimensões finais
    let finalWidth = outputSize;
    let finalHeight = outputSize;
    
    if (aspectRatio !== 1) {
      if (aspectRatio > 1) {
        finalHeight = Math.round(outputSize / aspectRatio);
      } else {
        finalWidth = Math.round(outputSize * aspectRatio);
      }
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // Calcular proporções
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Área de crop em coordenadas naturais
    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    // Aplicar rotação se necessário
    if (rotate !== 0) {
      ctx.translate(finalWidth / 2, finalHeight / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-finalWidth / 2, -finalHeight / 2);
    }

    // Ajustar pelo scale (zoom)
    // Quando scale > 1, precisamos recortar uma área menor da imagem fonte
    const effectiveSourceWidth = sourceWidth / scale;
    const effectiveSourceHeight = sourceHeight / scale;
    const offsetX = (sourceWidth - effectiveSourceWidth) / 2;
    const offsetY = (sourceHeight - effectiveSourceHeight) / 2;

    ctx.drawImage(
      image,
      sourceX + offsetX,
      sourceY + offsetY,
      effectiveSourceWidth,
      effectiveSourceHeight,
      0,
      0,
      finalWidth,
      finalHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.92,
      );
    });
  }, [completedCrop, rotate, scale, aspectRatio, outputSize]);

  const handleConfirm = async () => {
    const croppedBlob = await getCroppedImgSimple();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  };

  const handleClose = () => {
    setScale(1);
    setRotate(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ZoomIn className="h-5 w-5" />
            Ajustar Imagem
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Área de crop */}
          <div 
            className="relative bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center"
            style={{ minHeight: '280px', maxHeight: '380px' }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={circularCrop}
              keepSelection
              className="max-h-[380px]"
            >
              <img
                ref={imgRef}
                alt="Imagem para recorte"
                src={imageSrc}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '380px',
                  maxWidth: '100%',
                  display: 'block',
                  objectFit: 'contain',
                }}
                onLoad={onImageLoad}
                crossOrigin="anonymous"
              />
            </ReactCrop>
          </div>

          {/* Controles */}
          <div className="space-y-3 px-1">
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <Label className="w-16 text-sm font-medium">Zoom</Label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[scale * 100]}
                onValueChange={(value) => setScale(value[0] / 100)}
                min={50}
                max={300}
                step={5}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-14 text-right tabular-nums">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Rotação */}
            <div className="flex items-center gap-3">
              <Label className="w-16 text-sm font-medium">Rotação</Label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRotateLeft}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Slider
                value={[rotate + 180]}
                onValueChange={(value) => setRotate(value[0] - 180)}
                min={0}
                max={360}
                step={1}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRotateRight}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-14 text-right tabular-nums">
                {rotate}°
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="gap-2"
            disabled={!completedCrop}
          >
            <Check className="h-4 w-4" />
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
