import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { formatDate, formatTime } from '../utils/dateUtils';
import { Printer, MessageCircle, AlertCircle } from 'lucide-react';
import { shareBillOnWhatsAppWithPdf } from '../utils/billPdfGenerator';

const ViewBill = () => {
  const { billNumber, billId } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const billPaperRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      setError('');
      try {
        let endpoint = '';
        if (billNumber) {
          endpoint = `${API_BASE_URL}/billing/bills/number/${encodeURIComponent(billNumber)}`;
        } else if (billId) {
          endpoint = `${API_BASE_URL}/billing/bills/${billId}`;
        }

        if (!endpoint) {
          setError('Invalid bill reference.');
          setLoading(false);
          return;
        }

        const response = await axios.get(endpoint);
        setBill(response.data);
      } catch (err) {
        console.error('Error loading bill:', err);
        setError(err.response?.data?.error || 'Bill not found or could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [billNumber, billId]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = async () => {
    if (!bill) return;
    try {
      await shareBillOnWhatsAppWithPdf(bill, (status) => {
        if (status.type === 'success') {
          setSuccessMsg(status.message);
          setTimeout(() => setSuccessMsg(''), 3500);
        }
      });
    } catch (err) {
      console.error('WhatsApp share error:', err);
      setError(err.message || 'Failed to share bill on WhatsApp');
      setTimeout(() => setError(''), 3500);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '15px' }}>Loading invoice...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <h2 style={{ color: '#f8fafc', marginTop: '16px', marginBottom: '8px' }}>Invoice Not Found</h2>
        <p style={{ color: '#94a3b8', maxWidth: '400px', textAlign: 'center', marginBottom: '24px' }}>
          {error || 'The requested bill does not exist or may have been removed.'}
        </p>
      </div>
    );
  }

  // Extract variables
  const bNumber = bill.billNumber || bill.bill_number || '0000';
  const customerName = bill.customer?.name || bill.customer_name || 'Walk-in Customer';
  const customerPhone = bill.customer?.phone || bill.customer_phone || '-';
  const customerAddress = bill.customer?.address || bill.customer_address || '-';
  const customerDob = bill.customer?.dob || bill.customer_dob || 'dd-mm-yyyy';

  const orderDate = bill.createdAt ? formatDate(bill.createdAt) : formatDate(new Date());
  const orderTime = bill.createdAt ? formatTime(bill.createdAt) : formatTime(new Date());
  const dueDate = bill.dueDate || bill.due_date || orderDate;
  const byCourier = bill.byCourier || bill.by_courier || bill.courier || '-';

  const frameName = bill.frameName || bill.frame_name || bill.frameNo || bill.frame_no || '-';
  const lensType = bill.lensType || bill.lens_type || bill.lensesDetail || bill.lenses_detail || '-';

  // Prescription power values (fallback to '-' if not recorded)
  const dvReSph = bill.dvReSph || bill.dv_re_sph || '-';
  const dvReCyl = bill.dvReCyl || bill.dv_re_cyl || '-';
  const dvReAxis = bill.dvReAxis || bill.dv_re_axis || '-';
  const dvLeSph = bill.dvLeSph || bill.dv_le_sph || '-';
  const dvLeCyl = bill.dvLeCyl || bill.dv_le_cyl || '-';
  const dvLeAxis = bill.dvLeAxis || bill.dv_le_axis || '-';

  const nvReSph = bill.nvReSph || bill.nv_re_sph || '-';
  const nvReCyl = bill.nvReCyl || bill.nv_re_cyl || '-';
  const nvReAxis = bill.nvReAxis || bill.nv_re_axis || '-';
  const nvLeSph = bill.nvLeSph || bill.nv_le_sph || '-';
  const nvLeCyl = bill.nvLeCyl || bill.nv_le_cyl || '-';
  const nvLeAxis = bill.nvLeAxis || bill.nv_le_axis || '-';

  const rawItems = bill.items || bill.products || [];
  const items = Array.isArray(rawItems) ? rawItems.filter(item => item && (
    (parseFloat(item.total || 0) > 0) ||
    (parseFloat(item.sellPrice || item.sell_price || item.price || 0) > 0) ||
    (parseInt(item.quantity || item.qty || 0, 10) > 0) ||
    (item.productName || item.product_name || item.name)
  )) : [];

  const totalAmount = parseFloat(
    bill.total ?? bill.summary?.total ?? bill.grandTotal ?? bill.amount ?? 0
  );
  const advanceRecd = parseFloat(
    bill.advanceAmount ?? bill.advance_amount ?? bill.payment?.advanceAmount ??
    bill.paidAmount ?? bill.paid_amount ?? bill.payment?.paidAmount ?? 0
  );
  let balanceAmt = parseFloat(
    bill.balanceAmount ?? bill.balance_amount ?? bill.payment?.balanceAmount ?? 0
  );
  if (balanceAmt === 0 && totalAmount > advanceRecd) {
    balanceAmt = totalAmount - advanceRecd;
  }
  const advMethod = (bill.advancePaymentMethod || bill.advance_payment_method || bill.paymentMethod || bill.payment_method || bill.payment?.advancePaymentMethod || bill.payment?.method || 'cash').toUpperCase().replace('_', ' ');
  const balMethod = (bill.balancePaymentMethod || bill.balance_payment_method || bill.payment?.balancePaymentMethod || 'cash').toUpperCase().replace('_', ' ');
  const remainingDue = Math.max(0, totalAmount - (advanceRecd + balanceAmt));

  return (
    <div style={styles.pageWrapper}>
      {/* Top Navbar */}
      <div style={styles.navBar} className="no-print">
        <div style={styles.navLeft}>
          <span style={styles.navBrand}>Lenscraft</span>
          <span style={styles.navBadge}>Official Order Form / Bill</span>
        </div>
        <div style={styles.navActions}>
          <button style={styles.actionBtn} onClick={handlePrint} title="Print Invoice">
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button style={styles.whatsappBtn} onClick={handleWhatsAppShare} title="Share via WhatsApp">
            <MessageCircle size={16} />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div style={styles.contentContainer}>
        <div style={styles.billPaper} id="billPaper" ref={billPaperRef}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', marginBottom: '10px' }}>
            {/* Left Side: Logo & Clinic Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '360px' }}>
              <div style={{ marginBottom: '4px' }}>
                <img src="/lenscraft-logo.png" alt="Company Logo" style={{ height: '56px', maxWidth: '240px', width: 'auto', display: 'block', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: '1.4' }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1b4374', marginBottom: '2px' }}>Lenscraft</div>
                #10, Baker Street, Broadway, Chennai - 600001.<br />
                <span style={{ fontWeight: 'bold' }}>Mobile: 9944340471</span>
              </div>
            </div>

            {/* Right Side: Customer Name, Mobile No, Invoice No */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '310px' }}>
              {/* Customer Name Line */}
              <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Name</span>
                <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                <div style={{ width: '100%', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                  {customerName}
                </div>
              </div>

              {/* Customer Mobile No Line */}
              <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Mobile No</span>
                <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                <div style={{ width: '100%', fontSize: '13px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                  {customerPhone}
                </div>
              </div>

              {/* Customer Address Line */}
              <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Address</span>
                <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                <div style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                  {customerAddress}
                </div>
              </div>

              {/* Customer DOB Line */}
              <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>DOB</span>
                <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                <div style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '6px' }}>
                  {customerDob}
                </div>
              </div>

              {/* Invoice No Line */}
              <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
                <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Invoice No</span>
                <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: '800', color: '#1b4374', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' }}>
                  {bNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Double Horizontal Divider Line */}
          <div style={{ borderTop: '2px solid #1b4374', borderBottom: '1px solid #1b4374', height: '2px', marginBottom: '12px' }}></div>

          {/* Sub-Header Meta Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #1b4374', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', marginBottom: '14px', background: '#e8f2fc', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Order Date :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{orderDate}</span>
            </div>
            <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Due Date :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{dueDate}</span>
            </div>
            <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Time :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{orderTime}</span>
            </div>
            <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>By Courier :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{byCourier}</span>
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '12px' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Product Details Card */}
              <div style={{ border: '1.5px solid #1b4374', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                <div style={{ background: '#1b4374', color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', padding: '6px 12px' }}>
                  Product Details
                </div>
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px dotted #cbd5e1', paddingBottom: '3px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1b4374', width: '95px' }}>Frame Name</span>
                    <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                    <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{frameName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '2px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1b4374', width: '95px' }}>Lens Type</span>
                    <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
                    <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{lensType}</span>
                  </div>
                </div>
              </div>

              {/* Eye Prescription Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1b4374', borderRadius: '4px', textAlign: 'center', fontSize: '11px', overflow: 'hidden' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #1b4374', width: '18%', padding: '6px', background: '#e8f2fc' }}></th>
                    <th colSpan="3" style={{ border: '1px solid #1b4374', fontWeight: 'bold', padding: '6px', fontSize: '11.5px', background: '#1b4374', color: '#ffffff' }}>R.E.</th>
                    <th colSpan="3" style={{ border: '1px solid #1b4374', fontWeight: 'bold', padding: '6px', fontSize: '11.5px', background: '#1b4374', color: '#ffffff' }}>L.E.</th>
                  </tr>
                  <tr style={{ background: '#e8f2fc', color: '#1b4374' }}>
                    <th style={{ border: '1px solid #1b4374', padding: '4px' }}></th>
                    <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>SPH</th>
                    <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>CYL</th>
                    <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>AXIS</th>
                    <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>SPH</th>
                    <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>CYL</th>
                    <th style={{ border: '1px solid #1b4374', padding: '4px', fontWeight: 'bold' }}>AXIS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #1b4374', fontWeight: 'bold', background: '#e8f2fc', color: '#1b4374', padding: '6px' }}>D.V.</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvReSph}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvReCyl}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvReAxis}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvLeSph}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvLeCyl}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{dvLeAxis}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #1b4374', fontWeight: 'bold', background: '#e8f2fc', color: '#1b4374', padding: '6px' }}>N.V.</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvReSph}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvReCyl}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvReAxis}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvLeSph}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvLeCyl}</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px', fontWeight: 'bold', color: '#0f172a' }}>{nvLeAxis}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Amount Table */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1b4374', borderRadius: '4px', fontSize: '11.5px', background: '#fff', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#1b4374', color: '#ffffff' }}>
                    <th style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>DESCRIPTION</th>
                    <th style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', width: '38%' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((p, idx) => {
                      const name = p.productName || p.product_name || p.name || p.brand || p.itemName || p.item_name || 'Optical Item';
                      const model = p.productModel || p.product_model || p.model || '';
                      const qty = parseInt(p.quantity || p.qty || 1, 10) || 1;
                      let price = parseFloat(p.sellPrice || p.sell_price || p.price || 0);
                      let itemTot = parseFloat(p.total || p.amount || 0);

                      if (itemTot === 0 && price > 0) {
                        itemTot = qty * price;
                      } else if (price === 0 && itemTot > 0 && qty > 0) {
                        price = itemTot / qty;
                      } else if (itemTot === 0 && price === 0 && items.length === 1 && totalAmount > 0) {
                        itemTot = totalAmount;
                      }

                      return (
                        <tr key={idx} style={{ background: '#ffffff', backgroundColor: '#ffffff' }}>
                          <td style={{ border: '1px solid #1b4374', padding: '6px 10px', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff' }}>
                            {name + (model ? ' (' + model + ')' : '') + (qty > 1 ? ' x' + qty : '')}
                          </td>
                          <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff' }}>
                            ₹{itemTot.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr style={{ background: '#ffffff', backgroundColor: '#ffffff' }}>
                      <td style={{ border: '1px solid #1b4374', padding: '8px 10px', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff', fontWeight: '500' }}>
                        {(frameName && frameName !== '-') ? `${frameName}${lensType && lensType !== '-' ? ' + ' + lensType : ''}` : 'Lenses / Frame'}
                      </td>
                      <td style={{ border: '1px solid #1b4374', padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff' }}>
                        ₹{totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Pad empty rows so height matches left column */}
                  {Array.from({ length: Math.max(0, 3 - Math.max(items.length, 1)) }).map((_, i) => (
                    <tr key={'empty-' + i} style={{ background: '#ffffff', backgroundColor: '#ffffff' }}>
                      <td style={{ border: '1px solid #1b4374', padding: '8px', background: '#ffffff', backgroundColor: '#ffffff' }}>&nbsp;</td>
                      <td style={{ border: '1px solid #1b4374', padding: '8px', background: '#ffffff', backgroundColor: '#ffffff' }}>&nbsp;</td>
                    </tr>
                  ))}

                  <tr style={{ background: '#e8f2fc' }}>
                    <td style={{ border: '1px solid #1b4374', padding: '8px 12px', fontWeight: 'bold', textAlign: 'right', fontSize: '12px', color: '#1b4374' }}>TOTAL</td>
                    <td style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#1b4374' }}>₹{totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#e8f2fc' }}>
                    <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                      Adv. Recd. ({advMethod})
                    </td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
                      ₹ {advanceRecd.toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{ background: '#e8f2fc' }}>
                    <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                      Balance Amt. ({balMethod})
                    </td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
                      ₹ {balanceAmt.toFixed(2)}
                    </td>
                  </tr>
                  {remainingDue > 0 && (
                    <tr style={{ background: '#fef2f2' }}>
                      <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#b91c1c' }}>Remaining Due</td>
                      <td style={{ border: '1px solid #1b4374', padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#b91c1c' }}>₹{remainingDue.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* NOTES Card */}
          <div style={{ border: '1.5px solid #1b4374', borderRadius: '4px', overflow: 'hidden', background: '#fff', width: '100%', marginTop: '12px' }}>
            <div style={{ background: '#1b4374', color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', padding: '6px 12px' }}>
              NOTES :
            </div>
            <div style={{ padding: '8px 14px', fontSize: '10px', lineHeight: '1.55', background: '#f0f7ff', color: '#1e293b' }}>
              <div>1. No Guarantee.</div>
              <div>2. Rimless Glasses, Lenses no warranty.</div>
              <div>3. For all frames only service is eligible on the nature of complaints.</div>
              <div>4. Order once taken will not be cancelled on any circumstances.</div>
              <div>5. Spectacles must be collected within 15 days from the date of order.</div>
              <div>6. Subsequently No claim after that if the job is untraceable.</div>
              <div>7. The Company will try its best to execute order within delivery date, but under no circumstances order can be cancelled if its delayed due to unforeseen circumstances.</div>
              <div>8. All CR reslenses are scratch resistant only, not scratch proof.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div style={styles.floatingBar} className="no-print">
        <button style={styles.floatingPrintBtn} onClick={handlePrint}>
          <Printer size={18} />
          Print / PDF
        </button>
        <button style={styles.floatingWaBtn} onClick={handleWhatsAppShare}>
          <MessageCircle size={18} />
          WhatsApp
        </button>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #billPaper {
            box-shadow: none !important;
            border: 2.5px solid #1b4374 !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            padding: 20px !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: '#0b1120',
    fontFamily: "Arial, Helvetica, sans-serif",
    paddingBottom: '60px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0b1120',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(59, 130, 246, 0.2)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0b1120',
    padding: '20px',
  },
  navBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navBrand: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '0.5px',
  },
  navBadge: {
    fontSize: '11px',
    background: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: '600',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  whatsappBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#25D366',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
  },
  contentContainer: {
    maxWidth: '760px',
    margin: '24px auto',
    padding: '0 12px',
    display: 'flex',
    justifyContent: 'center',
  },
  billPaper: {
    background: '#ffffff',
    color: '#0f172a',
    padding: '24px 26px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '11.5px',
    border: '2.5px solid #1b4374',
    borderRadius: '6px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '720px',
    boxSizing: 'border-box',
  },
  floatingBar: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    background: 'rgba(15, 23, 42, 0.9)',
    backdropFilter: 'blur(10px)',
    padding: '8px 16px',
    borderRadius: '30px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
    zIndex: 99,
  },
  floatingPrintBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#1e293b',
    color: '#fff',
    border: '1px solid #334155',
    padding: '8px 16px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
  },
  floatingWaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#25D366',
    color: '#fff',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '20px',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

export default ViewBill;
