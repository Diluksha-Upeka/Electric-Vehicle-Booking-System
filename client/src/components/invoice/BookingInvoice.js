import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import QRCode from 'qrcode';

// Modern enterprise styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#2e3a59',
  },
  header: {
    borderBottom: '1 solid #e0e0e0',
    paddingBottom: 20,
    marginBottom: 30,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  companyTagline: {
    fontSize: 12,
    color: '#607d8b',
  },
  title: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388e3c',
  },
  section: {
    marginBottom: 25,
    padding: 20,
    border: '1 solid #e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1b5e20',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#546e7a',
  },
  value: {
    fontWeight: 'bold',
    color: '#2e3a59',
  },
  statusPill: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  paymentDetails: {
    marginTop: 10,
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
  },
  total: {
    borderTop: '1 solid #c8e6c9',
    paddingTop: 8,
    marginTop: 8,
  },
  qrSection: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 100,
    alignItems: 'center',
  },
  qrCode: {
    width: 100,
    height: 100,
  },
  qrLabel: {
    fontSize: 8,
    color: '#78909c',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#9e9e9e',
  },
});

const BookingInvoice = ({ booking }) => {
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const statusColors = {
    CONFIRMED: { bg: '#c8e6c9', color: '#2e7d32' },
    PENDING: { bg: '#fff9c4', color: '#f9a825' },
    CANCELLED: { bg: '#ffcdd2', color: '#c62828' },
  };

  const [qrCodeUrl, setQrCodeUrl] = React.useState('');

  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrData = {
          bookingId: booking._id,
          station: booking.station?.name,
          date: booking.date,
          time: booking.timeSlot?.startTime,
          status: booking.status,
        };
        const url = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 100,
          margin: 1,
          color: {
            dark: '#2e7d32',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('QR generation error', error);
      }
    };

    generateQRCode();
  }, [booking]);

  const statusStyle = statusColors[booking.status] || { bg: '#e0e0e0', color: '#555' };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>EVCONNECT</Text>
          <Text style={styles.companyTagline}>Empowering Greener Journeys</Text>
          <Text style={styles.title}>Booking Invoice</Text>
        </View>

        {/* QR Code */}
        {qrCodeUrl && (
          <View style={styles.qrSection}>
            <Image style={styles.qrCode} src={qrCodeUrl} />
            <Text style={styles.qrLabel}>Scan to verify</Text>
          </View>
        )}

        {/* Booking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Booking ID:</Text>
            <Text style={styles.value}>{booking._id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Station:</Text>
            <Text style={styles.value}>{booking.station?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatDate(booking.date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{booking.timeSlot?.startTime || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.statusPill, { backgroundColor: statusStyle.bg, color: statusStyle.color }]}>
              {booking.status}
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentDetails}>
            <View style={styles.row}>
              <Text style={styles.label}>Total Amount:</Text>
              <Text style={styles.value}>LKR {(booking.totalAmount || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Advance Paid:</Text>
              <Text style={[styles.value, { color: '#2e7d32' }]}>
                LKR {(booking.advanceAmount || 0).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.row, styles.total]}>
              <Text style={styles.label}>Balance Due:</Text>
              <Text style={[styles.value, { color: '#555' }]}>
                LKR {((booking.totalAmount || 0) - (booking.advanceAmount || 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing EVCONNECT – Drive Clean, Drive Smart</Text>
          <Text>This is a system-generated document. No signature required.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default BookingInvoice;
