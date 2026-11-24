'use client';

import { IsoBox, IsoScene, IsoText, Label, Person, Pipe, Plate, Server, type LabelTone, type Point3 } from '@shift-left/iso';
import type { RequestEval } from '@shift-left/lessons';

export const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  422: 'Unprocessable',
  500: 'Server Error',
};
export const statusLine = (s: number) => `${s} ${STATUS_TEXT[s] ?? ''}`.trim();
export const statusTone = (s: number): LabelTone => (s >= 500 ? 'bad' : s >= 400 ? 'hint' : 'good');

const GATE_X = 7;
const API_X = 13;
const ROOM_X = 20;
const ROOM2_X = 26;
const who = { none: 'nobody', ada: 'Ada', tunde: 'Tunde' } as const;

/** Client → auth gate → API → (transfer rooms). The request stops where Kudi answers. */
export function RequestScene({ evalState, rooms, reducedMotion, hideResults: hidePredict }: { evalState: RequestEval; rooms: boolean; reducedMotion: boolean; hideResults: boolean }) {
  const { req, current, history } = evalState;
  const sent = history.length > 0 && JSON.stringify(history.at(-1)!.req) === JSON.stringify(req);
  const hideResults = hidePredict || !sent;
  const status = current.actual.status;
  const known = req.path !== '/api/nope';
  const stopsAt: 'gate' | 'api' | 'room7' | 'room9' =
    !known || current.actual.status === 405 ? 'api' : status === 401 ? 'gate' : req.path === '/api/transfers/7' ? 'room7' : req.path === '/api/transfers/9' ? 'room9' : 'api';
  const stopX = stopsAt === 'gate' ? GATE_X + 1 : stopsAt === 'api' ? API_X - 1 : stopsAt === 'room7' ? ROOM_X : ROOM2_X;
  const stopY = 1.5;
  const toRoom = stopsAt === 'room7' || stopsAt === 'room9';
  const leaked = !hideResults && stopsAt === 'room9' && status === 200 && req.auth !== 'tunde';
  const roomTone = (id: 'room7' | 'room9') => (leaked && id === 'room9' ? 'rose' : stopsAt === id && !hideResults ? (status === 200 ? 'sage' : 'butter') : 'cream');
  const showRooms = rooms || toRoom;
  const respAt: Point3 = stopsAt === 'gate' ? [GATE_X + 0.5, 1.7, 3.1] : stopsAt === 'api' ? [API_X + 1, 1.4, 2.4] : [stopX + 1.5, 1.5, 1.6];

  const right = showRooms ? ROOM2_X + 3 : API_X + 3.5;
  const bounds: Point3[] = [[-1, 0, 4], [right, 0, 4], [-1, 4, 0], [right, 4, 0]];
  const label = hideResults
    ? `${req.method} ${req.path} as ${who[req.auth]}. ${hidePredict ? 'Predict first to see the response.' : 'Not sent yet.'}`
    : `${req.method} ${req.path} as ${who[req.auth]}: Kudi answered ${statusLine(status)}${current.matches ? ', as the spec says' : `; the spec says ${statusLine(current.expected.status)}`}.`;

  return (
    <IsoScene bounds={bounds} pad={[70, 60, 60, 60]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      <Plate x={-0.8} y={0} w={3.6} d={3.6} />
      <Person at={[1, 1.8, 0.25]} color={req.auth === 'none' ? '#e6dfd1' : req.auth === 'ada' ? '#c8b8ef' : '#b9d0f3'} />
      <IsoText at={[2.8, 3.6, 0]} dy={18}>{req.auth === 'none' ? 'Logged out' : who[req.auth]}</IsoText>

      <Pipe from={[2.8, 1.5, 0.4]} to={[toRoom ? API_X - 1 : stopX, stopY, 0.4]} tone={hideResults ? 'neutral' : status >= 500 || !current.matches ? 'bad' : 'neutral'} dots={reducedMotion ? 0 : 3} />

      <g data-testid="gate" data-stop={stopsAt === 'gate'}>
        <IsoBox x={GATE_X} y={-0.4} w={1} d={0.6} h={2.6} tone="lavender" />
        <IsoBox x={GATE_X} y={3.2} w={1} d={0.6} h={2.6} tone="lavender" />
        <IsoBox x={GATE_X} y={-0.4} z={2.6} w={1} d={4.2} h={0.5} tone={stopsAt === 'gate' && !hideResults ? 'butter' : 'lavender'} />
        <IsoText at={[GATE_X + 1, 3.8, 0]} dy={20} size={11.5}>Auth gate</IsoText>
        <IsoText at={[GATE_X + 1, 3.8, 0]} dy={34} size={10.5} weight={500} muted>who are you?</IsoText>
      </g>

      <Server x={API_X - 1} y={-0.6} w={4} d={4} h={2.4} tone={stopsAt === 'api' && status >= 500 && !hideResults ? 'rose' : 'sky'} title="Kudi API" />

      {toRoom && <Pipe from={[API_X + 3, 1.5, 0.4]} to={[stopX, 1.5, 0.4]} tone={!hideResults && !current.matches ? 'bad' : 'neutral'} dots={reducedMotion ? 0 : 2} />}
      {showRooms && (
        <g data-testid="rooms">
          <g data-testid="room-7" data-tone={roomTone('room7')}>
            <IsoBox x={ROOM_X} y={0} w={3} d={3} h={1.6} tone={roomTone('room7')} />
            <IsoText at={[ROOM_X + 3, 3, 0]} dy={18} size={11}>Transfer 7</IsoText>
            <IsoText at={[ROOM_X + 3, 3, 0]} dy={31} size={10} weight={500} muted>Ada → Tunde</IsoText>
          </g>
          <g data-testid="room-9" data-tone={roomTone('room9')}>
            <IsoBox x={ROOM2_X} y={0} w={3} d={3} h={1.6} tone={roomTone('room9')} />
            <IsoText at={[ROOM2_X + 3, 3, 0]} dy={18} size={11}>Transfer 9</IsoText>
            <IsoText at={[ROOM2_X + 3, 3, 0]} dy={31} size={10} weight={500} muted>Tunde → Bola</IsoText>
          </g>
          <IsoText at={[ROOM_X + 4, -0.3, 1.6]} dy={-30} size={10.5} weight={500} muted>who may see what?</IsoText>
        </g>
      )}

      <g className="pin">
        <Label at={[1, 1.5, 1.4]} lift={10} tone="you" text={`${req.method} ${req.path}`} />
      </g>
      <g className="pin" data-testid="response" data-status={hideResults ? '' : status}>
        <Label at={respAt} lift={8} tone={hideResults ? 'neutral' : statusTone(status)} text={hidePredict ? '? predict first' : !sent ? 'press Send' : statusLine(status)} />
        {!hideResults && !current.matches && (
          <Label at={respAt} lift={36} tone="bad" text={`spec: ${statusLine(current.expected.status)}${current.expected.status === status ? ', different body' : ''}`} />
        )}
      </g>
    </IsoScene>
  );
}
