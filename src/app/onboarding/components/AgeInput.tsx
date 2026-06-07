
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

const MAX_NEPALI_YEAR = 2083;
const MIN_YEAR = 1900;

function getDaysInMonth(month: number): number {
  const daysPerMonth = [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30]; // Nepali calendar
  return daysPerMonth[month - 1] ?? 31;
}

function isValidDay(day: string, month: string): boolean {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  if (isNaN(d) || d < 1) return false;
  if (!isNaN(m) && m >= 1 && m <= 12) {
    return d <= getDaysInMonth(m);
  }
  return d <= 32; // fallback if month not yet filled
}

function isValidMonth(month: string): boolean {
  const m = parseInt(month, 10);
  return !isNaN(m) && m >= 1 && m <= 12;
}

function isValidYear(year: string): boolean {
  if (year.length < 4) return false;
  const y = parseInt(year, 10);
  return !isNaN(y) && y >= MIN_YEAR && y <= MAX_NEPALI_YEAR;
}

export const AgePicker = ({ value, onChange, showError = false }: AgePickerProps) => {
  const [fieldTouched, setFieldTouched] = useState({
    day: false,
    month: false,
    year: false,
  });

  const dayError = (fieldTouched.day || showError) && !isValidDay(value.day, value.month);
  const monthError = (fieldTouched.month || showError) && !isValidMonth(value.month);
  const yearError = (fieldTouched.year || showError) && !isValidYear(value.year);

  const anyError = dayError || monthError || yearError;

  const handleChange = (field: keyof DateOfBirth, val: string) => {
    const clean = val.replace(/\D/g, "");

    // Clamp live while typing to avoid obviously wrong values building up
    if (field === "day") {
      if (clean.length === 2) {
        const d = parseInt(clean, 10);
        const m = parseInt(value.month, 10);
        const max = (!isNaN(m) && m >= 1 && m <= 12) ? getDaysInMonth(m) : 32;
        if (d < 1 || d > max) return; // block invalid final value
      }
    }
    if (field === "month") {
      if (clean.length === 2) {
        const m = parseInt(clean, 10);
        if (m < 1 || m > 12) return;
      }
    }
    if (field === "year") {
      if (clean.length === 4) {
        const y = parseInt(clean, 10);
        if (y < MIN_YEAR || y > MAX_NEPALI_YEAR) return;
      }
    }

    onChange({ ...value, [field]: clean });
  };

  const handleBlur = (field: keyof DateOfBirth) => {
    setFieldTouched((prev) => ({ ...prev, [field]: true }));

    // Auto-pad single digit day/month to 2 digits on blur
    if (field === "day" && value.day.length === 1) {
      const padded = value.day.padStart(2, "0");
      const d = parseInt(padded, 10);
      if (d >= 1) onChange({ ...value, day: padded });
    }
    if (field === "month" && value.month.length === 1) {
      const padded = value.month.padStart(2, "0");
      const m = parseInt(padded, 10);
      if (m >= 1) onChange({ ...value, month: padded });
    }
  };

  const borderColor = (hasError: boolean) =>
    hasError ? "#E13746" : "#d1d5db";

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px 10px",
    fontSize: "14px",
    color: "#111827",
    textAlign: "center",
    backgroundColor: "#fff",
    border: `1.5px solid ${borderColor(hasError)}`,
    borderRadius: "12px",
    outline: "none",
  });

  const errorMsg = () => {
    if (dayError) return "Day must be between 01–" + (isValidMonth(value.month) ? getDaysInMonth(parseInt(value.month)) : 32);
    if (monthError) return "Month must be between 01–12";
    if (yearError) return `Year must be between ${MIN_YEAR}–${MAX_NEPALI_YEAR}`;
    return "Please enter a valid date of birth.";
  };

  return (
    <div style={{ marginBottom: "24px" }}>

      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "black",
          marginBottom: "10px",
        }}
      >
        Date of Birth
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: "10px" }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD"
          maxLength={2}
          value={value.day}
          onBlur={() => handleBlur("day")}
          onChange={(e) => handleChange("day", e.target.value)}
          style={inputStyle(dayError)}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="MM"
          maxLength={2}
          value={value.month}
          onBlur={() => handleBlur("month")}
          onChange={(e) => handleChange("month", e.target.value)}
          style={inputStyle(monthError)}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="YYYY"
          maxLength={4}
          value={value.year}
          onBlur={() => handleBlur("year")}
          onChange={(e) => handleChange("year", e.target.value)}
          style={inputStyle(yearError)}
        />
      </div>

      {anyError && (
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
          {errorMsg()}
        </p>
      )}
    </div>
  );
};