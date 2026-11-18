import { addDays, format } from "date-fns";
import { createHash } from "crypto";
import type {
  ConnectedChannel,
  DestinationPublication,
  ParentContentPublication,
  PublishingChannelId,
  PublishingMetrics,
  WebhookLogEntry,
  PublicationStatus,
} from "@/lib/publishing-types";
import { getContent } from "@/lib/queries";
import { idempotencyKey } from "@/lib/services/cms";

export const CHANNEL_DEFINITIONS: Record<
  PublishingChannelId,
  {
    name: string;
    category: "website" | "social";
    capabilities: ConnectedChannel["capabilities"];
    endpoint?: string;
  }
> = {
  wordpress: {
    name: "WordPress",
    category: "website",
    capabilities: {
      posts: true,
      pages: true,
      scheduling: true,
      updates: true,
      media: true,
      notes: "Full REST API support for post types, custom taxonomies and scheduled publication.",
    },
    endpoint: "https://verdantbotanics.com/wp-json/wp/v2",
  },
  webflow: {
    name: "Webflow",
    category: "website",
    capabilities: {
      posts: true,
      pages: false,
      scheduling: false,
      updates: true,
      media: true,
      notes: "CMS Collection API. Scheduling requires staging trigger or scheduled webhook.",
    },
    endpoint: "https://api.webflow.com/v2/collections",
  },
  shopify: {
    name: "Shopify",
    category: "website",
    capabilities: {
      posts: true,
      pages: true,
      scheduling: false,
      updates: true,
      media: true,
      notes: "Shopify Storefront Blog & Pages API. Direct publishing to /blogs/news.",
    },
    endpoint: "https://verdant-botanics.myshopify.com/admin/api/2026-01",
  },
  ghost: {
    name: "Ghost",
    category: "website",
    capabilities: {
      posts: true,
      pages: true,
      scheduling: true,
      updates: true,
      media: true,
      notes: "Ghost Admin API v5. Native draft and scheduled delivery support.",
    },
    endpoint: "https://blog.verdantbotanics.com/ghost/api/admin",
  },
  wix: {
    name: "Wix",
    category: "website",
    capabilities: {
      posts: true,
      pages: false,
      scheduling: false,
      updates: true,
      media: true,
      notes: "Wix Blog API. Direct draft and post insertion.",
    },
    endpoint: "https://www.wixapis.com/blog/v3",
  },
  notion: {
    name: "Notion",
    category: "website",
    capabilities: {
      posts: true,
      pages: true,
      scheduling: false,
      updates: true,
      media: false,
      notes: "Syncs structured pages to connected Notion database for editorial review.",
    },
    endpoint: "https://api.notion.com/v1/databases",
  },
  framer: {
    name: "Framer",
    category: "website",
    capabilities: {
      posts: true,
      pages: false,
      scheduling: false,
      updates: true,
      media: false,
      notes: "Framer CMS collection synchronization via webhooks.",
    },
    endpoint: "https://api.framer.com/cms",
  },
  webhook: {
    name: "Custom webhook",
    category: "website",
    capabilities: {
      posts: true,
      pages: true,
      scheduling: true,
      updates: true,
      media: true,
      notes: "HMAC-signed SHA256 payload delivery to your custom backend with retry backoff.",
    },
    endpoint: "https://api.verdantbotanics.com/hooks/content",
  },
  linkedin: {
    name: "LinkedIn",
    category: "social",
    capabilities: {
      posts: true,
      pages: false,
      scheduling: true,
      updates: false,
      media: true,
      notes: "Company page and member share API. Native scheduled posts supported.",
    },
    endpoint: "https://api.linkedin.com/v2/ugcPosts",
  },
  reddit: {
    name: "Reddit",
    category: "social",
    capabilities: {
      posts: true,
      pages: false,
      scheduling: false,
      updates: false,
      media: false,
      notes: "Monitoring and draft assistance only. Automated posting is restricted per Reddit community policy.",
    },
    endpoint: "https://oauth.reddit.com/api/submit",
  },
};

