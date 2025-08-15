import { toast as sonnerToast } from "sonner";

// Wrapper to make sonner compatible with object-based toast API
export const toast = (options) => {
  if (typeof options === 'string') {
    // If it's just a string, show it directly
    return sonnerToast(options);
  }

  if (typeof options === 'object') {
    const { title, description, variant, ...rest } = options;
    
    // Handle different variants
    if (variant === 'destructive') {
      return sonnerToast.error(title, {
        description,
        ...rest
      });
    }
    
    if (variant === 'success') {
      return sonnerToast.success(title, {
        description,
        ...rest
      });
    }

    // Default toast
    return sonnerToast(title, {
      description,
      ...rest
    });
  }

  // Fallback
  return sonnerToast('Notification');
};
