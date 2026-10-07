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
      color: "#EF4444",
      lightColor: "#FEE2E2",
      numbers: ["09205741581", "09669109674"],
      display: ["(0920) 574 1581", "(0966) 910 9674"],
    },
    {
      name: "Palayan BFP",
      desc: "Fire Protection",
      icon: Flame,
      color: "#F97316",
      lightColor: "#FFEDD5",
      numbers: ["09430669962"],
      display: ["0943 066 9962"],
    },
    {
      name: "City Health Office",
      desc: "Health Emergencies",
      icon: HeartPulse,
      color: "#10B981",
      lightColor: "#D1FAE5",
      numbers: ["09171073808", "09209472735"],
      display: ["0917 107 3808", "0920 947 2735"],
    },
    {
      name: "City Hospital",
      desc: "Medical Emergencies",
      icon: Activity,
      color: "#3B82F6",
      lightColor: "#DBEAFE",
      numbers: ["09178018247"],
      display: ["0917 801 8247"],
    },
    {
      name: "NEECO",
      desc: "Electrical Emergencies",
      icon: Zap,
      color: "#EAB308",
      lightColor: "#FEF9C3",
      numbers: ["09328893447", "09328893348"],
      display: ["0932 889 3447", "0932 889 3348"],
    },
    {
      name: "City Traffic",
      desc: "Traffic & Road Incidents",
      icon: CarFront,
      color: "#8B5CF6",
      lightColor: "#EDE9FE",
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
        fontFamily: "'Nunito', sans-serif",
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
            background: "rgba(220, 38, 38, 0.95)", // Glassy Red
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: 24,
            margin: "8px",
            marginTop: "calc(8px + env(safe-area-inset-top, 0px))",
            padding: "16px 20px",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: "#FFF",
              marginBottom: 4,
              lineHeight: 1.1,
            }}
          >
            Emergency
            <br />
            Hotlines
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: 14,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            Palayan City Response Center
          </p>
        </div>

        {/* Cards Container */}
        <div
          style={{
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingBottom: "100px",
          }}
        >
          {departments.map((dept, i) => {
            const IconObj = dept.icon;
            return (
              <div
                key={i}
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 20,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
              >
                {/* Dept Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: dept.lightColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      flexShrink: 0,
                    }}
                  >
                    <IconObj color={dept.color} size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#1F2937",
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {dept.name}
                    </h2>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        fontWeight: 700,
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
                        background: "#F9FAFB",
                        padding: "12px 14px",
                        borderRadius: 16,
                        textDecoration: "none",
                        border: "1px solid #F3F4F6",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#374151",
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
                          color: dept.color,
                          fontWeight: 800,
                          fontSize: 12,
                          background: "#FFF",
                          padding: "4px 8px",
                          borderRadius: 12,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                      >
                        <span>Call</span>
                        <Phone size={14} fill={dept.color} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
