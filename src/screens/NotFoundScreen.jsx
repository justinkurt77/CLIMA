import { Helmet } from "react-helmet-async";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFoundScreen({ onNavigate }) {
  return (
    <>
      <Helmet>
        <title>Page Not Found | CLIMA Palayan City</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full text-center">
          {/* Logo/Seal */}
          <div className="mb-6 flex justify-center">
            <img 
              src="/logo.webp" 
              alt="Palayan City Seal" 
              className="w-24 h-24 object-contain"
              loading="eager"
            />
          </div>
          
          {/* 404 Icon */}
          <div className="mb-6">
            <AlertTriangle className="w-20 h-20 mx-auto text-orange-500" />
          </div>
          
          {/* Heading */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h1>
          
          {/* Message */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The page you are looking for does not exist or has been moved.
          </p>
          
          {/* Back to Home Button */}
          <button
            onClick={() => onNavigate && onNavigate("home")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-800 text-white font-semibold rounded-md hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </button>
          
          {/* Footer */}
          <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
            <p>Climate Information Monitoring and Awareness</p>
            <p className="mt-1">Palayan City Government, Nueva Ecija</p>
          </div>
        </div>
      </div>
    </>
  );
}
