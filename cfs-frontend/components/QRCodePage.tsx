import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodePageProps {
  url: string;
}

interface QRCodePageProps {
  url: string;
  location?: string;
  branchLocation?: string;
}

const QRCodePage: React.FC<QRCodePageProps> = ({ url, location, branchLocation }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-center mb-4">
        <img src="https://catalystsolutions.eco/wp-content/uploads/2023/02/logo.png" alt="Catalyst Logo" className="h-16 mx-auto mb-4" />
      </div>
      <h2 className="text-2xl font-bold mb-4">Scan QR Code for Feedback</h2>
      {branchLocation && (
        <h3 className="text-xl text-gray-700 mb-4">{branchLocation}</h3>
      )}
      <QRCode value={url} size={256} />
      <p className="mt-6 text-gray-600">Open your mobile camera or QR scanner app to scan the code.</p>
    </div>
  );
};

export default QRCodePage;
