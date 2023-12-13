<script lang="ts">
  import TimelineArrow from "../icons/TimelineArrow.svelte";
  import { dropzone } from "../lib/dnd";
  import { trackStore, selectedTrack } from "../stores";
  import { onDestroy } from "svelte";
  import type { main } from "wailsjs/go/models";
  import { GenerateThumbnail } from "../../wailsjs/go/main/App";
  import { videoStore, toolingStore } from "../stores";

  const { getDuration, currentTime } = videoStore;
  const { cutStart, cutEnd, resetTooling, editMode } = toolingStore;

  let hoverPos = 0;
  let selectedID = 0;
  let moveTimeline = false;
  let moveCutRangeBox = false;
  let timestamp = new Date().getTime();
  let trackNode: HTMLDivElement;
  let cutRangeBox: HTMLDivElement;
  let cutRangeSide: "left" | "right" | "middle" | "none";

  $: {
    if (trackNode !== undefined && trackNode !== null) {
      hoverPos = ($currentTime / getDuration()) * trackNode.clientWidth;
    }
  }

  function viewVideo(video: main.Video) {
    selectedTrack.set(`${video.filepath}/${video.name}${video.extension}`);
  }

  function loadThumbnail(track: main.Video) {
    return `${track.filepath}/${track.name}.png`;
  }

  function createThumbnail(track: main.Video) {
    GenerateThumbnail(`${track.filepath}/${track.name}${track.extension}`)
      .then(() => (timestamp = new Date().getTime()))
      .catch((e) => console.log(e));
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
        moveTimelineBar();
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
  ) {
    switch ($editMode) {
      case "timeline":
        handleTimelineMove(e);
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
        stopTimelineBar();
        break;
      case "cut":
        stopCutRange();
        break;
      default:
    }
  }

  function moveTimelineBar() {
    moveTimeline = true;
  }

  function stopTimelineBar() {
    moveTimeline = false;
  }

  function handleTimelineMove(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
  ) {
    if (moveTimeline) {
      hoverPos = Math.min(e.clientX, getTrackWidth());
      currentTime.set((hoverPos / trackNode.clientWidth) * getDuration());
    }
  }

  function setCutSideDragged(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
  ) {
    e.preventDefault();
    e.stopPropagation(); // Stop the event from bubbling up
    const { clientX } = e;
    const { left, width } = cutRangeBox.getBoundingClientRect();

    if (clientX <= left + width / 3) {
      cutRangeSide = "left";
    } else if (clientX >= left + (2 * width) / 3) {
      cutRangeSide = "right";
    } else {
      cutRangeSide = "middle";
    }
    moveCutRangeBox = true;
  }

  function stopCutRange() {
    moveCutRangeBox = false;
  }

  function adjustCutRange(
    e: MouseEvent & {
      currentTarget: EventTarget & HTMLDivElement;
    },
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (moveCutRangeBox) {
      const cutRangeBoxStyle = getComputedStyle(cutRangeBox);
      const curLeft = parseFloat(cutRangeBoxStyle.left);
      const curWidth = parseFloat(cutRangeBoxStyle.width);
      switch (cutRangeSide) {
        case "left":
          const newWidthLeft = curWidth + (curLeft - e.clientX);
          const newLeftPos = Math.max(
            0,
            Math.min(e.clientX, curLeft + curWidth, getTrackWidth() - curWidth),
          );
          cutRangeBox.style.width = `${newWidthLeft}px`;
          cutRangeBox.style.left = `${newLeftPos}px`;
          break;
        case "right":
          const newWidthRight = Math.min(
            e.clientX - curLeft,
            getTrackWidth() - curLeft,
          );
          cutRangeBox.style.width = `${newWidthRight}px`;
          break;
        case "middle":
          const cutRangeBoxPos = curLeft + (e.movementX || 0);
          const pos = Math.max(
            0,
            Math.min(cutRangeBoxPos, getTrackWidth() - curWidth),
          );
          cutRangeBox.style.left = `${pos}px`;
          break;
        default:
      }
    }
  }

  onDestroy(() => {
    resetTooling();
    trackStore.reset();
    hoverPos = 0;
  });
</script>

<div
  class="timeline h-full w-full bg-gdark border-t-2 border-t-white flex flex-col gap-4 pt-4 pb-4 px-1 relative"
  use:dropzone={{}}
  on:mousedown={(e) => handleEditModeMouseDown(e)}
  on:mousemove={(e) => handleEditModeMouseMove(e)}
  on:mouseup={() => handleEditModeMouseUp()}
>
  {#if $trackStore.length <= 0}
    <div class="flex justify-center items-center">
      <p class="text-white text-4xl font-semibold select-none">
        Drag And Drop Video Clips
      </p>
    </div>
  {:else if $editMode === "timeline"}
    <div
      class="absolute top-0 left-0 h-full w-3 z-10"
      style={`left: ${hoverPos}px`}
    >
      <TimelineArrow />
    </div>
  {/if}

  <!-- VIDEO TRACKS -->
  <!-- TODO Create an actual id for a track -->
  {#each $trackStore as track, id (id)}
    <div class="w-fit h-28 flex items-center relative" id={`track-${id}`}>
      {#if $editMode === "cut"}
        <div
          class="absolute border-yellow-500 border-4 rounded-md h-full w-full cursor-grab"
          bind:this={cutRangeBox}
          id="cut-range"
        ></div>
      {/if}

      {#each track as video (video.filepath + video.name)}
        <div
          class="h-28 bg-teal rounded-md border-white border-2 cursor-pointer"
          id={`track-node-${video.name}`}
          on:click={() => viewVideo(video)}
          bind:this={trackNode}
        >
          <img
            src={loadThumbnail(video) + `?${timestamp}`}
            alt={`video: ${video.name}`}
            class="h-full w-full select-none"
            draggable={false}
            on:error={() => createThumbnail(video)}
          />
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
