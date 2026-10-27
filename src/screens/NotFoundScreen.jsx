import { Helmet } from "react-helmet-async";
import { AlertTriangle, Home, MapPin } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function NotFoundScreen({ onNavigate }) {
  const { isDark } = useTheme();
  
  const bgColor = isDark ? '#18181b' : '#f9fafb';
  const cardBg = isDark ? '#27272a' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? '#a1a1aa' : '#6b7280';
  const accentColor = '#2563eb';
  
  return (
    <>
      <Helmet>
        <title>Page Not Found - 404 | CLIMA Palayan City</title>
      </Helmet>
      
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bgColor,
          padding: '20px',
          fontFamily: "'Nohemi', -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            background: cardBg,
            borderRadius: 24,
            padding: '48px 32px',
            boxShadow: isDark 
              ? '0 4px 24px rgba(0, 0, 0, 0.4)' 
              : '0 4px 24px rgba(0, 0, 0, 0.08)',
            border: isDark ? '1px solid #3f3f46' : '1px solid #e5e7eb',
          }}
        >
          {/* Three Official Logos */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <img 
              src="/images/legal/palayan-city-seal.png" 
              alt="Palayan City" 
              style={{
                width: 60,
                height: 60,
                objectFit: 'contain',
                filter: isDark ? 'brightness(0.9)' : 'none',
              }}
            />
            <img 
              src="/logo.png" 
              alt="CLIMA" 
              style={{
                width: 60,
                height: 60,
                objectFit: 'contain',
              }}
            />
            <img 
              src="/images/legal/ict-division-logo.png" 
              alt="ICT Division" 
              style={{
                width: 60,
                height: 60,
                objectFit: 'contain',
                filter: isDark ? 'brightness(0.9)' : 'none',
              }}
            />
          </div>
          
          {/* 404 Icon */}
          <div style={{ marginBottom: 24 }}>
            <AlertTriangle 
              size={80} 
              strokeWidth={1.5}
              style={{ 
                color: '#f97316',
                margin: '0 auto',
              }} 
            />
          </div>
          
          {/* 404 Number */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: accentColor,
              lineHeight: 1,
              marginBottom: 16,
              fontFamily: "'Nohemi', sans-serif",
            }}
          >
            404
          </div>
          
          {/* Heading */}
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: textPrimary,
              marginBottom: 12,
              fontFamily: "'Nohemi', sans-serif",
            }}
          >
            Page Not Found
          </h1>
          
          {/* Message */}
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: textSecondary,
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            The page you are looking for does not exist or has been moved.
            Please return to the home screen or use the navigation menu.
          </p>
          
          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <button
              onClick={() => onNavigate && onNavigate("home")}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 24px',
                background: accentColor,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = accentColor;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.3)';
              }}
            >
              <Home size={20} strokeWidth={2.5} />
              <span>Return to Home</span>
            </button>
            
            <button
              onClick={() => onNavigate && onNavigate("maps")}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 24px',
                background: 'transparent',
                color: textPrimary,
                fontWeight: 700,
                fontSize: 15,
                border: isDark ? '2px solid #3f3f46' : '2px solid #e5e7eb',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? '#3f3f46' : '#e5e7eb';
                e.currentTarget.style.color = textPrimary;
              }}
            >
              <MapPin size={20} strokeWidth={2.5} />
              <span>View Disaster Map</span>
            </button>
          </div>
          
          {/* Footer */}
          <div
            style={{
              marginTop: 40,
              fontSize: 13,
              fontWeight: 600,
              color: textSecondary,
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: 0 }}>Climate &amp; Local Incident Monitoring Application</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700 }}>Palayan City Government, Nueva Ecija</p>
          </div>
        </div>
      </div>
    </>
  );
}
