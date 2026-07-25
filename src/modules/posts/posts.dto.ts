import type { PostReactionType } from '@prisma/client';

export interface FoundationPostLineDto {
  itemName: string;
  unit: string;
  quantity: number;
}

export interface FoundationPostImageDto {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

export interface FoundationPostSummaryDto {
  id: string;
  foundationId: string;
  campaignId: string;
  campaignTitle: string;
  title: string;
  description: string;
  totalQuantityDelivered: number;
  slug: string;
  publishedAt: string;
  coverImageUrl: string | null;
  reactionsCount: {
    like: number;
    love: number;
    proud: number;
    total: number;
  };
  commentsCount: number;
}

export interface FoundationPostDetailDto extends FoundationPostSummaryDto {
  images: FoundationPostImageDto[];
  lines: FoundationPostLineDto[];
  viewerReaction: PostReactionType | null;
}

export interface PostCommentDto {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface SetPostReactionDto {
  type: PostReactionType;
}
