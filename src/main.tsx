import React from "react";
import { createRoot } from "react-dom/client";
import { AuthGate } from "./AuthGate";

const root = document.getElementById("root");
if (!root) throw new Error("Inkorium root element not found");

createRoot(root).render(<AuthGate />);
