export interface EntityDef {
  id: string;
  char: string;
  color: string;
  name: string;
  description: string; // Added description for encyclopedia/inspector
  movement: 'static' | 'wander' | 'seek' | 'flee';
  targetEntity?: string;
  lifespan?: number;
}

export interface InteractionDef {
  entity1: string;
  entity2: string;
  result1: string;
  result2: string;
  spawnEntity?: string; // Added to spawn a third entity upon interaction
  probability: number;
  logMessage?: string;
  logType?: 'info' | 'warning' | 'critical';
}

export interface SliderDef {
  id: string;
  name: string;
  desc: string;
  spawnEntity: string;
}

export interface ToolDef {
  id: string;
  name: string;
  desc: string;
  action: 'spawn' | 'destroy';
  targetEntity?: string;
  radius: number;
}

export interface PathologyEvent {
  id: string;
  name: string;
  description: string;
  triggerCondition: {
    type: 'entity_count' | 'slider_value';
    targetId: string; // entityId or sliderId
    operator: '>' | '<' | '>=';
    value: number;
  }[];
  logMessage: string;
  logType?: 'info' | 'warning' | 'critical';
  cooldown?: number; // ticks
}

export interface ScenarioDef {
  title: string;
  description: string;
  entities: EntityDef[];
  interactions: InteractionDef[];
  sliders: SliderDef[];
  tools: ToolDef[];
  pathologies?: PathologyEvent[];
}

export interface Cell {
  entityId: string | null;
  instanceId?: string;
  processedThisTick: boolean;
  age: number;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'warning' | 'critical';
}
