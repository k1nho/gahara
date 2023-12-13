<script lang="ts">
  import { dropzone } from "../lib/dnd";
  import { onDestroy } from "svelte";
  import type { video } from "wailsjs/go/models";
  import { videoStore, toolingStore, trackStore } from "../stores";
  import Playhead from "../icons/Playhead.svelte";

  const { setVideoSrc, currentTime } = videoStore;
  const {
    cutStart,
    cutEnd,
    setCutEnd,
    resetToolingStore,
    editMode,
    videoNode,
    setVideoNode,
    setVideoNodePos,
    setVideoNodeWidth,
    clipStart,
    clipEnd,
    playheadPos,
    setPlayheadPos,
    isMovingPlayhead,
    isMovingCutRangeBox,
    moveCutRangeBox,
    movePlayhead,
    boxLeftBound,
    boxRightBound,
    setBoxLeftBound,
    setBoxRightBound,
  } = toolingStore;
  const { trackDuration, resetTrackStore } = trackStore;

  let selectedID = 0;
  let trackNode: HTMLDivElement;
  let cutRangeBox: HTMLDivElement;
  let cutRangeSide: "left" | "right" | "middle" | "none";

  function formatSecondsToHMS(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds =
      remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  function getTrackWidth() {
    const track = document.getElementById(`track-${selectedID}`);
    return track.clientWidth;
  }

  function handleEditModeMouseDown(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
  ) {
    switch ($editMode) {
      case "timeline":
        movePlayhead(true);
        break;
      case "cut":
        setCutSideDragged(e);
        break;
      default:
    }
  }

  function handleEditModeMouseMove(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
    pos: number,
    tVideo: video.VideoNode,
  ) {
    switch ($editMode) {
      case "timeline":
        handleTimelineMove(e, pos, tVideo);
        break;
      case "cut":
        adjustCutRange(e);
        break;
      default:
    }
  }

  function handleEditModeMouseUp() {
    switch ($editMode) {
      case "timeline":
        movePlayhead(false);
        break;
      case "cut":
        moveCutRangeBox(false);
        break;
      default:
    }
  }

  function handleTimelineMove(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
    pos: number,
    tVideo: video.VideoNode,
  ) {
    if ($isMovingPlayhead) {
      setPlayheadPos(Math.min(e.clientX, getTrackWidth()));
      updateVideoTime(e, pos, tVideo);
    }
  }

  function setCutSideDragged(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
  ) {
    e.preventDefault();
    e.stopPropagation();
    const { clientX } = e;
    const { left, width } = cutRangeBox.getBoundingClientRect();

    if (clientX <= left + width / 3) {
      cutRangeSide = "left";
    } else if (clientX >= left + (2 * width) / 3) {
      cutRangeSide = "right";
    } else {
      cutRangeSide = "middle";
    }
    moveCutRangeBox(true);
  }

  function adjustCutRange(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
  ) {
    e.preventDefault();
    e.stopPropagation();

    if ($isMovingCutRangeBox) {
      const cutRangeBoxStyle = getComputedStyle(cutRangeBox);
      const boxLeft = parseFloat(cutRangeBoxStyle.left);
      const boxWidth = parseFloat(cutRangeBoxStyle.width);

      switch (cutRangeSide) {
        case "left":
          let newWidthLeft: number;
          if (e.clientX <= $boxLeftBound) newWidthLeft = boxWidth;
          else newWidthLeft = boxWidth + (boxLeft - e.clientX);
          const newLeftPos = Math.max(
            $boxLeftBound,
            Math.min(e.clientX, $boxRightBound - boxWidth),
          );
          cutRangeBox.style.left = `${newLeftPos}px`;
          cutRangeBox.style.width = `${newWidthLeft}px`;
          const start = (newLeftPos / trackNode.clientWidth) * $trackDuration;
          currentTime.set(start);
          cutStart.set(start);
          break;
        case "right":
          const newWidthRight = Math.min(
            e.clientX - boxLeft,
            $boxRightBound - boxLeft,
          );
          cutRangeBox.style.width = `${newWidthRight}px`;
          const endCut =
            ((boxLeft + newWidthRight) / getTrackWidth()) * $trackDuration;
          currentTime.set(endCut);
          cutEnd.set(endCut);
          break;
        case "middle":
          const cutRangeBoxPos = boxLeft + (e.movementX || 0);
          const pos = Math.max(
            $boxLeftBound,
            Math.min(cutRangeBoxPos, $boxRightBound - boxWidth),
          );
          cutRangeBox.style.left = `${pos}px`;
          const startTime = (pos / trackNode.clientWidth) * $trackDuration;
          currentTime.set(startTime);
          cutStart.set(startTime);
          break;
        default:
      }
    }
  }

  function handleVideoNode(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
    pos: number,
    video: video.VideoNode,
  ) {
    switch ($editMode) {
      default:
        if (e.currentTarget !== null) {
          setBoxLeftBound(e.currentTarget.offsetLeft);
          setBoxRightBound(
            e.currentTarget.offsetLeft + e.currentTarget.clientWidth,
          );
          setVideoNodeWidth(e.currentTarget.clientWidth);
        }
        currentTime.set(video.start);
        clipStart.set(video.start);
        clipEnd.set(video.end);
        setVideoNode(video);
        setVideoNodePos(pos);
        setVideoSrc(video.rid);
    }
  }

  function updateVideoTime(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
    pos: number,
    video: video.VideoNode,
  ) {
    const clipWidth = e.currentTarget.getBoundingClientRect().width;
    const mousePos = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const time =
      video.start + (video.end - video.start) * (mousePos / clipWidth);
    setVideoSrc(video.rid);
    setVideoNodePos(pos);
    setVideoNode(video);
    currentTime.set(time);
    setCutEnd(time);
  }

  onDestroy(() => {
    resetTrackStore();
    resetToolingStore();
  });
</script>

<div
  class="timeline h-full w-full bg-gdark border-t-2 border-t-white flex flex-col gap-4 pt-4 pb-4 px-1 relative"
  use:dropzone={{}}
  on:mouseup={() => handleEditModeMouseUp()}
>
  {#if $trackStore.length <= 0}
    <div class="flex justify-center items-center">
      <p class="text-white text-4xl font-semibold select-none">
        Drag And Drop Video Clips
      </p>
    </div>
  {:else}
    <div class="flex justify-center select-none">
      {formatSecondsToHMS($currentTime)}: {formatSecondsToHMS($trackDuration)}
    </div>
    {#if $editMode === "timeline"}
      <div
        class="absolute top-0 left-0 h-full w-3 z-10"
        style={`left: ${$playheadPos}px`}
      >
        <Playhead />
      </div>
    {/if}
  {/if}

  <!-- VIDEO TRACKS -->
  <!-- TODO Create an actual id for a track -->
  {#each $trackStore as track, id (id)}
    <div
      bind:this={trackNode}
      class=" h-28 flex relative bg-red-500"
      id={`track-${id}`}
    >
      <!-- Video Track -->
      {#each track as tVideo, pos (tVideo.id)}
        <!-- Video Nodes of this track -->
        {#if $editMode === "cut" && $videoNode.id === tVideo.id}
          <div
            class="absolute border-yellow-500 border-4 rounded-md h-full cursor-grab"
            style={`width: ${
              ((tVideo.end - tVideo.start) / $trackDuration) * 100
            }%; left: ${$boxLeftBound}px`}
            bind:this={cutRangeBox}
            id="cut-range"
          ></div>
        {/if}
        {#if $editMode === "remove" && $videoNode.id === tVideo.id}
          <div
            class="absolute border-gred border-4 rounded-md h-full"
            style={`width: ${
              ((tVideo.end - tVideo.start) / $trackDuration) * 100
            }%; left: ${$boxLeftBound}px`}
            id="remove-range"
          ></div>
        {/if}
        <div
          class="h-full bg-gblue0 border-white border-2 cursor-pointer select-none"
          style={`width: ${
            ((tVideo.end - tVideo.start) / $trackDuration) * 100
          }%`}
          on:click={(e) => handleVideoNode(e, pos, tVideo)}
          on:mousemove={(e) => {
            handleEditModeMouseMove(e, pos, tVideo);
          }}
          on:mousedown={(e) => {
            handleEditModeMouseDown(e);
          }}
          id={`videoNode-${tVideo.id}`}
        >
          node: {tVideo.start}: {tVideo.end}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .timeline:global(.droppable) {
    border-width: 2px;
    border-color: rgb(122, 162, 247);
  }

  .timeline:global(.droppable) * {
    pointer-events: none;
  }
</style>
