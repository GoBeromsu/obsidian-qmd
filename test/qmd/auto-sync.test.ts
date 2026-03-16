import { afterEach, describe, expect, it, vi } from 'vitest';

import { AutoSyncController } from '../../src/qmd/auto-sync';

describe('AutoSyncController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces repeated dirty events into one update/embed run', async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    const controller = new AutoSyncController(100, {
      shouldRun: () => true,
      runUpdate: async () => {
        calls.push('update');
      },
      runEmbed: async () => {
        calls.push('embed');
      },
    });

    controller.markDirty();
    controller.markDirty();

    await vi.advanceTimersByTimeAsync(100);

    expect(calls).toEqual(['update', 'embed']);
  });

  it('runs exactly one follow-up pass when changes arrive during an active sync', async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    let releaseFirstUpdate = () => {};
    let updateRuns = 0;

    const controller = new AutoSyncController(50, {
      shouldRun: () => true,
      runUpdate: async () => {
        calls.push('update');
        updateRuns += 1;
        if (updateRuns === 1) {
          await new Promise<void>((resolve) => {
            releaseFirstUpdate = resolve;
          });
        }
      },
      runEmbed: async () => {
        calls.push('embed');
      },
    });

    controller.markDirty();
    await vi.advanceTimersByTimeAsync(50);

    controller.markDirty();
    releaseFirstUpdate();
    await vi.runAllTimersAsync();

    expect(calls).toEqual(['update', 'embed', 'update', 'embed']);
  });

  it('does not run embed when update fails', async () => {
    vi.useFakeTimers();
    const phases: string[] = [];
    const controller = new AutoSyncController(25, {
      shouldRun: () => true,
      runUpdate: async () => {
        throw new Error('update failed');
      },
      runEmbed: async () => {
        phases.push('embed');
      },
      onPhaseChange: (phase) => {
        phases.push(phase);
      },
    });

    controller.markDirty();
    await vi.advanceTimersByTimeAsync(25);

    expect(phases).toContain('syncing');
    expect(phases).toContain('error');
    expect(phases).not.toContain('embed');
    expect(phases).not.toContain('embedding');
  });
});
