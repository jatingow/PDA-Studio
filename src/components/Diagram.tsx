import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { Maximize2, Download, RefreshCw } from 'lucide-react';
import { PDA, Transition, formatPush } from '../core/pda';

// Register plugins safely
try {
  cytoscape.use(dagre);
} catch {
  // Already registered
}

interface DiagramProps {
  pda: PDA;
  activeState?: string;
  activeTransition?: Transition;
  theme?: 'light' | 'dark';
}

interface MergedEdge {
  id: string;
  source: string;
  target: string;
  labels: string[];
  transitions: Transition[];
  isSelfLoop: boolean;
}

export const Diagram: React.FC<DiagramProps> = ({
  pda,
  activeState,
  activeTransition,
  theme = 'light',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [layoutName, setLayoutName] = useState<'dagre' | 'cose' | 'circle'>('dagre');
  const isDark = theme === 'dark';

  // Group transitions between the same source and target to display merged labels
  const getMergedEdges = useCallback((): MergedEdge[] => {
    const map = new Map<string, MergedEdge>();

    pda.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      const pushStr = formatPush(t.push);
      const label = `${t.input}, ${t.pop} | ${pushStr}`;

      if (!map.has(key)) {
        map.set(key, {
          id: `edge_${t.from}_${t.to}`,
          source: t.from,
          target: t.to,
          labels: [label],
          transitions: [t],
          isSelfLoop: t.from === t.to,
        });
      } else {
        const existing = map.get(key)!;
        existing.labels.push(label);
        existing.transitions.push(t);
      }
    });

    return Array.from(map.values());
  }, [pda.transitions]);

  // Initialize and update Cytoscape graph
  useEffect(() => {
    if (!containerRef.current) return;

    const mergedEdges = getMergedEdges();
    const elements: cytoscape.ElementDefinition[] = [];

    // Hidden start dummy node
    elements.push({
      group: 'nodes',
      data: { id: '_start_arrow_', label: 'START' },
      classes: 'start-arrow-node',
    });

    // Start arrow edge
    elements.push({
      group: 'edges',
      data: {
        id: '_start_edge_',
        source: '_start_arrow_',
        target: pda.start,
        label: 'start',
      },
      classes: 'start-edge',
    });

    // State nodes
    pda.states.forEach(state => {
      const isStart = state === pda.start;
      const isFinal = pda.finals.includes(state);
      elements.push({
        group: 'nodes',
        data: {
          id: state,
          label: state,
          isStart,
          isFinal,
        },
        classes: `${isFinal ? 'final-state' : ''} ${isStart ? 'start-state' : ''}`,
      });
    });

    // Transition Edges
    mergedEdges.forEach(me => {
      elements.push({
        group: 'edges',
        data: {
          id: me.id,
          source: me.source,
          target: me.target,
          label: me.labels.join('\n'),
        },
        classes: me.isSelfLoop ? 'self-loop' : 'standard-edge',
      });
    });

    // Cytoscape Canvas 2D color tokens (hex required for HTML5 Canvas 2D parser compatibility)
    const nodeBg = isDark ? '#1c212b' : '#ffffff';
    const nodeBorder = isDark ? '#3b4354' : '#334155';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const edgeColor = isDark ? '#64748b' : '#475569';
    const edgeTextColor = isDark ? '#f1f5f9' : '#0f172a';
    const edgeLabelBg = isDark ? '#0f172a' : '#ffffff';
    const edgeLabelBorder = isDark ? '#334155' : '#64748b';
    const skyBlue = isDark ? '#38bdf8' : '#0284c7';
    const orangeSignal = isDark ? '#f97316' : '#ea580c';

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'font-family': 'Geist Mono, monospace',
            'font-size': '13px',
            'font-weight': 'bold',
            color: textColor,
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': nodeBg,
            'border-width': 2,
            'border-color': nodeBorder,
            width: 46,
            height: 46,
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': 0.15,
          },
        },
        {
          selector: '.final-state',
          style: {
            'border-width': 5,
            'border-style': 'double',
            'border-color': skyBlue,
          },
        },
        {
          selector: '.start-arrow-node',
          style: {
            width: 1,
            height: 1,
            opacity: 0,
            label: '',
          },
        },
        {
          selector: '.start-edge',
          style: {
            'curve-style': 'straight',
            'target-arrow-shape': 'triangle',
            'line-color': skyBlue,
            'target-arrow-color': skyBlue,
            width: 1.5,
            label: 'start',
            'font-family': 'Geist Mono, monospace',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-margin-y': -7,
            color: skyBlue,
            'line-style': 'dashed',
          },
        },
        {
          selector: 'edge.standard-edge',
          style: {
            label: 'data(label)',
            'font-family': 'Geist Mono, monospace',
            'font-size': '11px',
            'text-wrap': 'wrap',
            'text-max-width': '130px',
            'text-background-opacity': 0.96,
            'text-background-color': edgeLabelBg,
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'text-border-opacity': 1.0,
            'text-border-width': 1,
            'text-border-color': edgeLabelBorder,
            color: edgeTextColor,
            'curve-style': 'bezier',
            'control-point-step-size': 40,
            'target-arrow-shape': 'triangle',
            'line-color': edgeColor,
            'target-arrow-color': edgeColor,
            width: 1.8,
            'arrow-scale': 1.0,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': 0.15,
          },
        },
        {
          selector: 'edge.self-loop',
          style: {
            label: 'data(label)',
            'font-family': 'Geist Mono, monospace',
            'font-size': '11px',
            'text-wrap': 'wrap',
            'text-max-width': '130px',
            'text-background-opacity': 0.96,
            'text-background-color': edgeLabelBg,
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'text-border-opacity': 1.0,
            'text-border-width': 1,
            'text-border-color': edgeLabelBorder,
            color: edgeTextColor,
            'curve-style': 'bezier',
            'loop-direction': '-45deg',
            'loop-sweep': '70deg',
            'control-point-step-size': 55,
            'target-arrow-shape': 'triangle',
            'line-color': edgeColor,
            'target-arrow-color': edgeColor,
            width: 1.8,
            'arrow-scale': 1.0,
          },
        },
        {
          selector: '.active-node',
          style: {
            'background-color': skyBlue,
            'border-color': isDark ? '#f8fafc' : '#0f172a',
            'border-width': 3,
            color: '#ffffff',
            width: 50,
            height: 50,
          },
        },
        {
          selector: '.active-edge',
          style: {
            'line-color': orangeSignal,
            'target-arrow-color': orangeSignal,
            width: 3,
            'line-style': 'solid',
            'text-background-color': isDark ? '#1c1917' : '#fff7ed',
            'text-border-color': orangeSignal,
            'text-border-width': 1.5,
            color: isDark ? '#fb923c' : '#c2410c',
            'z-index': 999,
          },
        },
      ],
      layout: {
        name: layoutName === 'dagre' ? 'dagre' : layoutName,
        rankDir: 'LR',
        nodeSep: 60,
        rankSep: 85,
        padding: 35,
      } as any,
      wheelSensitivity: 0.2,
      minZoom: 0.3,
      maxZoom: 3.0,
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [pda, layoutName, isDark, getMergedEdges]);

  // Update active state and active edge highlights
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.nodes().removeClass('active-node');
      cy.edges().removeClass('active-edge');

      if (activeState) {
        const node = cy.getElementById(activeState);
        if (node && node.length > 0) {
          node.addClass('active-node');
        }
      }

      if (activeTransition) {
        const edgeId = `edge_${activeTransition.from}_${activeTransition.to}`;
        const edge = cy.getElementById(edgeId);
        if (edge && edge.length > 0) {
          edge.addClass('active-edge');
        }
      }
    });
  }, [activeState, activeTransition]);

  // Canvas actions
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleRelayout = () => {
    if (!cyRef.current) return;
    const layout = cyRef.current.layout({
      name: layoutName === 'dagre' ? 'dagre' : layoutName,
      rankDir: 'LR',
      nodeSep: 60,
      rankSep: 85,
      padding: 35,
    } as any);
    layout.run();
  };

  const handleExportPNG = () => {
    if (!cyRef.current) return;
    const png64 = cyRef.current.png({
      full: true,
      scale: 2.5,
      bg: isDark ? '#14161b' : '#ffffff',
    });
    const a = document.createElement('a');
    a.href = png64;
    a.download = `${pda.name || 'pda'}_graph.png`;
    a.click();
  };

  return (
    <div className="relative w-full h-[470px] lg:h-[510px] bg-paper-2 overflow-hidden flex flex-col">
      {/* CAD Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-rule bg-paper-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="font-body font-medium text-xs text-ink">
            State transition graph
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 font-body">
          <select
            value={layoutName}
            onChange={e => setLayoutName(e.target.value as any)}
            className="text-xs font-body px-2 py-0.5 rounded border border-rule bg-paper text-ink focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
            title="Graph layout algorithm"
          >
            <option value="dagre">Dagre (hierarchical)</option>
            <option value="cose">CoSE (force)</option>
            <option value="circle">Circle</option>
          </select>

          <button
            type="button"
            onClick={handleRelayout}
            className="p-1 rounded border border-transparent hover:border-rule text-muted hover:text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Re-run layout"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFit}
            className="p-1 rounded border border-transparent hover:border-rule text-muted hover:text-ink transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Fit graph to canvas"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-rule mx-1" />

          <button
            type="button"
            onClick={handleExportPNG}
            className="px-2 py-0.5 rounded border border-rule hover:border-muted text-xs font-body text-ink transition-colors duration-150 inline-flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus"
            title="Export as PNG"
          >
            <Download className="w-3 h-3 text-muted" />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Cytoscape Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full bg-paper bg-dot-grid cursor-grab active:cursor-grabbing" />

      {/* Engineering Legend Strip */}
      <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex items-center justify-between text-[11px] font-body text-muted bg-paper-2/95 px-2.5 py-1 rounded border border-rule">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border border-rule bg-paper" />
            <span>State</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-double border-accent-2 bg-paper" />
            <span>Final state (F)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-2" />
            <span>Current (q)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-accent" />
            <span>Active δ</span>
          </span>
        </div>
        <div className="hidden sm:block text-[11px] text-muted-2">
          Format: a, X | α (read, pop | push)
        </div>
      </div>
    </div>
  );
};
