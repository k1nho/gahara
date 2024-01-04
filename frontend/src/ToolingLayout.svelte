<script lang="ts">
  import {
    ScissorsIcon,
    CheckIcon,
    VideoCameraIcon,
    HandIcon,
    XIcon,
  } from "@rgossiaux/svelte-heroicons/solid";
  import { toolingStore, trackStore, selectedTrack } from "./stores";
  import { TrimVideoInterval } from "../wailsjs/go/main/App";
  import type { main } from "wailsjs/go/models";

  const { editMode, cutStart, cutEnd } = toolingStore;

  let executeEdit = false;

  $: {
    executeEdit = $editMode !== "select" ? true : false;
  }

  function setEditMode(mode: string) {
    editMode.set(mode);
  }

  function handleEditAction() {
    switch ($editMode) {
      case "cut":
        const interval: main.Interval = { start: $cutStart, end: $cutEnd };
        TrimVideoInterval($selectedTrack, interval)
          .then(() => editMode.set("select"))
          .catch(console.log);
        break;
      default:
    }
  }
</script>

<div class=" w-full flex items-center p-2 justify-center">
  <div
    id="video-tooling"
    class="flex items-center justify-center bg-gblue0 rounded-md border-white border-2 p-2 gap-2"
  >
    {#if executeEdit && $editMode !== "timeline"}
      <button
        class="bg-ggreen px-2 py-1 rounded-md flex items-center border-2 border-white"
        on:click={() => handleEditAction()}
      >
        <CheckIcon class="h-5 w-5" />
      </button>
      <button
        class="bg-gred1 px-2 py-1 rounded-md flex items-center border-2 border-white"
        on:click={() => setEditMode("select")}
      >
        <XIcon class="h-5 w-5" />
      </button>
    {/if}
    <button
      class="bg-gdark px-2 py-1 rounded-md flex items-center gap-1 border-2 border-white"
      on:click={() => setEditMode("select")}
    >
      <HandIcon class="h-5 w-5 text-white" />
    </button>

    <button
      class="bg-gdark px-2 py-1 rounded-md flex items-center gap-1 border-2 border-white"
      on:click={() => setEditMode("timeline")}
    >
      <VideoCameraIcon class="h-5 w-5 text-white" />
    </button>
    <button
      class="bg-gdark px-2 py-1 rounded-md flex items-center gap-1 border-2 border-white"
      disabled={$trackStore.length <= 0}
      on:click={() => {
        setEditMode("cut");
      }}
    >
      <ScissorsIcon class="h-5 w-5 text-white" />
    </button>
  </div>
</div>
