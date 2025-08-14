<script lang="ts">
  /**
   * Accessible, reusable progress bar.
   *
   * Props:
   * - value: current progress value (0..max)
   * - max: maximum value
   * - size: visual height variant
   * - color: visual color variant
   * - striped: show diagonal stripes on the bar
   * - animated: animate stripes; when indeterminate, animates the sliding bar
   * - indeterminate: unknown progress; ignores value and shows a looping bar
   * - showValue: render percent text (or slot) over the bar
   * - ariaLabel: accessible label for screen readers
   * - testId: optional data-testid for e2e/unit tests
   *
   * Slots:
   * - default: custom label content (shown when showValue=true)
   */
  export let value: number = 0;
  export let max: number = 100;
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let color: 'accent' | 'primary' | 'success' | 'warning' | 'danger' = 'accent';
  export let striped: boolean = false;
  export let animated: boolean = false;
  export let indeterminate: boolean = false;
  export let showValue: boolean = true;
  export let ariaLabel: string | undefined = undefined;
  export let testId: string | undefined = undefined;

  $: clamped = Math.max(0, Math.min(value ?? 0, max ?? 0));
  $: percent = max > 0 ? (clamped / max) * 100 : 0;
  $: percentRounded = Math.round(percent);
</script>

<div
  class="gc-progress gc-progress--{size} gc-progress--{color} {striped ? 'gc-progress--striped' : ''} {animated ? 'gc-progress--animated' : ''} {indeterminate ? 'gc-progress--indeterminate' : ''}"
  role="progressbar"
  aria-valuemin={indeterminate ? undefined : 0}
  aria-valuemax={indeterminate ? undefined : max}
  aria-valuenow={indeterminate ? undefined : clamped}
  aria-busy={indeterminate ? 'true' : undefined}
  aria-label={ariaLabel}
  data-testid={testId}
>
  <div class="gc-progress__track">
    <div class="gc-progress__bar" style:width={!indeterminate ? `${percent}%` : undefined}></div>
    {#if showValue}
      <div class="gc-progress__label">
        <slot>{percentRounded}%</slot>
      </div>
    {/if}
  </div>
  
</div>



