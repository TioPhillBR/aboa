import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Upload, Link, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'images',
  folder = 'uploads',
  label,
  placeholder = 'https://...',
  className,
  aspectRatio = 'auto',
  maxSizeMB = 5,
}: ImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const [activeTab, setActiveTab] = useState<string>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'aspect-auto min-h-[120px]',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: `O tamanho máximo permitido é ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Não autenticado',
          description: 'Você precisa estar logado para fazer upload',
          variant: 'destructive',
        });
        return;
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onChange(publicUrl);
      setUrlInput(publicUrl);

      toast({
        title: 'Upload concluído!',
        description: 'A imagem foi carregada com sucesso',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível carregar a imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      toast({
        title: 'URL definida',
        description: 'A URL da imagem foi salva',
      });
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}

      {/* Preview da imagem */}
      {value && (
        <div className={cn(
          'relative rounded-lg border bg-muted/50 overflow-hidden',
          aspectRatioClass[aspectRatio]
        )}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Área de upload/URL */}
      {!value && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3">
            <div
              className={cn(
                'relative rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted',
                aspectRatioClass[aspectRatio],
                'flex flex-col items-center justify-center cursor-pointer'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Máx. {maxSizeMB}MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-3 space-y-3">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
            >
              Usar esta URL
            </Button>
          </TabsContent>
        </Tabs>
      )}

      {/* Input de URL visível quando já tem imagem (para editar) */}
      {value && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || urlInput === value}
          >
            Atualizar
          </Button>
        </div>
      )}
    </div>
  );
}
