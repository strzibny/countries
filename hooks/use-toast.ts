import { toast } from 'sonner'

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const showToast = ({ title, description, variant }: ToastOptions) => {
    if (variant === 'destructive') {
      toast.error(title, {
        description,
      })
    } else {
      toast.success(title, {
        description,
      })
    }
  }

  return {
    toast: showToast,
  }
}
