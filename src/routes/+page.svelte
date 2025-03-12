<script lang="ts">
    import { writable } from 'svelte/store';
    
    let validFiles = writable<File[]>([]);
    let dragOver = false;
    let isLoading = writable(false);
    let generatedImageUrl = writable<string | null>(null);
    let transcript = writable('');

    function handleFiles(event: Event) {
        const fileList = (event.target as HTMLInputElement).files;
        if (fileList) {
            const newFiles = Array.from(fileList).filter(file => {
                const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
                const isValidSize = file.size <= 10 * 1024 * 1024;
                return isValidType && isValidSize;
            });
            validFiles.update(currentFiles => [...currentFiles, ...newFiles]);
        }
    }

    function removeFile(index: number) {
        validFiles.update(currentFiles => {
            currentFiles.splice(index, 1);
            return currentFiles;
        });
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        dragOver = true;
    }

    function handleDragLeave() {
        dragOver = false;
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        dragOver = false;
        if (event.dataTransfer?.files) {
            const fileList = event.dataTransfer.files;
            handleFiles({ target: { files: fileList } } as unknown as Event);
        }
    }

    function getImageUrl(file: File): string {
        return URL.createObjectURL(file);
    }

    async function generateImages() {
        isLoading.set(true);
        const filesArray = $validFiles;
        const formData = new FormData();
        filesArray.forEach(file => formData.append('images', file));
		formData.append('transcript',$transcript)

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData
            });
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            generatedImageUrl.set(url);
            alert('Images generated successfully!');
            // Log the result
            // console.log('Generated image URL:', url);
        } catch (error) {
            console.error('Error generating images:', error);
        } finally {
            isLoading.set(false);
        }
    }

    function downloadImage() {
        const url = $generatedImageUrl;
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'generated-image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
</script>

<svelte:head>
    <title>Home</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<section class="container mx-auto max-w-lg p-4">
    <div class="mb-4">
        <label for="description" class="block text-gray-700 text-sm font-bold mb-2">Your Story:</label>
        <textarea id="description" rows="4" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" bind:value={$transcript}></textarea>
    </div>
    {#if $validFiles.length < 3}
    <div
        class="dropzone relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors duration-300 ease-in-out"
        class:drag-over={dragOver}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        role="button"
        tabindex="0"
        aria-label="File dropzone"
    >
        <input
            type="file"
            name="image"
            accept=".jpg,.jpeg,.png"
            multiple
            on:change={handleFiles}
            class="file-input absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        >
        <div class="dropzone-content pointer-events-none">
            <p>Drag and drop images here or click to browse</p>
            <small class="text-gray-600">Supported formats: JPG, PNG (max 10MB)</small>
        </div>
    </div>
    {/if}
    {#if $validFiles.length > 0 && !$isLoading}
        <div class="file-list mt-4">
            {#each $validFiles as file, index}
                <div class="file-item flex items-center p-2 bg-gray-100 rounded mb-2">
                    <span class="file-name flex-1 mr-4">{file.name}</span>
                    <span class="file-size text-gray-600 mr-4">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button class="delete-btn text-red-500 text-xl" on:click={() => removeFile(index)}>×</button>
                </div>
            {/each}
        </div>
        <div class="image-previews flex flex-wrap gap-4 mt-4">
            {#each $validFiles as file}
                <img src={getImageUrl(file)} alt={file.name} class="image-preview w-full max-w-xs h-24 object-cover rounded" />
            {/each}
        </div>
        <button class="generate-btn block mx-auto mt-4 px-4 py-2 bg-blue-500 text-white rounded" on:click={generateImages}>
            {#if $generatedImageUrl} Regenerate {:else} Generate {/if}
        </button>
    {/if}
    {#if $isLoading}
        <div class="loading-placeholder w-full h-64 bg-gray-400 rounded mt-4 animate-pulse flex items-center justify-center">
            <div class="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
        </div>
    {/if}
    {#if $generatedImageUrl}
        <div class="generated-image text-center mt-4">
            <img src={$generatedImageUrl} alt="Generated" class="max-w-full rounded" />
            <button class="download-btn block mx-auto mt-4 px-4 py-2 bg-green-500 text-white rounded" on:click={downloadImage}>
                Download Image
            </button>
        </div>
    {/if}
</section>

<style>
    .drag-over {
        @apply border-gray-600 bg-gray-100;
    }

    .loader {
        @apply border-4 border-gray-200 border-t-4 border-t-blue-500 rounded-full w-12 h-12 animate-spin;
    }
</style>