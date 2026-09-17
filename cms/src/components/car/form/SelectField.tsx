import React from "react";

interface SelectOption {
  value: any;
  label: string;
}

interface SelectFieldProps {
  label: string;
  field: string;
  options: SelectOption[];
  required?: boolean;
  placeholder?: string;
  value: any;
  error?: string;
  isViewMode?: boolean;
  disabled?: boolean;
  onChange: (value: any) => void;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  field,
  options,
  required = false,
  placeholder = "Select...",
  value,
  error,
  isViewMode = false,
  disabled = false,
  onChange,
}) => {
  if (isViewMode) {
    const selectedOption = options.find((opt) => opt.value === value);
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
          {selectedOption?.label || "Not specified"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ""}
        onChange={(e) =>
          onChange(
            e.target.value
              ? field === "category_id"
                ? parseInt(e.target.value)
                : e.target.value
              : null
          )
        }
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 ${error ? "border-red-300" : "border-gray-200"
          } ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white dark:bg-gray-800 dark:text-gray-100"}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SelectField;
