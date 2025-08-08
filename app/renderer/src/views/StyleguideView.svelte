<script lang="ts">
  import Modal from '@components/Modal.svelte';
  let showModal = false;
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">Styleguide</h2>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="stack-md">
      <h3 class="text-lg font-semibold">Buttons</h3>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn--primary">Primary Button</button>
        <button class="btn btn--secondary">Secondary Button</button>
        <button class="btn btn--link">Link Button</button>
      </div>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">Inputs</h3>
      <div class="grid gap-3">
        <label class="field">
          <span class="field__label">Text</span>
          <input class="input" placeholder="Placeholder" />
          <span class="field__hint">This is a hint</span>
        </label>
        <label class="field field--invalid">
          <span class="field__label">Invalid</span>
          <input class="input" placeholder="Invalid input" />
          <span class="field__hint">Error message</span>
        </label>
      </div>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">Typography</h3>
      <p>Body text — Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
      <a href="#/styleguide" class="btn btn--link">Link</a>
      <ul class="list-disc pl-5">
        <li>List item one</li>
        <li>List item two</li>
      </ul>
    </div>

    <div class="stack-md">
      <h3 class="text-lg font-semibold">Modal</h3>
      <button class="btn btn--primary" on:click={() => (showModal = true)}>Open Modal</button>
    </div>
  </div>

  <div class="stack-md">
    <h3 class="text-lg font-semibold">Layout Helpers</h3>
    <div class="container-page" style="background: var(--color-surface); border: 1px dashed var(--color-border); padding: 1rem;">Container demo</div>
    <div class="stack-md" style="background: var(--color-surface); border: 1px dashed var(--color-border); padding: 1rem;">
      <div>Stack item A</div>
      <div>Stack item B</div>
      <div>Stack item C</div>
    </div>
  </div>

  <Modal open={showModal} onClose={() => (showModal = false)} title="Demo Modal">
    <p>Modal content goes here.</p>
  </Modal>
</section>



