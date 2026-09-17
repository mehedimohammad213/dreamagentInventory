import React from "react";
import { FileText } from "lucide-react";
import { CreateCarData } from "../../../services/carApi";
import TextareaField from "./TextareaField";

interface NotesSectionProps {
  formData: CreateCarData;
  errors: Record<string, string>;
  isViewMode: boolean;
  onInputChange: (field: keyof CreateCarData, value: any) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  formData,
  errors,
  isViewMode,
  onInputChange,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-600" />
        Additional Information
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {/* Notes */}
        <TextareaField
          label="Notes"
          field="notes"
          placeholder="Additional notes about the car..."
          maxLength={1000}
          value={formData.notes}
          error={errors.notes}
          isViewMode={isViewMode}
          onChange={(value) => onInputChange("notes", value)}
        />
      </div>
    </div>
  );
};

export default NotesSection;
