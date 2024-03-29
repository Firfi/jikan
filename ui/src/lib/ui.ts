import {
  Program,
  NonEmptyState as NonEmptyFsmState,
  push,
  tick,
  empty as fsmState0,
  isEmpty,
} from '@jikan0/fsm';
import { lastRNEA, pipe } from '@jikan0/utils';
import { Deep } from '@rimbu/core';
import * as S from "@effect/schema/Schema";


// TODO program library
// TODO fp eslint

export type StartClickedEvent = {
  _tag: 'StartClicked';
};

export const StartClickedEvent = (): StartClickedEvent => ({
  _tag: 'StartClicked',
});

export type StopClickedEvent = {
  _tag: 'StopClicked';
};

export const StopClickedEvent = (): StopClickedEvent => ({
  _tag: 'StopClicked',
});

export type PauseClickedEvent = {
  _tag: 'PauseClicked';
};

export const PauseClickedEvent = (): PauseClickedEvent => ({
  _tag: 'PauseClicked',
});

export type ContinueClickedEvent = {
  _tag: 'ContinueClicked';
};

export const ContinueClickedEvent = (): ContinueClickedEvent => ({
  _tag: 'ContinueClicked',
});

export type TimePassedEvent = {
  _tag: 'TimePassed';
  timeMs: bigint;
};

export const TimePassedEvent = (timeMs: bigint): TimePassedEvent => ({
  _tag: 'TimePassed',
  timeMs,
});

const SIMPLE_MODE = 'simple' as const;

type SimpleMode = typeof SIMPLE_MODE;

const MODES = [SIMPLE_MODE] as const;

type Mode = (typeof MODES)[number];

export const DEFAULT_MODE = SIMPLE_MODE;
export const DEFAULT_EXERCISE_TIME_MS = BigInt(30000);
export const DEFAULT_REST_TIME_MS = BigInt(10000);
export const DEFAULT_ROUNDS = BigInt(10);

export type ModeSelectedEvent<M extends Mode = Mode> = {
  _tag: 'ModeSelected';
  mode: M;
};

export const ModeSelectedEvent = <M extends Mode>(
  mode: M
): ModeSelectedEvent<M> => ({
  _tag: 'ModeSelected',
  mode,
});

export type SimpleModeExerciseTimeSelectedEvent = {
  _tag: 'SimpleModeExerciseTimeSelected';
  exerciseTimeMs: bigint;
};

export const MakeSimpleModeExerciseTimeSelectedEvent = (
  exerciseTimeMs: bigint
): SimpleModeExerciseTimeSelectedEvent => ({
  _tag: 'SimpleModeExerciseTimeSelected',
  exerciseTimeMs,
});

export type SimpleModeRestTimeSelectedEvent = {
  _tag: 'SimpleModeRestTimeSelected';
  restTimeMs: bigint;
};

export const MakeSimpleModeRestTimeSelectedEvent = (
  restTimeMs: bigint
): SimpleModeRestTimeSelectedEvent => ({
  _tag: 'SimpleModeRestTimeSelected',
  restTimeMs,
});

export type SimpleModeRoundsSelectedEvent = {
  _tag: 'SimpleModeRoundsSelected';
  rounds: bigint;
};

export const MakeSimpleModeRoundsSelectedEvent = (
  rounds: bigint
): SimpleModeRoundsSelectedEvent => ({
  _tag: 'SimpleModeRoundsSelected',
  rounds,
});

export type Event =
  | StartClickedEvent
  | StopClickedEvent
  | PauseClickedEvent
  | ContinueClickedEvent
  | ModeSelectedEvent
  | SimpleModeExerciseTimeSelectedEvent
  | SimpleModeRestTimeSelectedEvent
  | SimpleModeRoundsSelectedEvent
  | TimePassedEvent;

export type Action = Event;

