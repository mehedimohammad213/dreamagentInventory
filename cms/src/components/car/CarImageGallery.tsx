import React from "react";
import { Car, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";
import { Car as CarType, CarPhoto } from "../../services/carApi";

interface CarImageGalleryProps {
  car: CarType;
  currentImageIndex: number;
  pdfFiles: Array<{ name: string; url: string }>;
  pdfLoading: boolean;
  onPrevImage: () => void;
  onNextImage: () => void;
  onThumbnailClick: (index: number) => void;
  onImageClick: () => void;
  onDownloadPdf: (pdfUrl: string, fileName: string) => void;
}

const CarImageGallery: React.FC<CarImageGalleryProps> = ({
  car,
  currentImageIndex,
  pdfFiles,
  pdfLoading,
  onPrevImage,
  onNextImage,
  onThumbnailClick,
  onImageClick,
  onDownloadPdf,
}) => {
  const hasMultiplePhotos = Boolean(car.photos && car.photos.length > 1);
  const { swipeHandlers, shouldIgnoreClick } = useSwipeNavigation(
    onPrevImage,
    onNextImage,
    hasMultiplePhotos
  );

  return (
    <div className="lg:col-span-2">
      {/* Main Photo */}
      <div className="relative mb-4">
        {car.photos && car.photos.length > 0 ? (
          <div
            className="w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] flex items-center justify-center bg-white rounded-xl overflow-hidden touch-pan-y select-none"
            {...(hasMultiplePhotos ? swipeHandlers : {})}
          >
            <img
              src={car.photos[currentImageIndex].url}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-contain rounded-xl cursor-pointer"
              draggable={false}
              onClick={() => {
                if (!shouldIgnoreClick()) onImageClick();
              }}
            />
          </div>
        ) : (
          <div className="h-[60vh] sm:h-[70vh] lg:h-[80vh] bg-white rounded-xl flex items-center justify-center">
            <Car className="w-24 h-24 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 ml-4 text-lg">
              No photos available
            </p>
          </div>
        )}

        {/* Photo Navigation Arrows */}
        {car.photos && car.photos.length > 1 && (
          <>
            {/* Side arrows for web & mobile */}
            <button
              onClick={onPrevImage}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 p-2 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={onNextImage}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 p-2 transition-colors"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {/* Image counter */}
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs md:text-sm shadow-md">
              {currentImageIndex + 1} / {car.photos.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {car.photos && car.photos.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {car.photos.slice(0, 6).map((photo: CarPhoto, index: number) => (
            <img
              key={index}
              src={photo.url}
              alt={`${car.make} ${car.model} thumbnail ${index + 1}`}
              onClick={() => onThumbnailClick(index)}
              className={`w-24 h-20 sm:w-28 sm:h-24 object-cover rounded-md cursor-pointer transition-all flex-shrink-0 ${
                currentImageIndex === index
                  ? "ring-2 ring-primary-500 opacity-100"
                  : "hover:opacity-80 opacity-70"
              }`}
            />
          ))}
          {car.photos.length > 6 && (
            <div className="w-24 h-20 sm:w-28 sm:h-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              +{car.photos.length - 6} more
            </div>
          )}

          {/* Auction Sheet at the end of the row */}
          {!pdfLoading && pdfFiles.length > 0 && (
            <>
              {pdfFiles.map((pdf, index) => (
                <div
                  key={`pdf-${index}`}
                  className="w-20 h-16 bg-red-100 dark:bg-red-900/30 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors group ml-auto"
                  onClick={() => onDownloadPdf(pdf.url, pdf.name)}
                  title="Download Auction Sheet"
                >
                  <Download className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 mb-1" />
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Auction Sheet
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CarImageGallery;
