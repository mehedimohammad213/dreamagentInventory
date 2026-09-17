import React from "react";
import { Star } from "lucide-react";
import { CreateCarData } from "../../../services/carApi";
import FormField from "./FormField";

interface GradingSectionProps {
  formData: CreateCarData;
  errors: Record<string, string>;
  isViewMode: boolean;
  onInputChange: (field: keyof CreateCarData, value: any) => void;
}

const GradingSection: React.FC<GradingSectionProps> = ({
  formData,
  errors,
  isViewMode,
  onInputChange,
}) => {
  // Auction Grade options: S,6,5,4.5,4,3.5,3,2,1,R,RA,R1,RA!
  const overallGradeOptions = ["S", "6", "5", "4.5", "4", "3.5", "3", "2", "1", "R", "RA", "R1", "RA1"];

  // Exterior Grade options: A,B,C,D,E
  const exteriorGradeOptions = ["A", "B", "C", "D", "E"];

  // Interior Grade options: A,B,C,D,E
  const interiorGradeOptions = ["A", "B", "C", "D", "E"];

  return (
    <div className="rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-primary-600" />
        Grading
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Auction Grade */}
        <FormField
          label="Auction Grade"
          field="grade_overall"
          type="text"
          required={false}
          value={formData.grade_overall}
          error={errors.grade_overall}
          isViewMode={isViewMode}
          onChange={(value) => onInputChange("grade_overall", value)}
          options={overallGradeOptions}
        />

        {/* Exterior Grade */}
        <FormField
          label="Exterior Grade"
          field="grade_exterior"
          type="text"
          required={false}
          value={formData.grade_exterior}
          error={errors.grade_exterior}
          isViewMode={isViewMode}
          onChange={(value) => onInputChange("grade_exterior", value)}
          options={exteriorGradeOptions}
        />

        {/* Interior Grade */}
        <FormField
          label="Interior Grade"
          field="grade_interior"
          type="text"
          required={false}
          value={formData.grade_interior}
          error={errors.grade_interior}
          isViewMode={isViewMode}
          onChange={(value) => onInputChange("grade_interior", value)}
          options={interiorGradeOptions}
        />
      </div>
    </div>
  );
};

export default GradingSection;
