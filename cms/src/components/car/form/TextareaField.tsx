import React from "react";

interface TextareaFieldProps {
  label: string;
  field: string;
  placeholder?: string;
  maxLength?: number;
  value: any;
  error?: string;
  isViewMode?: boolean;
  onChange: (value: any) => void;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  field,
  placeholder = "",
  maxLength,
  value,
  error,
  isViewMode = false,
  onChange,
}) => {
  if (isViewMode) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 min-h-[100px]">
          {value || "Not specified"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
          error ? "border-red-300" : "border-gray-200"
        }`}
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default TextareaField;
