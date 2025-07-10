
import { Server } from 'socket.io';

// ⭐️ 전역 범위에 Socket.IO 서버 인스턴스와 캐시를 저장합니다.
// 서버리스 환경에서는 요청마다 코드가 다시 실행될 수 있으므로,
// 상태를 유지하기 위해 전역 변수를 활용합니다.
const globalWithSocket = global as typeof global & {
  io?: Server;
  companyDataCache?: any[];
};

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting Socket.IO');

    const io = new Server(res.socket.server, {
      path: '/api/my_socket',
      addTrailingSlash: false,
      cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    io.on('connection', socket => {
      console.log('Socket.IO 클라이언트 연결됨:', socket.id);

      // 클라이언트가 연결되면 현재 캐시된 데이터를 전송합니다.
      if (globalWithSocket.companyDataCache?.length) {
        socket.emit('companies_updated', globalWithSocket.companyDataCache);
      }

      socket.on('update_company_list', (data) => {
        console.log(`파이썬으로부터 ${data.length}개의 ��업 데이터를 받아 캐시를 업데이트합니다.`);
        globalWithSocket.companyDataCache = data;
        io.emit('companies_updated', globalWithSocket.companyDataCache);
      });

      socket.on('real_kiwoom_data', (data) => {
        io.emit('real_kiwoom_data', data);
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO 클라이언트 연결 해제됨:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO already running');
  }
  res.end();
};

export const GET = ioHandler;
export const POST = ioHandler;
