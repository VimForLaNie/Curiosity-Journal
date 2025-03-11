<script lang="ts">
	import { FileDropzone } from '@skeletonlabs/skeleton';

	let files: FileList;
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<FileDropzone name="input_images" bind:files={files}>
		<svelte:fragment slot="message">Drag Your Images Here</svelte:fragment>
		<svelte:fragment slot="meta">(or click to browse files)</svelte:fragment>
	</FileDropzone>
</section>