"use client";

import { useState } from "react";

interface DateOfBirth {
  day: string;
  month: string;
  year: string;
}

interface AgePickerProps {
  value: DateOfBirth;
  onChange: (dob: DateOfBirth) => void;
  showError?: boolean;
}

export const AgePicker = ({ value, onChange, showError = false }: AgePickerProps) => {
  const [touched, setTouched] = useState(false);

  const isInvalid =
    (touched || showError) &&
    (value.day === "" || value.month === "" || value.year === "");

  const handleInputChange = (field: keyof DateOfBirth, val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    onChange({ ...value, [field]: cleanVal });
  };

  const inputStyle = (filled: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px 10px",
    fontSize: "14px",
    color: "#111827",
    textAlign: "center",
    backgroundColor: "#fff",
    border: `1.5px solid ${isInvalid && !filled ? "#E13746" : "#d1d5db"}`,
    borderRadius: "12px",
    outline: "none",
  });

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
        Date of Birth
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.3fr",
          gap: "10px",
        }}
      >
        <input
          type="text"
          placeholder="DD"
          maxLength={2}
          value={value.day}
          onBlur={() => setTouched(true)}
          onChange={(e) => handleInputChange("day", e.target.value)}
          style={inputStyle(value.day !== "")}
        />
        <input
          type="text"
          placeholder="MM"
          maxLength={2}
          value={value.month}
          onBlur={() => setTouched(true)}
          onChange={(e) => handleInputChange("month", e.target.value)}
          style={inputStyle(value.month !== "")}
        />
        <input
          type="text"
          placeholder="YYYY"
          maxLength={4}
          value={value.year}
          onBlur={() => setTouched(true)}
          onChange={(e) => handleInputChange("year", e.target.value)}
          style={inputStyle(value.year !== "")}
        />
      </div>

      {isInvalid && (
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
          Please enter a valid date of birth.
        </p>
      )}
    </div>
  );
};