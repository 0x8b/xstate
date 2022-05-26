import type { StateMachine } from './StateMachine';
import {
  ResolveTypegenMeta,
  TypegenConstraint,
  TypegenDisabled
} from './typegenTypes';
import {
  ActorMap,
  AnyFunction,
  Assigner,
  BaseActionObject,
  Compute,
  DynamicAssignAction,
  EventObject,
  InternalMachineImplementations,
  MachineConfig,
  MachineContext,
  Prop,
  PropertyAssigner
} from './types';

// real `ExtractEvent` breaks `model.assign` inference within transition actions
type SimplisticExtractEvent<
  TEvent extends EventObject,
  TEventType extends TEvent['type']
> = TEvent extends { type: TEventType } ? TEvent : never;

export interface Model<
  TContext extends MachineContext,
  TEvent extends EventObject,
  TAction extends BaseActionObject = BaseActionObject,
  TModelCreators = void
> {
  initialContext: TContext;
  assign: <TEventType extends TEvent['type'] = TEvent['type']>(
    assigner:
      | Assigner<TContext, SimplisticExtractEvent<TEvent, TEventType>>
      | PropertyAssigner<TContext, SimplisticExtractEvent<TEvent, TEventType>>,
    eventType?: TEventType
  ) => DynamicAssignAction<
    TContext,
    SimplisticExtractEvent<TEvent, TEventType>
  >;
  events: Prop<TModelCreators, 'events'>;
  actions: Prop<TModelCreators, 'actions'>;
  reset: () => DynamicAssignAction<TContext, any>;
  createMachine: {
    <
      TActorMap extends ActorMap = ActorMap,
      TTypesMeta extends TypegenConstraint = TypegenDisabled
    >(
      config: MachineConfig<TContext, TEvent, TAction, TActorMap, TTypesMeta>,
      implementations?: InternalMachineImplementations<
        TContext,
        TEvent,
        ResolveTypegenMeta<TTypesMeta, TEvent, TAction, TActorMap>
      >
    ): StateMachine<
      TContext,
      TEvent,
      TAction,
      TActorMap,
      ResolveTypegenMeta<TTypesMeta, TEvent, TAction, TActorMap>
    >;
  };
}

export type ModelContextFrom<
  TModel extends Model<any, any, any, any>
> = TModel extends Model<infer TContext, any, any, any> ? TContext : never;

export type ModelEventsFrom<
  TModel extends Model<any, any, any, any> | undefined
> = TModel extends Model<any, infer TEvent, any, any> ? TEvent : EventObject;

export type ModelActionsFrom<
  TModel extends Model<any, any, any, any>
> = TModel extends Model<any, any, infer TAction, any> ? TAction : never;

export type EventCreator<
  Self extends AnyFunction,
  Return = ReturnType<Self>
> = Return extends object
  ? Return extends {
      type: any;
    }
    ? "An event creator can't return an object with a type property"
    : Self
  : 'An event creator must return an object';

export type EventCreators<Self> = {
  [K in keyof Self]: Self[K] extends AnyFunction
    ? EventCreator<Self[K]>
    : 'An event creator must be a function';
};

export type FinalEventCreators<Self> = {
  [K in keyof Self]: Self[K] extends AnyFunction
    ? (
        ...args: Parameters<Self[K]>
      ) => Compute<ReturnType<Self[K]> & { type: K }>
    : never;
};

export type ActionCreator<
  Self extends AnyFunction,
  Return = ReturnType<Self>
> = Return extends object
  ? Return extends {
      type: any;
    }
    ? "An action creator can't return an object with a type property"
    : Self
  : 'An action creator must return an object';

export type ActionCreators<Self> = {
  [K in keyof Self]: Self[K] extends AnyFunction
    ? ActionCreator<Self[K]>
    : 'An action creator must be a function';
};

export type FinalActionCreators<Self> = {
  [K in keyof Self]: Self[K] extends AnyFunction
    ? (
        ...args: Parameters<Self[K]>
      ) => Compute<ReturnType<Self[K]> & { type: K }>
    : never;
};

export interface ModelCreators<Self> {
  events?: EventCreators<Prop<Self, 'events'>>;
  actions?: ActionCreators<Prop<Self, 'actions'>>;
}

export interface FinalModelCreators<Self> {
  events: FinalEventCreators<Prop<Self, 'events'>>;
  actions: FinalActionCreators<Prop<Self, 'actions'>>;
}

export type UnionFromCreatorsReturnTypes<TCreators> = {
  [K in keyof TCreators]: TCreators[K] extends AnyFunction
    ? ReturnType<TCreators[K]>
    : never;
}[keyof TCreators];
