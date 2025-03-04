import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/util/utils";

interface ToasterProps {
  position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center";
}

export function Toaster({ position = "bottom-right" }: ToasterProps) {
  const { toasts } = useToast();

  const viewportClassNames = {
    "top-left": "top-0 left-0 flex-col-reverse gap-2 p-4",
    "top-right": "top-0 right-0 flex-col-reverse gap-2 p-4",
    "top-center": "top-0 left-1/2 -translate-x-1/2 flex-col-reverse gap-2 p-4",
    "bottom-left": "bottom-0 left-0 flex-col gap-2 p-4",
    "bottom-right": "bottom-0 right-0 flex-col gap-2 p-4",
    "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 flex-col gap-2 p-4",
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport className={viewportClassNames[position]} />
    </ToastProvider>
  );
}
