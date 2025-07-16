"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UserProfile {
  user_id: number;
  bio: string | null;
  profile_picture_url: string | null;
  location: string | null;
  updated_at: string;
}

interface UserInfo {
  username: string;
  email: string | null;
}

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [location, setLocation] = useState('');
  const router = useRouter();

  const getTokenHeaders = () => {
    const token = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type');
    if (!token || !tokenType) {
      router.push('/login');
      return null;
    }
    return {
      Authorization: `${tokenType} ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    const headers = getTokenHeaders();
    if (!headers) return;

    try {
      // Fetch user info
      const userResponse = await fetch('`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/`users/me/', {
        headers: { Authorization: headers.Authorization },
      });
      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_type');
          router.push('/login');
        }
        throw new Error('Failed to fetch user info');
      }
      const userData = await userResponse.json();
      setUserInfo(userData);

      // Fetch user profile
      const profileResponse = await fetch('`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/`profiles/me', {
        headers: { Authorization: headers.Authorization },
      });
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const profileData = await profileResponse.json();
      setUserProfile(profileData);
      setBio(profileData.bio || '');
      setProfilePictureUrl(profileData.profile_picture_url || '');
      setLocation(profileData.location || '');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    const headers = getTokenHeaders();
    if (!headers) return;

    try {
      const response = await fetch('`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/`profiles/me', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ bio, profile_picture_url: profilePictureUrl, location }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const updatedData = await response.json();
      setUserProfile(updatedData);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    router.push('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading profile...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-500">Error: {error}</div>;
  }

  if (!userInfo) {
    return null; // Should redirect to login if no user info
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Username:</strong> {userInfo.username}</p>
          {userInfo.email && <p><strong>Email:</strong> {userInfo.email}</p>}

          {!isEditing ? (
            <>
              <p><strong>Bio:</strong> {userProfile?.bio || 'N/A'}</p>
              <p><strong>Location:</strong> {userProfile?.location || 'N/A'}</p>
              {userProfile?.profile_picture_url && (
                <p><strong>Profile Picture:</strong> <img src={userProfile.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-full object-cover" /></p>
              )}
              <Button onClick={() => setIsEditing(true)} className="w-full">Edit Profile</Button>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="profilePictureUrl">Profile Picture URL</Label>
                <Input id="profilePictureUrl" type="text" value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full mt-2">
                Cancel
              </Button>
            </form>
          )}
          <Button onClick={handleLogout} className="w-full mt-4">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}