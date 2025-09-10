'use client';

import React, { useState, useRef } from 'react';

interface UploadResponse {
  url: string;
  error: boolean;
  status: number;
  name: string;
  remainingCredits: number;
}

interface ConvertResponse {
  url: string;
  error: boolean;
  status: number;
}

const CameraScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key

  const handleScanClick = () => {
    setError('');
    setConvertedPdfUrl('');
    
    // Trigger file input with camera
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsUploading(true);
    
    try {
      // Step 1: Upload the image
      const uploadedUrl = await uploadFile(file);
      
      // Step 2: Convert to PDF
      const pdfUrl = await convertToPdf(uploadedUrl);
      
      setConvertedPdfUrl(pdfUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUploading(false);
      setIsConverting(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data: UploadResponse = await response.json();
    
    if (data.error) {
      throw new Error('Upload failed');
    }

    return data.url;
  };

  const convertToPdf = async (imageUrl: string): Promise<string> => {
    setIsConverting(true);
    
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/from/image', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: imageUrl,
        async: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Conversion failed: ${response.statusText}`);
    }

    const data: ConvertResponse = await response.json();
    
    if (data.error) {
      throw new Error('PDF conversion failed');
    }

    return data.url;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Document Scanner
        </h1>
        
        {/* Hidden file input for camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileCapture}
          className="hidden"
        />
        
        {/* Scan Button */}
        <button
          onClick={handleScanClick}
          disabled={isUploading || isConverting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-lg mb-4 transition duration-200"
        >
          {isUploading ? 'Uploading...' : isConverting ? 'Converting...' : 'Scan'}
        </button>
        
        {/* Loading States */}
        {isUploading && (
          <div className="text-center text-blue-600 mb-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2">Uploading image...</p>
          </div>
        )}
        
        {isConverting && (
          <div className="text-center text-green-600 mb-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <p className="mt-2">Converting to PDF...</p>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Success - Show PDF URL */}
        {convertedPdfUrl && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold mb-2">PDF Converted Successfully!</p>
            <div className="break-all">
              <p className="text-sm mb-2">Converted PDF URL:</p>
              <a
                href={convertedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm hover:text-blue-800"
              >
                {convertedPdfUrl}
              </a>
            </div>
            <button
              onClick={() => window.open(convertedPdfUrl, '_blank')}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded text-sm"
            >
              Open PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraScanner;