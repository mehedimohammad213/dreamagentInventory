"use client";

import React, { useEffect, useState } from "react";

interface ChassisLookupModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  submitLabel?: string;
  validatingLabel?: string;
  onClose: () => void;
  onValidate: (chassis: string) => Promise<string | void>;
}

const ChassisLookupModal: React.FC<ChassisLookupModalProps> = ({
  isOpen,
  title,
  description = "Enter the vehicle's chassis number to proceed.",
  placeholder = "Enter unique chassis number...",
  submitLabel = "Proceed",
  validatingLabel = "Validating...",
  onClose,
  onValidate,
}) => {
  const [chassisInput, setChassisInput] = useState("");
  const [chassisError, setChassisError] = useState("");
  const [isCheckingChassis, setIsCheckingChassis] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setChassisInput("");
    setChassisError("");
    setIsCheckingChassis(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chassisInput.trim()) {
      setChassisError("Chassis number is required.");
      return;
    }

    setIsCheckingChassis(true);
    setChassisError("");

    try {
      const error = await onValidate(chassisInput.trim());
      if (error) {
        setChassisError(error);
      }
    } catch (err) {
      console.error("Error validating chassis:", err);
      setChassisError(
        "An error occurred while validating the chassis number. Please try again."
      );
    } finally {
      setIsCheckingChassis(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={() => {
          if (!isCheckingChassis) onClose();
        }}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 scale-100">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-5">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-primary-100 text-xs mt-1">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="chassis_lookup_input"
              className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
            >
              Chassis Number
            </label>
            <input
              type="text"
              id="chassis_lookup_input"
              value={chassisInput}
              disabled={isCheckingChassis}
              onChange={(e) => {
                setChassisInput(e.target.value);
                if (chassisError) setChassisError("");
              }}
              placeholder={placeholder}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 font-semibold text-sm shadow-sm transition-all duration-200 ${
                chassisError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600"
              } ${isCheckingChassis ? "opacity-50 cursor-not-allowed" : ""}`}
              autoFocus
            />
            {chassisError && (
              <div className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <svg
                  className="w-4 h-4 shrink-0 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{chassisError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isCheckingChassis}
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-xl transition-colors border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCheckingChassis}
              className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-primary-600/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isCheckingChassis && (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {isCheckingChassis ? validatingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChassisLookupModal;
