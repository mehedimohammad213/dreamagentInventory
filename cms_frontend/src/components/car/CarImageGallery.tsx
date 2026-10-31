"use client";

import React, { useEffect, useRef, useState } from "react";
import { Car, ChevronLeft, ChevronRight, Download, Link2, Share2 } from "lucide-react";
import {
  FaFacebookF,
  FaFacebookMessenger,
  FaTelegram,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";
import { toast } from "react-toastify";
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
  onDownloadAllImages?: () => void;
  isDownloadingAllImages?: boolean;
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
  onDownloadAllImages,
  isDownloadingAllImages = false,
}) => {
  const hasMultiplePhotos = Boolean(car.photos && car.photos.length > 1);
  const { swipeHandlers, shouldIgnoreClick } = useSwipeNavigation(
    onPrevImage,
    onNextImage,
    hasMultiplePhotos
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!shareOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) {
        setShareOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShareOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [shareOpen]);

  const shareListing = () => {
    return { url: window.location.href };
  };

  const openShareLink = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };

  const copyShareLink = async () => {
    const { url } = shareListing();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
      setShareOpen(false);
    } catch (error) {
      console.error("Error copying share link:", error);
      toast.error("Could not copy the link");
    }
  };

  const shareOnMessenger = () => {
    const { url } = shareListing();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(url)}`;
      setShareOpen(false);
      return;
    }

    void navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied. Paste it in Messenger."),
      () => toast.error("Could not copy the link")
    );
    window.open("https://www.messenger.com/", "_blank", "noopener,noreferrer");
    setShareOpen(false);
  };

  const shareWithOtherApps = async () => {
    const { url } = shareListing();
    if (!navigator.share) {
      await copyShareLink();
      return;
    }

    try {
      await navigator.share({ url });
      setShareOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareOpen(false);
        return;
      }
      console.error("Error opening share sheet:", error);
      toast.error("Could not open sharing");
    }
  };

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

        {onDownloadAllImages && car.photos && car.photos.length > 0 && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onDownloadAllImages}
              disabled={isDownloadingAllImages}
              aria-label={
                isDownloadingAllImages ? "Downloading images" : "Download all images"
              }
              title={isDownloadingAllImages ? "Downloading..." : "Download all images"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow-md transition-colors hover:bg-primary-700 disabled:cursor-wait disabled:opacity-70"
            >
              <Download
                className={`h-5 w-5 ${isDownloadingAllImages ? "animate-pulse" : ""}`}
              />
            </button>

            <div className="relative" ref={shareRef}>
              <button
                type="button"
                onClick={() => setShareOpen((open) => !open)}
                aria-label="Share"
                aria-expanded={shareOpen}
                aria-haspopup="menu"
                title="Share"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow-md transition-colors hover:bg-primary-700 ${
                  shareOpen ? "ring-2 ring-white" : ""
                }`}
              >
                <Share2 className="h-5 w-5" />
              </button>

              {shareOpen && (
                <div
                  role="menu"
                  aria-label="Share this vehicle"
                  className="absolute right-0 top-full z-20 mt-2 flex max-w-[calc(100vw-1.5rem)] flex-row items-start gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
                >
                  <ShareMenuButton
                    label="WhatsApp"
                    icon={<FaWhatsapp className="h-4 w-4" />}
                    iconClassName="bg-[#25D366]"
                    onClick={() => {
                      const { url } = shareListing();
                      openShareLink(
                        `https://wa.me/?text=${encodeURIComponent(url)}`
                      );
                    }}
                  />
                  <ShareMenuButton
                    label="Messenger"
                    icon={<FaFacebookMessenger className="h-4 w-4" />}
                    iconClassName="bg-[#0084FF]"
                    onClick={shareOnMessenger}
                  />
                  <ShareMenuButton
                    label="Facebook"
                    icon={<FaFacebookF className="h-4 w-4" />}
                    iconClassName="bg-[#1877F2]"
                    onClick={() => {
                      const { url } = shareListing();
                      openShareLink(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                      );
                    }}
                  />
                  <ShareMenuButton
                    label="Telegram"
                    icon={<FaTelegram className="h-4 w-4" />}
                    iconClassName="bg-[#229ED9]"
                    onClick={() => {
                      const { url } = shareListing();
                      openShareLink(
                        `https://t.me/share/url?url=${encodeURIComponent(url)}`
                      );
                    }}
                  />
                  <ShareMenuButton
                    label="X"
                    icon={<FaXTwitter className="h-4 w-4" />}
                    iconClassName="bg-black"
                    onClick={() => {
                      const { url } = shareListing();
                      openShareLink(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`
                      );
                    }}
                  />
                  <ShareMenuButton
                    label="Copy link"
                    icon={<Link2 className="h-4 w-4" />}
                    iconClassName="bg-gray-500"
                    onClick={() => {
                      void copyShareLink();
                    }}
                  />
                  {canNativeShare && (
                    <ShareMenuButton
                      label="Other apps"
                      icon={<Share2 className="h-4 w-4" />}
                      iconClassName="bg-primary-600"
                      onClick={() => {
                        void shareWithOtherApps();
                      }}
                    />
                  )}
                </div>
              )}
            </div>
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

function ShareMenuButton({
  label,
  icon,
  iconClassName,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  iconClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      title={label}
      className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1 text-center text-[11px] font-medium leading-tight text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${iconClassName}`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

export default CarImageGallery;
