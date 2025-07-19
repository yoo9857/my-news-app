
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, postId } = await req.json();

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });
      return NextResponse.json({ message: 'Like removed' });
    } else {
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
      return NextResponse.json({ message: 'Like added' }, { status: 201 });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json({ error: 'Failed to handle like' }, { status: 500 });
  }
}
