import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './tuenti/App';
import './tuenti/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Inkorium root not found');

createRoot(root).render(<App />);
