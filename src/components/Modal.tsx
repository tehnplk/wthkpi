"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ children, isOpen, title, subtitle, onClose, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={`modal-panel modal-${size}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            {subtitle && (
              <p className="text-sm text-[var(--muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            <X size={17} aria-hidden="true" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
