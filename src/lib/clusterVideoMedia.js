/** Playable URL for a cluster video row (relative media paths resolve against the API). */
import { resolveConsumerMediaUrl } from "./consumerApi.js";
import { stripMediaUrlFragment } from "./menuplyLiveFeedControl.js";

export function clusterVideoSrc(video) {
  if (!video?.video_url) return "";
  return stripMediaUrlFragment(resolveConsumerMediaUrl(video.video_url) || video.video_url);
}
