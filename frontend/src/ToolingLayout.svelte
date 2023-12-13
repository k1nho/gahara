<script lang="ts">
  import { ScissorsIcon } from "@rgossiaux/svelte-heroicons/solid";
  import { toolingStore } from "./stores";

  const { editMode } = toolingStore;

  function handleEditMode() {
    if ($editMode === "cut") {
      editMode.set("timeline");
    } else {
      editMode.set("cut");
    }
  }
</script>

<div class=" w-full flex items-center p-2 justify-center">
  <div
    id="video-tooling"
    class="flex items-center justify-center bg-gblue0 rounded-md border-white border-2 p-2"
  >
    <button
      class="bg-gdark hover:bg-green2 px-2 py-1 rounded-md flex items-center gap-1 border-2 border-white transition ease-in-out duration-500"
      on:click={() => handleEditMode()}
    >
      <ScissorsIcon class="h-5 w-5 text-white" />
    </button>
  </div>
</div>
