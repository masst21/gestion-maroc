'use client';
import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose }: { onScan: (code: string) => void, onClose: () => void }) {
  useEffect(() => {
    // Initialisation du scanner de caméra
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // On ignore les erreurs de scan (fréquentes quand on bouge la caméra)
      }
    );

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-4 rounded-xl w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4 text-center">Scanner un code-barres</h2>
        <div id="reader" className="w-full"></div>
        <button onClick={onClose} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors">
          Annuler
        </button>
      </div>
    </div>
  );
}