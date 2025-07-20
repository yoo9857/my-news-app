import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfileCardProps {
  nickname: string;
  avatarUrl?: string | null;
  email: string;
}

export default function UserProfileCard({ nickname, avatarUrl, email }: UserProfileCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto bg-gray-800 text-white border-gray-700">
      <CardHeader className="text-center">
        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-indigo-500">
          <AvatarImage src={avatarUrl || undefined} alt={`${nickname}'s avatar`} />
          <AvatarFallback>{nickname.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl font-bold">{nickname}</CardTitle>
        <CardDescription className="text-gray-400">{email}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {/* Additional profile details can go here */}
        <p className="text-gray-300">Welcome to your personalized profile!</p>
      </CardContent>
    </Card>
  );
}
