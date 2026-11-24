'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose }: { onScan: (code: string) => void, onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    // On demande la caméra arrière (environment)
    html5QrCode.start(
      { facingMode: "environment" }, 
      config,
      (decodedText) => {
        // Succès du scan : on arrête la caméra et on renvoie le code
        html5QrCode.stop().then(() => {
          onScan(decodedText);
        }).catch(console.error);
      },
      (errorMessage) => {
        // On ignore les erreurs fréquentes de scan (quand on bouge)
      }
    ).catch((err) => {
      console.error(err);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
    });

    // Nettoyage quand on ferme
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative">
        
        {/* En-tête */}
        <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">Scanner un code-barres</h2>
          <button onClick={onClose} className="text-white hover:text-red-400 text-2xl font-bold leading-none">
            ✕
          </button>
        </div>

        {/* Zone Caméra */}
        <div className="p-4 bg-gray-100 flex flex-col items-center">
          {error ? (
            <div className="text-red-600 text-center p-4 font-medium">
              {error}
            </div>
          ) : (
            <>
              {/* Ce div sera rempli par la caméra */}
              <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-blue-500 bg-black"></div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                Placez le code-barres dans le cadre.
              </p>
            </>
          )}
        </div>

        {/* Pied de page */}
        <div className="p-4 bg-white border-t">
          <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-bold transition-colors">
            Annuler
          </button>
        </div>

      </div>
    </div>
  );
}