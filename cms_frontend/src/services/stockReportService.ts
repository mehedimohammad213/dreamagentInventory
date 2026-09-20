import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Stock } from "./stockApi";

export const StockReportService = {
    generatePDF: async (stocks: Stock[], searchTerm?: string) => {
        if (stocks.length === 0) {
            alert("No stocks to export. Please ensure some stocks are available.");
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const tableLeftMargin = 14;
        const tableWidth = 8 + 45 + 15 + 18 + 20 + 40 + 20 + 24;
        const tableRightEdge = tableLeftMargin + tableWidth;

        // Format current date as "DD MONTH YYYY"
        const now = new Date();
        const months = [
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        ];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const dateStr = `STOCK LIST DATE: ${day} ${month} ${year}`;

        const drawHeader = () => {
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("DREAM AGENT CAR VISION", pageWidth / 2, 20, {
                align: "center",
            });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(
                "57, Purana Palton Line, VIP Road, Dhaka-1000. Contact No : 01714211956",
                pageWidth / 2,
                26,
                { align: "center" }
            );

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            const stockListText = "STOCK LIST";
            const stockListTextWidth = doc.getTextWidth(stockListText);
            doc.text(stockListText, pageWidth / 2, 38, { align: "center" });
            // Draw underline for STOCK LIST
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            const underlineY = 38 + 2;
            doc.line(
                pageWidth / 2 - stockListTextWidth / 2,
                underlineY,
                pageWidth / 2 + stockListTextWidth / 2,
                underlineY
            );

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(dateStr, tableRightEdge, 38, { align: "right" });
        };

        // Sort stocks by Make, Model, then Year (descending)
        const sortedStocks = [...stocks].sort((a, b) => {
            const makeA = (a.car?.make || "").toLowerCase();
            const makeB = (b.car?.make || "").toLowerCase();
            if (makeA !== makeB) return makeA.localeCompare(makeB);

            const modelA = (a.car?.model || "").toLowerCase();
            const modelB = (b.car?.model || "").toLowerCase();
            if (modelA !== modelB) return modelA.localeCompare(modelB);

            const yearA = a.car?.year || 0;
            const yearB = b.car?.year || 0;
            return yearB - yearA;
        });

        const tableColumns = [
            "Sl.",
            "Car Name",
            "Grade",
            "Mileage",
            "Color/CC",
            "Key Features",
            "Price",
            "View",
        ];

        const viewLinkMap: Map<number, string> = new Map();
        const groupHeaderRows: Set<number> = new Set();
        let currentSl = 1;
        let lastMake = "";
        let lastModel = "";

        const tableData: any[][] = [];

        sortedStocks.forEach((stock) => {
            const car = stock.car;
            const make = (car?.make || "N/A").toUpperCase();
            const model = (car?.model || "N/A").toUpperCase();

            // Insert group header if make or model changes
            if (make !== lastMake || model !== lastModel) {
                groupHeaderRows.add(tableData.length);
                tableData.push([
                    {
                        content: `${make} - ${model}`,
                        colSpan: 8,
                        styles: {
                            fillColor: [240, 240, 240],
                            fontStyle: 'bold',
                            halign: 'center',
                            textColor: [0, 0, 0],
                            fontSize: 8
                        }
                    }
                ]);
                lastMake = make;
                lastModel = model;
            }

            try {
                if (!car) {
                    tableData.push([
                        (currentSl++).toString(),
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        "N/A",
                        `Location: N/A\nStatus: ${stock.status || "N/A"}`,
                    ]);
                    return;
                }

                const packageText = car.package ? `${car.package} ` : "";
                const fuelType = car.fuel ? `-${car.fuel.toUpperCase()}` : "";
                const carName = `${car.year || "N/A"} ${car.make || "N/A"} ${car.model || "N/A"} ${packageText}${fuelType}\nChassis No: ${car.chassis_no_full || car.chassis_no_masked || "N/A"}`;

                const grade = car.grade_overall || "N/A";
                const mileage = car.mileage_km
                    ? `${car.mileage_km.toLocaleString()} Km`
                    : "N/A";
                const color = car.color ? car.color.toUpperCase() : "N/A";
                const cc = car.engine_cc ? `${car.engine_cc.toLocaleString()} CC` : "";
                const colorCC = cc ? `${color}\n${cc}` : color;
                const keyFeatures = car.keys_feature
                    ? car.keys_feature
                        .split(",")
                        .map((f: string) => f.trim())
                        .join(", ")
                    : "N/A";
                const price = car.price_amount
                    ? `৳ ${typeof car.price_amount === "string"
                        ? parseFloat(car.price_amount).toLocaleString("en-IN")
                        : (car.price_amount as number).toLocaleString("en-IN")}`
                    : "Price on request";
                const location = car.location || "N/A";
                const viewLabel = "View Cars";
                const viewText = `${viewLabel}\nLocation: ${location}`;

                const baseUrl =
                    typeof window !== "undefined" && window.location?.origin
                        ? window.location.origin
                        : "";
                const viewUrl = `${baseUrl}/stock-gallery/${stock.id}`;
                viewLinkMap.set(tableData.length, viewUrl);

                tableData.push([
                    (currentSl++).toString(),
                    carName,
                    grade,
                    mileage,
                    colorCC,
                    keyFeatures,
                    price,
                    viewText,
                ]);
            } catch (error) {
                console.error("Error processing stock data:", error, stock);
                tableData.push([
                    (currentSl++).toString(),
                    "Error",
                    "Error",
                    "Error",
                    "Error",
                    "Error",
                    "Error",
                    "Error",
                ]);
            }
        });

        try {
            autoTable(doc, {
                head: [tableColumns],
                body: tableData,
                startY: 44,
                margin: { top: 44 },
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: "bold",
                    lineWidth: 0.5,
                    lineColor: [0, 0, 0],
                },
                bodyStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineWidth: 0.1,
                    lineColor: [0, 0, 0],
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 250],
                },
                columnStyles: {
                    0: { cellWidth: 8, halign: "center" },
                    1: { cellWidth: 45, halign: "left" },
                    2: { cellWidth: 15, halign: "center" },
                    3: { cellWidth: 18, halign: "center" },
                    4: { cellWidth: 20, halign: "left" },
                    5: { cellWidth: 40, halign: "left" },
                    6: { cellWidth: 20, halign: "right" },
                    7: { cellWidth: 24, halign: "left" },
                },
                didParseCell: function (data: any) {
                    const rowIndex = data.row.index;
                    const isGroupHeader = groupHeaderRows.has(rowIndex);

                    if (isGroupHeader) return;

                    if (data.column.index === 7 && data.row.index >= 0 && data.section !== 'head') {
                        const viewUrl = viewLinkMap.get(rowIndex);
                        if (viewUrl) {
                            data.cell.viewUrl = viewUrl;
                            data.cell.originalText = data.cell.text;
                            data.cell.text = [];
                        }
                    }

                    if (data.column.index === 1 && data.section === 'body') {
                        const currentPadding = data.cell.styles.cellPadding;
                        const basePadding = (typeof currentPadding === 'number') ? currentPadding : 2;

                        data.cell.styles.cellPadding = {
                            top: basePadding,
                            left: basePadding,
                            right: basePadding,
                            bottom: basePadding + 6
                        };
                    }
                },
                willDrawCell: function (data: any) {
                    const rowIndex = data.row.index;
                    const isGroupHeader = groupHeaderRows.has(rowIndex);

                    if (data.column.index === 1 && data.section === 'body' && !isGroupHeader) {
                        data.cell.customRender = true;
                        data.cell.originalText = data.cell.text;
                        data.cell.text = [];
                    }
                },
                didDrawCell: function (data: any) {
                    if (data.column.index === 1 && data.section === 'body' && data.cell.customRender) {
                        const cellX = data.cell.x;
                        const cellY = data.cell.y;
                        const padding = data.cell.padding("left") || 2;
                        const originalText = data.cell.originalText || [];
                        const lines = Array.isArray(originalText) ? originalText : [originalText];
                        const textX = cellX + padding;
                        let currentY = cellY + padding + 3;

                        const originalTextColor = doc.getTextColor();
                        const originalFontSize = doc.getFontSize();
                        doc.setFontSize(7);

                        let isChassisSection = false;
                        lines.forEach((line: string) => {
                            const isChassisLine = typeof line === 'string' && line.includes("Chassis No");
                            if (isChassisLine) {
                                isChassisSection = true;
                                currentY += 2;
                            }
                            if (isChassisSection) {
                                doc.setTextColor(0, 0, 0);
                            } else {
                                if (line.trim() !== "") {
                                    doc.setTextColor(255, 0, 0);
                                }
                            }
                            doc.text(line, textX, currentY);
                            currentY += 3.5;
                        });

                        doc.setTextColor(originalTextColor);
                        doc.setFontSize(originalFontSize);
                    }

                    if (data.column.index === 7 && data.cell.viewUrl && data.cell.originalText && data.section !== 'head') {
                        const cellX = data.cell.x;
                        const cellY = data.cell.y;
                        const cellWidth = data.cell.width;
                        const cellHeight = data.cell.height;
                        const padding = data.cell.padding("left") || 2;
                        const lineHeight = 4;

                        try {
                            const cellText = data.cell.originalText || [];
                            const fullText = Array.isArray(cellText) ? cellText.join("\n") : cellText;
                            const lines = fullText.split("\n");
                            const viewCarsText = "View Cars";

                            if (lines[0] && lines[0].includes(viewCarsText)) {
                                const textX = cellX + padding;
                                const textY = cellY + padding + 2;
                                const originalTextColor = doc.getTextColor();
                                const originalFontSize = doc.getFontSize();

                                doc.setFontSize(7);
                                doc.setTextColor(0, 0, 255);
                                doc.setFont("helvetica", "normal");
                                doc.text(viewCarsText, textX, textY);

                                const textWidth = doc.getTextWidth(viewCarsText);
                                doc.setDrawColor(0, 0, 255);
                                doc.setLineWidth(0.3);
                                const underlineY = textY + 1;
                                doc.line(textX, underlineY, textX + textWidth, underlineY);

                                if (lines.length > 1) {
                                    doc.setTextColor(0, 0, 0);
                                    const remainingText = lines.slice(1).join("\n");
                                    doc.text(remainingText, textX, textY + lineHeight, {
                                        maxWidth: cellWidth - 2 * padding,
                                    });
                                }
                                doc.setTextColor(originalTextColor);
                                doc.setFontSize(originalFontSize);
                            }
                            doc.link(cellX, cellY, cellWidth, cellHeight, {
                                url: data.cell.viewUrl,
                            });
                        } catch (linkError) {
                            console.warn(`Could not add link for row ${data.row.index}`, linkError);
                        }
                    }
                },
                didDrawPage: function (data: any) {
                    const currentPageNumber = data.pageNumber;

                    // Draw the full header on every page
                    drawHeader();

                    const pageCount = doc.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.text(
                        `Page ${currentPageNumber} of ${pageCount}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: "center" }
                    );
                },
            });
        } catch (tableError) {
            console.error("Error creating table:", tableError);
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

        doc.save(`stock-report-${new Date().toISOString().split("T")[0]}.pdf`);
    }
};
