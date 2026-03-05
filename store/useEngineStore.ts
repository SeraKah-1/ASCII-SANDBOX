import { create } from 'zustand';
import { ScenarioDef, Cell, LogEntry, ToolDef } from '../types/engine';

export const GRID_WIDTH = 50;
export const GRID_HEIGHT = 20;

const generateId = () => Math.random().toString(36).substring(2, 9);

export const createEmptyGrid = (): Cell[][] => {
  return Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, () => ({ entityId: null, processedThisTick: false, age: 0 }))
  );
};

interface EngineState {
  appMode: 'sandbox' | 'study' | 'journey';
  isSimulating: boolean;
  scenario: ScenarioDef | null;
  grid: Cell[][];
  logs: LogEntry[];
  sliderValues: Record<string, number>;
  selectedTool: ToolDef | null;
  logIdCounter: number;
  trackedInstanceId: string | null;
  trackedPosition: { x: number; y: number } | null;
  speedMultiplier: number;
  
  pathologyCooldowns: Record<string, number>;
  
  // Save/Load
  savedScenarios: ScenarioDef[];
  saveScenario: () => void;
  loadScenario: (title: string) => void;
  deleteScenario: (title: string) => void;
  loadSavedScenarios: () => void;

  // Actions
  setAppMode: (mode: 'sandbox' | 'study' | 'journey') => void;
  setSimulating: (val: boolean) => void;
  setScenario: (scenario: ScenarioDef) => void;
  clearScenario: () => void;
  setGrid: (grid: Cell[][]) => void;
  addLog: (text: string, type?: 'info' | 'warning' | 'critical') => void;
  setSliderValue: (id: string, value: number) => void;
  setSelectedTool: (tool: ToolDef | null) => void;
  setTrackedInstance: (id: string | null) => void;
  applyTool: (x: number, y: number) => void;
  applyDirectAction: (action: 'spawn' | 'destroy', entityId: string, x: number, y: number, radius: number) => void;
  tick: () => void;
  setSpeedMultiplier: (val: number) => void;
}

