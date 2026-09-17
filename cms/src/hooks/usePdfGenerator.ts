import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { carApi, Car } from "../services/carApi";

interface PdfGeneratorParams {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
  makeFilter: string;
  modelFilter: string;
  yearFilter: string;
  transmissionFilter: string;
  fuelFilter: string;
  colorFilter: string;
  priceRange: { min: string; max: string };
  sortBy: string;
  sortDirection: string;
}

export const usePdfGenerator = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async (params: PdfGeneratorParams) => {
    if (isGeneratingPDF) return;

    try {
      setIsGeneratingPDF(true);
      console.log("Generating PDF... Fetching all cars...");

      // Fetch all available cars with current filters (no pagination)
      const response = await carApi.getCars({
        search: params.searchTerm || undefined,
        status: "available", // Only available cars
        category_id: params.categoryFilter || undefined,
        make: params.makeFilter || undefined,
        model: params.modelFilter || undefined,
        year: params.yearFilter || undefined,
        transmission: params.transmissionFilter || undefined,
        fuel: params.fuelFilter || undefined,
        color: params.colorFilter || undefined,
        price_from: params.priceRange.min || undefined,
        price_to: params.priceRange.max || undefined,
        sort_by: params.sortBy,
        sort_direction: params.sortDirection,
        per_page: 10000, // Large number to get all cars
        page: 1,
      });

      let allCars: Car[] = [];

      if (response.success && response.data.data) {
        allCars = response.data.data;

        // If there are more pages, fetch them all
        const totalPages = response.data.last_page || 1;
        if (totalPages > 1) {
          console.log(`Fetching ${totalPages - 1} additional pages...`);
          const additionalPages = [];
          for (let page = 2; page <= totalPages; page++) {
            additionalPages.push(
              carApi.getCars({
                search: params.searchTerm || undefined,
                status: "available",
                category_id: params.categoryFilter || undefined,
                make: params.makeFilter || undefined,
                model: params.modelFilter || undefined,
                year: params.yearFilter || undefined,
                transmission: params.transmissionFilter || undefined,
                fuel: params.fuelFilter || undefined,
                color: params.colorFilter || undefined,
                price_from: params.priceRange.min || undefined,
                price_to: params.priceRange.max || undefined,
                sort_by: params.sortBy,
                sort_direction: params.sortDirection,
                per_page: 10000,
                page: page,
              })
            );
          }
          const additionalResponses = await Promise.all(additionalPages);
          additionalResponses.forEach((resp) => {
            if (resp.success && resp.data.data) {
              allCars = [...allCars, ...resp.data.data];
            }
          });
        }

        // Sort by model alphabetically
        allCars.sort((a, b) => {
          const modelA = (a.model || "").toLowerCase();
          const modelB = (b.model || "").toLowerCase();
          return modelA.localeCompare(modelB);
        });
      } else {
        console.error("Failed to fetch cars for PDF:", response);
        alert("Failed to fetch car data. Please try again.");
        setIsGeneratingPDF(false);
        return;
      }

      if (allCars.length === 0) {
        alert("No available cars to export. Please ensure some cars are marked as available.");
        setIsGeneratingPDF(false);
        return;
      }

      console.log(`Generating PDF with ${allCars.length} cars`);

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text("Car Catalog Report", 14, 22);

      // Add date and total count
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Cars: ${allCars.length}`, 14, 36);

      // Prepare table data
      const tableColumns = [
        "Car Info",
        "Image",
        "Mileage",
        "Engine",
        "Color",
        "AA Score",
        "Key Features",
        "Price",
      ];

      // Store all image URLs for each car (array of arrays)
      const allImageUrls: string[][] = [];

      const tableData = allCars.map((car) => {
        try {
          const keyFeatures = [];
          if (car.fuel) keyFeatures.push(car.fuel);
          if (car.seats) keyFeatures.push(`${car.seats} Seats`);
          if (car.steering) keyFeatures.push(car.steering);
          if ((car as any).drive_type)
            keyFeatures.push((car as any).drive_type);

          const aaScore = [];
          if (car.grade_overall) aaScore.push(car.grade_overall);
          if (car.grade_exterior) aaScore.push(`Ext: ${car.grade_exterior}`);
          if (car.grade_interior) aaScore.push(`Int: ${car.grade_interior}`);

          const reference = car.ref_no || "N/A";
          const chassis =
            car.chassis_no_full || car.chassis_no_masked || "N/A";

          // Get all photos
          const photos = car.photos || [];
          const imageUrls = photos.map((p) => p.url).filter((url) => url);
          allImageUrls.push(imageUrls);

          // Create image links text as a horizontal list
          let imageLinksText = "N/A";
          if (imageUrls.length > 0) {
            imageLinksText = imageUrls.map((_, index) => `${index + 1}`).join(", ");
          }

          return [
            `${car.year || "N/A"} ${car.make || "N/A"} ${car.model || "N/A"}${car.variant ? ` - ${car.variant}` : ""
            }\nRef: ${reference}${chassis && chassis !== "N/A" ? ` | Chassis: ${chassis}` : ""
            }`,
            imageLinksText,
            car.mileage_km ? `${car.mileage_km.toLocaleString()} km` : "N/A",
            car.engine_cc ? `${car.engine_cc.toLocaleString()} cc` : "N/A",
            car.color || "N/A",
            aaScore.length > 0 ? aaScore.join(" ") : "N/A",
            keyFeatures.length > 0 ? keyFeatures.join(", ") : "N/A",
            car.price_amount
              ? `BDT ${car.price_amount.toLocaleString()}`
              : "Price on request",
          ];
        } catch (error) {
          console.error("Error processing car data:", error, car);
          allImageUrls.push([]);
          return [
            "Error",
            "N/A",
            "Error",
            "Error",
            "Error",
            "Error",
            "Error",
            "Error",
          ];
        }
      });

      // Add table
      try {
        autoTable(doc, {
          head: [tableColumns],
          body: tableData,
          startY: 45,
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 30, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 } },
            2: { cellWidth: 18 },
            3: { cellWidth: 18 },
            4: { cellWidth: 15 },
            5: { cellWidth: 18 },
            6: { cellWidth: 25 },
            7: { cellWidth: 25 },
          },
          didParseCell: function (data: any) {
            // Add clickable links to Image column (column index 1)
            if (data.column.index === 1 && data.cell.text && data.cell.text[0] !== "N/A") {
              const rowIndex = data.row.index;
              if (rowIndex >= 0 && rowIndex < allImageUrls.length) {
                const carImageUrls = allImageUrls[rowIndex];
                if (carImageUrls && carImageUrls.length > 0) {
                  // Store all image URLs for this car
                  data.cell.imageUrls = carImageUrls;
                  // Enable word wrap for multiple lines
                  data.cell.styles.cellPadding = { top: 2, bottom: 2, left: 3, right: 3 };
                }
              }
            }
          },
          didDrawCell: function (data: any) {
            // Add clickable links to Image column
            if (data.column.index === 1 && data.cell.imageUrls && data.cell.imageUrls.length > 0) {
              const cellX = data.cell.x;
              const cellY = data.cell.y;
              const cellWidth = data.cell.width;
              const cellHeight = data.cell.height;

              // Calculate approximate width per number (including comma and space)
              // Font size 8, approximate width: "1, " = ~8-10 points
              const numberWidth = 10;
              const lineHeight = 10;

              // Calculate how many numbers fit per line
              const numbersPerLine = Math.floor(cellWidth / numberWidth);

              // Add link annotation for each image (horizontal with wrapping)
              data.cell.imageUrls.forEach((imageUrl: string, index: number) => {
                const lineNumber = Math.floor(index / numbersPerLine);
                const positionInLine = index % numbersPerLine;

                const linkX = cellX + (positionInLine * numberWidth);
                const linkY = cellY + (lineNumber * lineHeight);

                doc.link(linkX, linkY, numberWidth, lineHeight, {
                  url: imageUrl,
                });
              });
            }
          },
          didDrawPage: function (data: any) {
            // Add page numbers
            const pageCount = doc.getNumberOfPages();
            const currentPage = data.pageNumber;
            doc.setFontSize(8);
            doc.text(
              `Page ${currentPage} of ${pageCount}`,
              14,
              doc.internal.pageSize.height - 10
            );
          },
        });
      } catch (tableError) {
        console.error("Error creating table:", tableError);
        // Fallback: Add simple text list
        let yPosition = 40;
        doc.setFontSize(10);
        tableData.forEach((row, index) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`${index + 1}. ${row[0]}`, 14, yPosition);
          yPosition += 10;
        });
      }

      // Save the PDF
      doc.save(`car-catalog-${new Date().toISOString().split("T")[0]}.pdf`);
      console.log("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return { generatePDF, isGeneratingPDF };
};
