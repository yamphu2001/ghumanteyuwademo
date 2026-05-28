"use client";

import React, { useState } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  showError?: boolean;
}

export const PhoneInput = ({ value, onChange, showError = false }: PhoneInputProps) => {
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length >= 2) {
      const prefix = val.substring(0, 2);
      if (prefix !== "97" && prefix !== "98") {
        val = val[0] === "9" ? "9" : "";
      }
    }
    if (val.length <= 10) onChange(val);
  };

  const isValid = /^9[78]\d{8}$/.test(value);
  const hasError = (touched || showError) && value.length > 0 && !isValid;
  const isEmpty = (touched || showError) && value.length === 0;

  const borderCol =
    hasError || isEmpty ? "#E13746" : isValid ? "#0a0a0a" : "#d1d5db";

  return (
    <div style={{ marginBottom: "24px" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#6b7280",
          marginBottom: "10px",
        }}
      >
        Phone Number
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: `1.5px solid ${borderCol}`,
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "12px 14px",
            borderRight: "1.5px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }}>🇳🇵</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
            +977
          </span>
        </div>

        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          style={{
            flex: 1,
            padding: "12px 14px",
            fontSize: "14px",
            color: "#111827",
            backgroundColor: "#fff",
            border: "none",
            outline: "none",
          }}
          placeholder="98XXXXXXXX"
          maxLength={10}
        />

        {isValid && (
          <span
            style={{
              paddingRight: "14px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#02c238",
              userSelect: "none",
            }}
          >
            ✓
          </span>
        )}
      </div>

      {isEmpty && (
        <p
          style={{
            color: "#E13746",
            fontSize: "12px",
            marginTop: "7px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "#E13746",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Phone number is required.
        </p>
      )}
      {hasError && (
        <p
          style={{
            color: "#E13746",
            fontSize: "12px",
            marginTop: "7px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: "#E13746",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          {value.length > 0 && !/^9[78]/.test(value)
            ? "Must start with 97 or 98."
            : "Must be exactly 10 digits."}
        </p>
      )}
    </div>
  );
};