import React, { useState, useEffect } from "react";
import { PackageIcon, HashIcon, FileTextIcon } from "lucide-react";
import {
  Stock,
  CreateStockData,
  UpdateStockData,
} from "../../services/stockApi";
import { stockApi } from "../../services/stockApi";

interface StockDrawerFormProps {
  stock?: Stock | null;
  onSubmit: (data: CreateStockData | UpdateStockData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  onError?: (error: string) => void;
}

interface AvailableCar {
  id: number;
  make: string;
  model: string;
  year: number;
  package?: string;
  ref_no?: string;
  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  };
}

interface CarGroup {
  key: string; // make_model_package combination
  make: string;
  model: string;
  package?: string;
  carIds: number[]; // All car IDs with this combination
  representativeCar: AvailableCar; // First car for display
}

const StockDrawerForm: React.FC<StockDrawerFormProps> = ({
  stock,
  onSubmit,
  onCancel,
  isLoading = false,
  onError,
}) => {
  const [formData, setFormData] = useState<CreateStockData>({
    car_id: 0,
    quantity: 1,
    price: 0,
    status: "available",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [carGroups, setCarGroups] = useState<CarGroup[]>([]);
  const [isLoadingCars, setIsLoadingCars] = useState(false);
  const [selectedCarGroup, setSelectedCarGroup] = useState<string>("");

  useEffect(() => {
    fetchAvailableCars();
  }, []);

  useEffect(() => {
    if (stock) {
      setFormData({
        car_id:
          typeof stock.car_id === "string"
            ? parseInt(stock.car_id, 10)
            : stock.car_id,
        quantity: stock.quantity,
        price:
          typeof stock.price === "string"
            ? parseFloat(stock.price)
            : stock.price || 0,
        status: stock.status,
        notes: stock.notes || "",
      });

      // Set selected car group for edit mode
      if (stock.car) {
        const packageName = (stock.car as any).package || "";
        const key = `${stock.car.make}_${stock.car.model}_${packageName}`.toLowerCase();
        setSelectedCarGroup(key);
      }
    }
  }, [stock, carGroups]);

  const fetchAvailableCars = async () => {
    try {
      setIsLoadingCars(true);
      const response = await stockApi.getAvailableCars();
      if (response.success && response.data) {
        setAvailableCars(response.data);

        // Group cars by make, model, and package
        const grouped = new Map<string, CarGroup>();

        response.data.forEach((car: AvailableCar) => {
          const packageName = car.package || "";
          const key = `${car.make}_${car.model}_${packageName}`.toLowerCase();

          if (!grouped.has(key)) {
            grouped.set(key, {
              key,
              make: car.make,
              model: car.model,
              package: car.package,
              carIds: [car.id],
              representativeCar: car,
            });
          } else {
            const group = grouped.get(key)!;
            group.carIds.push(car.id);
          }
        });

        setCarGroups(Array.from(grouped.values()));
      }
    } catch (error) {
      console.error("Error fetching available cars:", error);
    } finally {
      setIsLoadingCars(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Only validate car selection for new stocks, not updates
    if (!stock && !selectedCarGroup) {
      newErrors.car_id = "Car selection is required";
    }

    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = "Price cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        if (stock) {
          // For updates, find all cars with same make+model+package and update their stock
          const car = stock.car;
          if (car) {
            const packageName = (car as any).package || "";
            const key = `${car.make}_${car.model}_${packageName}`.toLowerCase();
            const group = carGroups.find(g => g.key === key);

            if (group) {
              // Update stock for all cars with same make+model+package (price/notes only; API fixes quantity=1, ignores status)
              const updateData = {
                make: car.make,
                model: car.model,
                package: (car as any).package || "",
                car_ids: group.carIds,
                price: formData.price,
                notes: formData.notes,
              };
              onSubmit(updateData as any);
            } else {
              // Fallback to single stock update
              const submitData = {
                price: formData.price,
                notes: formData.notes,
              };
              onSubmit(submitData);
            }
          } else {
            const submitData = {
              price: formData.price,
              notes: formData.notes,
            };
            onSubmit(submitData);
          }
        } else {
          // For new stock, find selected group and create stock for all cars
          const group = carGroups.find(g => g.key === selectedCarGroup);
          if (group) {
            const createData = {
              make: group.make,
              model: group.model,
              package: group.package || "",
              car_ids: group.carIds,
              quantity: 1,
              price: formData.price,
              notes: formData.notes,
            };
            onSubmit(createData as any);
          }
        }
      } catch (error: any) {
        console.error("Form submission error:", error);
        if (onError) {
          onError(
            error.message || "An error occurred while submitting the form"
          );
        }
      }
    }
  };

  const handleInputChange = (
    field: keyof CreateStockData,
    value: string | number
  ) => {
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

  const formatCarLabel = (group: CarGroup) => {
    const packageName = group.package ? ` - ${group.package}` : "";
    const count = group.carIds.length > 1 ? ` (${group.carIds.length} cars)` : "";
    return `${group.make} ${group.model}${packageName}${count}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Car Selection, Quantity, and Status Fields - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              <PackageIcon className="w-4 h-4 inline mr-2" />
              {stock ? "Car" : "Car *"}
            </label>
          </div>
          {stock ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {stock.car
                ? `${stock.car.make} ${stock.car.model} (${stock.car.year})`
                : "N/A"}
            </div>
          ) : (
            <select
              value={selectedCarGroup}
              onChange={(e) => setSelectedCarGroup(e.target.value)}
              disabled={isLoadingCars}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.car_id ? "border-red-300" : "border-gray-300"
              } ${isLoadingCars ? "bg-gray-100 cursor-not-allowed" : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"}`}
            >
              <option value="">
                {isLoadingCars ? "Loading cars..." : "Select a car"}
              </option>
              {carGroups.map((group) => (
                <option key={group.key} value={group.key}>
                  {formatCarLabel(group)}
                </option>
              ))}
            </select>
          )}
          {errors.car_id && (
            <p className="mt-1 text-sm text-red-600">{errors.car_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HashIcon className="w-4 h-4 inline mr-2" />
            Quantity *
          </label>
          <input
            type="number"
            min="1"
            value={1}
            readOnly
            title="Quantity is always 1 (set by system for create and update)."
            onChange={(e) =>
              handleInputChange("quantity", parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Status dropdown intentionally commented out per request */}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FileTextIcon className="w-4 h-4 inline mr-2" />
          Notes (Optional)
        </label>
        <textarea
          rows={3}
          placeholder="Add any additional notes about this stock item..."
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : stock && stock.id !== 0 ? (
            "Update Stock"
          ) : (
            "Create Stock"
          )}
        </button>
      </div>
    </form>
  );
};

export default StockDrawerForm;
