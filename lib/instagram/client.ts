import axios from 'axios';

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface InstagramConversation {
  id: string;
  updated_time: string;
  participants: {
    data: Array<{
      id: string;
      username: string;
      name: string;
    }>;
  };
  messages?: {
    data: Array<{
      id: string;
      from: {
        id: string;
        username: string;
        name: string;
      };
      message: string;
      created_time: string;
    }>;
  };
}

export async function getInstagramUser(accessToken: string) {
  try {
    console.log('🔍 Fetching Facebook Pages...');

    // First, get the user's Facebook pages
    const pagesResponse = await axios.get(`${META_API_BASE}/me/accounts`, {
      params: {
        access_token: accessToken,
      },
    });

    console.log('📄 Pages API Response:', JSON.stringify(pagesResponse.data, null, 2));
    console.log('📊 Number of pages found:', pagesResponse.data.data?.length || 0);

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      console.error('❌ No pages returned from API');
      console.error('This could mean:');
      console.error('1. You are not an admin of any Facebook Pages');
      console.error('2. The permission "pages_show_list" was not granted');
      console.error('3. The access token does not have the right scopes');
      throw new Error('No Facebook Pages found where you are admin. Make sure you are an admin (not just editor) of a Facebook Page.');
    }

    // Get the first page (you can let user select if they have multiple)
    const page = pagesResponse.data.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    // Get the Instagram Business Account connected to this page
    const igAccountResponse = await axios.get(`${META_API_BASE}/${pageId}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: pageAccessToken,
      },
    });

    if (!igAccountResponse.data.instagram_business_account) {
      throw new Error('No Instagram Business Account connected to this Facebook Page.');
    }

    const igUserId = igAccountResponse.data.instagram_business_account.id;

    // Get Instagram account details
    const igUserResponse = await axios.get(`${META_API_BASE}/${igUserId}`, {
      params: {
        fields: 'id,username,name,profile_picture_url',
        access_token: pageAccessToken,
      },
    });

    return {
      ...igUserResponse.data,
      page_id: pageId,
      page_access_token: pageAccessToken,
    };
  } catch (error) {
    console.error('Error fetching Instagram user:', error);
    throw error;
  }
}

export async function getInstagramConversations(
  pageId: string,
  accessToken: string
) {
  try {
    console.log('🔍 Fetching Instagram conversations for page:', pageId);

    // Instagram Messaging API endpoint for conversations
    // IMPORTANT: Use Page ID, not Instagram User ID
    const response = await axios.get(
      `${META_API_BASE}/${pageId}/conversations`,
      {
        params: {
          platform: 'instagram',
          access_token: accessToken,
          fields: 'id,updated_time,participants',
        },
      }
    );

    console.log('📬 Conversations found:', response.data.data?.length || 0);
    return response.data.data || [];
  } catch (error: any) {
    console.error('❌ Error fetching Instagram conversations:', error.response?.data || error.message);
    throw error;
  }
}

export async function getConversationMessages(
  conversationId: string,
  accessToken: string
) {
  try {
    console.log('💬 Fetching messages for conversation:', conversationId);

    // Get messages from a conversation
    const response = await axios.get(
      `${META_API_BASE}/${conversationId}/messages`,
      {
        params: {
          fields: 'id,from,message,created_time',
          access_token: accessToken,
        },
      }
    );

    // Get conversation details (participants)
    const conversationResponse = await axios.get(
      `${META_API_BASE}/${conversationId}`,
      {
        params: {
          fields: 'participants',
          access_token: accessToken,
        },
      }
    );

    console.log('✉️ Messages in conversation:', response.data.data?.length || 0);

    return {
      conversationId,
      messages: response.data,
      participants: conversationResponse.data.participants,
    };
  } catch (error: any) {
    console.error('❌ Error fetching conversation messages:', error.response?.data || error.message);
    throw error;
  }
}

// Get conversations updated after a specific timestamp (for incremental sync)
export async function getInstagramConversationsSince(
  pageId: string,
  accessToken: string,
  sinceTimestamp?: string
) {
  try {
    console.log('🔍 Fetching Instagram conversations since:', sinceTimestamp || 'beginning');

    const params: any = {
      platform: 'instagram',
      access_token: accessToken,
      fields: 'id,updated_time,participants',
    };

    // Only fetch conversations updated since last sync
    if (sinceTimestamp) {
      // Convert ISO timestamp to Unix timestamp for Instagram API
      const unixTimestamp = Math.floor(new Date(sinceTimestamp).getTime() / 1000);
      params.since = unixTimestamp;
    }

    const response = await axios.get(
      `${META_API_BASE}/${pageId}/conversations`,
      { params }
    );

    console.log('📬 Conversations found:', response.data.data?.length || 0);
    return response.data.data || [];
  } catch (error: any) {
    console.error('❌ Error fetching Instagram conversations:', error.response?.data || error.message);
    throw error;
  }
}

export async function exchangeCodeForToken(code: string) {
  try {
    // Facebook/Instagram Messaging API token exchange
    const response = await axios.get(`${META_API_BASE}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

export async function getLongLivedToken(shortLivedToken: string) {
  try {
    // Facebook/Instagram Messaging API long-lived token exchange
    const response = await axios.get(`${META_API_BASE}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting long-lived token:', error);
    throw error;
  }
}
