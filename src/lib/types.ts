export type Platform = "youtube" | "twitch";

export type MediaKind =
  | "youtube-video"
  | "twitch-channel"
  | "twitch-vod"
  | "twitch-clip";

export type ParsedMedia =
  | { platform: "youtube"; kind: "youtube-video"; id: string; url: string }
  | { platform: "twitch"; kind: "twitch-channel"; id: string; url: string }
  | { platform: "twitch"; kind: "twitch-vod"; id: string; url: string }
  | { platform: "twitch"; kind: "twitch-clip"; id: string; url: string };

export type ParsedChannel =
  | {
      platform: "twitch";
      kind: "channel";
      id: string;
      displayName: string;
      url: string;
    }
  | {
      platform: "youtube";
      kind: "channel";
      id: string;
      displayName: string;
      url: string;
      handle?: string;
    };

export type LayoutId =
  | "1"
  | "2"
  | "2-stack"
  | "3-focus"
  | "3"
  | "4"
  | "6";

export type CellSource = ParsedMedia | null;

export interface ViewerCell {
  id: string;
  source: CellSource;
  label: string;
}

export interface TrackSizes {
  cols: number[];
  rows: number[];
}

export interface ViewerState {
  layoutId: LayoutId;
  cells: ViewerCell[];
  listeningCellId: string | null;
  sizesByLayout: Partial<Record<LayoutId, TrackSizes>>;
}

export type LiveStatus = "live" | "offline" | "unknown" | "not-checked";

export interface RosterEntry {
  id: string;
  platform: Platform;
  /** Twitch login or YouTube channel id */
  channelId: string;
  displayName: string;
  url: string;
  avatarUrl?: string;
  source: "manual" | "twitch-follow" | "youtube-sub";
  liveStatus: LiveStatus;
  liveTitle?: string;
  viewerCount?: number;
  /** Set when a YouTube live video id is known */
  liveVideoId?: string;
  lastCheckedAt?: number;
}

export interface TwitchStreamInfo {
  userLogin: string;
  userName: string;
  title: string;
  viewerCount: number;
  thumbnailUrl?: string;
}

export interface YoutubeLiveInfo {
  channelId: string;
  videoId: string;
  title: string;
}
