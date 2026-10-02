import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (container) {
  let root = (window as any)._reactRoot;
  if (!root) {
    root = createRoot(container);
    (window as any)._reactRoot = root;
  }
  root.render(<App />);
}