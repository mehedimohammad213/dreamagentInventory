import React, { useState, useEffect } from "react";
import { X, Search, Plus, Minus, FileText } from "lucide-react";
import { Car } from "../../services/carApi";
import { carApi } from "../../services/carApi";

interface InvoiceItem {
  car: Car;
  quantity: number;
  price: number;
  code?: string;
  fob_value_usd?: number;
  freight_usd?: number;
}

interface InvoiceCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInvoice: (items: InvoiceItem[]) => void;
}

export const InvoiceCreationModal: React.FC<InvoiceCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateInvoice,
}) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCars, setSelectedCars] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCars();
    }
  }, [isOpen]);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      const response = await carApi.getCars({ per_page: 1000 });
      if (response.success && response.data.data) {
        setCars(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCars = cars.filter(
    (car) =>
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.ref_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addCarToInvoice = (car: Car) => {
    const existingItem = selectedCars.find((item) => item.car.id === car.id);
    if (existingItem) {
      setSelectedCars(
        selectedCars.map((item) =>
          item.car.id === car.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                // Update fields with latest car data
                code: car.code || "",
                fob_value_usd: car.fob_value_usd || 0,
                freight_usd: car.freight_usd || 0,
                price: car.price_amount || 0,
              }
            : item
        )
      );
    } else {
      setSelectedCars([
        ...selectedCars,
        {
          car,
          quantity: 1,
          price: car.price_amount || 0,
          code: car.code || "",
          fob_value_usd: car.fob_value_usd || 0,
          freight_usd: car.freight_usd || 0,
        },
      ]);
    }
  };

  const updateQuantity = (carId: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedCars(selectedCars.filter((item) => item.car.id !== carId));
    } else {
      setSelectedCars(
        selectedCars.map((item) =>
          item.car.id === carId ? { ...item, quantity } : item
        )
      );
    }
  };

  const updatePrice = (carId: number, price: number) => {
    setSelectedCars(
      selectedCars.map((item) =>
        item.car.id === carId ? { ...item, price } : item
      )
    );
  };

  const updateCode = (carId: number, code: string) => {
    setSelectedCars(
      selectedCars.map((item) =>
        item.car.id === carId ? { ...item, code } : item
      )
    );
  };

  const updateFobValue = (carId: number, fob_value_usd: number) => {
    setSelectedCars(
      selectedCars.map((item) =>
        item.car.id === carId ? { ...item, fob_value_usd } : item
      )
    );
  };

  const updateFreight = (carId: number, freight_usd: number) => {
    setSelectedCars(
      selectedCars.map((item) =>
        item.car.id === carId ? { ...item, freight_usd } : item
      )
    );
  };

  const removeCarFromInvoice = (carId: number) => {
    setSelectedCars(selectedCars.filter((item) => item.car.id !== carId));
  };

  const calculateTotal = () => {
    return selectedCars.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleSubmit = async () => {
    if (selectedCars.length === 0) {
      alert("Please select at least one car for the invoice.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateInvoice(selectedCars);
      onClose();
      setSelectedCars([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCars([]);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Create Invoice</h2>
                <p className="text-primary-100 mt-1">
                  Select cars and quantities for your invoice
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Car Selection */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cars by make, model, ref no, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCars.map((car) => (
                    <div
                      key={car.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-gray-900">
                          {car.make} {car.model}
                        </h3>
                        <button
                          onClick={() => addCarToInvoice(car)}
                          className="mt-3 self-start px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredCars.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-gray-500">
                      No cars found matching your search.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Invoice Items */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Invoice Items ({selectedCars.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedCars.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No items selected</p>
                  <p className="text-sm">
                    Add cars from the left panel to create an invoice
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCars.map((item) => (
                    <div
                      key={item.car.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {item.car.make} {item.car.model}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeCarFromInvoice(item.car.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() =>
                                updateQuantity(item.car.id, item.quantity - 1)
                              }
                              className="p-2 hover:bg-gray-100 border-r border-gray-300"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="flex-1 flex flex-col">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.car.id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-full px-2 py-2 text-center border-0 focus:ring-0 focus:outline-none appearance-none"
                              />
                              <button
                                onClick={() =>
                                  updateQuantity(item.car.id, item.quantity + 1)
                                }
                                className="p-2 hover:bg-gray-100 border-t border-gray-300"
                              >
                                <Plus className="w-4 h-4 mx-auto" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updatePrice(
                                item.car.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code
                          </label>
                          <input
                            type="text"
                            value={item.code || ""}
                            onChange={(e) =>
                              updateCode(item.car.id, e.target.value)
                            }
                            placeholder="Enter code"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            FOB Value
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.fob_value_usd || ""}
                            onChange={(e) =>
                              updateFobValue(
                                item.car.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Freight
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.freight_usd || ""}
                            onChange={(e) =>
                              updateFreight(
                                item.car.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-right font-semibold break-words whitespace-normal">
                            {(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Total and Actions */}
            {selectedCars.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount:
                  </span>
                  <span className="text-2xl font-bold text-primary-600 break-words text-right">
                    {calculateTotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 h-12 px-4 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-12 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? "Creating Invoice..." : "Create Invoice"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
