import toast, { type ToastOptions } from 'react-hot-toast'

const baseStyle: ToastOptions['style'] = {
  borderRadius: '12px',
  background: '#ffffff',
  color: '#1f2937',
  border: '1px solid #fed7aa',
  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  fontSize: '14px',
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  style: baseStyle,
}

export const showSuccessToast = (message: string, options?: ToastOptions) =>
  toast.success(message, {
    ...defaultOptions,
    iconTheme: {
      primary: '#f97316',
      secondary: '#ffffff',
    },
    ...options,
  })

export const showErrorToast = (message: string, options?: ToastOptions) =>
  toast.error(message, {
    ...defaultOptions,
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
    ...options,
  })

export const showInfoToast = (message: string, options?: ToastOptions) =>
  toast(message, {
    ...defaultOptions,
    ...options,
  })
