import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { carApi, Car as CarType } from "../../services/carApi";
import { stockApi, Stock } from "../../services/stockApi";
import { useAuth } from "../../contexts/AuthContext";
import CarViewHeader from "../../components/car/CarViewHeader";
import CarImageGallery from "../../components/car/CarImageGallery";
import CarSpecifications from "../../components/car/CarSpecifications";
import CarDetailsSection from "../../components/car/CarDetailsSection";
import CarAttachedFile from "../../components/car/CarAttachedFile";
import ImageModal from "../../components/car/ImageModal";
import type { StockPageTab } from "../../components/stock/StockHeader";
import { stockManagementPath } from "../../utils/stockNavigation";

const ViewCar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [car, setCar] = useState<CarType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageAlt, setModalImageAlt] = useState<string>("");
  const [stockData, setStockData] = useState<Stock | null>(null);
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
    const fetchCarData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const carResponse = await carApi.getCar(parseInt(id));

        // Extract car from response
        let carData: CarType | null = null;
        if (carResponse.data.car) {
          carData = carResponse.data.car;
        } else if (
          Array.isArray(carResponse.data.data) &&
          carResponse.data.data.length > 0
        ) {
          carData = carResponse.data.data[0];
        } else if (carResponse.data && "id" in carResponse.data) {
          carData = carResponse.data as CarType;
        }

        if (carData) {
          setCar(carData);

          // Fetch stock data
          try {
            const stockResponse = await stockApi.getStocks({ per_page: 1000 });
            if (stockResponse.success && stockResponse.data) {
              const stock = stockResponse.data.find(
                (s: Stock) =>
                  (typeof s.car_id === "string"
                    ? parseInt(s.car_id)
                    : s.car_id) === carData.id
              );
              if (stock) {
                setStockData(stock);
              }
            }
          } catch (error) {
            console.error("Error fetching stock data:", error);
          }

          // Fetch PDF files
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
      } catch (error) {
        console.error("Error fetching car:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarData();
  }, [id, isAdmin]);

  const fetchPdfFiles = async (car: CarType) => {
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
            : `${baseUrl}${car.attached_file}`;

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

  const returnStockTab = (
    location.state as { returnStockTab?: StockPageTab } | null
  )?.returnStockTab;

  const getBackRoute = () => {
    if (isAdmin) return stockManagementPath(returnStockTab);
    if (user?.role === "user") return "/admin/stock?tab=current";
    return `/cars?${searchParams.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Car not found
          </h2>
          <button
            onClick={() => navigate(getBackRoute())}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-primary-500/20"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="w-full">
        <CarViewHeader
          car={car}
          isAdmin={isAdmin}
          getBackRoute={getBackRoute}
        />

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div>
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

              <CarSpecifications car={car} stockData={stockData} />
            </div>
          </div>
        </div>

        <CarDetailsSection
          details={car.details}
          onImageClick={(imageUrl, alt) => {
            setModalImageUrl(imageUrl);
            setModalImageAlt(alt);
            setShowImageModal(true);
          }}
        />

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
          alt={modalImageAlt || `${car.make} ${car.model}`}
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

export default ViewCar;