const RUNNING_STATE_RUNNING = 'running' as const;
const RUNNING_STATE_PAUSED = 'paused' as const;
const RUNNING_STATE_STOPPED = 'stopped' as const;
type RunningStateRunning = typeof RUNNING_STATE_RUNNING;
type RunningStatePaused = typeof RUNNING_STATE_PAUSED;
type RunningStateStopped = typeof RUNNING_STATE_STOPPED;

const RUNNING_STATES = [
  RUNNING_STATE_RUNNING,
  RUNNING_STATE_PAUSED,
  RUNNING_STATE_STOPPED,
] as const;

type RunningState = (typeof RUNNING_STATES)[number];

type Button<E> =
  | {
      active: true;
      onClick: E;
    }
  | {
      active: false;
    };
type ActiveButton<E> = Button<E> & {
  active: true;
};
type InactiveButton<E = never> = Button<E> & {
  active: false;
};

type ViewActiveValue = {
  startButton: Button<StartClickedEvent>;
  stopButton: Button<StopClickedEvent>;
  pauseButton: Button<PauseClickedEvent>;
  continueButton: Button<ContinueClickedEvent>;
};

export type State<M extends Mode = Mode> = {
  mode: ModeSelectorState & {selected: M};
} & (
  | {
      running: RunningStateRunning | RunningStatePaused;
      fsmState: NonEmptyFsmState<StepPerMode[M]>;
    }
  | {
      running: RunningStateStopped;
    }
);

export const SimpleModeSettings = S.struct({
  exerciseTimeMs: S.bigint,
  restTimeMs: S.bigint,
  rounds: S.bigint,
});


export type ModeSelectorSettingsValue = {
  mode: Mode;
} & ({
  mode: SimpleMode;

} & S.Schema.To<typeof SimpleModeSettings>);

export const ModesSettings = S.struct({
  simple: SimpleModeSettings,
});

export const ModeSettings = S.struct({
  selected: S.literal(...MODES),
  settings: ModesSettings,
});

export type ModeSettings = S.Schema.To<typeof ModeSettings>;

export type ModesSettings = Readonly<{
  [k in Mode]: Readonly<
    Omit<
      ModeSelectorSettingsValue & {
        mode: k;
      },
      'mode'
    >
  >;
}> & S.Schema.To<typeof ModeSettings>;

export type ModeSelectorState = Readonly<S.Schema.To<typeof ModeSettings>>;

export const modeSelectorState0 = Object.freeze({
  selected: DEFAULT_MODE,
  settings: Object.freeze({
    simple: Object.freeze({
      exerciseTimeMs: DEFAULT_EXERCISE_TIME_MS,
      restTimeMs: DEFAULT_REST_TIME_MS,
      rounds: DEFAULT_ROUNDS,
    }),
  }),
}) satisfies ModeSelectorState;

const selectorToProgram = (
  selector: ModeSelectorState
): ProgramPerMode[typeof selector.selected] => {
  const settings = selector.settings[selector.selected];
  switch (selector.selected) {
    case SIMPLE_MODE: {
      return simpleModeSelectorToProgram(settings);
    }
  }
};

export const state0: State<SimpleMode> = Object.freeze({
  running: RUNNING_STATE_STOPPED,
  mode: modeSelectorState0,
});

export const PREPARATION_STEP = 'warmup' as const;
export const EXERCISE_STEP = 'exercise' as const;
export const REST_STEP = 'rest' as const;

export const SIMPLE_PROGRAM_STEPS = [
  PREPARATION_STEP,
  EXERCISE_STEP,
  REST_STEP,
] as const;

export type SimpleProgramStep = (typeof SIMPLE_PROGRAM_STEPS)[number];

type ProgramPerMode = {
  [k in Mode]: Program<string>;
} & {
  [SIMPLE_MODE]: Program<SimpleProgramStep>;
};

type StepPerMode = {
  [k in Mode]: string;
} & {
  simple: SimpleProgramStep;
};

const PREPARATION_STEPS_SIMPLE = [
  {
    kind: PREPARATION_STEP,
    duration: 3000 /*TODO make configurable*/,
  },
] as const;

