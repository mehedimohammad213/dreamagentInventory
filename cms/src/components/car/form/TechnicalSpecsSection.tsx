import React, { useMemo } from "react";
import { Settings } from "lucide-react";
import { CreateCarData, CarFilterOptions } from "../../../services/carApi";
import FormField from "./FormField";
import SelectField from "./SelectField";
import {
  fuelTypes,
  transmissionTypes,
  drivetrainTypes,
} from "../../../utils/carData";

interface TechnicalSpecsSectionProps {
  formData: CreateCarData;
  errors: Record<string, string>;
  filterOptions?: CarFilterOptions | null;
  isViewMode: boolean;
  onInputChange: (field: keyof CreateCarData, value: any) => void;
}

const TechnicalSpecsSection: React.FC<TechnicalSpecsSectionProps> = ({
  formData,
  errors,
  filterOptions,
  isViewMode,
  onInputChange,
}) => {
  const fuelOptions = useMemo(() => {
    const merged = new Set<string>([
      ...(filterOptions?.fuels ?? []),
      ...fuelTypes,
    ]);
    const cur = formData.fuel?.trim();
    if (cur) merged.add(cur);
    return Array.from(merged).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [filterOptions?.fuels, formData.fuel]);

  const transmissionOptions = useMemo(() => {
    const merged = new Set<string>([
      ...(filterOptions?.transmissions ?? []),
      ...transmissionTypes,
    ]);
    const cur = formData.transmission?.trim();
    if (cur) merged.add(cur);
    return Array.from(merged).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [filterOptions?.transmissions, formData.transmission]);

  const drivetrainOptions = useMemo(() => {
    const merged = new Set<string>([
      ...(filterOptions?.drives ?? []),
      ...drivetrainTypes,
    ]);
    const cur = formData.drive?.trim();
    if (cur) merged.add(cur);
    return Array.from(merged).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [filterOptions?.drives, formData.drive]);

  return (
    <div className="rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary-600" />
        Technical Specifications
      </h3>
      <div className="space-y-6">
        {/* Row 1 — five fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <FormField
            label="Mileage"
            field="mileage_km"
            type="number"
            placeholder="e.g., 50000"
            required={false}
            value={formData.mileage_km}
            error={errors.mileage_km}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("mileage_km", value)}
          />
          <FormField
            label="Chassis Number"
            field="chassis_no_full"
            type="text"
            placeholder="Complete chassis number"
            required={false}
            maxLength={64}
            value={formData.chassis_no_full}
            error={errors.chassis_no_full}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("chassis_no_full", value)}
          />
          <FormField
            label="Engine Capacity"
            field="engine_cc"
            type="number"
            placeholder="e.g., 2000"
            required={false}
            value={formData.engine_cc}
            error={errors.engine_cc}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("engine_cc", value)}
          />
          <SelectField
            label="Fuel Type"
            field="fuel"
            options={fuelOptions.map((v) => ({ value: v, label: v }))}
            required={false}
            placeholder="Select Fuel Type"
            value={formData.fuel}
            error={errors.fuel}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("fuel", value ?? "")}
          />
          <SelectField
            label="Transmission"
            field="transmission"
            options={transmissionOptions.map((v) => ({
              value: v,
              label: v,
            }))}
            required={false}
            placeholder="Select Transmission"
            value={formData.transmission}
            error={errors.transmission}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("transmission", value ?? "")}
          />
        </div>

        {/* Row 2 — five fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SelectField
            label="Drivetrain"
            field="drive"
            options={drivetrainOptions.map((v) => ({
              value: v,
              label: v,
            }))}
            required={false}
            placeholder="Select Drivetrain"
            value={formData.drive}
            error={errors.drive}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("drive", value ?? "")}
          />
          <FormField
            label="Engine Number"
            field="engine_number"
            type="text"
            placeholder="Engine identification number"
            required={false}
            maxLength={64}
            value={formData.engine_number}
            error={errors.engine_number}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("engine_number", value)}
          />
          <FormField
            label="Seats"
            field="seats"
            type="number"
            placeholder="e.g., 5"
            required={false}
            value={formData.seats}
            error={errors.seats}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("seats", value)}
          />
          <FormField
            label="Number of Keys"
            field="number_of_keys"
            type="number"
            placeholder="e.g., 2, 3"
            required={false}
            value={formData.number_of_keys}
            error={errors.number_of_keys}
            isViewMode={isViewMode}
            onChange={(value) =>
              onInputChange(
                "number_of_keys",
                value ? Number(value) : undefined
              )
            }
          />
          <FormField
            label="Key Features"
            field="keys_feature"
            type="text"
            placeholder="e.g., Keyless entry, Remote start"
            required={false}
            value={formData.keys_feature}
            error={errors.keys_feature}
            isViewMode={isViewMode}
            onChange={(value) => onInputChange("keys_feature", value)}
          />
        </div>
      </div>
    </div>
  );
};

export default TechnicalSpecsSection;
