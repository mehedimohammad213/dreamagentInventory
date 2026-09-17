
"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { stockApi, Stock } from "../../services/stockApi";
import { carApi, Car as CarType } from "../../services/carApi";
import { useAuth } from "../../contexts/AuthContext";
import CarViewHeader from "../../components/car/CarViewHeader";
import CarImageGallery from "../../components/car/CarImageGallery";
import CarSpecifications from "../../components/car/CarSpecifications";
import CarDetailsSection from "../../components/car/CarDetailsSection";
import CarAttachedFile from "../../components/car/CarAttachedFile";
import ImageModal from "../../components/car/ImageModal";

const StockGallery: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [stock, setStock] = useState<Stock | null>(null);
  const [car, setCar] = useState<CarType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageAlt, setModalImageAlt] = useState<string>("");
  const [pdfFiles, setPdfFiles] = useState<
    Array<{ name: string; url: string }>
  >([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [attachedFileInfo, setAttachedFileInfo] = useState<{
    url: string;
    type: 'image' | 'pdf';
    filename: string;
  } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Missing stock id");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch Stock
        const stockResponse = await stockApi.getStock(parseInt(id, 10));

        if (stockResponse.success && stockResponse.data) {
          const stockData = stockResponse.data;
          setStock(stockData);
          setCurrentImageIndex(0);

          // 2. Fetch Full Car Details
          // We prefer the full car API response because the nested stock.car object
          // might be partial or have different types (e.g. category_id as string vs number)
          // and might miss fields like 'details' or 'attached_file'.
          const carId = typeof stockData.car_id === 'string' ? parseInt(stockData.car_id) : stockData.car_id;

          if (carId) {
            try {
              const carResponse = await carApi.getCar(carId);
              let carData: CarType | null = null;

              if (carResponse.data.car) {
                carData = carResponse.data.car;
              } else if (Array.isArray(carResponse.data.data) && carResponse.data.data.length > 0) {
                carData = carResponse.data.data[0];
              } else if (carResponse.data && "id" in carResponse.data) {
                carData = carResponse.data as unknown as CarType;
              }

              if (carData) {
                setCar(carData);

                // Fetch PDF files using the full car data
                await fetchPdfFiles(carData);

                // Fetch attached file info if admin and car has attached_file
                if (isAdmin && carData.attached_file) {
                  try {
                    const fileInfo = await carApi.getAttachedFile(carData.id);
                    if (fileInfo.success) {
                      setAttachedFileInfo(fileInfo.data);
                    }
                  } catch (error) {
                    console.error("Error fetching attached file info:", error);
                  }
                }
              }
            } catch (carErr) {
              console.error("Failed to load full car details", carErr);
            }
          }

        } else {
          setError("Stock not found");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load stock");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isAdmin]);

  const fetchPdfFiles = async (car: any) => {
    try {
      setPdfLoading(true);
      if (car.attached_file) {
        try {
          const fileInfo = await carApi.getAttachedFile(car.id);
          if (fileInfo.success && fileInfo.data) {
            setPdfFiles([
              {
                name: fileInfo.data.filename,
                url: fileInfo.data.url,
              },
            ]);
          }
        } catch (apiError) {
          console.log("API call failed, using direct file path:", apiError);
          const fileName =
            car.attached_file.split("/").pop() || "Vehicle Document.pdf";
          const baseUrl = "http://localhost:8000";
          const pdfUrl = car.attached_file.startsWith("http")
            ? car.attached_file
            : `${baseUrl}${car.attached_file} `;

          setPdfFiles([
            {
              name: fileName,
              url: pdfUrl,
            },
          ]);
        }
      } else {
        setPdfFiles([]);
      }
    } catch (error) {
      console.error("Error processing PDF files:", error);
      setPdfFiles([]);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = (pdfUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNextImage = () => {
    if (!car?.photos) return;
    setCurrentImageIndex((prev) =>
      prev === car.photos!.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    if (!car?.photos) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? car.photos!.length - 1 : prev - 1
    );
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    setModalImageUrl(null);
    setModalImageAlt("");
    setShowImageModal(true);
  };

  const handleViewFile = () => {
    if (attachedFileInfo) {
      window.open(attachedFileInfo.url, '_blank');
    }
  };

  const handleDownloadFile = async () => {
    if (!car || !attachedFileInfo) return;

    try {
      setIsLoadingFile(true);
      const blob = await carApi.downloadAttachedFile(car.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachedFileInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      window.open(attachedFileInfo.url, '_blank');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const getBackRoute = () => {
    // Default to stock management if no history
    return -1 as any;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !stock || !car) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || "Stock not found"}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
        <CarViewHeader
          car={car}
          isAdmin={isAdmin}
          getBackRoute={() => "/stock-management"}
          disableBack={true}
        />

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden">
          <div className="p-2 sm:p-4 lg:p-6 xl:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <CarImageGallery
                car={car}
                currentImageIndex={currentImageIndex}
                pdfFiles={pdfFiles}
                pdfLoading={pdfLoading}
                onPrevImage={handlePrevImage}
                onNextImage={handleNextImage}
                onThumbnailClick={handleThumbnailClick}
                onImageClick={() => {
                  setModalImageUrl(null);
                  setModalImageAlt("");
                  setShowImageModal(true);
                }}
                onDownloadPdf={handleDownloadPdf}
              />

              <CarSpecifications car={car} stockData={stock} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <CarDetailsSection
            details={car.details}
            onImageClick={(imageUrl, alt) => {
              setModalImageUrl(imageUrl);
              setModalImageAlt(alt);
              setShowImageModal(true);
            }}
          />
        </div>

        {/* Attached File - Admin Only */}
        {isAdmin && attachedFileInfo && (
          <CarAttachedFile
            attachedFileInfo={attachedFileInfo}
            isLoadingFile={isLoadingFile}
            onViewFile={handleViewFile}
            onDownloadFile={handleDownloadFile}
          />
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <ImageModal
          imageUrl={modalImageUrl || (car.photos && car.photos.length > 0 ? car.photos[currentImageIndex].url : "")}
          alt={modalImageAlt || `${car.make} ${car.model} `}
          hasMultipleImages={!modalImageUrl && car.photos ? car.photos.length > 1 : false}
          onClose={() => {
            setShowImageModal(false);
            setModalImageUrl(null);
            setModalImageAlt("");
          }}
          onPrev={modalImageUrl ? () => { } : handlePrevImage}
          onNext={modalImageUrl ? () => { } : handleNextImage}
        />
      )}
    </div>
  );
};

export default StockGallery;
