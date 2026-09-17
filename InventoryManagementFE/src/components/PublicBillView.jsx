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

  const billDate = bill.created_at ? new Date(bill.created_at) : new Date();
  const formattedDate = formatDate(billDate);
  const formattedTime = formatTime(billDate);

  // Active products filter
  const activeProducts = bill.items.filter(item => item.quantity > 0);
  const due = Math.max(0, bill.total - bill.paid_amount);

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
              <img src="/lenscraft-logo.png" alt="Company Logo" style={{ height: '56px', maxWidth: '240px', width: 'auto', display: 'block', objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1b4374', marginTop: '2px', lineHeight: '1.3' }}>
              Computerised Eye Testing &amp; Contact Lens Clinic
            </div>
            <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.4' }}>
              {bill.company?.address || '#10, Baker Street, Broadway, Chennai - 600001.'}<br />
              <span style={{ fontWeight: 'bold' }}>Mobile: {bill.company?.phone || '9944340471'}</span>
            </div>
          </div>

          {/* Right Side: Customer Name, Mobile No, ORDER FORM NO Box */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', width: '310px' }}>
            {/* Customer Name Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Name</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                {bill.customer_name}
              </div>
            </div>

            {/* Customer Mobile No Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Mobile No</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                {bill.customer_phone}
              </div>
            </div>

            {/* Customer Address Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Address</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                {bill.customer_address || '-'}
              </div>
            </div>

            {/* Invoice No Line */}
            <div style={{ fontSize: '12.5px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '85px', color: '#1b4374' }}>Invoice No</span>
              <span style={{ fontWeight: 'bold', color: '#1b4374', margin: '0 4px' }}>:</span>
              <div style={{ width: '100%', textAlign: 'left', paddingLeft: '6px', fontSize: '13px', fontWeight: '800', color: '#1b4374', fontFamily: "'Courier New', monospace", letterSpacing: '0.5px' }}>
                {bill.bill_number}
              </div>
            </div>
          </div>
        </div>

        {/* Double Horizontal Divider Line */}
        <div style={{ borderTop: '2px solid #1b4374', borderBottom: '1px solid #1b4374', height: '2px', marginBottom: '12px' }}></div>

        {/* Sub-Header Meta Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #1b4374', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', marginBottom: '14px', background: '#e8f2fc', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Order Date :</strong> <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{formattedDate}</span>
          </div>
          <div style={{ width: '1px', height: '18px', background: '#94a3b8' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <strong style={{ color: '#1b4374', whiteSpace: 'nowrap' }}>Time :</strong>
            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{formattedTime}</span>
          </div>
        </div>

        {/* Main 2-Column Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '12px' }}>
          {/* Items Table */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1b4374', borderRadius: '4px', fontSize: '11.5px', background: '#fff', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#1b4374', color: '#ffffff' }}>
                  <th style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>DESCRIPTION</th>
                  <th style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', width: '38%' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {activeProducts.length > 0 ? (
                  activeProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #1b4374', padding: '6px 10px', color: '#0f172a' }}>
                        {p.product_name + (p.product_model ? ' (' + p.product_model + ')' : '') + (p.quantity > 1 ? ' x' + p.quantity : '')}
                      </td>
                      <td style={{ border: '1px solid #1b4374', padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                        ₹{p.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ border: '1px solid #1b4374', padding: '8px 10px', color: '#475569' }}>Lenses / Frame</td>
                    <td style={{ border: '1px solid #1b4374', padding: '8px 10px', textAlign: 'right', color: '#475569' }}>-</td>
                  </tr>
                )}

                {/* Pad empty rows so height is reasonable */}
                {Array.from({ length: Math.max(0, 3 - activeProducts.length) }).map((_, i) => (
                  <tr key={'empty-' + i}>
                    <td style={{ border: '1px solid #1b4374', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid #1b4374', padding: '8px' }}>&nbsp;</td>
                  </tr>
                ))}

                <tr style={{ background: '#e8f2fc' }}>
                  <td style={{ border: '1px solid #1b4374', padding: '8px 12px', fontWeight: 'bold', textAlign: 'right', fontSize: '12px', color: '#1b4374' }}>TOTAL</td>
                  <td style={{ border: '1px solid #1b4374', padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#1b4374' }}>₹{bill.total.toFixed(2)}</td>
                </tr>
                <tr style={{ background: '#e8f2fc' }}>
                  <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                    Adv. Recd. ({(bill.advance_payment_method || 'cash').toUpperCase().replace('_', ' ')})
                  </td>
                  <td style={{ border: '1px solid #1b4374', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
                    ₹{bill.advance_amount?.toFixed(2) || '0.00'}
                  </td>
                </tr>
                <tr style={{ background: '#e8f2fc' }}>
                  <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#1b4374' }}>
                    Balance Amt. ({(bill.balance_payment_method || 'cash').toUpperCase().replace('_', ' ')})
                  </td>
                  <td style={{ border: '1px solid #1b4374', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1b4374' }}>
                    ₹{bill.balance_amount?.toFixed(2) || '0.00'}
                  </td>
                </tr>
                {due > 0 && (
                  <tr style={{ background: '#fef2f2' }}>
                    <td style={{ border: '1px solid #1b4374', padding: '6px 12px', fontWeight: 'bold', textAlign: 'right', color: '#b91c1c' }}>Remaining Due</td>
                    <td style={{ border: '1px solid #1b4374', padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#b91c1c' }}>₹{due.toFixed(2)}</td>
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