export const useEngineStore = create<EngineState>((set, get) => ({
  appMode: 'sandbox',
  isSimulating: false,
  scenario: null,
  grid: createEmptyGrid(),
  logs: [],
  sliderValues: {},
  selectedTool: null,
  logIdCounter: 0,
  trackedInstanceId: null,
  trackedPosition: null,
  speedMultiplier: 1,
  pathologyCooldowns: {},

  savedScenarios: [],

  setAppMode: (mode) => set({ appMode: mode }),
  setSimulating: (val) => set({ isSimulating: val }),
  setSpeedMultiplier: (val) => set({ speedMultiplier: val }),

  saveScenario: () => {
    const state = get();
    if (!state.scenario) return;
    
    const existingIndex = state.savedScenarios.findIndex(s => s.title === state.scenario!.title);
    let newSaved = [...state.savedScenarios];
    
    if (existingIndex >= 0) {
      newSaved[existingIndex] = state.scenario;
    } else {
      newSaved.push(state.scenario);
    }
    
    localStorage.setItem('sandbox_scenarios', JSON.stringify(newSaved));
    set({ savedScenarios: newSaved });
  },

  loadScenario: (title) => {
    const state = get();
    const scenario = state.savedScenarios.find(s => s.title === title);
    if (scenario) {
      state.setScenario(scenario);
    }
  },

  deleteScenario: (title) => {
    const state = get();
    const newSaved = state.savedScenarios.filter(s => s.title !== title);
    localStorage.setItem('sandbox_scenarios', JSON.stringify(newSaved));
    set({ savedScenarios: newSaved });
  },

  loadSavedScenarios: () => {
    try {
      const saved = localStorage.getItem('sandbox_scenarios');
      if (saved) {
        set({ savedScenarios: JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Failed to load scenarios", e);
    }
  },
  
  setScenario: (scenario) => {
    const initialSliders: Record<string, number> = {};
    scenario.sliders.forEach(s => initialSliders[s.id] = 10);
    
    // Initialize Grid
    const newGrid = createEmptyGrid();
    const baseEntities = scenario.entities.slice(0, 2);
    for (let y = 2; y < GRID_HEIGHT - 2; y++) {
      for (let x = 2; x < GRID_WIDTH - 2; x++) {
        if (Math.random() > 0.8 && baseEntities.length > 0) {
          const randomEntity = baseEntities[Math.floor(Math.random() * baseEntities.length)];
          newGrid[y][x] = { entityId: randomEntity.id, instanceId: generateId(), processedThisTick: false, age: 0 };
        }
      }
    }

    set({ scenario, sliderValues: initialSliders, grid: newGrid, isSimulating: false, trackedInstanceId: null, trackedPosition: null });
  },

  clearScenario: () => {
    set({ scenario: null, grid: createEmptyGrid(), isSimulating: false, trackedInstanceId: null, trackedPosition: null, logs: [], sliderValues: {} });
  },

  setGrid: (grid) => set({ grid }),

  addLog: (text, type = 'info') => set((state) => {
    const newLog = { id: state.logIdCounter, text, type };
    return {
      logs: [...state.logs, newLog].slice(-15), // Keep only last 15 logs for performance
      logIdCounter: state.logIdCounter + 1
    };
  }),

  setSliderValue: (id, value) => set((state) => ({
    sliderValues: { ...state.sliderValues, [id]: value }
  })),

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setTrackedInstance: (id) => set({ trackedInstanceId: id }),

  applyTool: (x, y) => {
    const { selectedTool, grid, addLog } = get();
    if (!selectedTool) return;

    const next = grid.map(row => [...row]);
    const radius = selectedTool.radius;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
          if (selectedTool.action === 'spawn' && selectedTool.targetEntity) {
            next[ny][nx] = { entityId: selectedTool.targetEntity, instanceId: generateId(), processedThisTick: false, age: 0 };
          } else if (selectedTool.action === 'destroy') {
            if (!selectedTool.targetEntity || next[ny][nx].entityId === selectedTool.targetEntity) {
              next[ny][nx] = { entityId: null, instanceId: undefined, processedThisTick: false, age: 0 };
            }
          }
        }
      }
    }
    
    set({ grid: next, selectedTool: null });
    addLog(`Intervensi Pemain: Menggunakan "${selectedTool.name}"`, 'warning');
  },

  applyDirectAction: (action, entityId, x, y, radius) => {
    const { grid } = get();
    const next = grid.map(row => [...row]);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
          if (action === 'spawn' && entityId) {
            next[ny][nx] = { entityId: entityId, instanceId: generateId(), processedThisTick: false, age: 0 };
          } else if (action === 'destroy') {
            if (!entityId || next[ny][nx].entityId === entityId) {
              next[ny][nx] = { entityId: null, instanceId: undefined, processedThisTick: false, age: 0 };
            }
          }
        }
      }
    }
    
    set({ grid: next });
  },

  tick: () => {
    const { grid, scenario, sliderValues, addLog, trackedInstanceId } = get();
    if (!scenario) return;

    const nextGrid = grid.map(row => row.map(cell => ({ ...cell, processedThisTick: false })));
    const getDef = (id: string | null) => scenario.entities.find(e => e.id === id);

    let newTrackedPosition = null;

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = nextGrid[y][x];
        if (!cell.entityId || cell.processedThisTick) continue;

        const def = getDef(cell.entityId);
        if (!def) continue;

        if (def.lifespan && cell.age >= def.lifespan) {
          cell.entityId = null;
          cell.instanceId = undefined;
          cell.age = 0;
          continue;
        }
        cell.age++;

        let interacted = false;
        const neighbors = [
          { nx: x, ny: y - 1 }, { nx: x, ny: y + 1 },
          { nx: x - 1, ny: y }, { nx: x + 1, ny: y }
        ].filter(n => n.nx >= 0 && n.nx < GRID_WIDTH && n.ny >= 0 && n.ny < GRID_HEIGHT);
        neighbors.sort(() => Math.random() - 0.5);

        for (const { nx, ny } of neighbors) {
          const neighborCell = nextGrid[ny][nx];
          if (!neighborCell.entityId || neighborCell.processedThisTick) continue;

          const rule = scenario.interactions.find(i => 
            (i.entity1 === cell.entityId && i.entity2 === neighborCell.entityId) ||
            (i.entity2 === cell.entityId && i.entity1 === neighborCell.entityId)
          );

          if (rule && Math.random() < rule.probability) {
            const isCellEntity1 = cell.entityId === rule.entity1;
            const resForCell = isCellEntity1 ? rule.result1 : rule.result2;
            const resForNeighbor = isCellEntity1 ? rule.result2 : rule.result1;

            cell.entityId = resForCell === 'none' ? null : (resForCell === 'same' ? cell.entityId : resForCell);
            if (resForCell === 'none') cell.instanceId = undefined;
            else if (resForCell !== 'same' && resForCell !== null) cell.instanceId = generateId(); // New entity born from interaction

            neighborCell.entityId = resForNeighbor === 'none' ? null : (resForNeighbor === 'same' ? neighborCell.entityId : resForNeighbor);
            if (resForNeighbor === 'none') neighborCell.instanceId = undefined;
            else if (resForNeighbor !== 'same' && resForNeighbor !== null) neighborCell.instanceId = generateId();
            
            cell.processedThisTick = true;
            neighborCell.processedThisTick = true;
            cell.age = 0;
            neighborCell.age = 0;
            interacted = true;

            // Handle spawning a third entity
            if (rule.spawnEntity) {
              const emptyNeighbors = neighbors.filter(n => nextGrid[n.ny][n.nx].entityId === null);
              if (emptyNeighbors.length > 0) {
                const spawnTarget = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                nextGrid[spawnTarget.ny][spawnTarget.nx].entityId = rule.spawnEntity;
                nextGrid[spawnTarget.ny][spawnTarget.nx].instanceId = generateId();
                nextGrid[spawnTarget.ny][spawnTarget.nx].processedThisTick = true;
                nextGrid[spawnTarget.ny][spawnTarget.nx].age = 0;
              }
            }

            if (rule.logMessage && Math.random() > 0.7) {
              addLog(rule.logMessage, (rule.logType as any) || 'warning');
            }
            break;
          }
        }

        if (!interacted && def.movement !== 'static') {
          let targetX = -1, targetY = -1;

          if ((def.movement === 'seek' || def.movement === 'flee') && def.targetEntity) {
            let closestDist = Infinity;
            for (let ty = 0; ty < GRID_HEIGHT; ty++) {
              for (let tx = 0; tx < GRID_WIDTH; tx++) {
                if (nextGrid[ty][tx].entityId === def.targetEntity) {
                  const d = Math.abs(tx - x) + Math.abs(ty - y);
                  if (d < closestDist) {
                    closestDist = d;
                    targetX = tx;
                    targetY = ty;
                  }
                }
              }
            }
          }

          const emptyNeighbors = neighbors.filter(n => nextGrid[n.ny][n.nx].entityId === null);
          if (emptyNeighbors.length > 0) {
            let chosenTarget = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];

            if (targetX !== -1 && targetY !== -1) {
              let bestNeighborDist = def.movement === 'seek' ? Infinity : -1;
              for (const n of emptyNeighbors) {
                const d = Math.abs(targetX - n.nx) + Math.abs(targetY - n.ny);
                if (def.movement === 'seek' && d < bestNeighborDist) {
                  bestNeighborDist = d;
                  chosenTarget = n;
                } else if (def.movement === 'flee' && d > bestNeighborDist) {
                  bestNeighborDist = d;
                  chosenTarget = n;
                }
              }
            }

            nextGrid[chosenTarget.ny][chosenTarget.nx].entityId = cell.entityId;
            nextGrid[chosenTarget.ny][chosenTarget.nx].instanceId = cell.instanceId;
            nextGrid[chosenTarget.ny][chosenTarget.nx].processedThisTick = true;
            nextGrid[chosenTarget.ny][chosenTarget.nx].age = cell.age;
            
            cell.entityId = null;
            cell.instanceId = undefined;
            cell.age = 0;
          }
        }
      }
    }

    scenario.sliders.forEach(slider => {
      const value = sliderValues[slider.id] || 0;
      if (Math.random() * 100 < value * 0.05) {
        const spawnX = Math.floor(Math.random() * GRID_WIDTH);
        const spawnY = Math.floor(Math.random() * GRID_HEIGHT);
        if (!nextGrid[spawnY][spawnX].entityId) {
          nextGrid[spawnY][spawnX].entityId = slider.spawnEntity;
          nextGrid[spawnY][spawnX].instanceId = generateId();
        }
      }
    });

    // Find tracked entity position
    if (trackedInstanceId) {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          if (nextGrid[y][x].instanceId === trackedInstanceId) {
            newTrackedPosition = { x, y };
            break;
          }
        }
        if (newTrackedPosition) break;
      }
    }

    // Count entities for pathology checks
    const entityCounts: Record<string, number> = {};
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const id = nextGrid[y][x].entityId;
        if (id) {
          entityCounts[id] = (entityCounts[id] || 0) + 1;
        }
      }
    }

    // Check pathologies
    const { pathologyCooldowns } = get();
    const newCooldowns = { ...pathologyCooldowns };
    
    // Decrement cooldowns
    for (const key in newCooldowns) {
      if (newCooldowns[key] > 0) newCooldowns[key]--;
    }

    if (scenario.pathologies) {
      scenario.pathologies.forEach(pathology => {
        if ((newCooldowns[pathology.id] || 0) > 0) return;

        const allConditionsMet = pathology.triggerCondition.every(cond => {
          let currentVal = 0;
          if (cond.type === 'entity_count') {
            currentVal = entityCounts[cond.targetId] || 0;
          } else if (cond.type === 'slider_value') {
            currentVal = sliderValues[cond.targetId] || 0;
          }

          if (cond.operator === '>') return currentVal > cond.value;
          if (cond.operator === '<') return currentVal < cond.value;
          if (cond.operator === '>=') return currentVal >= cond.value;
          return false;
        });

        if (allConditionsMet) {
          addLog(pathology.logMessage, pathology.logType || 'warning');
          newCooldowns[pathology.id] = pathology.cooldown || 50; // Default 50 ticks cooldown
        }
      });
    }

    set({ grid: nextGrid, trackedPosition: newTrackedPosition, pathologyCooldowns: newCooldowns });
  }
}));
