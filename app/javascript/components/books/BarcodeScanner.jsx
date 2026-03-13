import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [manualISBN, setManualISBN] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Check if we're on HTTPS or localhost
    const isSecureContext = window.isSecureContext;
    if (!isSecureContext && window.location.hostname !== 'localhost') {
      setError("Camera requires HTTPS on mobile devices.");
      setShowManualInput(true);
      setIsLoading(false);
    } else {
      startScanning();
    }
    return () => stopScanning();
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setIsLoading(true);
      setError(null);
      
      // First, get camera access using getUserMedia for better compatibility
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsLoading(false);
      }

      // Now start the barcode reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      codeReader.decodeFromVideoElement(
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText();
            console.log("Scanned barcode:", barcode);
            onScan(barcode);
            stopScanning();
          }
          if (error && error.name !== "NotFoundException") {
            console.error("Scan error:", error);
          }
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      let errorMessage = "Failed to access camera.";
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }
      setError(errorMessage);
      setIsScanning(false);
      setIsLoading(false);
      setShowManualInput(true);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualISBN.trim()) {
      onScan(manualISBN.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Scan Book Barcode</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm sm:text-base mb-2">{error}</p>
              {!showManualInput && (
                <button
                  onClick={() => {
                    setError(null);
                    startScanning();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm mr-2"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => setShowManualInput(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Enter ISBN Manually
              </button>
            </div>
          ) : null}

          {showManualInput ? (
            <form onSubmit={handleManualSubmit} className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter ISBN Manually
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Find the ISBN on the back of the book (usually a 10 or 13 digit number)
                </p>
                <input
                  type="text"
                  value={manualISBN}
                  onChange={(e) => setManualISBN(e.target.value)}
                  placeholder="e.g., 9780141439518 or 0141439513"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm sm:text-base"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualISBN.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Look Up Book
                </button>
              </div>
            </form>
          ) : !error ? (
            <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "4/3" }}>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                  <p className="text-sm sm:text-base">Starting camera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {!isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-1/2 border-4 border-green-500 rounded-lg shadow-lg relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-4 text-center">
            {!showManualInput && !error && (
              <>
                <p className="text-gray-600 text-sm sm:text-base mb-2">
                  Position the book's barcode within the frame
                </p>
                <p className="text-gray-500 text-xs sm:text-sm mb-3">
                  ISBN-10 or ISBN-13 barcodes work best
                </p>
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Or enter ISBN manually
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BarcodeScanner;
