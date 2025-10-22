import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Archives a specific DM message by message_id
 * Called when a message is replied to (manual or auto)
 */
export async function archiveMessage(messageId: string, userId: string): Promise<void> {
  await supabaseAdmin
    .from('instagram_messages')
    .update({ is_archived: true })
    .eq('message_id', messageId)
    .eq('user_id', userId);
}

/**
 * Archives a specific comment by comment_id
 * Called when a comment is replied to (manual or auto)
 */
export async function archiveComment(commentId: string, userId: string): Promise<void> {
  await supabaseAdmin
    .from('instagram_comments')
    .update({ is_archived: true })
    .eq('comment_id', commentId)
    .eq('user_id', userId);
}

/**
 * Batch archive old answered messages (older than specified days)
 * Should be called by a cron job or manually by user
 *
 * @param userId - User ID to archive messages for
 * @param daysOld - Number of days old messages must be (default 30)
 * @returns Number of messages and comments archived
 */
export async function archiveOldAnsweredMessages(
  userId: string,
  daysOld: number = 30
): Promise<{ archivedMessages: number; archivedComments: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Archive old answered DMs
  const { count: msgCount } = await supabaseAdmin
    .from('instagram_messages')
    .update({ is_archived: true })
    .eq('user_id', userId)
    .eq('is_archived', false)
    .not('replied_at', 'is', null)
    .lt('replied_at', cutoffDate.toISOString());

  // Archive old answered comments
  const { count: commentCount } = await supabaseAdmin
    .from('instagram_comments')
    .update({ is_archived: true })
    .eq('user_id', userId)
    .eq('is_archived', false)
    .not('replied_at', 'is', null)
    .lt('replied_at', cutoffDate.toISOString());

  return {
    archivedMessages: msgCount || 0,
    archivedComments: commentCount || 0,
  };
}

/**
 * Get counts of archived vs unarchived messages for a user
 * Useful for showing stats in the UI
 */
export async function getArchivalStats(userId: string): Promise<{
  totalMessages: number;
  archivedMessages: number;
  activeMessages: number;
  totalComments: number;
  archivedComments: number;
  activeComments: number;
}> {
  const [
    { count: totalMessages },
    { count: archivedMessages },
    { count: totalComments },
    { count: archivedComments },
  ] = await Promise.all([
    supabaseAdmin.from('instagram_messages').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('instagram_messages').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_archived', true),
    supabaseAdmin.from('instagram_comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('instagram_comments').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_archived', true),
  ]);

  return {
    totalMessages: totalMessages || 0,
    archivedMessages: archivedMessages || 0,
    activeMessages: (totalMessages || 0) - (archivedMessages || 0),
    totalComments: totalComments || 0,
    archivedComments: archivedComments || 0,
    activeComments: (totalComments || 0) - (archivedComments || 0),
  };
}
