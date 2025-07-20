'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [backendMessage, setBackendMessage] = useState('');
  const [backendData, setBackendData] = useState('');

  useEffect(() => {
    // 백엔드 루트 API 호출
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => setBackendMessage(data.message))
      .catch(err => console.error('Error fetching root message:', err));

    // 백엔드 /api/data API 호출
    fetch('http://localhost:8000/api/data')
      .then(res => res.json())
      .then(data => setBackendData(data.data))
      .catch(err => console.error('Error fetching data:', err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-5xl font-bold mb-6 text-blue-400">심리연구소</h1>
      <p className="text-xl mb-8 text-gray-300">개인 홈페이지에 오신 것을 환영합니다!</p>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-4 text-green-400">백엔드 통신 테스트</h2>
        <p className="text-lg mb-2">루트 메시지: <span className="font-mono text-yellow-300">{backendMessage || '로딩 중...'}</span></p>
        <p className="text-lg">데이터: <span className="font-mono text-yellow-300">{backendData || '로딩 중...'}</span></p>
      </div>

      <footer className="mt-12 text-gray-500 text-sm">
        &copy; 2025 심리연구소. All rights reserved.
      </footer>
    </div>
  );
}