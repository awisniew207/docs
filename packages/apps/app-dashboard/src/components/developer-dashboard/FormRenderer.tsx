import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { EntitySelector } from './EntitySelector';
import { useState, useEffect } from 'react';
import { processImageUpload, cleanupPreviewUrl } from '@/utils/developer-dashboard/imageUtils';

interface FormRendererProps {
  schema: any;
  onSubmit: (data: any) => void | Promise<void>;
  title: string;
  description?: string;
  defaultValues?: any;
  initialData?: any;
  isLoading?: boolean;
  hiddenFields?: string[];
  hideHeader?: boolean;
}

export function FormRenderer({
  schema,
  onSubmit,
  title,
  description,
  defaultValues = {},
  initialData = {},
  isLoading = false,
  hiddenFields = [],
  hideHeader = false,
}: FormRendererProps) {
  const finalValues = { ...defaultValues, ...initialData };

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        cleanupPreviewUrl(imagePreview);
      }
    };
  }, [imagePreview]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: finalValues as any,
    mode: 'onChange',
  });

  const watchedValues = watch();

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldKey: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearErrors(fieldKey as any);
    if (imagePreview) {
      cleanupPreviewUrl(imagePreview);
      setImagePreview(null);
    }

    setIsUploading(true);

    try {
      const { base64String, previewUrl } = await processImageUpload(file);
      setImagePreview(previewUrl);
      setValue(fieldKey as any, base64String);
    } catch (error) {
      console.error('Error during image upload:', error);
      event.target.value = '';

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process image. Please try again.';
      setError(fieldKey as any, { message: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = (fieldKey: string) => {
    setValue(fieldKey as any, '');
    if (imagePreview) {
      cleanupPreviewUrl(imagePreview);
      setImagePreview(null);
    }
    clearErrors(fieldKey as any);
  };

  const renderField = (key: string, fieldSchema: any) => {
    const error = (errors as any)[key]?.message as string | undefined;

    const metadata = fieldSchema._def?.openapi?.metadata || {};
    const describeDescription = fieldSchema._def?.description;

    // Handle ZodEffects (created by .refine()) - check innerType for description
    let actualDescription = describeDescription;
    if (
      fieldSchema._def?.typeName === 'ZodEffects' &&
      fieldSchema._def?.schema?._def?.description
    ) {
      actualDescription = fieldSchema._def.schema._def.description;
    }

    const placeholder = metadata.description || actualDescription || '';
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

    // Handle ZodOptional wrapper - get the inner type (recursively unwrap multiple layers)
    let innerSchema = fieldSchema;
    while (innerSchema._def?.typeName === 'ZodOptional') {
      innerSchema = innerSchema._def.innerType;
    }

    // Special handling for logo field - render as image upload
    if (key === 'logo' && innerSchema._def?.typeName === 'ZodString') {
      const currentValue = (watchedValues as any)[key];
      const hasImage = currentValue || imagePreview;

      return (
        <div key={key} className="mb-3">
          <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
            {label}
          </label>
          <div className="space-y-2">
            <input
              type="file"
              id={key}
              accept="image/jpeg,image/jpg,image/gif"
              onChange={(e) => handleImageUpload(e, key)}
              disabled={isUploading}
              aria-describedby={`${key}-help`}
              className={`w-full px-2 py-1.5 text-sm border rounded-md border-gray-300 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <div id={`${key}-help`} className="text-xs text-gray-600">
              Upload a square JPG, JPEG, or GIF image (max 5MB)
            </div>

            {isUploading && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                <span>Processing image...</span>
              </div>
            )}

            {hasImage && !isUploading && (
              <div className="mt-2">
                <img
                  src={imagePreview || currentValue}
                  alt="Logo preview"
                  className="max-w-32 max-h-32 object-contain rounded border bg-gray-50"
                />
              </div>
            )}

            {hasImage && !isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleImageRemove(key)}
              >
                Remove Image
              </Button>
            )}
          </div>
          {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        </div>
      );
    }

    // Special handling for tools field - render as EntitySelector
    if ((key === 'tools' || key === 'policies') && innerSchema._def?.typeName === 'ZodArray') {
      const currentValues = (watchedValues as any)[key] || [];
      return (
        <div key={key} className="mb-3">
          <EntitySelector
            entityType="tool"
            selectedEntities={currentValues}
            onChange={(selectedTools) => {
              // Store the complete tool objects so we have version info
              setValue(key, selectedTools);
            }}
            error={error}
          />
        </div>
      );
    }

    // Number Field
    if (innerSchema._def?.typeName === 'ZodNumber') {
      return (
        <div key={key} className="mb-3">
          <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            {...register(key as any, { valueAsNumber: true })}
            type="number"
            id={key}
            className={`w-full px-2 py-1.5 text-sm border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={placeholder}
          />
          {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        </div>
      );
    }

    // String Field
    if (innerSchema._def?.typeName === 'ZodString') {
      // Email Field
      if (innerSchema._def?.checks?.some((check: any) => check.kind === 'email')) {
        return (
          <div key={key} className="mb-3">
            <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              {...register(key as any)}
              type="email"
              id={key}
              className={`w-full px-2 py-1.5 text-sm border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={placeholder}
            />
            {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
          </div>
        );
      }

      // URL Field
      if (innerSchema._def?.checks?.some((check: any) => check.kind === 'url')) {
        return (
          <div key={key} className="mb-3">
            <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              {...register(key as any)}
              type="url"
              id={key}
              className={`w-full px-2 py-1.5 text-sm border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={placeholder}
            />
            {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
          </div>
        );
      }

      // Long Text Field
      const isLongText =
        key.toLowerCase().includes('description') || key.toLowerCase().includes('changes');

      if (isLongText) {
        return (
          <div key={key} className="mb-3">
            <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
              {label}
            </label>
            <textarea
              {...register(key as any)}
              id={key}
              rows={2}
              className={`w-full px-2 py-1.5 text-sm border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
              placeholder={placeholder}
            />
            {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
          </div>
        );
      }

      // Regular text input
      return (
        <div key={key} className="mb-3">
          <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
            {label}
          </label>
          <input
            {...register(key as any)}
            type="text"
            id={key}
            className={`w-full px-2 py-1.5 text-sm border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={key === 'confirmation' ? '' : placeholder}
          />
          {/* Show placeholder as helper text for confirmation fields with long text */}
          {key === 'confirmation' && placeholder && (
            <p className="text-xs text-gray-600 mt-1">{placeholder}</p>
          )}
          {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        </div>
      );
    }

    // Enum Field
    if (innerSchema._def?.typeName === 'ZodEnum') {
      const options = innerSchema._def.values;
      return (
        <div key={key} className="mb-3">
          <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
            {label}
          </label>
          <select
            {...register(key as any)}
            id={key}
            className={`w-full px-2 py-1.5 text-sm border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        </div>
      );
    }

    // Array Field
    if (innerSchema._def?.typeName === 'ZodArray') {
      const currentValues = (watchedValues as any)[key] || [''];

      const elementSchema = innerSchema._def.type;
      const inputType = elementSchema?._def?.checks?.some((check: any) => check.kind === 'url')
        ? 'url'
        : 'text';

      return (
        <div key={key} className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
          {currentValues.map((value: string, index: number) => {
            const itemError = (errors as any)[key]?.[index]?.message;
            return (
              <div key={index} className="mb-1">
                <div className="flex gap-2">
                  <input
                    type={inputType}
                    value={value}
                    onChange={(e) => {
                      const newValues = [...currentValues];
                      newValues[index] = e.target.value;
                      setValue(key as any, newValues, { shouldValidate: true });
                    }}
                    className={`flex-1 px-2 py-1.5 text-sm border rounded-md ${itemError ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder={placeholder}
                  />
                  {currentValues.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        const newValues = currentValues.filter((_: any, i: number) => i !== index);
                        setValue(key as any, newValues, { shouldValidate: true });
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {itemError && <p className="text-red-500 text-xs mt-0.5">{itemError}</p>}
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs mt-1"
            onClick={() => setValue(key as any, [...currentValues, ''], { shouldValidate: true })}
          >
            + Add
          </Button>
          {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        </div>
      );
    }

    // Fallback to text input
    // NOTE: This shouldn't be needed so long as we're doing everything right, but having a fallback is better than nothing
    return (
      <div key={key} className="mb-3">
        <label htmlFor={key} className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input
          {...register(key as any)}
          type="text"
          id={key}
          className={`w-full px-2 py-1.5 text-sm border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={key === 'confirmation' ? '' : placeholder}
        />
        {/* Show placeholder as helper text for confirmation fields with long text */}
        {key === 'confirmation' && placeholder && (
          <p className="text-xs text-gray-600 mt-1">{placeholder}</p>
        )}
        {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
      </div>
    );
  };

  const schemaShape = (schema as any).shape;

  const handleFormSubmit: SubmitHandler<any> = async (data) => {
    await onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {!hideHeader && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
          {description && <p className="text-gray-600 text-sm mb-4">{description}</p>}
        </>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
        {Object.entries(schemaShape)
          .filter(([key]) => !hiddenFields.includes(key))
          .map(([key, fieldSchema]) => renderField(key, fieldSchema))}

        <Button type="submit" disabled={!isValid || isLoading} className="w-full h-9 text-sm">
          {isLoading ? 'Loading...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}
