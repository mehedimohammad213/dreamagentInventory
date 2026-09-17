import React, { useEffect } from "react";
import { X } from "lucide-react";
import UserDrawerForm from "./UserDrawerForm";
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from "../../services/userApi";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  user?: User | null;
  onSubmit: (data: CreateUserPayload | UpdateUserPayload) => void;
  isSubmitting?: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  title,
  user,
  onSubmit,
  isSubmitting = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2
            id="user-form-modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <UserDrawerForm
            user={user}
            onSubmit={onSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
