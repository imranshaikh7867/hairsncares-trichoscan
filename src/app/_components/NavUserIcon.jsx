"use client";

import React from "react";
import { FaUserCircle } from "react-icons/fa";
import "./NavUserIcon.css";

const DASHBOARD_URL = "https://hairsncares.in/dashboard";

export default function NavUserIcon() {
  return (
    <a
      className="nav-user-icon"
      href={DASHBOARD_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Go to your dashboard"
      title="Dashboard"
    >
      <FaUserCircle />
    </a>
  );
}
