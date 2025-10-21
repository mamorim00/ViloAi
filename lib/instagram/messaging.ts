import axios from 'axios';

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Send a direct message to an Instagram user
 * @param pageId - The Facebook Page ID (not Instagram User ID)
 * @param recipientId - Instagram user ID (IGID) of the recipient
 * @param messageText - The message text to send
 * @param accessToken - Page access token
 * @returns The message ID of the sent message
 */
export async function sendDirectMessage(
  pageId: string,
  recipientId: string,
  messageText: string,
  accessToken: string
): Promise<string> {
  try {
    console.log('📨 Sending DM to recipient:', recipientId);

    const response = await axios.post(
      `${META_API_BASE}/${pageId}/messages`,
      {
        recipient: {
          id: recipientId,
        },
        message: {
          text: messageText,
        },
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    const messageId = response.data.message_id;
    console.log('✅ DM sent successfully:', messageId);
    return messageId;
  } catch (error: any) {
    console.error('❌ Error sending DM:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send a direct message in response to a conversation
 * This is useful when you already have a conversation ID and sender ID
 * NOTE: Instagram doesn't support /{conversation_id}/messages endpoint
 * We must use /{page_id}/messages with recipient ID instead
 * @param pageId - The Facebook Page ID
 * @param recipientId - Instagram user ID (IGID) of the recipient
 * @param messageText - The message text to send
 * @param accessToken - Page access token
 * @returns The message ID of the sent message
 */
export async function sendConversationMessage(
  pageId: string,
  recipientId: string,
  messageText: string,
  accessToken: string
): Promise<string> {
  try {
    console.log('📨 Sending message via page to recipient:', recipientId);

    const response = await axios.post(
      `${META_API_BASE}/${pageId}/messages`,
      {
        recipient: {
          id: recipientId,
        },
        message: {
          text: messageText,
        },
      },
      {
        params: {
          access_token: accessToken,
        },
      }
    );

    const messageId = response.data.message_id || response.data.id;
    console.log('✅ Message sent successfully:', messageId);
    return messageId;
  } catch (error: any) {
    console.error('❌ Error sending conversation message:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Mark a conversation as read
 * @param conversationId - The Instagram conversation ID
 * @param accessToken - Page access token
 */
export async function markConversationAsRead(
  conversationId: string,
  accessToken: string
): Promise<boolean> {
  try {
    console.log('✓ Marking conversation as read:', conversationId);

    await axios.post(
      `${META_API_BASE}/${conversationId}`,
      null,
      {
        params: {
          access_token: accessToken,
          // Instagram Messaging API uses this to mark as read
          // Note: This might not be supported for all conversation types
        },
      }
    );

    console.log('✅ Conversation marked as read');
    return true;
  } catch (error: any) {
    console.error('❌ Error marking conversation as read:', error.response?.data || error.message);
    // Don't throw - this is not critical
    return false;
  }
}
