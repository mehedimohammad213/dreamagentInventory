import jsPDF from "jspdf";

export interface StockInvoiceItem {
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    image_url?: string;
    mileage_km?: number;
  };
  quantity: number;
  price: number;
  code?: string;
  fob_value_usd?: number;
  freight_usd?: number;
}

export interface StockInvoiceData {
  items: StockInvoiceItem[];
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
}

export class StockInvoiceService {
  private static readonly COMPANY_INFO = {
    name: "Car Management System",
    address: "123 Business Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@carmanagement.com",
    website: "www.carmanagement.com",
  };

  static generateStockInvoice(items: StockInvoiceItem[]): void {
    const invoiceData: StockInvoiceData = {
      items,
      company: this.COMPANY_INFO,
      invoice_number: `STK-INV-${Date.now().toString().slice(-6)}`,
      invoice_date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      due_date: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      customer_name: "Stock Customer",
      customer_email: "customer@example.com",
      shipping_address: "123 Main St, City, State 12345",
    };

    this.createStockPDF(invoiceData);
  }

  private static createStockPDF(data: StockInvoiceData): void {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors for Stock Invoice
    const primaryColor = "#db2d2e"; // Brand Red
    const secondaryColor = "#64748b"; // Gray
    const accentColor = "#dc2626"; // Red
    const textColor = "#1e293b"; // Dark gray
    const lightGray = "#fdf3f3"; // Light brand red

    // Helper function to add text with styling
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const {
        fontSize,
        color,
        font,
        style,
        maxWidth,
        lineHeight = 5,
        align,
      } = options;

      doc.setFontSize(fontSize || 12);
      doc.setTextColor(color || textColor);
      doc.setFont(font || "helvetica", style || "normal");

      const lines = maxWidth
        ? doc.splitTextToSize(text, maxWidth)
        : Array.isArray(text)
        ? text
        : [text];

      lines.forEach((line: string, index: number) => {
        const textY = y + index * lineHeight;
        if (align) {
          doc.text(line, x, textY, { align });
        } else {
          doc.text(line, x, textY);
        }
      });

      return {
        lineCount: lines.length,
        height: (lines.length - 1) * lineHeight,
        lastY: y + (lines.length - 1) * lineHeight,
      };
    };

