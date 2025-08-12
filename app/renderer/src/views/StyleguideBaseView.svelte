<script lang="ts">
  import { t as tStore } from '@ts/i18n/store';
  let t: (key: string, params?: Record<string, string | number>) => string = (k) => k;
  const unsubT = tStore.subscribe((fn) => (t = fn));
  import { onDestroy } from 'svelte';
  onDestroy(() => unsubT());
</script>

<section class="container-page stack-lg">
  <h2 class="text-2xl font-bold">{t('pages.styleguide.base.title')}</h2>

  <div class="stack-lg">
    <!-- Tokens: Colors -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.colors')}</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="demo-box">
          <div class="h-10 w-full" style="background: var(--color-primary);"></div>
          <div class="text-sm mt-1">primary</div>
        </div>
        <div class="demo-box">
          <div class="h-10 w-full" style="background: var(--color-accent);"></div>
          <div class="text-sm mt-1">accent</div>
        </div>
        <div class="demo-box">
          <div class="h-10 w-full" style="background: var(--color-bg);"></div>
          <div class="text-sm mt-1">bg</div>
        </div>
        <div class="demo-box">
          <div class="h-10 w-full" style="background: var(--color-surface);"></div>
          <div class="text-sm mt-1">surface</div>
        </div>
        <div class="demo-box">
          <div class="h-10 w-full" style="background: var(--color-border);"></div>
          <div class="text-sm mt-1">border</div>
        </div>
      </div>
    </div>

    <!-- Tokens: Spacing & Radii -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.spacingRadii')}</h3>
      <div class="flex flex-wrap items-center gap-4">
        <div class="demo-box" style="padding: 0.25rem">4px</div>
        <div class="demo-box" style="padding: 0.5rem">8px</div>
        <div class="demo-box" style="padding: 0.75rem">12px</div>
        <div class="demo-box" style="padding: 1rem">16px</div>
        <div class="demo-box" style="padding: 1.5rem">24px</div>
      </div>
      <div class="flex flex-wrap items-center gap-4 mt-2">
        <div class="demo-box" style="border-radius: 0">radius 0</div>
        <div class="demo-box" style="border-radius: var(--radius-md)">radius var(--radius-md)</div>
      </div>
    </div>

    <!-- Tokens: Shadows -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.shadows')}</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="demo-box" style="box-shadow: var(--shadow-sm)">shadow-sm</div>
        <div class="demo-box" style="box-shadow: var(--shadow-md)">shadow-md</div>
      </div>
    </div>

    <!-- Tokens: Motion -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.motion')}</h3>
      <div class="flex items-center gap-4">
        <div class="demo-box transition-transform" style="transition: transform var(--duration-fast) var(--ease-standard)">duration-fast</div>
        <div class="demo-box transition-transform" style="transition: transform var(--duration-normal) var(--ease-standard)">duration-normal</div>
        <div class="demo-box transition-transform" style="transition: transform var(--duration-slow) var(--ease-standard)">duration-slow</div>
      </div>
    </div>

    <!-- Text Section -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.textSection')}</h3>
      <div class="stack-sm">
        <h1>H1 — {t('pages.styleguide.base.example')}</h1>
        <h2>H2 — {t('pages.styleguide.base.example')}</h2>
        <h3>H3 — {t('pages.styleguide.base.example')}</h3>
        <h4>H4 — {t('pages.styleguide.base.example')}</h4>
        <h5>H5 — {t('pages.styleguide.base.example')}</h5>
        <h6>H6 — {t('pages.styleguide.base.example')}</h6>
        <p>{t('pages.styleguide.base.body')}</p>
        <p><strong>{t('pages.styleguide.base.bold')}</strong> · <em>{t('pages.styleguide.base.italic')}</em></p>
        <ul class="list-disc pl-5">
          <li>{t('pages.styleguide.base.listItemA')}</li>
          <li>{t('pages.styleguide.base.listItemB')}</li>
          <li>{t('pages.styleguide.base.listItemC')}</li>
        </ul>
        <ol class="list-decimal pl-5">
          <li>{t('pages.styleguide.base.listItemA')}</li>
          <li>{t('pages.styleguide.base.listItemB')}</li>
          <li>{t('pages.styleguide.base.listItemC')}</li>
        </ol>
      </div>
    </div>

    <!-- Icon Section -->
    <div class="stack-md">
      <h3 class="text-lg font-semibold">{t('pages.styleguide.base.iconSection')}</h3>
      <div class="flex flex-wrap gap-3 items-center">
        <span class="inline-flex items-center gap-2 px-2 py-1 border rounded">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          <span>{t('pages.styleguide.base.iconExample')}</span>
        </span>
        <button class="btn btn--primary inline-flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          <span>{t('pages.styleguide.base.iconInButton')}</span>
        </button>
        <a class="btn btn--link inline-flex items-center gap-2" href="#/test/styleguide/base">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16"/></svg>
          <span>{t('pages.styleguide.base.iconInLink')}</span>
        </a>
      </div>
    </div>
  </div>
</section>


