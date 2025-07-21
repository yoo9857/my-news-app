
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') ? parseInt(formData.get('postId') as string, 10) : null;
    const userId = formData.get('userId') ? parseInt(formData.get('userId') as string, 10) : null;

    if (postId !== null && isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });
    }
    if (userId !== null && isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // In a real application, you would upload the file to a storage service (e.g., AWS S3)
    // and store the file path in the database.
    // For this example, we'll just simulate storing the file info.

    const newUpload = await prisma.upload.create({
      data: {
        filePath: `/uploads/${file.name}`,
        fileName: file.name,
        postId: postId,
        userId: userId,
      },
    });

    return NextResponse.json(newUpload, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
