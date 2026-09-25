import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatTime } from './dateUtils';

/**
 * Generate a jsPDF document for a Lenscraft Bill
 * Matches the official on-screen Lenscraft Order Form / Bill Invoice format exactly (Image 1 replica)
 * @param {Object} billData - Normalized or raw bill data
 * @returns {jsPDF} doc
 */
export const generateBillPdfDoc = (billData = {}) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width || 210;
  
  // Format variables
  const billNo = String(billData.billNumber || billData.bill_number || billData.invoiceNo || billData.bNumber || '0004');
  const custName = String(billData.customerName || billData.customer_name || billData.customer?.name || 'Walk-in Customer');
  const custPhone = String(billData.customerPhone || billData.customer_phone || billData.customer?.phone || '-');
  const custAddress = String(billData.customerAddress || billData.customer_address || billData.customer?.address || '-');
  const custDob = String(billData.customerDob || billData.customer_dob || billData.customer?.dob || billData.dob || '-');

  let orderDate = billData.orderDate || billData.billDate || billData.date;
  if (!orderDate && billData.createdAt) {
    orderDate = formatDate(billData.createdAt);
  } else if (!orderDate) {
    orderDate = formatDate(new Date());
  }

  let orderTime = billData.orderTime || billData.time || billData.currentTime;
  if (!orderTime && billData.createdAt) {
    orderTime = formatTime(billData.createdAt);
  } else if (!orderTime) {
    orderTime = formatTime(new Date());
  }

  const dueDate = String(billData.dueDate || billData.due_date || orderDate);
  const byCourier = String(billData.byCourier || billData.by_courier || billData.courier || 'No');

  const frameName = String(billData.frameName || billData.frame_name || billData.frameNo || billData.frame_no || billData.frameDetail || billData.brand || '-');
  const lensType = String(billData.lensType || billData.lens_type || billData.lensesDetail || billData.lenses_detail || '-');

  const dvReSph = String(billData.dvReSph ?? billData.dv_re_sph ?? '-');
  const dvReCyl = String(billData.dvReCyl ?? billData.dv_re_cyl ?? '-');
  const dvReAxis = String(billData.dvReAxis ?? billData.dv_re_axis ?? '-');
  const dvLeSph = String(billData.dvLeSph ?? billData.dv_le_sph ?? '-');
  const dvLeCyl = String(billData.dvLeCyl ?? billData.dv_le_cyl ?? '-');
  const dvLeAxis = String(billData.dvLeAxis ?? billData.dv_le_axis ?? '-');

  const nvReSph = String(billData.nvReSph ?? billData.nv_re_sph ?? '-');
  const nvReCyl = String(billData.nvReCyl ?? billData.nv_re_cyl ?? '-');
  const nvReAxis = String(billData.nvReAxis ?? billData.nv_re_axis ?? '-');
  const nvLeSph = String(billData.nvLeSph ?? billData.nv_le_sph ?? '-');
  const nvLeCyl = String(billData.nvLeCyl ?? billData.nv_le_cyl ?? '-');
  const nvLeAxis = String(billData.nvLeAxis ?? billData.nv_le_axis ?? '-');

  const total = parseFloat(billData.total ?? billData.finalTotal ?? billData.summary?.total ?? billData.grandTotal ?? billData.amount ?? 0);
  const paid = parseFloat(billData.advanceAmount ?? billData.advance_amount ?? billData.payment?.advanceAmount ?? billData.paidAmount ?? billData.paid_amount ?? billData.payment?.paidAmount ?? 0);
  let balance = parseFloat(billData.balanceAmount ?? billData.balance_amount ?? billData.payment?.balanceAmount ?? 0);
  if (balance === 0 && total > paid) {
    balance = total - paid;
  }
  const remainingDue = Math.max(0, total - (paid + balance));

  const advMethod = (billData.advancePaymentMethod || billData.advance_payment_method || billData.paymentMethod || billData.payment_method || billData.payment?.advancePaymentMethod || billData.payment?.method || 'CASH').toUpperCase().replace('_', ' ');
  const balMethod = (billData.balancePaymentMethod || billData.balance_payment_method || billData.payment?.balancePaymentMethod || 'CASH').toUpperCase().replace('_', ' ');

  // Outer Framing Coordinates
  const marginX = 8;
  const marginY = 8;
  const contentWidth = pageWidth - (marginX * 2); // 194mm
  const innerPad = 5;
  const leftX = marginX + innerPad; // 13mm
  const rightX = marginX + contentWidth - innerPad; // 197mm
  const innerWidth = rightX - leftX; // 184mm

  // Colors
  const blueColor = [27, 67, 116];      // #1b4374
  const lightBlueBg = [232, 242, 252];  // #e8f2fc
  const notesBg = [240, 247, 255];      // #f0f7ff
  const darkSlate = [15, 23, 42];       // #0f172a
  const grayLine = [203, 213, 225];     // #cbd5e1

  // 1. TOP HEADER SECTION
  let curY = 13;

  // Kheteswar Optics Geometric Emblem Vector
  const embX = leftX + 5.5;
  const embY = curY + 4.5;
  const embR = 4.2;
  const embBrown = [112, 60, 16];

  doc.setFillColor(embBrown[0], embBrown[1], embBrown[2]);
  doc.circle(embX, embY, embR, 'F');

  const sqH = embR * 0.7071 * 0.95;
  doc.setFillColor(255, 255, 255);
  doc.rect(embX - sqH, embY - sqH, sqH * 2, sqH * 2, 'F');

  doc.setFillColor(embBrown[0], embBrown[1], embBrown[2]);
  doc.triangle(embX - sqH, embY - sqH, embX, embY - sqH, embX - sqH, embY, 'FD');
  doc.triangle(embX + sqH, embY - sqH, embX, embY - sqH, embX + sqH, embY, 'FD');
  doc.triangle(embX - sqH, embY + sqH, embX, embY + sqH, embX - sqH, embY, 'FD');
  doc.triangle(embX + sqH, embY + sqH, embX, embY + sqH, embX + sqH, embY, 'FD');

  const inSq = sqH * 0.55;
  doc.rect(embX - inSq, embY - inSq, inSq * 2, inSq * 2, 'F');

  const inD = inSq * 0.82;
  doc.setFillColor(255, 255, 255);
  doc.triangle(embX, embY - inD, embX + inD, embY, embX, embY + inD, 'F');
  doc.triangle(embX, embY - inD, embX - inD, embY, embX, embY + inD, 'F');

  const inSq2 = inD * 0.55;
  doc.setFillColor(embBrown[0], embBrown[1], embBrown[2]);
  doc.rect(embX - inSq2, embY - inSq2, inSq2 * 2, inSq2 * 2, 'F');

  const dotR = inSq2 * 0.45;
  doc.setFillColor(255, 255, 255);
  doc.circle(embX, embY, dotR, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('KHETESWAR OPTICS', leftX, curY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  doc.text('128, Baker Street, Broadway, Chennai - 600001.', leftX, curY + 16.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.text('Mobile: 7708560890', leftX, curY + 21.2);

  // Right Top: Customer Information Table (Name, Mobile No, Address, DOB, Invoice No)
  const metaRightX = leftX + 96; // 109mm
  const metaWidth = innerWidth - 96; // 88mm
  const rowH = 5.2;
  const metaStartY = curY + 0.5;

  const metaRows = [
    { label: 'Name', value: custName, isBold: true },
    { label: 'Mobile No', value: custPhone, isBold: true },
    { label: 'Address', value: custAddress, isBold: false },
    { label: 'DOB', value: custDob, isBold: false },
    { label: 'Invoice No', value: billNo, isBold: true, isInvoice: true }
  ];

  metaRows.forEach((row, idx) => {
    const rowY = metaStartY + (idx * rowH);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    doc.text(row.label, metaRightX, rowY + 3.8);

    // Colon
    doc.text(':', metaRightX + 22, rowY + 3.8);

    // Value
    doc.setFont('helvetica', row.isBold ? 'bold' : 'normal');
    if (row.isInvoice) {
      doc.setFontSize(9);
      doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    }
    
    // Truncate long value if needed
    const maxValWidth = metaWidth - 28;
    let displayVal = row.value;
    if (doc.getTextWidth(displayVal) > maxValWidth) {
      while (doc.getTextWidth(displayVal + '...') > maxValWidth && displayVal.length > 0) {
        displayVal = displayVal.slice(0, -1);
      }
      displayVal += '...';
    }
    doc.text(displayVal, metaRightX + 26, rowY + 3.8);

    // Light grey bottom underline
    doc.setDrawColor(grayLine[0], grayLine[1], grayLine[2]);
    doc.setLineWidth(0.2);
    doc.line(metaRightX, rowY + 5, metaRightX + metaWidth, rowY + 5);
  });

  // 2. DOUBLE HORIZONTAL DIVIDER LINE
  curY = metaStartY + (metaRows.length * rowH) + 3; // ~40mm
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(0.6);
  doc.line(leftX, curY, rightX, curY);
  doc.setLineWidth(0.25);
  doc.line(leftX, curY + 1, rightX, curY + 1);

  // 3. SUB-HEADER META BAR (Order Date, Due Date, Time, By Courier)
  curY += 3.5; // ~44.5mm
  const subBarH = 7.5;
  doc.setFillColor(lightBlueBg[0], lightBlueBg[1], lightBlueBg[2]);
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(0.35);
  doc.roundedRect(leftX, curY, innerWidth, subBarH, 1, 1, 'FD');

  const col1X = leftX + 3;
  const col2X = leftX + 46;
  const col3X = leftX + 96;
  const col4X = leftX + 138;

  // Vertical separators in meta bar
  doc.setDrawColor(grayLine[0], grayLine[1], grayLine[2]);
  doc.setLineWidth(0.3);
  doc.line(col2X - 2, curY + 1.2, col2X - 2, curY + subBarH - 1.2);
  doc.line(col3X - 2, curY + 1.2, col3X - 2, curY + subBarH - 1.2);
  doc.line(col4X - 2, curY + 1.2, col4X - 2, curY + subBarH - 1.2);

  doc.setFontSize(7.5);

  // Col 1: Order Date
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('Order Date :', col1X, curY + 5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(String(orderDate), col1X + 17, curY + 5);

  // Col 2: Due Date
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('Due Date :', col2X, curY + 5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(String(dueDate), col2X + 15, curY + 5);

  // Col 3: Time
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('Time :', col3X, curY + 5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(String(orderTime), col3X + 10, curY + 5);

  // Col 4: By Courier
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('By Courier :', col4X, curY + 5);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(String(byCourier), col4X + 17, curY + 5);

  // 4. MAIN 2-COLUMN SECTION
  curY += subBarH + 3.5; // ~55.5mm
  const mainStartY = curY;
  const leftColW = 100;
  const rightColW = innerWidth - leftColW - 4; // 80mm
  const rightColX = leftX + leftColW + 4; // 117mm

  // --- LEFT COLUMN: Product Details & Prescription Power Table ---
  // A. Product Details Card
  const prodCardH = 19;
  doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.roundedRect(leftX, curY, leftColW, 5.5, 0.5, 0.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Product Details', leftX + 3, curY + 4);

  // Card Body
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(0.35);
  doc.rect(leftX, curY + 5.5, leftColW, prodCardH - 5.5, 'S');

  // Frame Name Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('Frame Name', leftX + 3, curY + 10.2);
  doc.text(':', leftX + 22, curY + 10.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(String(frameName), leftX + 25, curY + 10.2);

  // Dotted line under Frame Name
  doc.setDrawColor(grayLine[0], grayLine[1], grayLine[2]);
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.line(leftX + 25, curY + 11.5, leftX + leftColW - 3, curY + 11.5);
  doc.setLineDashPattern([], 0); // Reset dash

  // Lens Type Line
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.text('Lens Type', leftX + 3, curY + 16.2);
  doc.text(':', leftX + 22, curY + 16.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(String(lensType), leftX + 25, curY + 16.2);

  // B. Eye Prescription Power Table (autoTable)
  const rxTableY = curY + prodCardH + 3;
  const rxBody = [
    ['D.V.', dvReSph, dvReCyl, dvReAxis, dvLeSph, dvLeCyl, dvLeAxis],
    ['N.V.', nvReSph, nvReCyl, nvReAxis, nvLeSph, nvLeCyl, nvLeAxis]
  ];

  autoTable(doc, {
    startY: rxTableY,
    margin: { left: leftX, right: pageWidth - leftX - leftColW },
    tableWidth: leftColW,
    head: [
      [
        { content: '', rowSpan: 2, styles: { fillColor: lightBlueBg } },
        { content: 'R.E.', colSpan: 3, styles: { halign: 'center', fillColor: blueColor, textColor: [255, 255, 255] } },
        { content: 'L.E.', colSpan: 3, styles: { halign: 'center', fillColor: blueColor, textColor: [255, 255, 255] } }
      ],
      [
        { content: 'SPH', styles: { halign: 'center', fillColor: lightBlueBg, textColor: blueColor } },
        { content: 'CYL', styles: { halign: 'center', fillColor: lightBlueBg, textColor: blueColor } },
        { content: 'AXIS', styles: { halign: 'center', fillColor: lightBlueBg, textColor: blueColor } },
        { content: 'SPH', styles: { halign: 'center', fillColor: lightBlueBg, textColor: blueColor } },
        { content: 'CYL', styles: { halign: 'center', fillColor: lightBlueBg, textColor: blueColor } },
        { content: 'AXIS', styles: { halign: 'center', fillColor: lightBlueBg, textColor: blueColor } }
      ]
    ],
    body: rxBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      halign: 'center',
      valign: 'middle',
      lineColor: blueColor,
      lineWidth: 0.3,
      textColor: darkSlate
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: lightBlueBg, textColor: blueColor, cellWidth: 16 }
    }
  });

  const leftFinalY = doc.lastAutoTable.finalY;

  // --- RIGHT COLUMN: Description & Financials Table (autoTable) ---
  const rawItems = billData.items || billData.products || billData.selectedProducts || [];
  const validItems = Array.isArray(rawItems) ? rawItems.filter(item => item && (
    (parseFloat(item.total || 0) > 0) ||
    (parseFloat(item.sellPrice || item.sell_price || item.price || 0) > 0) ||
    (parseInt(item.quantity || item.qty || 0, 10) > 0) ||
    (item.productName || item.product_name || item.name)
  )) : [];

  let tableItems = validItems.map(p => {
    const name = p.productName || p.product_name || p.name || p.brand || p.itemName || p.item_name || 'Optical Item';
    const model = p.productModel || p.product_model || p.model || '';
    const qty = parseInt(p.quantity || p.qty || 1, 10) || 1;
    let price = parseFloat(p.sellPrice || p.sell_price || p.price || 0);
    let itemTot = parseFloat(p.total || p.amount || 0);

    if (itemTot === 0 && price > 0) {
      itemTot = qty * price;
    } else if (itemTot === 0 && price === 0 && validItems.length === 1 && total > 0) {
      itemTot = total;
    }

    const desc = `${name}${model ? ` (${model})` : ''}${qty > 1 ? ` x${qty}` : ''}`;
    return [desc, `Rs. ${itemTot.toFixed(2)}`];
  });

  if (tableItems.length === 0) {
    const defaultDesc = (frameName && frameName !== '-')
      ? `${frameName}${lensType && lensType !== '-' ? ' + ' + lensType : ''}`
      : 'Optical Item';
    tableItems = [[defaultDesc, `Rs. ${total.toFixed(2)}`]];
  }

  // Pad empty rows so heights are aligned
  const minRows = 3;
  while (tableItems.length < minRows) {
    tableItems.push(['', '']);
  }

  // Add Summary Rows
  const summaryRows = [
    [
      { content: 'TOTAL', styles: { halign: 'right', fontStyle: 'bold', textColor: blueColor, fillColor: lightBlueBg } },
      { content: `Rs. ${total.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: blueColor, fillColor: lightBlueBg } }
    ],
    [
      { content: `Adv. Recd. (${advMethod})`, styles: { halign: 'right', fontStyle: 'bold', textColor: blueColor, fillColor: lightBlueBg } },
      { content: `Rs. ${paid.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: darkSlate, fillColor: lightBlueBg } }
    ],
    [
      { content: `Balance Amt. (${balMethod})`, styles: { halign: 'right', fontStyle: 'bold', textColor: blueColor, fillColor: lightBlueBg } },
      { content: `Rs. ${balance.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: darkSlate, fillColor: lightBlueBg } }
    ]
  ];

  if (remainingDue > 0) {
    summaryRows.push([
      { content: 'Remaining Due', styles: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28], fillColor: [254, 242, 242] } },
      { content: `Rs. ${remainingDue.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28], fillColor: [254, 242, 242] } }
    ]);
  }

  const fullRightBody = [...tableItems, ...summaryRows];

  autoTable(doc, {
    startY: mainStartY,
    margin: { left: rightColX, right: marginX + innerPad },
    tableWidth: rightColW,
    head: [
      [
        { content: 'DESCRIPTION', styles: { halign: 'left', fillColor: blueColor, textColor: [255, 255, 255] } },
        { content: 'AMOUNT', styles: { halign: 'right', fillColor: blueColor, textColor: [255, 255, 255] } }
      ]
    ],
    body: fullRightBody,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: blueColor,
      lineWidth: 0.3,
      textColor: darkSlate
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
    }
  });

  const rightFinalY = doc.lastAutoTable.finalY;

  // 5. BOTTOM NOTES CARD (Horizontally across full width)
  const notesStartY = Math.max(leftFinalY, rightFinalY) + 3.5;
  const notesHeaderH = 5.5;
  const notesBodyH = 34;

  // Notes Header Box
  doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.roundedRect(leftX, notesStartY, innerWidth, notesHeaderH, 0.5, 0.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NOTES :', leftX + 3, notesStartY + 4);

  // Notes Body Box
  doc.setFillColor(notesBg[0], notesBg[1], notesBg[2]);
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(0.35);
  doc.rect(leftX, notesStartY + notesHeaderH, innerWidth, notesBodyH, 'FD');

  // Notes 8 Points
  const notes = [
    '1. No Guarantee.',
    '2. Rimless Glasses, Lenses no warranty.',
    '3. For all frames only service is eligible on the nature of complaints.',
    '4. Order once taken will not be cancelled on any circumstances.',
    '5. Spectacles must be collected within 15 days from the date of order.',
    '6. Subsequently No claim after that if the job is untraceable.',
    '7. The Company will try its best to execute order within delivery date, but under no circumstances order can be cancelled if its delayed due to unforeseen circumstances.',
    '8. All CR reslenses are scratch resistant only, not scratch proof.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(30, 41, 59);

  let noteY = notesStartY + notesHeaderH + 3.6;
  notes.forEach((note) => {
    doc.text(note, leftX + 3, noteY);
    noteY += 3.8;
  });

  // 6. OUTER CONTAINER BORDER ENCLOSING ENTIRE BILL
  const totalBillHeight = (notesStartY + notesHeaderH + notesBodyH + 4) - marginY;
  doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.setLineWidth(0.7);
  doc.roundedRect(marginX, marginY, contentWidth, totalBillHeight, 2, 2, 'S');

  return doc;
};

/**
 * Share a Bill PDF + exact message on WhatsApp
 * @param {Object} billData - Bill details
 * @param {Function} [onStatus] - Optional callback for UI feedback
 */
/**
 * Helper to construct the public bill link with domain resolution
 * @param {string|number} billNumber
 * @returns {string}
 */
export const getPublicBillUrl = (billNumber) => {
  const billNo = encodeURIComponent(String(billNumber || '').trim());
  if (!billNo || billNo === 'N/A') return '';

  if (typeof process !== 'undefined' && process.env?.REACT_APP_PUBLIC_URL) {
    return `${process.env.REACT_APP_PUBLIC_URL.replace(/\/$/, '')}/view-bill/${billNo}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/view-bill/${billNo}`;
  }

  return `https://lenscraftoptical.com/view-bill/${billNo}`;
};

export const shareBillOnWhatsAppWithPdf = async (billData, onStatus) => {
  const phone = billData.customerPhone || billData.customer_phone || billData.customer?.phone || '';
  const cleanPhone = String(phone).replace(/\D/g, '');

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Please enter a valid 10-digit customer mobile number');
  }

  const whatsappNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const billNo = String(billData.billNumber || billData.bill_number || billData.invoiceNo || billData.bNumber || 'N/A');
  const custName = String(billData.customerName || billData.customer_name || billData.customer?.name || 'Customer');
  
  let billDate = billData.orderDate || billData.billDate || billData.date;
  if (!billDate && billData.createdAt) {
    billDate = formatDate(billData.createdAt);
  } else if (!billDate) {
    billDate = formatDate(new Date());
  }

  const total = parseFloat(billData.total ?? billData.finalTotal ?? billData.summary?.total ?? billData.grandTotal ?? billData.amount ?? 0);
  const paid = parseFloat(billData.advanceAmount ?? billData.advance_amount ?? billData.payment?.advanceAmount ?? billData.paidAmount ?? billData.paid_amount ?? billData.payment?.paidAmount ?? 0);
  let balance = parseFloat(billData.balanceAmount ?? billData.balance_amount ?? billData.payment?.balanceAmount ?? 0);
  if (balance === 0 && total > paid) {
    balance = total - paid;
  }
  const dueDate = billData.dueDate || billData.due_date;
  const billUrl = getPublicBillUrl(billNo);

  // 1. Formatted message for WhatsApp
  let message = `Dear *${custName}*,\n` +
    `Thank you for choosing *Kheteswar Optics*!\n\n` +
    `📄 *Bill Invoice No:* #${billNo}\n` +
    `📅 *Date:* ${billDate}\n` +
    `💰 *Total Amount:* ₹${total.toFixed(2)}\n` +
    `💵 *Paid / Advance:* ₹${paid.toFixed(2)}\n` +
    `⏳ *Balance Due:* ₹${balance.toFixed(2)}\n`;

  if (dueDate && dueDate !== '-') {
    message += `📦 *Due Delivery Date:* ${dueDate}\n`;
  }

  if (billUrl) {
    message += `\n🔗 *View / Print Official Invoice:*\n${billUrl}\n`;
  }

  message += `\nBest regards,\n*Kheteswar Optics*\n128, Baker Street, Broadway, Chennai - 600001.\nMobile: 7708560890`;

  // 2. Open WhatsApp Web / App directly with pre-filled message & official invoice link
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = isMobile
    ? `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');

  if (onStatus) {
    onStatus({
      type: 'success',
      message: `📱 Opening WhatsApp Web chat for ${custName}...`
    });
  }
};

/**
 * Check if a customer's DOB matches today's date
 * @param {string} dob - Date string in YYYY-MM-DD or DD-MM-YYYY
 * @returns {boolean}
 */
export const isBirthdayToday = (dob) => {
  if (!dob) return false;
  const today = new Date();
  const todayMonth = today.getMonth() + 1; // 1-12
  const todayDay = today.getDate(); // 1-31

  const cleanStr = String(dob).trim();
  if (cleanStr.includes('-') || cleanStr.includes('/')) {
    const parts = cleanStr.split(/[-/]/);
    if (parts.length === 3) {
      let month, day;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
      }
      return month === todayMonth && day === todayDay;
    }
  }
  return false;
};

/**
 * Send a warm birthday greeting to a customer via WhatsApp
 * @param {Object} customerData - Customer object
 * @param {Function} [onStatus] - Optional callback
 */
export const sendBirthdayWishOnWhatsApp = (customerData, onStatus) => {
  const phone = customerData.phone || customerData.customerPhone || customerData.customer_phone || '';
  const cleanPhone = String(phone).replace(/\D/g, '');

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Please ensure a valid 10-digit customer phone number is available');
  }

  const whatsappNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const name = customerData.name || customerData.customerName || customerData.customer_name || 'Valued Customer';

  const message = `🎉 *Happy Birthday, ${name}!* 🎂🎈\n\n` +
    `Warmest birthday greetings and best wishes from the entire team at *Kheteswar Optics*! ✨\n\n` +
    `May your year ahead be blessed with good health, happiness, prosperity, and crystal-clear vision. 👓🌟\n\n` +
    `🎁 *Special Birthday Offer:* Visit us this month to enjoy an exclusive special Birthday benefit on your frames and lenses!\n\n` +
    `Have a wonderful celebration today! 💐\n\n` +
    `Warm regards,\n*Kheteswar Optics*\n128, Baker Street, Broadway, Chennai - 600001.\nMobile: 7708560890`;

  const encodedMessage = encodeURIComponent(message);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  const whatsappUrl = isMobile
    ? `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');

  if (onStatus) {
    onStatus({
      type: 'success',
      message: `🎂 Birthday wish opened on WhatsApp for ${name}!`
    });
  }
};
