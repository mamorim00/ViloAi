import axios from 'axios';

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  timestamp: string;
  permalink: string;
}

export interface InstagramCommentData {
  id: string;
  from?: {
    id: string;
    username: string;
  };
  username?: string;
  text: string;
  timestamp: string;
  like_count?: number;
}

/**
 * Get user's recent Instagram media (posts)
 * Used to fetch posts that we can then check for comments
 */
export async function getUserRecentMedia(
  igUserId: string,
  accessToken: string,
  limit: number = 25
): Promise<InstagramMediaItem[]> {
  try {
    console.log('📸 Fetching recent media for Instagram user:', igUserId);

    const response = await axios.get(`${META_API_BASE}/${igUserId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,timestamp,permalink',
        access_token: accessToken,
        limit,
      },
    });

    console.log('📊 Media items found:', response.data.data?.length || 0);
    return response.data.data || [];
  } catch (error: any) {
    console.error('❌ Error fetching Instagram media:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get comments on a specific Instagram media/post
 */
export async function getMediaComments(
  mediaId: string,
  accessToken: string
): Promise<InstagramCommentData[]> {
  try {
    console.log('💬 Fetching comments for media:', mediaId);

    const response = await axios.get(`${META_API_BASE}/${mediaId}/comments`, {
      params: {
        fields: 'id,from,username,text,timestamp,like_count',
        access_token: accessToken,
      },
    });

    const comments = response.data.data || [];
    console.log('✉️ Comments found:', comments.length);
    return comments;
  } catch (error: any) {
    console.error('❌ Error fetching comments:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Reply to an Instagram comment
 * @param commentId - The ID of the comment to reply to
 * @param replyText - The reply text
 * @param accessToken - Page access token
 * @returns The ID of the created reply comment
 */
export async function replyToComment(
  commentId: string,
  replyText: string,
  accessToken: string
): Promise<string> {
  try {
    console.log('📝 Replying to comment:', commentId);

    const response = await axios.post(
      `${META_API_BASE}/${commentId}/replies`,
      null,
      {
        params: {
          message: replyText,
          access_token: accessToken,
        },
      }
    );

    const replyId = response.data.id;
    console.log('✅ Reply posted successfully:', replyId);
    return replyId;
  } catch (error: any) {
    console.error('❌ Error posting reply:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Delete a comment (if needed for moderation)
 */
export async function deleteComment(
  commentId: string,
  accessToken: string
): Promise<boolean> {
  try {
    console.log('🗑️ Deleting comment:', commentId);

    await axios.delete(`${META_API_BASE}/${commentId}`, {
      params: {
        access_token: accessToken,
      },
    });

    console.log('✅ Comment deleted successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Error deleting comment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Hide/unhide a comment
 */
export async function hideComment(
  commentId: string,
  hide: boolean,
  accessToken: string
): Promise<boolean> {
  try {
    console.log(`${hide ? '🙈 Hiding' : '👁️ Unhiding'} comment:`, commentId);

    await axios.post(`${META_API_BASE}/${commentId}`, null, {
      params: {
        hide: hide,
        access_token: accessToken,
      },
    });

    console.log('✅ Comment visibility updated');
    return true;
  } catch (error: any) {
    console.error('❌ Error updating comment visibility:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Sync all comments from recent media posts
 * This is the main function used by the sync endpoint
 */
export async function syncInstagramComments(
  igUserId: string,
  accessToken: string,
  mediaLimit: number = 10
): Promise<{
  mediaId: string;
  postUrl: string;
  comments: InstagramCommentData[];
}[]> {
  try {
    console.log('🔄 Starting comment sync for user:', igUserId);

    // Get recent media posts
    const mediaItems = await getUserRecentMedia(igUserId, accessToken, mediaLimit);

    const allComments: {
      mediaId: string;
      postUrl: string;
      comments: InstagramCommentData[];
    }[] = [];

    // Fetch comments for each media item
    for (const media of mediaItems) {
      try {
        const comments = await getMediaComments(media.id, accessToken);

        if (comments.length > 0) {
          allComments.push({
            mediaId: media.id,
            postUrl: media.permalink,
            comments,
          });
        }
      } catch (error) {
        console.error(`Error fetching comments for media ${media.id}:`, error);
        continue; // Continue with next media item
      }
    }

    console.log(`✅ Comment sync complete. Found comments on ${allComments.length} posts`);
    return allComments;
  } catch (error: any) {
    console.error('❌ Error syncing comments:', error.response?.data || error.message);
    throw error;
  }
}
