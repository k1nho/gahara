import { get, writable } from "svelte/store";
import type { main, video } from "../wailsjs/go/models";

export function createBooleanStore(initial: boolean) {
  const isOpen = writable(initial);
  const { set, update } = isOpen;
  return {
    isOpen,
    open: () => set(true),
    close: () => set(false),
    toggle: () => update((n) => !n),
  };
}

function createTwoPageRouterStore() {
  const { subscribe, set, update } = writable(false);

  const setVideoLayoutView = () => {
    set(true);
  };

  const setMainMenuView = () => {
    set(false);
  };

  return {
    subscribe,
    update,
    setVideoLayoutView,
    setMainMenuView,
  };
}

function createFilesytemStore() {
  const { subscribe, set, update } = writable<main.Video[]>([]);

  const addVideos = (videos: main.Video[]) => {
    // TODO: handle duplicated keys
    update((projectFiles) => (projectFiles = [...projectFiles, ...videos]));
  };

  const removeVideo = (fileName: string) => {
    update(
      (projectFiles) =>
        (projectFiles = projectFiles.filter(
          (video) => video.name !== fileName,
        )),
    );
  };

  const reset = () => {
    set([]);
  };

  return {
    subscribe,
    addVideos,
    removeVideo,
    reset,
  };
}

function createVideoTransferStore() {
  const video = writable<main.Video>(null);
  const { set } = video;

  function value(): main.Video {
    return get(video);
  }

  function setDraggedVideo(vid: main.Video) {
    set(vid);
  }

  return {
    setDraggedVideo,
    value,
  };
}

function createTracksStore() {
  const tracks = writable<video.VideoNode[][]>([]);
  const trackDuration = writable<number>(0.0);

  const { subscribe, set, update } = tracks;
  const { set: setTrackDuration, update: updateTrackDuration } = trackDuration;
  const addVideoToTrack = (id: number, video: video.VideoNode) => {
    // TODO: handle duplicated keys
    update((tracks) => {
      if (tracks.length === 0 || id > tracks.length) {
        tracks.push([video]);
      } else if (id >= 0 && id < tracks.length) {
        tracks[id] = [...tracks[id], video];
      }
      return tracks;
    });

    updateTrackDuration((tDuration) => (tDuration += video.end - video.start));
  };

  const removeAndAddIntervalToTrack = (
    id: number,
    pos: number,
    videoNodes: video.VideoNode[],
  ) => {
    update((tracks) => {
      if (pos < 0 || pos > tracks[0].length) {
        return tracks;
      }
      tracks[id].splice(pos, 1, ...videoNodes);
      return tracks;
    });
  };

  const removeVideoFromTrack = (id: number, videoNode: video.VideoNode) => {
    update((tracks) => {
      tracks[id] = tracks[0].filter((v) => v.id !== videoNode.id);
      return tracks;
    });
    updateTrackDuration(
      (tDuration) => (tDuration -= videoNode.end - videoNode.start),
    );
  };

  const resetTrackStore = () => {
    set([]);
    setTrackDuration(0);
  };

  return {
    subscribe,
    addVideoToTrack,
    removeVideoFromTrack,
    removeAndAddIntervalToTrack,
    trackDuration,
    resetTrackStore,
  };
}

function createVideoStore() {
  const source = writable<string>("");
  const duration = writable<number>(0);
  const currentTime = writable<number>(0.0);
  const volume = writable<number>(0.5);
  const paused = writable<boolean>(true);
  const ended = writable<boolean>(false);

  const { set: setDur } = duration;
  const { set: setCurT } = currentTime;
  const { set: setVol } = volume;
  const { set: setVideoSrc } = source;

  function viewVideo(video: main.Video) {
    setVideoSrc(`${video.filepath}/${video.name}${video.extension}`);
  }

  function setDuration(val: number) {
    setDur(val);
  }

  function getDuration(): number {
    return get(duration);
  }

  function setCurrentTime(val: number) {
    setCurT(val);
  }

  function getCurrentTime(): number {
    return get(currentTime);
  }

  function getVolume(): number {
    return get(volume);
  }

  function setVolume(val: number) {
    setVol(val);
  }

  function resetVideo() {
    setDur(0);
    setCurT(0.0);
    setVol(0.5);
  }

  return {
    source,
    duration,
    currentTime,
    paused,
    ended,
    viewVideo,
    setVideoSrc,
    setDuration,
    setCurrentTime,
    getDuration,
    getCurrentTime,
    getVolume,
    setVolume,
    resetVideo,
  };
}

function createVideoToolingStore() {
  // Edit modes
  const editMode = writable<string>("select");

  // Selected video information
  const videoNode = writable<video.VideoNode>(null);
  const videoNodePos = writable<number>(0);
  const videoNodeWidth = writable<number>(1);
  const { set: setVideoNode } = videoNode;
  const { set: setVideoNodePos } = videoNodePos;
  const { set: setVideoNodeWidth } = videoNodeWidth;

  // Cut and range box operations
  const cutStart = writable<number>(0.0);
  const cutEnd = writable<number>(0.0);
  const clipStart = writable<number>(0.0);
  const clipEnd = writable<number>(0.0);
  const isMovingCutRangeBox = writable<boolean>(false);
  const boxLeftBound = writable<number>(0);
  const boxRightBound = writable<number>(0);

  const { set: setCutStart } = cutStart;
  const { set: setCutEnd } = cutEnd;
  const { set: setEditMode } = editMode;
  const { set: setClipStart } = clipStart;
  const { set: setClipEnd } = clipEnd;
  const { set: moveCutRangeBox } = isMovingCutRangeBox;
  const { set: setBoxLeftBound } = boxLeftBound;
  const { set: setBoxRightBound } = boxRightBound;

  // Playhead
  const playheadPos = writable<number>(0.0);
  const isMovingPlayhead = writable<boolean>(false);

  const { set: movePlayhead } = isMovingPlayhead;
  const { set: setPlayheadPos, update: updatePlayheadPos } = playheadPos;

  function resetToolingStore() {
    setVideoNode(null);
    setVideoNodePos(0);
    setVideoNodeWidth(1);
    setCutStart(0.0);
    setCutEnd(0.0);
    setClipStart(0.0);
    setClipEnd(0.0);
    setBoxLeftBound(0);
    setBoxRightBound(0);
    setPlayheadPos(0);
    setEditMode("select");
  }

  return {
    editMode,
    cutStart,
    setCutStart,
    cutEnd,
    setCutEnd,
    videoNode,
    setVideoNode,
    videoNodePos,
    setVideoNodePos,
    videoNodeWidth,
    setVideoNodeWidth,
    clipStart,
    clipEnd,
    boxLeftBound,
    boxRightBound,
    setBoxLeftBound,
    setBoxRightBound,
    movePlayhead,
    playheadPos,
    setPlayheadPos,
    updatePlayheadPos,
    isMovingPlayhead,
    isMovingCutRangeBox,
    moveCutRangeBox,
    resetToolingStore,
  };
}

export const router = createTwoPageRouterStore();
export const videoFiles = createFilesytemStore();
export const trackStore = createTracksStore();
export const projectName = writable("");
export const draggedVideo = createVideoTransferStore();
export const videoStore = createVideoStore();
export const toolingStore = createVideoToolingStore();
