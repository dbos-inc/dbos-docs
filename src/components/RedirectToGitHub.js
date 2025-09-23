import React, { useEffect } from 'react';

export function RedirectToGitHub({ url }) {
  useEffect(() => {
    window.open(url, '_blank');
  }, [url]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p></p>
    </div>
  );
}