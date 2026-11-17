// Real RPC load test. Never reads .env or chooses a project implicitly.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PilotClient, readPilotConfig, delay, percentile } from './classroom-load-client.ts';
import { joinPilotRoom, signInPilotClients } from './classroom-load-session.ts';

async function main(): Promise<void> {
  const config = await readPilotConfig();
  const durationSeconds = Number(process.env.CLASSROOM_TEST_DURATION_SECONDS ?? 7200);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 90 || durationSeconds > 14400) {
    throw new Error('Test duration must be between 90 and 14400 seconds (default 7200).');
  }
  const clients = config.accounts.map(account => new PilotClient(config,account));
  console.log('Staged authentication; room joins will still start simultaneously.');
  const authenticationRateLimits = await signInPilotClients(clients,delay);
  console.log(`Authentication HTTP 429 responses during setup: ${authenticationRateLimits}`);
  const roomName = `PILOT-${randomUUID().slice(0,12)}`;
  const { joined, roomId, host } = await joinPilotRoom(clients, roomName);
  const students = clients.filter(client => client !== host);
  const roomArgs = (client: PilotClient) => ({ p_room_id: roomId, p_connection_id: client.connectionId });
  const notificationMs: number[] = [];
  const offlineMs: number[] = [];
  const expected = new Map<string,{ visible: boolean; answer: boolean | null; questionId: string }>();
  const transitions = new Map<string,number>();
  const seen = new Set(joined.flatMap(snapshot => snapshot.events.map(event => event.id)));
  let eventCursor = joined.flatMap(snapshot => snapshot.events).reduce(
    (last, event) => BigInt(event.id) > last ? BigInt(event.id) : last, 0n);
  let failures = 0;
  let completed = false;
  const started = Date.now();
  const stopAt = started + durationSeconds * 1000;
  let lastReportAt = started;
  let lastSeenStudentAt=started;
  let offlineBaseline: number | null = null;
  const captureEvents = (snapshot: typeof joined[number]): void => {
    for (const event of snapshot.events) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      if (BigInt(event.id) > eventCursor) eventCursor = BigInt(event.id);
      const key = `${event.userId}:${event.type}`;
      const sentAt = transitions.get(key);
      if (sentAt !== undefined) { notificationMs.push(Date.now()-sentAt); transitions.delete(key); }
      if (event.type === 'OFFLINE' && event.userId === students.at(-1)?.userId) {
        if (offlineBaseline !== null) offlineMs.push(Date.now()-offlineBaseline);
      }
    }
  };
  try {
    await assert.rejects(students[0].rpc('publish_room_announcement',{ ...roomArgs(students[0]), p_text:'forged' }),/FORBIDDEN/);
    await assert.rejects(students[0].rpc('close_classroom_room',roomArgs(students[0])),/FORBIDDEN/);
    await assert.rejects(students[0].join(roomName,roomId,randomUUID()),/CONNECTION_ACTIVE/);
    await host.rpc('publish_room_announcement',{ ...roomArgs(host),p_text:'Pilot bağlantı denemesi' });
    await host.join(roomName,roomId); // same connection resumes, never creates new room
    const loops = clients.map(async client => {
      const isHost = client === host;
      const index = students.indexOf(client);
      let ticks = 0;
      let visible = true;
      let lastOnline = Date.now();
      while (Date.now()<stopAt) {
        const cycleStart = Date.now();
        const elapsed = cycleStart-started;
        let moreEvents = false;
        // One student loses its network for 25 seconds, once in the first minute.
        if (!isHost && index===students.length-1 && elapsed>=30000 && elapsed<55000) {
          offlineBaseline ??= lastSeenStudentAt;
          await delay(1000);
          continue;
        }
        try {
          const answers: Record<string,boolean|null> = {};
          if (!isHost) {
            if (ticks%6===1 || ticks%6===3) {
              visible=!visible;
              const key = `${client.userId}:${visible ? 'RETURN':'AWAY'}`;
              assert.equal(transitions.has(key),false,`Missing notification before next transition: ${key}`);
              transitions.set(key,cycleStart);
            }
            const questionId = String(1000000+index);
            const answer = ticks%3===0 ? true : ticks%3===1 ? false : null;
            answers[questionId]=answer;
            expected.set(client.userId,{ visible,answer,questionId });
          }
          const snapshot = await client.update(roomId,visible,answers,isHost ? eventCursor.toString() : undefined);
          assert.equal(snapshot.hostId,host.userId);
          assert.equal(snapshot.closed,false);
          if (isHost) {
            assert.equal(snapshot.members.length,61);
            captureEvents(snapshot);
            moreEvents = snapshot.events.length === 100;
            if (Date.now()-lastReportAt >= 60000) {
              lastReportAt = Date.now();
              console.log(`Elapsed ${Math.floor((lastReportAt-started)/1000)}s; failures ${failures}; notifications ${notificationMs.length}.`);
            }
          } else {
            assert.equal(snapshot.members.length,1,'Student received peer progress');
            assert.equal(snapshot.members[0].userId,client.userId);
            assert.equal(snapshot.members[0].visible,visible);
            assert.equal(snapshot.members[0].answers[String(1000000+index)],answers[String(1000000+index)] ?? undefined);
            assert.equal(snapshot.announcement?.text,'Pilot bağlantı denemesi');
            lastOnline=Date.now();
            if (index===students.length-1) lastSeenStudentAt=lastOnline;
          }
        } catch (error) {
          failures++;
          console.error(`Cycle failed: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
        ticks++;
        await delay(moreEvents ? 0 : Math.max(0,(isHost ? 2000:5000)-(Date.now()-cycleStart)));
      }
    });
    await Promise.all(loops);
    let snapshot = await host.update(roomId,true,{},eventCursor.toString());
    captureEvents(snapshot);
    while (snapshot.events.length === 100) {
      snapshot = await host.update(roomId,true,{},eventCursor.toString());
      captureEvents(snapshot);
    }
    for (const [userId,value] of expected) {
      const member = snapshot.members.find(item => item.userId===userId);
      assert.ok(member,'Member disappeared');
      assert.equal(member.visible,value.visible,'Final visibility state lost');
      assert.equal(member.answers[value.questionId],value.answer ?? undefined,'Final answer lost or duplicate update applied');
    }
    const durations = clients.flatMap(client => client.requestDurations);
    const report = {
      test:'real-supabase-rpc',accounts:61,durationSeconds,requests:durations.length,failures,authenticationRateLimits,
      requestP95Ms:percentile(durations,0.95),notificationP95Ms:percentile(notificationMs,0.95),
      notificationMaxMs:Math.max(0,...notificationMs),offlineMaxMs:Math.max(0,...offlineMs),
      notificationsObserved:notificationMs.length,offlineEventsObserved:offlineMs.length,
      notificationsMissing:transitions.size,
      fullDuration:durationSeconds>=7200,
    };
    console.log(JSON.stringify(report,null,2));
    assert.equal(failures,0,'RPC/load failure observed');
    assert.equal(transitions.size,0,'Some visibility notifications were never observed');
    assert.ok(notificationMs.length>0 && report.notificationMaxMs<=3000,'Visibility notifications exceeded 3s');
    assert.ok(offlineMs.length>0 && report.offlineMaxMs<=20000,'Disconnect detection exceeded 20s');
    if (!report.fullDuration) console.log('Preliminary run only; the two-hour pilot acceptance remains incomplete.');
    completed=true;
  } finally {
    await host.rpc('close_classroom_room',roomArgs(host)).catch(() => { console.error('Test room cleanup failed; close it manually.'); });
    if (!completed) console.error('Pilot acceptance FAILED. No readiness claim can be made.');
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Load test failed.');
  process.exitCode=1;
});
