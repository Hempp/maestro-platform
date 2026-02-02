/**
 * TUTOR VIDEO SEARCH API
 * Fetches relevant YouTube videos based on learning context
 */

import { NextRequest, NextResponse } from 'next/server';

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
  publishedAt: string;
  url: string;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      medium: { url: string };
    };
  };
}

interface YouTubeVideoItem {
  id: string;
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
  };
}

// Search query mapping based on learning path and step
const SEARCH_QUERIES: Record<string, Record<number, string[]>> = {
  student: {
    0: ['terminal basics tutorial beginner', 'command line for beginners'],
    1: ['terminal setup mac windows', 'install developer tools'],
    2: ['basic terminal commands tutorial', 'command line navigation'],
    3: ['build portfolio project tutorial', 'beginner coding project'],
    4: ['deploy website vercel netlify tutorial', 'host website free'],
  },
  employee: {
    0: ['workflow automation assessment', 'identify automation opportunities'],
    1: ['business process mapping tutorial', 'workflow analysis'],
    2: ['create custom GPT tutorial', 'chatgpt custom instructions'],
    3: ['zapier make automation tutorial', 'email automation workflow'],
    4: ['automation ROI report', 'productivity improvement metrics'],
  },
  owner: {
    0: ['business operations audit', 'process improvement methodology'],
    1: ['ai agent architecture design', 'multi-agent system design'],
    2: ['build ai agent tutorial', 'langchain autogen tutorial'],
    3: ['orchestrate multiple ai agents', 'agent workflow automation'],
    4: ['deploy ai agents production', 'scale ai automation business'],
  },
};

// Fallback general queries
const FALLBACK_QUERIES = [
  'learn to code beginner tutorial',
  'AI automation tutorial',
  'productivity tools tutorial',
];

function parseDuration(duration: string): string {
  // Parse ISO 8601 duration (PT1H2M3S) to readable format
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatViewCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K views`;
  }
  return `${num} views`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      path,
      step = 0,
      query: customQuery,
      maxResults = 5,
    }: {
      path?: 'student' | 'employee' | 'owner';
      step?: number;
      query?: string;
      maxResults?: number;
    } = body;

    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      // Return mock data if no API key
      return NextResponse.json({
        videos: getMockVideos(path, step),
        source: 'mock',
      });
    }

    // Determine search query
    let searchQuery: string;
    if (customQuery) {
      searchQuery = customQuery;
    } else if (path && SEARCH_QUERIES[path]?.[step]) {
      // Pick a random query from the options
      const queries = SEARCH_QUERIES[path][step];
      searchQuery = queries[Math.floor(Math.random() * queries.length)];
    } else {
      searchQuery = FALLBACK_QUERIES[Math.floor(Math.random() * FALLBACK_QUERIES.length)];
    }

    // Search YouTube
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', searchQuery);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', maxResults.toString());
    searchUrl.searchParams.set('relevanceLanguage', 'en');
    searchUrl.searchParams.set('safeSearch', 'strict');
    searchUrl.searchParams.set('videoEmbeddable', 'true');
    searchUrl.searchParams.set('key', apiKey);

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      console.error('YouTube search failed:', await searchResponse.text());
      return NextResponse.json({
        videos: getMockVideos(path, step),
        source: 'mock',
        error: 'YouTube API error',
      });
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: YouTubeSearchItem) => item.id.videoId).join(',');

    if (!videoIds) {
      return NextResponse.json({
        videos: getMockVideos(path, step),
        source: 'mock',
      });
    }

    // Get video details (duration, view count)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set('part', 'contentDetails,statistics');
    detailsUrl.searchParams.set('id', videoIds);
    detailsUrl.searchParams.set('key', apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData = await detailsResponse.json();

    // Map video details by ID
    const detailsMap = new Map<string, YouTubeVideoItem>();
    detailsData.items?.forEach((item: YouTubeVideoItem) => {
      detailsMap.set(item.id, item);
    });

    // Build video results
    const videos: VideoResult[] = searchData.items?.map((item: YouTubeSearchItem) => {
      const details = detailsMap.get(item.id.videoId);
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        duration: details ? parseDuration(details.contentDetails.duration) : undefined,
        viewCount: details ? formatViewCount(details.statistics.viewCount) : undefined,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    }) || [];

    return NextResponse.json({
      videos,
      source: 'youtube',
      query: searchQuery,
    });
  } catch (error) {
    console.error('Video search error:', error);
    return NextResponse.json({
      videos: getMockVideos(),
      source: 'mock',
      error: 'Failed to fetch videos',
    });
  }
}

// Mock videos for when API key isn't available
function getMockVideos(path?: string, step?: number): VideoResult[] {
  const mockData: Record<string, VideoResult[]> = {
    student: [
      { id: 'mock1', title: 'Terminal Basics for Beginners', thumbnail: '', channelTitle: 'Phazur', duration: '8:32', viewCount: '125K views', publishedAt: '', url: '#' },
      { id: 'mock2', title: 'Your First Command Line Commands', thumbnail: '', channelTitle: 'Phazur', duration: '5:45', viewCount: '89K views', publishedAt: '', url: '#' },
      { id: 'mock3', title: 'Navigate Files Like a Pro', thumbnail: '', channelTitle: 'Phazur', duration: '12:18', viewCount: '67K views', publishedAt: '', url: '#' },
      { id: 'mock4', title: 'Build Your Portfolio Project', thumbnail: '', channelTitle: 'Phazur', duration: '18:22', viewCount: '234K views', publishedAt: '', url: '#' },
    ],
    employee: [
      { id: 'mock1', title: 'Workflow Analysis 101', thumbnail: '', channelTitle: 'Phazur', duration: '10:15', viewCount: '45K views', publishedAt: '', url: '#' },
      { id: 'mock2', title: 'Build Your First Custom GPT', thumbnail: '', channelTitle: 'Phazur', duration: '15:32', viewCount: '312K views', publishedAt: '', url: '#' },
      { id: 'mock3', title: 'Email Automation with Zapier', thumbnail: '', channelTitle: 'Phazur', duration: '9:48', viewCount: '78K views', publishedAt: '', url: '#' },
      { id: 'mock4', title: 'Measure Your Automation ROI', thumbnail: '', channelTitle: 'Phazur', duration: '7:22', viewCount: '34K views', publishedAt: '', url: '#' },
    ],
    owner: [
      { id: 'mock1', title: 'Operations Audit Framework', thumbnail: '', channelTitle: 'Phazur', duration: '14:45', viewCount: '28K views', publishedAt: '', url: '#' },
      { id: 'mock2', title: 'AI Agent Architecture Design', thumbnail: '', channelTitle: 'Phazur', duration: '22:18', viewCount: '156K views', publishedAt: '', url: '#' },
      { id: 'mock3', title: 'Multi-Agent Orchestration', thumbnail: '', channelTitle: 'Phazur', duration: '19:33', viewCount: '89K views', publishedAt: '', url: '#' },
      { id: 'mock4', title: 'Scale Your AI Systems', thumbnail: '', channelTitle: 'Phazur', duration: '16:12', viewCount: '67K views', publishedAt: '', url: '#' },
    ],
  };

  if (path && mockData[path]) {
    return mockData[path];
  }

  return mockData.student;
}
