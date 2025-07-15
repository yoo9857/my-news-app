"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface Group {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
}

interface GroupMember {
  group_id: number;
  user_id: number;
  role: string;
  joined_at: string;
}

interface ChatMessage {
  id: number;
  group_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.group_id as string;
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getTokenHeaders = () => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');
    if (!token || !tokenType) {
      // router.push('/login'); // Optionally redirect to login if token is missing
      return null;
    }
    return {
      Authorization: `${tokenType} ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        // Fetch group details
        const groupResponse = await fetch(`http://localhost:8003/api/groups/${groupId}`);
        if (!groupResponse.ok) {
          throw new Error('그룹 정보를 불러오지 못했습니다.');
        }
        const groupData = await groupResponse.json();
        setGroup(groupData);

        // Fetch group members
        const headers = getTokenHeaders();
        if (headers) { // Only fetch members if authenticated
          const membersResponse = await fetch(`http://localhost:8003/api/groups/${groupId}/members/`, {
            headers: { Authorization: headers.Authorization },
          });
          if (!membersResponse.ok) {
            throw new Error('그룹 멤버를 불러오지 못했습니다.');
          }
          const membersData = await membersResponse.json();
          setMembers(membersData);

          // Fetch chat messages
          const chatResponse = await fetch(`http://localhost:8003/api/chat/${groupId}/messages`, {
            headers: { Authorization: headers.Authorization },
          });
          if (!chatResponse.ok) {
            throw new Error('채팅 메시지를 불러오지 못했습니다.');
          }
          const chatData = await chatResponse.json();
          setChatMessages(chatData.reverse()); // Reverse to show latest at bottom
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  useEffect(() => {
    if (!loading && group) {
      const token = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');

      if (!token || !tokenType) {
        console.warn("WebSocket: No token found, real-time chat will not be available.");
        return;
      }

      // WebSocket connection
      ws.current = new WebSocket(`ws://localhost:8003/api/ws/chat/${groupId}?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        scrollToBottom();
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setChatMessages((prevMessages) => [...prevMessages, message]);
        scrollToBottom();
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error', error);
        setChatError('채팅 연결 오류 발생');
      };

      return () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.close();
        }
      };
    }
  }, [loading, group, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleChatMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    setChatLoading(true);
    setChatError(null);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({ content: newChatMessage }));
        setNewChatMessage('');
      } catch (err: any) {
        setChatError('메시지 전송 실패');
      } finally {
        setChatLoading(false);
      }
    } else {
      setChatError('채팅 서버에 연결되지 않았습니다.');
      setChatLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    const headers = getTokenHeaders();
    if (!headers) {
      alert('그룹을 삭제하려면 로그인이 필요합니다.');
      return;
    }

    if (window.confirm('정말로 이 그룹을 삭제하시겠습니까? (그룹 소유자만 가능)')) {
      try {
        const response = await fetch(`http://localhost:8003/api/groups/${groupId}`, {
          method: 'DELETE',
          headers: { Authorization: headers.Authorization },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || '그룹 삭제 실패');
        }

        alert('그룹이 삭제되었습니다.');
        router.push('/groups');
      } catch (err: any) {
        alert(`삭제 실패: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-white">그룹 정보 로딩 중...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">오류: {error}</div>;
  }

  if (!group) {
    return <div className="container mx-auto p-4 text-white">그룹을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-gray-800 text-white mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{group.name}</CardTitle>
          <p className="text-sm text-gray-400">생성일: {format(new Date(group.created_at), 'yyyy-MM-dd HH:mm')}</p>
        </CardHeader>
        <CardContent>
          <p className="text-lg whitespace-pre-wrap">{group.description || '설명 없음'}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" onClick={handleDeleteGroup}>그룹 삭제 (소유자만)</Button>
        </CardFooter>
      </Card>

      <h2 className="text-2xl font-bold mb-4 text-white">그룹 멤버</h2>
      <div className="space-y-2 mb-6">
        {members.length === 0 ? (
          <p className="text-gray-400">아직 그룹 멤버가 없습니다.</p>
        ) : (
          members.map((member) => (
            <Card key={member.user_id} className="bg-gray-700 text-white">
              <CardContent className="pt-4">
                <p>User ID: {member.user_id} (Role: {member.role})</p>
                <p className="text-xs text-gray-400">가입일: {format(new Date(member.joined_at), 'yyyy-MM-dd HH:mm')}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4 text-white">채팅</h2>
      <Card className="bg-gray-800 text-white mb-6">
        <CardContent className="h-80 overflow-y-auto p-4 space-y-2">
          {chatMessages.length === 0 ? (
            <p className="text-gray-400">채팅 메시지가 없습니다.</p>
          ) : (
            chatMessages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <span className="text-sm font-bold text-blue-400">User {message.sender_id}</span>
                <p className="text-base">{message.content}</p>
                <span className="text-xs text-gray-500 self-end">{format(new Date(message.created_at), 'HH:mm')}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="p-4 border-t border-gray-700">
          <form onSubmit={handleChatMessageSubmit} className="flex w-full space-x-2">
            <Input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              className="flex-grow bg-gray-700 border-gray-600 text-white"
            />
            <Button type="submit" disabled={chatLoading || !newChatMessage.trim()}>
              {chatLoading ? '전송 중...' : '전송'}
            </Button>
          </form>
          {chatError && <p className="text-red-500 text-sm mt-2">{chatError}</p>}
        </CardFooter>
      </Card>
    </div>
  );
}