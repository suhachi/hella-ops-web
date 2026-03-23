import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { auth } from '../shared/lib/firebase';

// Firebase Connection Logging (Debug)
console.log('🚀 HELLA OPS: Firebase System Initializing...');
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('✅ Auth State: Logged In as', user.email);
  } else {
    console.log('💡 Auth State: No Active Session (Guest Mode)');
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
