"use client";

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-drawer-title"
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2
            id="user-form-drawer-title"
            className="text-lg font-semibold text-gray-900"
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
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
