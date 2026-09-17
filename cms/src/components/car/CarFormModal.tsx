import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Car as CarType,
  CreateCarData,
  CarFilterOptions,
} from "../../services/carApi";
import { Category } from "../../services/categoryApi";
import {
  BasicInfoSection,
  TechnicalSpecsSection,
  GradingSection,
  LocationStatusSection,
  // PricingSection,
  NotesSection,
  PhotoSection,
  CarDetailsSection,
  AttachedFileSection,
} from "./form";

interface CarFormModalProps {
  mode: "create" | "update" | "view";
  car?: CarType | null;
  categories: Category[];
  filterOptions: CarFilterOptions | null;
  onSubmit?: (data: CreateCarData | FormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isModal?: boolean;
}

const CarFormModal: React.FC<CarFormModalProps> = ({
  mode,
  car,
  categories,
  filterOptions,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isModal = false,
}) => {
  const [formData, setFormData] = useState<CreateCarData>({
    category_id: undefined,
    subcategory_id: undefined,
    ref_no: "",
    code: "",
    make: "",
    model: "",
    model_code: "",
    variant: "",
    year: 2026,
    reg_year_month: "",
    mileage_km: undefined,
    engine_cc: undefined,
    transmission: "",
    drive: "",
    steering: "",
    fuel: "",
    color: "",
    seats: undefined,
    grade_overall: undefined,
    grade_exterior: "",
    grade_interior: "",
    price_amount: undefined,
    price_currency: "USD",
    price_basis: "",
    fob_value_usd: undefined,
    freight_usd: undefined,
    chassis_no_masked: "",
    chassis_no_full: "",
    location: "",
    country_origin: "",
    status: "",
    package: "",
    body: "",
    type: "",
    engine_number: "",
    number_of_keys: undefined,
    keys_feature: "",
    notes: "",
    photos: [],
    details: [
      {
        short_title: "",
        full_title: "",
        description: "",
        images: [],
        sub_details: [
          {
            title: "",
            description: "",
          },
        ],
      },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  const isEditMode = mode === "update" && !!car;
  const isViewMode = mode === "view";

  useEffect(() => {
    if (car) {
      setFormData({
        category_id: car.category_id,
        subcategory_id: car.subcategory_id || undefined,
        ref_no: car.ref_no || "",
        make: car.make,
        model: car.model,
        model_code: car.model_code || "",
        variant: car.variant || "",
        year: car.year || 2026,
        reg_year_month: car.reg_year_month || "",
        mileage_km: car.mileage_km || undefined,
        engine_cc: car.engine_cc || undefined,
        transmission: car.transmission || "",
        drive: car.drive || "",
        steering: car.steering || "",
        fuel: car.fuel || "",
        color: car.color || "",
        seats: car.seats || undefined,
        grade_overall: car.grade_overall || undefined,
        grade_exterior: car.grade_exterior || "",
        grade_interior: car.grade_interior || "",
        price_amount: car.price_amount || undefined,
        price_currency: car.price_currency || "USD",
        price_basis: car.price_basis || "",
        chassis_no_masked: car.chassis_no_masked || "",
        chassis_no_full: car.chassis_no_full || "",
        location: car.location || "",
        country_origin: car.country_origin || "",
        status: car.status || "",
        package: car.package || "",
        body: car.body || "",
        type: car.type || "",
        engine_number: car.engine_number || "",
        number_of_keys: car.number_of_keys || undefined,
        keys_feature: car.keys_feature || "",
        notes: car.notes || "",
        attached_file: car.attached_file || undefined,
        photos:
          car.photos?.map((p) => ({
            url: p.url,
            is_primary: p.is_primary,
            sort_order: p.sort_order,
            is_hidden: p.is_hidden,
          })) || [],
        details: car.details?.map((d) => ({
          short_title: d.short_title,
          full_title: d.full_title,
          description: d.description,
          images: d.images || [],
          sub_details: d.sub_details?.map((sd) => ({
            title: sd.title,
            description: sd.description,
          })) || [
              {
                title: "",
                description: "",
              },
            ],
        })) || [
            {
              short_title: "",
              full_title: "",
              description: "",
              images: [],
              sub_details: [
                {
                  title: "",
                  description: "",
                },
              ],
            },
          ],
      });
    }
  }, [car]);

  useEffect(() => {
    if (formData.category_id) {
      // Find subcategories that have the selected category as their parent
      const filteredSubcategories = categories.filter(
        (cat) => cat.parent_category_id === formData.category_id
      );
      setSubcategories(filteredSubcategories);
    } else {
      setSubcategories([]);
    }
  }, [formData.category_id, categories]);

  const handleInputChange = (field: keyof CreateCarData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const addPhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photos: [
        ...(prev.photos || []),
        {
          url: "",
          is_primary: prev.photos?.length === 0,
          sort_order: prev.photos?.length || 0,
          is_hidden: false,
        },
      ],
    }));
  };

  const addPhotos = (newPhotos: any[]) => {
    setFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...newPhotos],
    }));
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleDetailImageChange = (
    detailIndex: number,
    imageIndex: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      details:
        prev.details?.map((detail, index) =>
          index === detailIndex
            ? {
              ...detail,
              images:
                detail.images?.map((image, i) =>
                  i === imageIndex ? value : image
                ) || [],
            }
            : detail
        ) || [],
    }));
  };

  const addDetailImage = (detailIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      details:
        prev.details?.map((detail, index) =>
          index === detailIndex
            ? {
              ...detail,
              images: [...(detail.images || []), ""],
            }
            : detail
        ) || [],
    }));
  };

  const removeDetailImage = (detailIndex: number, imageIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      details:
        prev.details?.map((detail, index) =>
          index === detailIndex
            ? {
              ...detail,
              images: detail.images?.filter((_, i) => i !== imageIndex) || [],
            }
            : detail
        ) || [],
    }));
  };

  const addDetail = () => {
    setFormData((prev) => ({
      ...prev,
      details: [
        ...(prev.details || []),
        {
          short_title: "",
          full_title: "",
          description: "",
          images: [],
          sub_details: [
            {
              title: "",
              description: "",
            },
          ],
        },
      ],
    }));
  };

  const removeDetail = (detailIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details?.filter((_, index) => index !== detailIndex) || [],
    }));
  };

  const handleDetailChange = (
    detailIndex: number,
    field: keyof NonNullable<CreateCarData["details"]>[0],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      details: (prev.details || []).map((detail, index) =>
        index === detailIndex ? { ...detail, [field]: value } : detail
      ),
    }));
  };

  // Sub-details functions
  const addSubDetail = (detailIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      details: (prev.details || []).map((detail, index) =>
        index === detailIndex
          ? {
            ...detail,
            sub_details: [
              ...(detail.sub_details || []),
              {
                title: "",
                description: "",
              },
            ],
          }
          : detail
      ),
    }));
  };

  const removeSubDetail = (detailIndex: number, subDetailIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      details: (prev.details || []).map((detail, index) =>
        index === detailIndex
          ? {
            ...detail,
            sub_details:
              detail.sub_details?.filter((_, i) => i !== subDetailIndex) ||
              [],
          }
          : detail
      ),
    }));
  };

  const handleSubDetailChange = (
    detailIndex: number,
    subDetailIndex: number,
    field: "title" | "description",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      details: (prev.details || []).map((detail, index) =>
        index === detailIndex
          ? {
            ...detail,
            sub_details: (detail.sub_details || []).map(
              (subDetail, subIndex) =>
                subIndex === subDetailIndex
                  ? { ...subDetail, [field]: value }
                  : subDetail
            ),
          }
          : detail
      ),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation - only make, model, and year are required
    if (!formData.make || !formData.make.trim()) {
      newErrors.make = "Make is required";
    }

    if (!formData.model || !formData.model.trim()) {
      newErrors.model = "Model is required";
    }

    if (
      !formData.year ||
      formData.year < 1900 ||
      formData.year > new Date().getFullYear() + 1
    ) {
      newErrors.year = "Valid year is required";
    }

    // Field length validation
    if (formData.make.length > 64) {
      newErrors.make = "Make must be 64 characters or less";
    }

    if (formData.model.length > 64) {
      newErrors.model = "Model must be 64 characters or less";
    }

    if (formData.ref_no && formData.ref_no.length > 32) {
      newErrors.ref_no = "Reference number must be 32 characters or less";
    }

    if (formData.model_code && formData.model_code.length > 32) {
      newErrors.model_code = "Model code must be 32 characters or less";
    }

    if (formData.variant && formData.variant.length > 64) {
      newErrors.variant = "Variant must be 64 characters or less";
    }

    if (formData.transmission && formData.transmission.length > 32) {
      newErrors.transmission = "Transmission must be 32 characters or less";
    }

    if (formData.fuel && formData.fuel.length > 32) {
      newErrors.fuel = "Fuel type must be 32 characters or less";
    }

    if (formData.color && formData.color.length > 32) {
      newErrors.color = "Color must be 32 characters or less";
    }

    if (formData.grade_exterior && formData.grade_exterior.length > 32) {
      newErrors.grade_exterior = "Exterior grade must be 32 characters or less";
    }

    if (formData.grade_interior && formData.grade_interior.length > 32) {
      newErrors.grade_interior = "Interior grade must be 32 characters or less";
    }

    if (formData.location && formData.location.length > 128) {
      newErrors.location = "Location must be 128 characters or less";
    }

    if (formData.country_origin && formData.country_origin.length > 64) {
      newErrors.country_origin =
        "Country of origin must be 64 characters or less";
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = "Notes must be 1000 characters or less";
    }

    if (formData.reg_year_month && formData.reg_year_month.length > 10) {
      newErrors.reg_year_month =
        "Registration year/month must be 10 characters or less";
    }

    // Numeric validation
    if (
      formData.mileage_km &&
      (formData.mileage_km < 0 || formData.mileage_km > 999999)
    ) {
      newErrors.mileage_km = "Mileage must be between 0 and 999,999 km";
    }

    if (
      formData.engine_cc &&
      (formData.engine_cc < 0 || formData.engine_cc > 10000)
    ) {
      newErrors.engine_cc = "Engine capacity must be between 0 and 10,000 cc";
    }

    if (formData.seats && (formData.seats < 1 || formData.seats > 50)) {
      newErrors.seats = "Seats must be between 1 and 50";
    }

    if (
      formData.price_amount &&
      (formData.price_amount < 0 || formData.price_amount > 999999999)
    ) {
      newErrors.price_amount = "Price must be between 0 and 999,999,999";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewMode || !onSubmit) return;

    console.log("Form validation starting...");
    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    console.log("Submitting form data:", formData);
    try {
      // If there's an attached file and it's a File object, we need to handle it differently
      if (formData.attached_file && formData.attached_file instanceof File) {
        // Create FormData for file upload
        const submitData = new FormData();

        // Add all form fields except the file
        Object.keys(formData).forEach(key => {
          if (key !== 'attached_file') {
            const value = formData[key as keyof CreateCarData];
            if (value !== undefined) {
              if (key === 'photos' || key === 'details') {
                submitData.append(key, JSON.stringify(value));
              } else {
                // Convert null to empty string for FormData
                submitData.append(key, value === null ? '' : String(value));
              }
            }
          }
        });

        // Add the file
        submitData.append('attached_file', formData.attached_file);

        await onSubmit(submitData as any);
      } else {
        // No new file to upload - exclude attached_file from submission
        // If it's a string (existing file), backend will keep it
        // If it's null/undefined, backend will keep existing or leave it null
        const submitData = { ...formData };
        // Remove attached_file if it's a string (existing file URL)
        // Only send it if it's a File object (which is handled above)
        if (typeof submitData.attached_file === 'string') {
          delete submitData.attached_file;
        }
        console.log("No new file attached, submitting regular form data (excluding existing file URL)");
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const content = (
    <div
      className={
        isModal
          ? "relative w-full max-w-6xl max-h-[90vh] overflow-y-auto"
          : "w-full"
      }
    >
      {/* Header */}
      {isModal && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-8 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {isEditMode
                  ? "Edit Vehicle"
                  : isViewMode
                    ? "View Vehicle Details"
                    : "Create New Vehicle"}
              </h2>
              <p className="text-gray-300 text-lg">
                {isEditMode
                  ? "Update vehicle information and specifications"
                  : isViewMode
                    ? "Review comprehensive vehicle details"
                    : "Add a new vehicle to your inventory management system"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Form — tighter vertical rhythm on full page (non-modal) */}
      <form
        onSubmit={handleSubmit}
        className={
          isModal ? "p-8 space-y-8" : "px-8 pt-3 pb-8 space-y-5"
        }
      >

        {/* Basic Information Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <BasicInfoSection
              formData={formData}
              errors={errors}
              categories={categories}
              filterOptions={filterOptions}
              isViewMode={isViewMode}
              onInputChange={handleInputChange}
            />
          </div>
        </div>

        {/* Technical Specifications Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <TechnicalSpecsSection
              formData={formData}
              errors={errors}
              filterOptions={filterOptions}
              isViewMode={isViewMode}
              onInputChange={handleInputChange}
            />
          </div>
        </div>

        {/* Grading & location — two cards, same row on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
            <div className="p-6">
              <GradingSection
                formData={formData}
                errors={errors}
                isViewMode={isViewMode}
                onInputChange={handleInputChange}
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
            <div className="p-6">
              <LocationStatusSection
                formData={formData}
                errors={errors}
                isViewMode={isViewMode}
                onInputChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Pricing Section — hidden on add/edit
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <PricingSection
              formData={formData}
              errors={errors}
              isViewMode={isViewMode}
              onInputChange={handleInputChange}
            />
          </div>
        </div>
        */}

        {/* Photos & attachment — one row on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
            <div className="p-6">
              <PhotoSection
                formData={formData}
                isViewMode={isViewMode}
                onAddPhoto={addPhoto}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
                onUpdatePhoto={(index, photo) => {
                  const newPhotos = [...(formData.photos || [])];
                  newPhotos[index] = photo;
                  setFormData((prev) => ({ ...prev, photos: newPhotos }));
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
            <div className="p-6">
              <AttachedFileSection
                formData={formData}
                errors={errors}
                isViewMode={isViewMode}
                onInputChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Car Details Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <CarDetailsSection
              formData={formData}
              isViewMode={isViewMode}
              onAddDetail={addDetail}
              onRemoveDetail={removeDetail}
              onDetailChange={handleDetailChange}
              onAddDetailImage={addDetailImage}
              onRemoveDetailImage={removeDetailImage}
              onDetailImageChange={handleDetailImageChange}
              onAddSubDetail={addSubDetail}
              onRemoveSubDetail={removeSubDetail}
              onSubDetailChange={handleSubDetailChange}
            />
          </div>
        </div>

        {/* Form Actions */}
        {!isViewMode && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-8 py-3 text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md border border-red-700/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-600/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                      ? "Update Vehicle"
                      : "Create Vehicle"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with blur effect */}
        <div
          className="absolute inset-0 bg-white/30 backdrop-blur-md"
          onClick={handleClose}
        />
        {content}
      </div>
    );
  }

  return content;
};

export default CarFormModal;
