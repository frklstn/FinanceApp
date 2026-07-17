import React from 'react';

// Halaman auth (register, forgot-password, reset-password) merender AuthShell
// full-page sendiri, jadi layout ini hanya passthrough.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