    // Helper function to add line
    const addLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string = primaryColor
    ) => {
      doc.setDrawColor(color);
      doc.setLineWidth(0.5);
      doc.line(x1, y1, x2, y2);
    };

    // Helper function to add rectangle
    const addRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      color: string = lightGray
    ) => {
      doc.setFillColor(color);
      doc.rect(x, y, width, height, "F");
    };

    let yPosition = 20;

    // Header with green gradient background
    addRect(0, 0, pageWidth, 60, primaryColor);

    // Company header text
    addText(data.company.name, 20, 25, {
      fontSize: 20,
      color: "#ffffff",
      style: "bold",
    });
    addText("Stock Management System", 20, 32, {
      fontSize: 12,
      color: "#e2e8f0",
    });

    // Company details
    addText(data.company.address, 20, 45, { fontSize: 10, color: "#e2e8f0" });
    addText(data.company.phone, 20, 50, { fontSize: 10, color: "#e2e8f0" });
    addText(data.company.email, 20, 55, { fontSize: 10, color: "#e2e8f0" });

    // Stock Invoice details
    addText("STOCK INVOICE", pageWidth - 70, 25, {
      fontSize: 24,
      color: "#ffffff",
      style: "bold",
    });
    addText(`#${data.invoice_number}`, pageWidth - 70, 32, {
      fontSize: 14,
      color: "#e2e8f0",
    });
    addText(`Date: ${data.invoice_date}`, pageWidth - 70, 40, {
      fontSize: 10,
      color: "#e2e8f0",
    });
    addText(`Due: ${data.due_date}`, pageWidth - 70, 45, {
      fontSize: 10,
      color: "#e2e8f0",
    });

    yPosition = 80;

    // Customer information
    addText("Customer Details:", 20, yPosition, {
      fontSize: 14,
      style: "bold",
    });
    yPosition += 10;

    addText(data.customer_name, 20, yPosition, {
      fontSize: 12,
      style: "bold",
    });
    yPosition += 6;
    addText(data.customer_email, 20, yPosition, {
      fontSize: 10,
      color: secondaryColor,
    });
    yPosition += 6;

    addText("Shipping Address:", 20, yPosition, {
      fontSize: 10,
      style: "bold",
    });
    yPosition += 6;
    const addressLines = data.shipping_address.split("\n");
    addressLines.forEach((line) => {
      addText(line, 20, yPosition, { fontSize: 10, color: secondaryColor });
      yPosition += 5;
    });

    yPosition += 20;

    // Stock items table
    addText("Stock Items", 20, yPosition, { fontSize: 16, style: "bold" });
    yPosition += 15;

    // Table header
    const marginLeft = 20;
    const marginRight = 20;
    const lineHeight = 5;
    const rowPadding = 4;
    const rowSpacing = 4;

    const totalColumnWidth = 35;
    const freightColumnWidth = 30;
    const fobColumnWidth = 30;
    const qtyColumnWidth = 15;

    const totalColumnX = pageWidth - marginRight;
    const freightColumnX = totalColumnX - totalColumnWidth;
    const fobColumnX = freightColumnX - fobColumnWidth;
    const qtyColumnX = fobColumnX - qtyColumnWidth;
    const itemColumnX = 55;
    const codeColumnX = marginLeft + 5;
    const itemColumnWidth = qtyColumnX - itemColumnX - 10;
    const codeColumnWidth = itemColumnX - codeColumnX - 5;

    addRect(20, yPosition - 5, pageWidth - 40, 15, lightGray);
    addText("Code", codeColumnX, yPosition + 2, {
      fontSize: 10,
      style: "bold",
    });
    addText("Item", itemColumnX, yPosition + 2, {
      fontSize: 10,
      style: "bold",
    });
    addText("Qty", qtyColumnX, yPosition + 2, {
      fontSize: 10,
      style: "bold",
      align: "right",
    });
    addText("FOB", fobColumnX, yPosition + 2, {
      fontSize: 10,
      style: "bold",
      align: "right",
    });
    addText("Freight", freightColumnX, yPosition + 2, {
      fontSize: 10,
      style: "bold",
      align: "right",
    });
    addText("Total", totalColumnX, yPosition + 2, {
      fontSize: 10,
      style: "bold",
      align: "right",
    });

    yPosition += 12;

    // Table rows
    let currentRowY = yPosition;
    data.items.forEach((item, index) => {
      const codeText = item.code || `STK-${item.car.id}`;
      const nameText = `${item.car.make} ${item.car.model}`;
      const mileageText = item.car.mileage_km
        ? `Mileage: ${item.car.mileage_km.toLocaleString()} km`
        : "";
      const codeLines = doc.splitTextToSize(codeText, codeColumnWidth);
      const nameLines = doc.splitTextToSize(nameText, itemColumnWidth);
      const detailLineCount =
        nameLines.length + (mileageText ? 2 : 1); // year + optional mileage

      const contentHeight = Math.max(
        codeLines.length * lineHeight,
        detailLineCount * lineHeight + 2
      );
      const rowHeight = Math.max(18, contentHeight) + rowPadding * 2;

      if (index % 2 === 0) {
        addRect(marginLeft, currentRowY - rowPadding, pageWidth - 40, rowHeight, "#fafafa");
      }

      const codeY = currentRowY + lineHeight;
      addText(codeText, codeColumnX, codeY, {
        fontSize: 9,
        style: "bold",
        maxWidth: codeColumnWidth,
        lineHeight,
      });

      const nameResult = addText(nameText, itemColumnX, currentRowY + lineHeight, {
        fontSize: 10,
        style: "bold",
        maxWidth: itemColumnWidth,
        lineHeight,
      });

      const yearY = nameResult.lastY + lineHeight;
      addText(`Year: ${item.car.year}`, itemColumnX, yearY, {
        fontSize: 8,
        color: secondaryColor,
        maxWidth: itemColumnWidth,
        lineHeight,
      });

      if (mileageText) {
        addText(mileageText, itemColumnX, yearY + lineHeight, {
          fontSize: 8,
          color: secondaryColor,
          maxWidth: itemColumnWidth,
          lineHeight,
        });
      }

      const numericY = currentRowY + lineHeight;
      addText(item.quantity.toString(), qtyColumnX, numericY, {
        fontSize: 10,
        style: "bold",
        align: "right",
      });

      addText(
        `BDT ${(item.fob_value_usd || item.price).toLocaleString()}`,
        fobColumnX,
        numericY,
        {
          fontSize: 9,
          align: "right",
          maxWidth: fobColumnWidth,
        }
      );

      addText(
        `BDT ${(item.freight_usd || 0).toLocaleString()}`,
        freightColumnX,
        numericY,
        {
          fontSize: 9,
          align: "right",
          maxWidth: freightColumnWidth,
        }
      );

      const itemTotal = item.price * item.quantity;
      addText(`BDT ${itemTotal.toLocaleString()}`, totalColumnX, numericY, {
        fontSize: 10,
        style: "bold",
        align: "right",
        maxWidth: totalColumnWidth,
      });

      currentRowY += rowHeight + rowSpacing;
    });

    yPosition = currentRowY + 12;

    // Totals section
    const totalsLabelX = pageWidth - 75;
    const totalsValueX = pageWidth - 20;
    const subtotal = data.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const totalFob = data.items.reduce(
      (total, item) =>
        total + (item.fob_value_usd || item.price) * item.quantity,
      0
    );
    const totalFreight = data.items.reduce(
      (total, item) => total + (item.freight_usd || 0) * item.quantity,
      0
    );
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    addText("Subtotal:", totalsLabelX, yPosition, { fontSize: 12 });
    addText(`BDT ${subtotal.toLocaleString()}`, totalsValueX, yPosition, {
      fontSize: 12,
      style: "bold",
      align: "right",
    });
    yPosition += 8;

    addText("Total FOB:", totalsLabelX, yPosition, { fontSize: 12 });
    addText(`BDT ${totalFob.toLocaleString()}`, totalsValueX, yPosition, {
      fontSize: 12,
      style: "bold",
      align: "right",
    });
    yPosition += 8;

    addText("Total Freight:", totalsLabelX, yPosition, { fontSize: 12 });
    addText(`BDT ${totalFreight.toLocaleString()}`, totalsValueX, yPosition, {
      fontSize: 12,
      style: "bold",
      align: "right",
    });
    yPosition += 8;

    addText("Tax (8%):", totalsLabelX, yPosition, { fontSize: 12 });
    addText(`BDT ${tax.toLocaleString()}`, totalsValueX, yPosition, {
      fontSize: 12,
      style: "bold",
      align: "right",
    });
    yPosition += 8;

    addLine(totalsLabelX, yPosition, totalsValueX, yPosition, textColor);
    yPosition += 8;

    addText("Total:", totalsLabelX, yPosition, { fontSize: 14, style: "bold" });
    addText(`BDT ${total.toLocaleString()}`, totalsValueX, yPosition, {
      fontSize: 14,
      style: "bold",
      color: accentColor,
      align: "right",
    });
    yPosition += 20;

    // Stock information (commented out per request)
    // addText("Stock Information:", 20, yPosition, {
    //   fontSize: 12,
    //   style: "bold",
    // });
    // yPosition += 10;
    // addText(`Total Items: ${data.items.length}`, 20, yPosition, {
    //   fontSize: 10,
    // });
    // addText(
    //   `Total Quantity: ${data.items.reduce(
    //     (sum, item) => sum + item.quantity,
    //     0
    //   )}`,
    //   20,
    //   yPosition + 6,
    //   { fontSize: 10 }
    // );

    // Footer
    yPosition = pageHeight - 40;
    addLine(20, yPosition, pageWidth - 20, yPosition, secondaryColor);
    yPosition += 10;

    addText("Thank you for your stock purchase!", 20, yPosition, {
      fontSize: 12,
      style: "bold",
      color: primaryColor,
    });
    yPosition += 8;

    // addText(
    //   `For questions about this stock invoice, contact us at ${data.company.email}`,
    //   20,
    //   yPosition,
    //   { fontSize: 10, color: secondaryColor }
    // );
    // addText(`Visit us at ${data.company.website}`, 20, yPosition + 6, {
    //   fontSize: 10,
    //   color: secondaryColor,
    // });

    // Page number
    addText(`Page 1 of 1`, pageWidth - 30, pageHeight - 10, {
      fontSize: 8,
      color: secondaryColor,
    });

    // Download the PDF
    const filename = `Stock-Invoice-${data.invoice_number}.pdf`;
    doc.save(filename);
  }
}
