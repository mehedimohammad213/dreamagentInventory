import jsPDF from "jspdf";
import { Order } from "./orderApi";

export interface InvoiceData {
  order: Order;
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
}

export class InvoiceService {
  private static readonly COMPANY_INFO = {
    name: "Car Management System",
    address: "123 Business Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "info@carmanagement.com",
    website: "www.carmanagement.com",
  };

  static generateInvoice(order: Order): void {
    const invoiceData: InvoiceData = {
      order,
      company: this.COMPANY_INFO,
      invoice_number: `INV-${order.id.toString().padStart(6, "0")}`,
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
    };

    this.createPDF(invoiceData);
  }

  private static createPDF(data: InvoiceData): void {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors
    const primaryColor = "#db2d2e"; // Brand Red
    const secondaryColor = "#64748b"; // Gray
    const accentColor = "#db2d2e"; // Brand Red
    const textColor = "#1e293b"; // Dark gray
    const lightGray = "#f1f5f9";

    // Helper function to add text with styling
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      doc.setFontSize(options.fontSize || 12);
      doc.setTextColor(options.color || textColor);
      doc.setFont(options.font || "helvetica", options.style || "normal");
      doc.text(text, x, y);
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

    // Header with gradient background
    addRect(0, 0, pageWidth, 60, primaryColor);

    // Company logo area (placeholder)
    addText("🚗", 20, 25, { fontSize: 24, color: "#ffffff" });
    addText(data.company.name, 50, 25, {
      fontSize: 20,
      color: "#ffffff",
      style: "bold",
    });
    addText("Premium Car Sales", 50, 32, { fontSize: 12, color: "#e2e8f0" });

    // Company details
    addText(data.company.address, 20, 45, { fontSize: 10, color: "#e2e8f0" });
    addText(data.company.phone, 20, 50, { fontSize: 10, color: "#e2e8f0" });
    addText(data.company.email, 20, 55, { fontSize: 10, color: "#e2e8f0" });

    // Invoice details
    addText("INVOICE", pageWidth - 60, 25, {
      fontSize: 24,
      color: "#ffffff",
      style: "bold",
    });
    addText(`#${data.invoice_number}`, pageWidth - 60, 32, {
      fontSize: 14,
      color: "#e2e8f0",
    });
    addText(`Date: ${data.invoice_date}`, pageWidth - 60, 40, {
      fontSize: 10,
      color: "#e2e8f0",
    });
    addText(`Due: ${data.due_date}`, pageWidth - 60, 45, {
      fontSize: 10,
      color: "#e2e8f0",
    });

    yPosition = 80;

    // Customer information
    addText("Bill To:", 20, yPosition, { fontSize: 14, style: "bold" });
    yPosition += 10;

    if (data.order.user) {
      addText(data.order.user.name, 20, yPosition, {
        fontSize: 12,
        style: "bold",
      });
      yPosition += 6;
      addText(data.order.user.email, 20, yPosition, {
        fontSize: 10,
        color: secondaryColor,
      });
      yPosition += 6;
    }

    if (data.order.shipping_address) {
      addText("Shipping Address:", 20, yPosition, {
        fontSize: 10,
        style: "bold",
      });
      yPosition += 6;
      const addressLines = data.order.shipping_address.split("\n");
      addressLines.forEach((line) => {
        addText(line, 20, yPosition, { fontSize: 10, color: secondaryColor });
        yPosition += 5;
      });
    }

    yPosition += 20;

    // Order items table
    addText("Order Items", 20, yPosition, { fontSize: 16, style: "bold" });
    yPosition += 15;

    // Table header
    addRect(20, yPosition - 5, pageWidth - 40, 15, lightGray);
    addText("Item", 25, yPosition + 2, { fontSize: 10, style: "bold" });
    addText("Description", 80, yPosition + 2, { fontSize: 10, style: "bold" });
    addText("Qty", pageWidth - 80, yPosition + 2, {
      fontSize: 10,
      style: "bold",
    });
    addText("Price", pageWidth - 60, yPosition + 2, {
      fontSize: 10,
      style: "bold",
    });
    addText("Total", pageWidth - 30, yPosition + 2, {
      fontSize: 10,
      style: "bold",
    });

    yPosition += 10;

    // Table rows
    data.order.items.forEach((item, index) => {
      const itemY = yPosition + index * 20;

      // Alternating row colors
      if (index % 2 === 0) {
        addRect(20, itemY - 5, pageWidth - 40, 20, "#fafafa");
      }

      // Item image placeholder
      addText("🚗", 25, itemY + 5, { fontSize: 12 });

      // Item details
      addText(`${item.car.make} ${item.car.model}`, 40, itemY, {
        fontSize: 10,
        style: "bold",
      });
      addText(`Year: ${item.car.year}`, 40, itemY + 5, {
        fontSize: 8,
        color: secondaryColor,
      });
      // Check if mileage exists on car object
      const mileage =
        "mileage_km" in item.car ? item.car.mileage_km : undefined;
      if (mileage) {
        addText(`Mileage: ${mileage.toLocaleString()} km`, 40, itemY + 10, {
          fontSize: 8,
          color: secondaryColor,
        });
      }

      // Quantity
      addText(item.quantity.toString(), pageWidth - 80, itemY + 5, {
        fontSize: 10,
        style: "bold",
      });

      // Price
      addText(`$${item.price.toLocaleString()}`, pageWidth - 60, itemY + 5, {
        fontSize: 10,
      });

      // Total
      const itemTotal = item.price * item.quantity;
      addText(`$${itemTotal.toLocaleString()}`, pageWidth - 30, itemY + 5, {
        fontSize: 10,
        style: "bold",
      });
    });

    yPosition += data.order.items.length * 20 + 20;

    // Totals section
    const totalsX = pageWidth - 100;
    const subtotal = data.order.total_amount;
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50000 ? 0 : 500; // Free shipping over $50,000
    const total = subtotal + tax + shipping;

    addText("Subtotal:", totalsX, yPosition, { fontSize: 12 });
    addText(`$${subtotal.toLocaleString()}`, totalsX + 50, yPosition, {
      fontSize: 12,
      style: "bold",
    });
    yPosition += 8;

    addText("Tax (8%):", totalsX, yPosition, { fontSize: 12 });
    addText(`$${tax.toLocaleString()}`, totalsX + 50, yPosition, {
      fontSize: 12,
      style: "bold",
    });
    yPosition += 8;

    addText("Shipping:", totalsX, yPosition, { fontSize: 12 });
    addText(
      shipping === 0 ? "Free" : `$${shipping.toLocaleString()}`,
      totalsX + 50,
      yPosition,
      { fontSize: 12, style: "bold" }
    );
    yPosition += 8;

    addLine(totalsX, yPosition, totalsX + 60, yPosition, textColor);
    yPosition += 8;

    addText("Total:", totalsX, yPosition, { fontSize: 14, style: "bold" });
    addText(`$${total.toLocaleString()}`, totalsX + 50, yPosition, {
      fontSize: 14,
      style: "bold",
      color: accentColor,
    });
    yPosition += 20;

    // Order status
    const statusColor = this.getStatusColor(data.order.status);
    addText("Order Status:", 20, yPosition, { fontSize: 12, style: "bold" });
    addText(data.order.status.toUpperCase(), 80, yPosition, {
      fontSize: 12,
      style: "bold",
      color: statusColor,
    });
    yPosition += 10;

    // Footer
    yPosition = pageHeight - 40;
    addLine(20, yPosition, pageWidth - 20, yPosition, secondaryColor);
    yPosition += 10;

    addText("Thank you for your business!", 20, yPosition, {
      fontSize: 12,
      style: "bold",
      color: primaryColor,
    });
    yPosition += 8;

    addText(
      `For questions about this invoice, contact us at ${data.company.email}`,
      20,
      yPosition,
      { fontSize: 10, color: secondaryColor }
    );
    addText(`Visit us at ${data.company.website}`, 20, yPosition + 6, {
      fontSize: 10,
      color: secondaryColor,
    });

    // Page number
    addText(`Page 1 of 1`, pageWidth - 30, pageHeight - 10, {
      fontSize: 8,
      color: secondaryColor,
    });

    // Download the PDF
    const filename = `Invoice-${data.invoice_number}.pdf`;
    doc.save(filename);
  }

  private static getStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return "#f59e0b"; // Yellow
      case "approved":
        return "#22c55e"; // Success Green
      case "shipped":
        return "#3b82f6"; // Blue
      case "delivered":
        return "#22c55e"; // Success Green
      case "canceled":
        return "#ef4444"; // Red
      default:
        return "#64748b"; // Gray
    }
  }
}