interface PublishingStore {
  parentItems: ParentContentPublication[];
  channels: ConnectedChannel[];
  webhookLogs: WebhookLogEntry[];
}

const globalForPublishing = globalThis as typeof globalThis & {
  __visibilityPublishingStore?: PublishingStore;
};

function initializeStore(integrationsState?: Record<string, boolean>): PublishingStore {
  const isConn = (id: string, def = false) =>
    integrationsState ? Boolean(integrationsState[id]) : def;

  // Connected channels list with token expiration demo warning for LinkedIn
  const channels: ConnectedChannel[] = Object.entries(CHANNEL_DEFINITIONS).map(
    ([id, def]) => {
      const channelId = id as PublishingChannelId;
      // Default initial connected state: WordPress, LinkedIn, Webhook, and Shopify
      const connected =
        isConn(channelId, channelId === "wordpress" || channelId === "linkedin" || channelId === "webhook");

      // Demo warning: LinkedIn token expires in 4 days
      const tokenExpiresAt =
        channelId === "linkedin"
          ? new Date(Date.now() + 86400000 * 4).toISOString()
          : undefined;

      return {
        id: channelId,
        name: def.name,
        category: def.category,
        connected,
        publishedCount: 0,
        scheduledCount: 0,
        tokenExpiresAt,
        tokenExpired: false,
        capabilities: def.capabilities,
        endpoint: def.endpoint,
      };
    }
  );

  // Multi-destination content publications
  const parentItems: ParentContentPublication[] = [
    {
      contentId: 1,
      title: "The Complete Guide to Organic Skincare",
      slug: "the-complete-guide-to-organic-skincare",
      contentType: "article",
      primaryKeyword: "organic skincare",
      overallStatus: "published",
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      destinations: [
        {
          id: "pub_1_wp",
          contentId: 1,
          destination: "wordpress",
          destinationName: "WordPress",
          category: "website",
          status: "published",
          publishedAt: new Date(Date.now() - 86400000 * 60).toISOString(),
          externalUrl: "https://verdantbotanics.com/blog/the-complete-guide-to-organic-skincare",
          externalId: "wp_post_1042",
          idempotencyKey: idempotencyKey(1, 2, "WordPress"),
          version: 2,
          adaptedTitle: "The Complete Guide to Organic Skincare",
          adaptedSnippet: "A plain-English guide to understanding organic skincare ingredients, certifications and routines.",
          adaptedContentHtml: "<h2>What makes skincare organic?</h2><p>Organic skincare prioritises plant-based botanicals grown without synthetic pesticides...</p>",
          syncStatus: "in_sync",
          lastSyncedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          retryCount: 0,
        },
        {
          id: "pub_1_li",
          contentId: 1,
          destination: "linkedin",
          destinationName: "LinkedIn",
          category: "social",
          status: "published",
          publishedAt: new Date(Date.now() - 86400000 * 55).toISOString(),
          externalUrl: "https://linkedin.com/feed/update/urn:li:share:714209384",
          externalId: "li_share_9941",
          idempotencyKey: idempotencyKey(1, 1, "LinkedIn"),
          version: 1,
          adaptedTitle: "Why 80% of 'clean beauty' claims fail ingredient scrutiny",
          adaptedSnippet: "We analysed over 200 cosmetic ingredient labels. Here is what actually distinguishes certified organic skincare...",
          syncStatus: "in_sync",
          lastSyncedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          retryCount: 0,
        },
        {
          id: "pub_1_rd",
          contentId: 1,
          destination: "reddit",
          destinationName: "Reddit",
          category: "social",
          status: "draft",
          idempotencyKey: idempotencyKey(1, 1, "Reddit"),
          version: 1,
          adaptedTitle: "Resource breakdown: USDA Organic vs COSMOS vs Ecocert certification standards",
          adaptedSnippet: "Compiled a comparison table of what each certifier actually requires for leave-on products.",
          syncStatus: "in_sync",
          retryCount: 0,
        },
      ],
    },
    {
      contentId: 2,
      title: "Organic Skincare Routine for Beginners",
      slug: "organic-skincare-routine-for-beginners",
      contentType: "article",
      primaryKeyword: "organic skincare routine for beginners",
      overallStatus: "published",
      createdAt: new Date(Date.now() - 86400000 * 52).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      destinations: [
        {
          id: "pub_2_wp",
          contentId: 2,
          destination: "wordpress",
          destinationName: "WordPress",
          category: "website",
          status: "published",
          publishedAt: new Date(Date.now() - 86400000 * 52).toISOString(),
          externalUrl: "https://verdantbotanics.com/blog/organic-skincare-routine-for-beginners",
          externalId: "wp_post_1043",
          idempotencyKey: idempotencyKey(2, 1, "WordPress"),
          version: 1,
          adaptedTitle: "Organic Skincare Routine for Beginners: 4 Simple Steps",
          adaptedSnippet: "Start with cleanser, toner, moisturiser and sunscreen. How to build consistency without overloading sensitive skin.",
          syncStatus: "in_sync",
          lastSyncedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
          retryCount: 0,
        },
        {
          id: "pub_2_li",
          contentId: 2,
          destination: "linkedin",
          destinationName: "LinkedIn",
          category: "social",
          status: "scheduled",
          scheduledFor: new Date(Date.now() + 86400000 * 2).toISOString(),
          externalId: "li_draft_309",
          idempotencyKey: idempotencyKey(2, 1, "LinkedIn"),
          version: 1,
          adaptedTitle: "The minimalist 4-step skincare routine for sensitive skin",
          adaptedSnippet: "Most people ruin their skin barrier by using 10 products at once. Here is the minimal viable botanical routine...",
          syncStatus: "pending_sync",
          retryCount: 0,
        },
      ],
    },
    {
      contentId: 3,
      title: "Natural vs Organic Skincare: What's the Difference?",
      slug: "natural-vs-organic-skincare",
      contentType: "article",
      primaryKeyword: "natural vs organic skincare",
      overallStatus: "published",
      createdAt: new Date(Date.now() - 86400000 * 46).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      destinations: [
        {
          id: "pub_3_wp",
          contentId: 3,
          destination: "wordpress",
          destinationName: "WordPress",
          category: "website",
          status: "published",
          publishedAt: new Date(Date.now() - 86400000 * 46).toISOString(),
          externalUrl: "https://verdantbotanics.com/blog/natural-vs-organic-skincare",
          externalId: "wp_post_1044",
          idempotencyKey: idempotencyKey(3, 1, "WordPress"),
          version: 1,
          adaptedTitle: "Natural vs Organic Skincare: What's the Difference?",
          adaptedSnippet: "'Natural' is unregulated; 'Organic' requires strict third-party verification. Learn how to read cosmetic labels.",
          syncStatus: "in_sync",
          lastSyncedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          retryCount: 0,
        },
        {
          id: "pub_3_wh",
          contentId: 3,
          destination: "webhook",
          destinationName: "Custom webhook",
          category: "website",
          status: "published",
          publishedAt: new Date(Date.now() - 86400000 * 46).toISOString(),
          externalId: "wh_deliv_4011",
          idempotencyKey: idempotencyKey(3, 1, "Webhook"),
          version: 1,
          adaptedTitle: "Natural vs Organic Skincare payload",
          adaptedSnippet: "Delivered content.published event with SHA256 signature to api.verdantbotanics.com.",
          syncStatus: "in_sync",
          lastSyncedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
          retryCount: 0,
        },
      ],
    },
    {
      contentId: 4,
      title: "Gentle Cleanser for Sensitive Skin",
      slug: "gentle-cleanser-for-sensitive-skin",
      contentType: "article",
      primaryKeyword: "gentle cleanser for sensitive skin",
      overallStatus: "scheduled",
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      destinations: [
        {
          id: "pub_4_wp",
          contentId: 4,
          destination: "wordpress",
          destinationName: "WordPress",
          category: "website",
          status: "scheduled",
          scheduledFor: new Date(Date.now() + 86400000 * 3).toISOString(),
          externalId: "wp_post_1049",
          idempotencyKey: idempotencyKey(4, 1, "WordPress"),
          version: 1,
          adaptedTitle: "Gentle Cleanser for Sensitive Skin: Formulations That Do Not Strip",
          adaptedSnippet: "How sulfate-free cleansers preserve skin barrier moisture while effectively lifting impurities.",
          syncStatus: "pending_sync",
          retryCount: 0,
        },
        {
          id: "pub_4_li",
          contentId: 4,
          destination: "linkedin",
          destinationName: "LinkedIn",
          category: "social",
          status: "scheduled",
          scheduledFor: new Date(Date.now() + 86400000 * 4).toISOString(),
          externalId: "li_draft_310",
          idempotencyKey: idempotencyKey(4, 1, "LinkedIn"),
          version: 1,
          adaptedTitle: "Why that squeaky clean feeling is actually damaging your skin",
          adaptedSnippet: "If your face feels tight after cleansing, your moisture barrier is being stripped. Here is what to look for instead...",
          syncStatus: "pending_sync",
          retryCount: 0,
        },
      ],
    },
    {
      contentId: 5,
      title: "Hyaluronic Acid vs Glycerin",
      slug: "hyaluronic-acid-vs-glycerin",
      contentType: "article",
      primaryKeyword: "hyaluronic acid vs glycerin",
      overallStatus: "scheduled",
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      destinations: [
        {
          id: "pub_5_wp",
          contentId: 5,
          destination: "wordpress",
          destinationName: "WordPress",
          category: "website",
          status: "scheduled",
          scheduledFor: new Date(Date.now() + 86400000 * 7).toISOString(),
          externalId: "wp_post_1050",
          idempotencyKey: idempotencyKey(5, 1, "WordPress"),
          version: 1,
          adaptedTitle: "Hyaluronic Acid vs Glycerin: Which Hydrator Works Best for Dry Climates?",
          adaptedSnippet: "Comparing molecular weight, humectant draw mechanisms and barrier repair properties.",
          syncStatus: "pending_sync",
          retryCount: 0,
        },
      ],
    },
    {
      contentId: 6,
      title: "Shea Butter Benefits for Skin",
      slug: "shea-butter-benefits-for-skin",
      contentType: "article",
      primaryKeyword: "shea butter benefits for skin",
      overallStatus: "failed",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      destinations: [
        {
          id: "pub_6_wh",
          contentId: 6,
          destination: "webhook",
          destinationName: "Custom webhook",
          category: "website",
          status: "failed",
          externalId: "wh_err_109",
          idempotencyKey: idempotencyKey(6, 1, "Webhook"),
          version: 1,
          adaptedTitle: "Shea Butter Benefits for Skin",
          adaptedSnippet: "Payload delivery rejected: HTTP 502 Bad Gateway on remote endpoint api.verdantbotanics.com.",
          syncStatus: "sync_error",
          lastSyncedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          error: "Endpoint returned HTTP 502 Bad Gateway. Upstream server took too long to respond (timeout 15000ms).",
          retryCount: 3,
        },
        {
          id: "pub_6_wp",
          contentId: 6,
          destination: "wordpress",
          destinationName: "WordPress",
          category: "website",
          status: "draft",
          idempotencyKey: idempotencyKey(6, 1, "WordPress"),
          version: 1,
          adaptedTitle: "Raw Shea Butter Benefits: Fatty Acids and Moisture Retention",
          adaptedSnippet: "Unrefined shea butter contains oleic and stearic acids that create a breathable protective seal.",
          syncStatus: "in_sync",
          retryCount: 0,
        },
      ],
    },
    {
      contentId: 7,
      title: "Organic Face Moisturiser Collection",
      slug: "organic-face-moisturiser",
      contentType: "page",
      primaryKeyword: "organic face moisturiser",
      overallStatus: "published",
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      destinations: [
        {
          id: "pub_7_wp",
          contentId: 7,
          destination: "wordpress",
          destinationName: "WordPress",
          category: "website",
          status: "published",
          publishedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          externalUrl: "https://verdantbotanics.com/organic-face-moisturiser",
          externalId: "wp_page_201",
          idempotencyKey: idempotencyKey(7, 1, "WordPress"),
          version: 1,
          adaptedTitle: "Organic Face Moisturiser Collection",
          adaptedSnippet: "Landing page presenting botanical face hydrators formulated with cold-pressed rosehip seed oil.",
          syncStatus: "in_sync",
          lastSyncedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          retryCount: 0,
        },
      ],
    },
  ];

  // Recalculate published/scheduled counts on channels
  channels.forEach((ch) => {
    let pubCount = 0;
    let schedCount = 0;
    parentItems.forEach((p) => {
      p.destinations.forEach((d) => {
        if (d.destination === ch.id) {
          if (d.status === "published") pubCount++;
          if (d.status === "scheduled") schedCount++;
        }
      });
    });
    ch.publishedCount = pubCount;
    ch.scheduledCount = schedCount;
  });

  const webhookLogs: WebhookLogEntry[] = [
    {
      id: "log_wh_1042",
      event: "content.published",
      status: 200,
      key: "9f2a1c04e7b81d3a",
      at: "Today 10:12",
      attempt: 1,
      destination: "https://api.verdantbotanics.com/hooks/content",
      payloadSummary: "Published: The Complete Guide to Organic Skincare (v2)",
    },
    {
      id: "log_wh_1041",
      event: "content.updated",
      status: 200,
      key: "4be7710aa90c2f55",
      at: "Today 09:40",
      attempt: 1,
      destination: "https://api.verdantbotanics.com/hooks/content",
      payloadSummary: "Updated: Natural vs Organic Skincare (v1)",
    },
    {
      id: "log_wh_1039",
      event: "content.published",
      status: 502,
      key: "c3d84a0b19ee7a21",
      at: "Today 04:15",
      attempt: 3,
      destination: "https://api.verdantbotanics.com/hooks/content",
      payloadSummary: "Failed: Shea Butter Benefits for Skin (HTTP 502 Bad Gateway)",
    },
  ];

  return { parentItems, channels, webhookLogs };
}

