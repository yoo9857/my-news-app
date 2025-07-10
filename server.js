// server.js
const { createServer } = require('http');
const { parse } = require('url'); // ⭐️ 'parse'를 다시 임포트합니다.
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ⭐️ 파이썬으로부터 받은 기업 목록을 저장할 변수(캐시)
let companyDataCache = [];

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;
    console.log('Received request for pathname:', pathname);

    // Explicitly handle Socket.IO requests for both /api/my_socket and /api/socket_io
    if (pathname.startsWith('/api/my_socket') || pathname.startsWith('/api/socket_io')) {
      io.engine.handleRequest(req, res); // Let Socket.IO engine handle it
      return;
    }

    // ⭐️ /api/companies 경로로 GET 요청이 오면 캐시된 데이터를 반환합니다.
    if (req.method === 'GET' && pathname === '/api/companies') {
      console.log('Handling GET /api/companies request.'); // Added log
      res.setHeader('Access-Control-Allow-Origin', '*'); // 모든 출처 허용 (개발용)
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, companies: companyDataCache }));
      return; // 여기서 요청 처리를 종료합니다.
    }
    
    // 그 외의 모든 요청은 Next.js가 처리하도록 합니다.
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: '/api/my_socket',
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 10000, // 10 seconds (default is 25000)
    pingTimeout: 5000,   // 5 seconds (default is 5000) - keep default for now, or increase if needed
  });

  io.on('connection', socket => {
    console.log('Socket.IO 클라이언트 연결됨:', socket.id);

    // ⭐️ 파이썬으로부터 'update_company_list' 이벤트를 받으면 캐시를 업데이트하고 클라이언트에 알립니다.
    socket.on('update_company_list', (data) => {
      console.log(`파이썬으로부터 ${data.length}개의 기업 데이터를 받아 캐시를 업데이트합니다.`);
      companyDataCache = data;
      // ⭐️ 모든 연결된 클라이언트에게 데이터가 업데이트되었음을 알립니다.
      io.emit('companies_updated');
    });
    
    // 실시간 시세 데이터 처리
    socket.on('real_kiwoom_data', (data) => {
      io.emit('real_kiwoom_data', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO 클라이언트 연결 해제됨:', socket.id);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});