import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, CheckCircle2, Sliders, Lock } from 'lucide-react';

interface AdapterConfigField {
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'secret';
  required: boolean;
  sensitive: boolean;
  value?: any;
  configured?: boolean;
}

interface AdapterConfigResponse {
  slug: string;
  name: string;
  fields: AdapterConfigField[];
}

interface AdapterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'game' | 'provider';
  entityId: string;
  entityName: string;
  apiService: {
    getConfig: (id: string) => Promise<AdapterConfigResponse>;
    saveConfig: (id: string, values: Record<string, any>) => Promise<any>;
  };
}

export function AdapterConfigModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  apiService,
}: AdapterConfigModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [configData, setConfigData] = useState<AdapterConfigResponse | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !entityId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    apiService
      .getConfig(entityId)
      .then((res: any) => {
        const data = res?.fields ? res : res?.data || res;
        setConfigData(data);
        const initialValues: Record<string, any> = {};
        if (data?.fields) {
          data.fields.forEach((field: AdapterConfigField) => {
            initialValues[field.key] = field.sensitive ? '' : field.value ?? '';
          });
        }
        setFormValues(initialValues);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load adapter configuration schema');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, entityId]);

  const handleChange = (key: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await apiService.saveConfig(entityId, formValues);
      setSuccess('Configuration saved and encrypted successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${entityName} Configuration`}
      description={`Dynamic adapter configuration settings for ${entityType} '${entityName}'`}
      maxWidth="xl"
    >
      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {configData?.fields && configData.fields.length > 0 ? (
            <div className="space-y-5">
              {configData.fields.map((field) => (
                <div key={field.key} className="space-y-2 p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-200 tracking-wide flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-rose-400 text-sm">*</span>}
                    </label>
                    {field.sensitive && (
                      <Badge variant="purple" className="text-xs py-1 px-2.5 flex items-center gap-1.5 font-medium">
                        <Lock className="w-3 h-3" />
                        Encrypted Secret
                      </Badge>
                    )}
                  </div>

                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-3.5 p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formValues[field.key])}
                        onChange={(e) => handleChange(field.key, e.target.checked)}
                        className="w-5 h-5 accent-indigo-500 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-zinc-300">
                        {field.description || `Enable ${field.label}`}
                      </span>
                    </label>
                  ) : field.type === 'secret' ? (
                    <Input
                      type="password"
                      placeholder={
                        field.configured
                          ? '•••••••••••• (Leave empty to keep existing secret)'
                          : 'Enter secret value...'
                      }
                      value={formValues[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      hint={field.description}
                    />
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      value={formValues[field.key] ?? ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      hint={field.description}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400 text-base border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30">
              <Sliders className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              This adapter does not require any dynamic configuration fields.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-5 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={onClose} size="md">
              Cancel
            </Button>
            {configData?.fields && configData.fields.length > 0 && (
              <Button variant="primary" type="submit" isLoading={submitting} size="md">
                Save Configuration
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