export const simpleModeSelectorToProgram = (
  settings: Omit<ModeSelectorSettingsValue & { mode: SimpleMode }, 'mode'>
): ProgramPerMode[SimpleMode] =>
  Object.freeze(
    [...Array(Number(settings.rounds)).keys()].flatMap((i) => [
      ...(i === 0 ? PREPARATION_STEPS_SIMPLE : ([] as const)),
      { kind: EXERCISE_STEP, duration: Number(settings.exerciseTimeMs) },
      ...(Number(settings.rounds) === i + 1
        ? ([] as const)
        : [{ kind: REST_STEP, duration: Number(settings.restTimeMs) }]),
    ])
  ) as ProgramPerMode[SimpleMode];

const simpleModeStateToStats = (
  s: NonEmptyFsmState<SimpleProgramStep>
): TimerStatsCurrent<SimpleProgramStep> => ({
  current: BigInt(s.queue.filter((x) => x.kind === EXERCISE_STEP).length),
  kind: lastRNEA(s.queue).kind,
  leftMs: BigInt(s.duration),
  totalMs: BigInt(lastRNEA(s.queue).duration),
});

export type ModeSelectorSettingViewModeActions<M extends Mode> = {
  simple: {
    setRounds: typeof MakeSimpleModeRoundsSelectedEvent;
    setExerciseTimeMs: typeof MakeSimpleModeExerciseTimeSelectedEvent;
    setRestTimeMs: typeof MakeSimpleModeRestTimeSelectedEvent;
  };
}[M];

export type ModeSelectorSettingsViewValue = ModeSelectorSettingsValue;
export type ModeSelectorSettingsViewActions = {
  [m in Mode]: {
    onSelect: ModeSelectedEvent<m>;
  } & ModeSelectorSettingViewModeActions<m>;
};

const modeSelectorSettingsViewActions: ModeSelectorSettingsViewActions = {
  simple: {
    onSelect: ModeSelectedEvent('simple'),
    setRounds: MakeSimpleModeRoundsSelectedEvent,
    setExerciseTimeMs: MakeSimpleModeExerciseTimeSelectedEvent,
    setRestTimeMs: MakeSimpleModeRestTimeSelectedEvent,
  },
} as const;

type TimerStatsCurrent<RoundKind extends string = string> = {
  current: bigint;
  kind: RoundKind;
  leftMs: bigint;
  totalMs: bigint;
};

type TimerStats<RoundKind extends string = string> = {
  rounds: bigint;
  round: TimerStatsCurrent<RoundKind>;
};

export type ViewValue<R extends RunningState = RunningState> =
  ViewActiveValue & {
    // read-only, round totals can be derived
    modeSelector: {
      value: ModeSelectorSettingsViewValue;
    };
    running: R;
  } & (
      | {
          running: 'running';
          startButton: InactiveButton;
          stopButton: ActiveButton<StopClickedEvent>;
          pauseButton: ActiveButton<PauseClickedEvent>;
          continueButton: InactiveButton;
          timerStats: TimerStats;
        }
      | {
          running: 'paused';
          startButton: InactiveButton;
          stopButton: ActiveButton<StopClickedEvent>;
          pauseButton: InactiveButton;
          continueButton: ActiveButton<ContinueClickedEvent>;
        }
      | {
          running: 'stopped';
          startButton: ActiveButton<StartClickedEvent>;
          stopButton: InactiveButton;
          pauseButton: InactiveButton;
          continueButton: InactiveButton;
          // read-write
          modeSelector: {
            actions: ModeSelectorSettingsViewActions;
          };
          // todo program queries
        }
    );
type View_<S, R> = (state: S) => R;
export type View = View_<State, ViewValue>;

