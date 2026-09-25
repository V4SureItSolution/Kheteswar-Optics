import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { formatDate, formatTime } from '../utils/dateUtils';

const PublicBillView = () => {
  const { billNumber } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/billing/bills/number/${billNumber}`);
        setBill(response.data);
      } catch (err) {
        console.error('Error fetching bill:', err);
        setError('Bill not found or an error occurred.');
      } finally {
        setLoading(false);
      }
    };
    if (billNumber) {
      fetchBill();
    }
  }, [billNumber]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9' }}>
        <h2>Loading your bill...</h2>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#dc3545' }}>Oops!</h2>
          <p>{error || 'Bill not found'}</p>
        </div>
      </div>
    );
  }

  const bNumber = bill.billNumber || bill.bill_number || billNumber || '0000';
  const customerName = bill.customer?.name || bill.customer_name || 'Walk-in Customer';
  const customerPhone = bill.customer?.phone || bill.customer_phone || '-';
  const customerAddress = bill.customer?.address || bill.customer_address || '-';
  const customerDob = bill.customer?.dob || bill.customer_dob || bill.dob || '-';

  const orderDate = bill.createdAt ? formatDate(bill.createdAt) : formatDate(new Date());
  const orderTime = bill.createdAt ? formatTime(bill.createdAt) : formatTime(new Date());
  const dueDate = bill.dueDate || bill.due_date || orderDate;
  const byCourier = bill.byCourier || bill.by_courier || bill.courier || 'No';

  const frameName = bill.frameName || bill.frame_name || bill.frameNo || bill.frame_no || '-';
  const lensType = bill.lensType || bill.lens_type || bill.lensesDetail || bill.lenses_detail || '-';

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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px', minHeight: '100vh', background: '#f1f5f9' }}>
      <div
        style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '24px 26px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '11.5px',
          border: '2.5px solid #1b4374',
          borderRadius: '6px',
          boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '720px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', marginBottom: '10px' }}>
          {/* Left Side: Logo & Clinic Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '360px' }}>
            <div style={{ marginBottom: '4px' }}>
              <img
                src="/lenscraft-logo.png"
                alt="Lenscraft"
                style={{ height: '56px', maxWidth: '240px', width: 'auto', display: 'block', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: '1.4' }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1b4374', marginBottom: '2px' }}>Lenscraft</div>
              #10, Baker Street, Broadway, Chennai - 600001.<br />
              <span style={{ fontWeight: 'bold' }}>Mobile: 9944340471</span>
            </div>
          </div>

          {/* Right Side: Customer Name, Mobile No, Address, DOB, Invoice No */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '320px' }}>
            {/* Customer Name Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Name</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                {customerName}
              </div>
            </div>

            {/* Customer Mobile No Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Mobile No</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                {customerPhone}
              </div>
            </div>

            {/* Customer Address Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Address</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                {customerAddress}
              </div>
            </div>

            {/* Customer DOB Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>DOB</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
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
            <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Time :</strong>
            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{orderTime}</span>
          </div>
          <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>By Courier :</strong>
            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{byCourier}</span>
          </div>
        </div>

        {/* Main 2-Column Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '12px' }}>
          {/* Left Column: Product Details & Prescription Table */}
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
                    const name = p.product_name || p.productName || p.name || p.brand || 'Optical Item';
                    const model = p.product_model || p.productModel || p.model || '';
                    const qty = parseInt(p.quantity || p.qty || 1, 10) || 1;
                    let itemTot = parseFloat(p.total || p.amount || 0);
                    let price = parseFloat(p.sell_price || p.sellPrice || p.price || 0);

                    if (itemTot === 0 && price > 0) {
                      itemTot = qty * price;
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
                    <td style={{ border: '1px solid #1b4374', padding: '8px 10px', textAlign: 'right', color: '#0f172a', background: '#ffffff', backgroundColor: '#ffffff', fontWeight: 'bold' }}>
                      ₹{totalAmount.toFixed(2)}
                    </td>
                  </tr>
                )}

                {/* Pad empty rows */}
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
                  <td style={{ border: '1px solid #1b4374', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
                    ₹ {advanceRecd.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ background: '#e8f2fc' }}>
                  <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                    Balance Amt. ({balMethod})
                  </td>
                  <td style={{ border: '1px solid #1b4374', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
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

        {/* NOTES Card - Horizontally across full bottom width */}
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
  );
};

export default PublicBillView;
