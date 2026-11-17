import { ClassroomError } from '../../data/classroom.ts';

/** Session storage can be cloned by Duplicate Tab; a browser lock prevents sharing its lease. */
export async function claimClassroomTab(userId: string): Promise<{ release: () => void; canResume: boolean }> {
  if (typeof window === 'undefined') return { release: () => {}, canResume: true };
  // Without an exclusive lock a duplicated tab may inherit sessionStorage. Never reuse
  // that lease; the server rejects the new lease until the previous one expires.
  if (typeof navigator === 'undefined' || !navigator.locks) return { release: () => {}, canResume: false };
  return new Promise((resolve, reject) => {
    void navigator.locks.request(`classroom:${userId}`, { ifAvailable: true }, async lock => {
      if (!lock) {
        reject(new ClassroomError('CONNECTION_ACTIVE', 'Sınıf başka bir sekmede açık. Önce oradan ayrılın.'));
        return;
      }
      await new Promise<void>(release => resolve({ release, canResume: true }));
    }).catch(reject);
  });
}