export const view = <M extends Mode = Mode>(state: State<M>): ViewValue => {
  const modeSelectorValue = {
    mode: state.mode.selected,
    ...state.mode.settings[state.mode.selected],
  };

  switch (state.running) {
    case RUNNING_STATE_RUNNING: {
      return {
        running: state.running,
        startButton: {
          active: false,
        },
        stopButton: {
          active: true,
          onClick: StopClickedEvent(),
        },
        pauseButton: {
          active: true,
          onClick: PauseClickedEvent(),
        },
        continueButton: {
          active: false,
        },
        modeSelector: {
          value: modeSelectorValue,
        },
        timerStats: {
          // dupe but it's a "view"!
          rounds: modeSelectorValue.rounds,
          round: simpleModeStateToStats(state.fsmState),
        },
      };
    }
    case RUNNING_STATE_PAUSED: {
      return {
        running: state.running,
        startButton: {
          active: false,
        },
        stopButton: {
          active: true,
          onClick: StopClickedEvent(),
        },
        pauseButton: {
          active: false,
        },
        continueButton: {
          active: true,
          onClick: ContinueClickedEvent(),
        },
        modeSelector: {
          value: modeSelectorValue,
        },
      };
    }
    case RUNNING_STATE_STOPPED: {
      return {
        running: state.running,
        startButton: {
          active: true,
          onClick: StartClickedEvent(),
        },
        stopButton: {
          active: false,
        },
        pauseButton: {
          active: false,
        },
        continueButton: {
          active: false,
        },
        modeSelector: {
          value: modeSelectorValue,
          actions: modeSelectorSettingsViewActions,
        },
      };
    }
  }
};

export const reduce =
  (action: Action) =>
  (state: State): State => {
    switch (action._tag) {
      case 'TimePassed': {
        if (state.running !== 'running') return state;
        const timeMs = Number(action.timeMs);
        const fsmState = pipe(state.fsmState, tick(timeMs), ([s]) => s);
        if (fsmState === state.fsmState) return state;
        return isEmpty(fsmState)
          ? {
              ...state,
              running: 'stopped',
            }
          : {
              ...state,
              fsmState,
            };
      }
      case 'StartClicked': {
        if (state.running === 'running' || state.running === 'paused')
          return state;
        const program = selectorToProgram(state.mode);
        return {
          ...state,
          running: 'running',
          fsmState: pipe(
            fsmState0,
            push(program),
            (s) =>
              s as NonEmptyFsmState<StepPerMode[typeof state.mode.selected]>
          ),
        };
      }
      case 'StopClicked': {
        if (state.running === 'stopped') return state;
        return {
          ...state,
          running: 'stopped',
        };
      }
      case 'PauseClicked': {
        if (state.running === 'stopped' || state.running === 'paused')
          return state;
        return {
          ...state,
          running: 'paused',
        };
      }
      case 'ContinueClicked': {
        if (state.running === 'stopped' || state.running === 'running')
          return state;
        return {
          ...state,
          running: 'running',
        };
      }
      case 'ModeSelected': {
        if (state.mode.selected === action.mode) return state;
        return Deep.patch(state, [
          {
            mode: [
              {
                selected: action.mode,
              },
            ],
          },
        ]);
      }
      case 'SimpleModeRoundsSelected': {
        if (state.mode.selected !== SIMPLE_MODE) return state;
        return Deep.patch(state, [
          {
            mode: [
              {
                settings: [
                  {
                    simple: [
                      {
                        rounds: action.rounds,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]);
      }
      case 'SimpleModeExerciseTimeSelected': {
        if (state.mode.selected !== SIMPLE_MODE) return state;
        return Deep.patch(state, [
          {
            mode: [
              {
                settings: [
                  {
                    simple: [
                      {
                        exerciseTimeMs: action.exerciseTimeMs,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]);
      }
      case 'SimpleModeRestTimeSelected': {
        if (state.mode.selected !== SIMPLE_MODE) return state;
        return Deep.patch(state, [
          {
            mode: [
              {
                settings: [
                  {
                    simple: [
                      {
                        restTimeMs: action.restTimeMs,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]);
      }
    }
  };
