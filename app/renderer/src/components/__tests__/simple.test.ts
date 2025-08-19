import { describe, test, expect } from 'vitest';
import ProgressBar from '../ProgressBar.svelte';

describe('Simple Svelte 5 Test', () => {
  test('should render ProgressBar component with compatibility mode', () => {
    // Create a container manually
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    let component: any;
    
    try {
      // Use Svelte 4 compatible API (enabled by compatibility.componentApi: 4)
      component = new ProgressBar({
        target: container,
        props: { progress: 50 }
      });
      
      expect(container).toBeTruthy();
      expect(container.innerHTML).toContain('gc-progress');
      
      // Clean up
      component.$destroy();
      document.body.removeChild(container);
    } catch (error) {
      // Clean up on error
      if (component && component.$destroy) {
        try { component.$destroy(); } catch {}
      }
      if (container.parentNode) {
        document.body.removeChild(container);
      }
      throw error;
    }
  });
});