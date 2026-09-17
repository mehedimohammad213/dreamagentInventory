import React from "react";
import { MapPin } from "lucide-react";
import { CreateCarData } from "../../../services/carApi";
import FormField from "./FormField";
import SelectField from "./SelectField";

interface LocationStatusSectionProps {
  formData: CreateCarData;
  errors: Record<string, string>;
  isViewMode: boolean;
  onInputChange: (field: keyof CreateCarData, value: any) => void;
}

const LocationStatusSection: React.FC<LocationStatusSectionProps> = ({
  formData,
  errors,
  isViewMode,
  onInputChange,
}) => {
  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "available", label: "Available" },
    { value: "sold", label: "Sold" },
    { value: "reserved", label: "Reserved" },
    { value: "in_transit", label: "In Transit" },
    { value: "preorder", label: "Preorder" },
  ];

  return (
    <div className="rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-600" />
        Location & Status
      </h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="Location"
            field="location"
            type="text"
            placeholder="e.g., Tokyo, Japan"
            required={false}
            maxLength={128}
            value={formData.location}
            error={errors.location}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("location", value)}
          />
          <FormField
            label="Country of Origin"
            field="country_origin"
            type="text"
            placeholder="e.g., Japan, Germany, USA, UK"
            required={false}
            maxLength={64}
            value={formData.country_origin}
            error={errors.country_origin}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("country_origin", value)}
          />
          <div className="w-full">
            <SelectField
              label="Status"
              field="status"
              options={statusOptions}
              required={false}
              placeholder="Select Status"
              value={formData.status}
              error={errors.status}
              isViewMode={isViewMode}
              onChange={(value) => onInputChange("status", value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationStatusSection;
