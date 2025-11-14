'use client';

import { motion } from 'framer-motion';
import QRScanner from '@/components/dashboard/QRScanner';

export default function ScanPage() {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-white p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 mb-2">
          Scanner un QR Code
        </h1>
        <p className="text-gray-600 md:text-lg">
          Scannez le QR code d'un apprenant ou d'un coach
        </p>
      </motion.div>

      {/* QR Scanner Container */}
      <motion.div
        className="bg-white shadow-xl rounded-2xl p-6 md:p-10 w-full max-w-md flex flex-col items-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        <QRScanner />
        <p className="mt-4 text-gray-500 text-sm text-center">
          Assurez-vous que le QR Code soit bien éclairé pour un scan rapide.
        </p>
      </motion.div>
    </motion.div>
  );
}
