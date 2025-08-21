import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import AgentCard from '../AgentCard.svelte';
import type { Agent } from '@features/admin/types';

// Mock the i18n store
vi.mock('@ts/i18n', () => ({
  t: writable((key: string) => key),
}));

describe('AgentCard', () => {
  const mockAgent: Agent = {
    id: 1,
    code: 'test-agent',
    name: 'Test Agent',
    description: 'This is a test agent',
    version: '1.0',
    enable: true,
    isSystem: false,
    systemPrompt: 'You are a test agent',
    configuration: '{"useMemory": true}',
    modelId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render agent information', () => {
    const { container, getByText } = render(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    expect(container.querySelector('.agent-card')).toBeTruthy();
    expect(getByText('Test Agent')).toBeTruthy();
    expect(getByText('This is a test agent')).toBeTruthy();
    expect(getByText('test-agent')).toBeTruthy();
    expect(getByText('v1.0')).toBeTruthy();
  });

  it('should show system badge for system agents', () => {
    const systemAgent = { ...mockAgent, isSystem: true };
    const { container } = render(AgentCard, {
      props: {
        agent: systemAgent,
      },
    });

    const systemBadge = container.querySelector('.system-badge');
    expect(systemBadge).toBeTruthy();
    expect(systemBadge?.textContent).toBe('discussion.agent.system');
  });

  it('should show disabled badge for disabled agents', () => {
    const disabledAgent = { ...mockAgent, enable: false };
    const { container } = render(AgentCard, {
      props: {
        agent: disabledAgent,
      },
    });

    const disabledBadge = container.querySelector('.disabled-badge');
    expect(disabledBadge).toBeTruthy();
    expect(disabledBadge?.textContent).toBe('discussion.agent.disabled');
  });

  it('should be disabled when agent is disabled', () => {
    const disabledAgent = { ...mockAgent, enable: false };
    const { container } = render(AgentCard, {
      props: {
        agent: disabledAgent,
      },
    });

    const card = container.querySelector('.agent-card') as HTMLButtonElement;
    expect(card.disabled).toBe(true);
    expect(card.classList.contains('disabled')).toBe(true);
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    const { container } = render(AgentCard, {
      props: {
        agent: mockAgent,
        onClick,
      },
    });

    const card = container.querySelector('.agent-card') as HTMLElement;
    await fireEvent.click(card);

    expect(onClick).toHaveBeenCalledWith(mockAgent);
  });

  it('should not call onClick when disabled', async () => {
    const onClick = vi.fn();
    const disabledAgent = { ...mockAgent, enable: false };
    const { container } = render(AgentCard, {
      props: {
        agent: disabledAgent,
        onClick,
      },
    });

    const card = container.querySelector('.agent-card') as HTMLElement;
    await fireEvent.click(card);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should show selected state', () => {
    const { container } = render(AgentCard, {
      props: {
        agent: mockAgent,
        selected: true,
      },
    });

    const card = container.querySelector('.agent-card');
    expect(card?.classList.contains('selected')).toBe(true);
  });

  it('should show no description message when description is empty', () => {
    const agentWithoutDesc = { ...mockAgent, description: '' };
    const { getByText } = render(AgentCard, {
      props: {
        agent: agentWithoutDesc,
      },
    });

    expect(getByText('discussion.agent.noDescription')).toBeTruthy();
  });
});