function getStore(integrationsState?: Record<string, boolean>): PublishingStore {
  if (!globalForPublishing.__visibilityPublishingStore) {
    globalForPublishing.__visibilityPublishingStore = initializeStore(integrationsState);
  }
  return globalForPublishing.__visibilityPublishingStore;
}

export function getPublishingData(integrationsState?: Record<string, boolean>): {
  channels: ConnectedChannel[];
  parentItems: ParentContentPublication[];
  metrics: PublishingMetrics;
  webhookLogs: WebhookLogEntry[];
} {
  const store = getStore(integrationsState);

  // Sync with integrationsState if passed
  if (integrationsState) {
    store.channels.forEach((ch) => {
      if (integrationsState[ch.id] !== undefined) {
        ch.connected = integrationsState[ch.id];
      }
    });
  }

  // Calculate actual counts
  let scheduledTotal = 0;
  let publishedThisMonthTotal = 0;
  let failedTotal = 0;

  store.parentItems.forEach((p) => {
    p.destinations.forEach((d) => {
      if (d.status === "scheduled") scheduledTotal++;
      if (d.status === "published") publishedThisMonthTotal++;
      if (d.status === "failed") failedTotal++;
    });
  });

  const connectedChannelsCount = store.channels.filter((c) => c.connected).length;

  const metrics: PublishingMetrics = {
    totalConnectedChannels: connectedChannelsCount,
    scheduledCount: scheduledTotal,
    publishedThisMonth: publishedThisMonthTotal,
    failedCount: failedTotal,
  };

  return {
    channels: store.channels,
    parentItems: store.parentItems,
    metrics,
    webhookLogs: store.webhookLogs,
  };
}

