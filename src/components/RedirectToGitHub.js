import React, { useEffect } from 'react';

export function RedirectToGitHub({ url }) {
  useEffect(() => {
    window.location.href = url;
  }, [url]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Redirecting to GitHub...</p>
      <p>If you are not redirected automatically, <a href={url}>click here</a>.</p>
    </div>
  );
}