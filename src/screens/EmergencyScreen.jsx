import React from "react";
import { motion } from "framer-motion";
import {
  Phone,
  ShieldAlert,
  Flame,
  Activity,
  Zap,
  CarFront,
  HeartPulse,
} from "lucide-react";

export default function EmergencyScreen() {
  const departments = [
    {
      name: "Palayan City CDRRMO",
      desc: "Disaster Risk Reduction",
      icon: ShieldAlert,
      numbers: ["09205741581", "09669109674"],
      display: ["(0920) 574 1581", "(0966) 910 9674"],
    },
    {
      name: "Palayan BFP",
      desc: "Fire Protection",
      icon: Flame,
      numbers: ["09430669962"],
      display: ["0943 066 9962"],
    },
    {
      name: "City Health Office",
      desc: "Health Emergencies",
      icon: HeartPulse,
      numbers: ["09171073808", "09209472735"],
      display: ["0917 107 3808", "0920 947 2735"],
    },
    {
      name: "City Hospital",
      desc: "Medical Emergencies",
      icon: Activity,
      numbers: ["09178018247"],
      display: ["0917 801 8247"],
    },
    {
      name: "NEECO",
      desc: "Electrical Emergencies",
      icon: Zap,
      numbers: ["09328893447", "09328893348"],
      display: ["0932 889 3447", "0932 889 3348"],
    },
    {
      name: "City Traffic",
      desc: "Traffic & Road Incidents",
      icon: CarFront,
      numbers: ["09958741014"],
      display: ["0995 874 1014"],
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#000000",
        fontFamily: "'Nunito', -apple-system, sans-serif",
        pointerEvents: "auto",
      }}
    >
      {/* Scrollable Content */}
      <div
        className="hide-scroll"
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Floating Header */}
        <div
          style={{
            background: "rgba(16, 16, 18, 0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 26,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            margin: "12px 14px 6px",
            marginTop: "calc(12px + env(safe-area-inset-top, 0px))",
            padding: "20px 22px",
            flexShrink: 0,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              padding: "4px 10px",
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Direct Dispatch
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#ffffff",
              margin: "0 0 4px",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            Emergency Hotlines
          </h1>
          <p
            style={{
              color: "#a1a1aa",
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Palayan City Rapid Emergency Operations
          </p>
        </div>

        {/* Cards Container */}
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingBottom: "110px",
          }}
        >
          {departments.map((dept, i) => {
            const IconObj = dept.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                style={{
                  background: "#121214",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 22,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
                }}
              >
                {/* Dept Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      flexShrink: 0,
                      color: "#ffffff",
                    }}
                  >
                    <IconObj size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#ffffff",
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {dept.name}
                    </h2>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#71717a",
                        fontWeight: 600,
                      }}
                    >
                      {dept.desc}
                    </span>
                  </div>
                </div>

                {/* Numbers */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {dept.numbers.map((num, j) => (
                    <a
                      key={j}
                      href={`tel:${num}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        padding: "11px 14px",
                        borderRadius: 16,
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#f4f4f5",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {dept.display[j]}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#000000",
                          fontWeight: 800,
                          fontSize: 12,
                          background: "#ffffff",
                          padding: "6px 12px",
                          borderRadius: 20,
                          boxShadow: "0 2px 8px rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <span>Call</span>
                        <Phone size={13} fill="#000000" color="#000000" />
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