export function retryPublication(pubId: string): DestinationPublication | null {
  const store = getStore();
  for (const parent of store.parentItems) {
    const dest = parent.destinations.find((d) => d.id === pubId);
    if (dest) {
      dest.status = "published";
      dest.publishedAt = new Date().toISOString();
      dest.error = undefined;
      dest.syncStatus = "in_sync";
      dest.lastSyncedAt = new Date().toISOString();
      dest.retryCount += 1;
      dest.externalId = `wh_retry_${Date.now()}`;
      dest.idempotencyKey = idempotencyKey(dest.contentId, dest.version, dest.destinationName);

      // Re-evaluate parent overall status
      const anyFailed = parent.destinations.some((d) => d.status === "failed");
      const anySched = parent.destinations.some((d) => d.status === "scheduled");
      parent.overallStatus = anyFailed ? "failed" : anySched ? "scheduled" : "published";

      // Add success entry to log
      store.webhookLogs.unshift({
        id: `log_retry_${Date.now()}`,
        event: "content.published",
        status: 200,
        key: dest.idempotencyKey,
        at: "Just now",
        attempt: dest.retryCount,
        destination: CHANNEL_DEFINITIONS[dest.destination].endpoint || dest.destinationName,
        payloadSummary: `Retry delivered: ${parent.title} (${dest.destinationName})`,
      });

      return dest;
    }
  }
  return null;
}

export function cancelSchedule(pubId: string): DestinationPublication | null {
  const store = getStore();
  for (const parent of store.parentItems) {
    const dest = parent.destinations.find((d) => d.id === pubId);
    if (dest && dest.status === "scheduled") {
      dest.status = "draft";
      dest.scheduledFor = undefined;
      dest.syncStatus = "in_sync";

      // Re-evaluate parent overall status
      const anyFailed = parent.destinations.some((d) => d.status === "failed");
      const anySched = parent.destinations.some((d) => d.status === "scheduled");
      parent.overallStatus = anyFailed ? "failed" : anySched ? "scheduled" : "draft";

      return dest;
    }
  }
  return null;
}

export function republishDestination(pubId: string): DestinationPublication | null {
  const store = getStore();
  for (const parent of store.parentItems) {
    const dest = parent.destinations.find((d) => d.id === pubId);
    if (dest) {
      dest.version += 1;
      dest.status = "published";
      dest.publishedAt = new Date().toISOString();
      dest.lastSyncedAt = new Date().toISOString();
      dest.syncStatus = "in_sync";
      dest.idempotencyKey = idempotencyKey(dest.contentId, dest.version, dest.destinationName);
      parent.updatedAt = new Date().toISOString();

      return dest;
    }
  }
  return null;
}

export function reconcileChannelStatus(channelId: PublishingChannelId): {
  reconciledCount: number;
} {
  const store = getStore();
  let count = 0;
  for (const parent of store.parentItems) {
    for (const dest of parent.destinations) {
      if (dest.destination === channelId) {
        dest.syncStatus = "in_sync";
        dest.lastSyncedAt = new Date().toISOString();
        count++;
      }
    }
  }
  return { reconciledCount: count };
}

export function toggleChannelConnection(channelId: PublishingChannelId): boolean {
  const store = getStore();
  const ch = store.channels.find((c) => c.id === channelId);
  if (ch) {
    ch.connected = !ch.connected;
    return ch.connected;
  }
  return false;
}

