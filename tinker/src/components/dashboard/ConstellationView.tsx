import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import * as THREE from "three";
import ForceGraph3D, { type ForceGraph3DInstance, type LinkObject, type NodeObject } from "3d-force-graph";
import {
  ArrowUpRight,
  GitBranchPlus,
  Maximize2,
  Network,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { useAllBridges, useDecayingBridges, useReinforceBridge } from "../../hooks/useBridges";
import { useAllItems } from "../../hooks/useItems";
import { useAllWorkbenches } from "../../hooks/useWorkbenches";
import { useShops } from "../../hooks/useShops";
import { useUiStore } from "../../stores/uiStore";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { AnimatedButton } from "../shared/AnimatedButton";
import { decodeStructuredItemContent } from "../../utils/itemContent";
import {
  getBridgeAgeInDays,
  getBridgeFreshness,
  getBridgeFreshnessColor,
  getEffectiveBridgeStrength,
  type BridgeFreshness,
} from "../../data/bridges";
import type { Bridge, Item, Workbench } from "../../types";

interface GraphNode extends NodeObject {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  color: string;
  val: number;
  itemCount: number;
  bridgeCount: number;
}

interface GraphLink extends LinkObject<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  bridge: Bridge;
  color: string;
  ageDays: number;
  freshness: BridgeFreshness;
  effectiveStrength: number;
  opacity: number;
}

function getItemSummary(item?: Item): string {
  if (!item) {
    return "Unknown item";
  }

  const structured = decodeStructuredItemContent(item);
  return structured?.title
    ? `${structured.title}: ${structured.content}`.trim()
    : structured?.content ?? item.content;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getNodeId(value: string | GraphNode | undefined) {
  return typeof value === "string" ? value : value?.id;
}

function buildWorkbenchBridgeCounts(bridges: Bridge[], items: Item[]) {
  const itemLookup = new Map(items.map((item) => [item.id, item]));
  const counts = new Map<string, number>();

  for (const bridge of bridges) {
    const sourceItem = itemLookup.get(bridge.sourceItemId);
    const targetItem = itemLookup.get(bridge.targetItemId);
    if (!sourceItem || !targetItem) {
      continue;
    }

    counts.set(sourceItem.workbenchId, (counts.get(sourceItem.workbenchId) ?? 0) + 1);
    counts.set(targetItem.workbenchId, (counts.get(targetItem.workbenchId) ?? 0) + 1);
  }

  return counts;
}

function buildGraphData(
  workbenches: Workbench[],
  shops: Array<{ id: string; name: string }>,
  items: Item[],
  bridges: Bridge[]
) {
  const shopLookup = new Map(shops.map((shop) => [shop.id, shop.name]));
  const itemCounts = items.reduce((map, item) => {
    map.set(item.workbenchId, (map.get(item.workbenchId) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const bridgeCounts = buildWorkbenchBridgeCounts(bridges, items);

  const nodes: GraphNode[] = workbenches
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((workbench) => {
      const itemCount = itemCounts.get(workbench.id) ?? 0;
      const bridgeCount = bridgeCounts.get(workbench.id) ?? 0;
      const isArchived = workbench.name.includes("[ARCHIVED]");

      return {
        id: workbench.id,
        shopId: workbench.shopId,
        shopName: shopLookup.get(workbench.shopId) ?? "Untitled workshop",
        name: workbench.name.replace("[ARCHIVED]", "").trim(),
        color: isArchived ? "#6C6A64" : "#CC785C",
        val: Math.max(2, Math.min(14, 3 + itemCount * 0.7 + bridgeCount * 1.1)),
        itemCount,
        bridgeCount,
      };
    });

  const itemLookup = new Map(items.map((item) => [item.id, item]));
  const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
  const links: GraphLink[] = bridges.flatMap((bridge) => {
    const sourceItem = itemLookup.get(bridge.sourceItemId);
    const targetItem = itemLookup.get(bridge.targetItemId);
    if (!sourceItem || !targetItem || sourceItem.workbenchId === targetItem.workbenchId) {
      return [];
    }

    if (!nodeLookup.has(sourceItem.workbenchId) || !nodeLookup.has(targetItem.workbenchId)) {
      return [];
    }

    const freshness = getBridgeFreshness(bridge);
    const effectiveStrength = getEffectiveBridgeStrength(bridge);

    return [
      {
        id: bridge.id,
        source: sourceItem.workbenchId,
        target: targetItem.workbenchId,
        bridge,
        color: getBridgeFreshnessColor(freshness),
        ageDays: Math.round(getBridgeAgeInDays(bridge)),
        freshness,
        effectiveStrength,
        opacity: freshness === "dormant" ? 0.2 : freshness === "established" ? 0.36 : 0.64,
      },
    ];
  });

  return { nodes, links };
}

function graphLabel(node: GraphNode) {
  return `
    <div style="padding:8px 10px">
      <div style="font-weight:600">${escapeHtml(node.name)}</div>
      <div style="opacity:.7;margin-top:3px">${escapeHtml(node.shopName)} - ${node.itemCount} items - ${node.bridgeCount} bridges</div>
    </div>
  `;
}

function linkLabel(link: GraphLink) {
  return `
    <div style="max-width:280px;padding:8px 10px">
      <div style="font-weight:600;text-transform:capitalize">${link.freshness} bridge</div>
      <div style="opacity:.74;margin-top:3px">${escapeHtml(link.bridge.note || "No note recorded.")}</div>
    </div>
  `;
}

function FallbackGraph({
  nodes,
  links,
  onOpenNode,
  onSelectLink,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  onOpenNode: (node: GraphNode) => void;
  onSelectLink: (bridgeId: string) => void;
}) {
  return (
    <div className="grid h-full min-h-[520px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_20rem]" data-testid="constellation-view">
      <div className="ui-panel p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-1)]">
          <Network className="h-4 w-4 text-[var(--ui-accent)]" />
          Project nodes
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {nodes.map((node) => (
            <button key={node.id} type="button" onClick={() => onOpenNode(node)} className="ui-row px-4 py-3 text-left">
              <div className="text-sm font-medium text-[var(--ui-text-1)]">{node.name}</div>
              <div className="mt-1 text-xs text-[var(--ui-text-3)]">{node.shopName} - {node.itemCount} items - {node.bridgeCount} bridges</div>
            </button>
          ))}
        </div>
      </div>
      <div className="ui-panel p-4">
        <div className="mb-4 text-sm font-semibold text-[var(--ui-text-1)]">Bridge lines</div>
        <div className="space-y-2">
          {links.map((link) => (
            <button key={link.id} type="button" onClick={() => onSelectLink(link.id)} className="ui-row w-full px-3 py-2 text-left text-sm text-[var(--ui-text-2)]">
              {link.bridge.note || "Untitled bridge"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConstellationView() {
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [graphFailed, setGraphFailed] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraph3DInstance<GraphNode, GraphLink> | null>(null);
  const { data: shops = [], isLoading: shopsLoading } = useShops();
  const { data: workbenches = [], isLoading: workbenchesLoading, isError } = useAllWorkbenches();
  const { data: items = [], isLoading: itemsLoading } = useAllItems();
  const { data: bridges = [], isLoading: bridgesLoading } = useAllBridges();
  const { data: decayingBridges = [] } = useDecayingBridges();
  const reinforceBridge = useReinforceBridge();
  const setActiveShop = useUiStore((state) => state.setActiveShop);
  const setActiveWorkbench = useUiStore((state) => state.setActiveWorkbench);

  const graphData = useMemo(
    () => buildGraphData(workbenches, shops, items, bridges),
    [bridges, items, shops, workbenches]
  );
  const itemLookup = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const workbenchLookup = useMemo(
    () => new Map(workbenches.map((workbench) => [workbench.id, workbench])),
    [workbenches]
  );
  const selectedBridge = useMemo(
    () => bridges.find((bridge) => bridge.id === selectedBridgeId) ?? null,
    [bridges, selectedBridgeId]
  );

  const matchingNodes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return graphData.nodes;
    }

    return graphData.nodes.filter((node) =>
      [node.name, node.shopName].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [graphData.nodes, query]);

  useEffect(() => {
    if (selectedBridgeId && !bridges.some((bridge) => bridge.id === selectedBridgeId)) {
      setSelectedBridgeId(null);
    }
  }, [bridges, selectedBridgeId]);

  const selectedBridgeContext = useMemo(() => {
    if (!selectedBridge) {
      return null;
    }

    const sourceItem = itemLookup.get(selectedBridge.sourceItemId);
    const targetItem = itemLookup.get(selectedBridge.targetItemId);
    const sourceWorkbench = sourceItem ? workbenchLookup.get(sourceItem.workbenchId) : undefined;
    const targetWorkbench = targetItem ? workbenchLookup.get(targetItem.workbenchId) : undefined;

    return {
      sourceItem,
      targetItem,
      sourceWorkbench,
      targetWorkbench,
      freshness: getBridgeFreshness(selectedBridge),
      ageDays: Math.round(getBridgeAgeInDays(selectedBridge)),
      effectiveStrength: getEffectiveBridgeStrength(selectedBridge).toFixed(1),
    };
  }, [itemLookup, selectedBridge, workbenchLookup]);

  const decayingBridgeCards = useMemo(() => {
    return decayingBridges
      .slice()
      .sort((left, right) => getBridgeAgeInDays(right) - getBridgeAgeInDays(left))
      .slice(0, 6)
      .map((bridge) => {
        const sourceItem = itemLookup.get(bridge.sourceItemId);
        const targetItem = itemLookup.get(bridge.targetItemId);
        const sourceWorkbench = sourceItem ? workbenchLookup.get(sourceItem.workbenchId) : undefined;
        const targetWorkbench = targetItem ? workbenchLookup.get(targetItem.workbenchId) : undefined;

        return {
          bridge,
          sourceItem,
          targetItem,
          sourceWorkbench,
          targetWorkbench,
          ageDays: Math.round(getBridgeAgeInDays(bridge)),
        };
      });
  }, [decayingBridges, itemLookup, workbenchLookup]);

  const handleOpenNode = (node: GraphNode) => {
    setActiveShop(node.shopId);
    setActiveWorkbench(node.id);
  };

  const handleOpenWorkbench = (workbenchId: string, shopId: string) => {
    setActiveShop(shopId);
    setActiveWorkbench(workbenchId);
  };

  const handleReinforce = async (bridgeId: string) => {
    await reinforceBridge.mutateAsync(bridgeId);
    setSelectedBridgeId(bridgeId);
  };

  const focusNode = (node: GraphNode) => {
    const graph = graphRef.current;
    if (!graph || typeof node.x !== "number" || typeof node.y !== "number" || typeof node.z !== "number") {
      return;
    }

    graph.cameraPosition(
      { x: node.x * 1.45, y: node.y * 1.45, z: (node.z || 1) * 1.45 + 170 },
      { x: node.x, y: node.y, z: node.z },
      650
    );
  };

  const resetCamera = () => {
    graphRef.current?.cameraPosition({ x: 0, y: 0, z: 560 }, { x: 0, y: 0, z: 0 }, 650);
  };

  const fitGraph = () => {
    graphRef.current?.zoomToFit(650, 82);
  };

  const toggleFrozen = () => {
    const next = !isFrozen;
    setIsFrozen(next);
    if (next) {
      graphRef.current?.pauseAnimation();
    } else {
      graphRef.current?.resumeAnimation();
    }
  };

  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container || graphFailed) {
      return undefined;
    }

    let graph: ForceGraph3DInstance<GraphNode, GraphLink> | null = null;

    try {
      graph = new ForceGraph3D(container, {
        controlType: "orbit",
        rendererConfig: { antialias: true, alpha: true },
      }) as unknown as ForceGraph3DInstance<GraphNode, GraphLink>;

      graph
        .backgroundColor("#12110F")
        .showNavInfo(false)
        .nodeId("id")
        .linkResolution(8)
        .linkOpacity(0.42)
        .linkCurvature(0.08)
        .linkHoverPrecision(6)
        .warmupTicks(90)
        .cooldownTicks(180)
        .enableNodeDrag(true)
        .nodeLabel((node) => graphLabel(node))
        .linkLabel((link) => linkLabel(link))
        .onNodeClick((node) => handleOpenNode(node))
        .onLinkClick((link) => setSelectedBridgeId(link.id))
        .onBackgroundClick(() => setSelectedBridgeId(null));

      graphRef.current = graph;
      resetCamera();
    } catch {
      setGraphFailed(true);
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.max(320, entry.contentRect.width);
      const height = Math.max(420, entry.contentRect.height);
      graph?.width(width).height(height);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      graph?._destructor();
      graphRef.current = null;
    };
  }, [graphFailed]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }

    graph
      .graphData(graphData)
      .nodeThreeObject((node) => {
        const graphNode = node as GraphNode;
        const normalized = query.trim().toLowerCase();
        const isMatch = normalized && [graphNode.name, graphNode.shopName].some((value) => value.toLowerCase().includes(normalized));
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        
        context.font = "500 14px Inter, sans-serif";
        const textWidth = context.measureText(graphNode.name).width;
        
        canvas.width = textWidth + 24;
        canvas.height = 28;
        
        const ctx = canvas.getContext("2d")!;
        ctx.font = "500 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        if (isMatch) {
          ctx.fillStyle = "rgba(250, 249, 245, 0.15)";
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (isMatch) {
          ctx.strokeStyle = "rgba(250, 249, 245, 0.8)";
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        }
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = isMatch ? "#FAF9F5" : "rgba(250, 249, 245, 0.85)";
        ctx.fillText(graphNode.name, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
        const sprite = new THREE.Sprite(material);
        
        sprite.scale.set(canvas.width * 0.45, canvas.height * 0.45, 1);
        return sprite;
      })
      .linkColor((link) => {
        if (link.id === selectedBridgeId) {
          return "#FAF9F5";
        }
        return link.color;
      })
      .linkWidth((link) => (link.id === selectedBridgeId ? Math.max(1.4, link.effectiveStrength * 0.9) : Math.max(0.4, link.effectiveStrength * 0.45)))
      .linkDirectionalParticles((link) => (link.id === selectedBridgeId ? 3 : link.freshness === "fresh" ? 1 : 0))
      .linkDirectionalParticleWidth((link) => (link.id === selectedBridgeId ? 2.4 : 1.4))
      .linkDirectionalParticleColor(() => "#CC785C");

    window.setTimeout(() => fitGraph(), 80);
  }, [graphData, query, selectedBridgeId]);

  const isLoading = shopsLoading || workbenchesLoading || itemsLoading || bridgesLoading;

  if (isLoading) {
    return (
      <div className="grid h-full gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <SkeletonBlock className="h-full min-h-[560px] w-full rounded-lg" />
        <div className="space-y-4">
          <SkeletonBlock className="h-52 w-full rounded-lg" />
          <SkeletonBlock className="h-80 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Constellation unavailable"
          description="The project graph could not load right now."
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  if (graphFailed) {
    return (
      <FallbackGraph
        nodes={graphData.nodes}
        links={graphData.links}
        onOpenNode={handleOpenNode}
        onSelectLink={setSelectedBridgeId}
      />
    );
  }

  return (
    <div className="grid h-full min-h-0 bg-[var(--ui-surface-0)] lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="relative min-h-0 overflow-hidden">
        <div className="absolute left-4 right-4 top-4 z-10 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-xl rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)] bg-[rgba(24,23,21,0.72)] px-4 py-3 text-[#FAF9F5] backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#A09D96]">
              <Network className="h-4 w-4 text-[var(--ui-accent)]" />
              3D relationship graph
            </div>
            <h1 className="mt-2 font-serif text-3xl leading-tight">Constellation</h1>
            <p className="mt-1 text-sm leading-6 text-[#C5C0B7]">
              Orbit the projects, inspect bridge lines, and open any node back into the workbench.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[rgba(24,23,21,0.72)] p-1 backdrop-blur">
            <AnimatedButton type="button" variant="ghost" size="sm" onClick={fitGraph} className="rounded-full text-[#FAF9F5]">
              <Maximize2 className="h-4 w-4" />
              Fit
            </AnimatedButton>
            <AnimatedButton type="button" variant="ghost" size="sm" onClick={resetCamera} className="rounded-full text-[#FAF9F5]">
              <RotateCcw className="h-4 w-4" />
              Reset
            </AnimatedButton>
            <AnimatedButton type="button" variant="ghost" size="sm" onClick={toggleFrozen} className="rounded-full text-[#FAF9F5]">
              {isFrozen ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isFrozen ? "Resume" : "Freeze"}
            </AnimatedButton>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 w-[min(28rem,calc(100%-2rem))] rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)] bg-[rgba(24,23,21,0.78)] p-3 backdrop-blur">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A09D96]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input h-10 rounded-full border-[rgba(250,249,245,0.14)] bg-[rgba(31,30,27,0.8)] pl-9 text-[#FAF9F5] placeholder:text-[#A09D96]"
              placeholder="Find a project or workshop"
              data-testid="input-constellation-search"
            />
          </div>
          <div className="mt-3 max-h-36 overflow-y-auto">
            {matchingNodes.slice(0, 6).map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => focusNode(node)}
                className="flex w-full items-center justify-between rounded-[var(--ui-radius-md)] px-3 py-2 text-left text-sm text-[#C5C0B7] hover:bg-white/5 hover:text-[#FAF9F5]"
              >
                <span className="truncate">{node.name}</span>
                <span className="text-xs text-[#A09D96]">{node.bridgeCount} links</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={graphContainerRef} className="constellation-canvas h-full w-full" data-testid="constellation-view" />

        {graphData.nodes.length === 0 && (
          <div className="absolute inset-6 z-20 flex items-center justify-center">
            <EmptyState
              title="No projects in the field yet"
              description="Create projects from the workbench canvas and the constellation will start to populate."
              className="w-full max-w-xl"
            />
          </div>
        )}
      </section>

      <aside className="ui-inspector flex min-h-0 flex-col gap-4 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="ui-panel-muted px-3 py-3" data-testid="constellation-stat-projects">
            <div className="ui-kicker">Projects</div>
            <div className="mt-2 font-serif text-2xl text-[var(--ui-text-1)]">{graphData.nodes.length}</div>
          </div>
          <div className="ui-panel-muted px-3 py-3" data-testid="constellation-stat-bridges">
            <div className="ui-kicker">Bridges</div>
            <div className="mt-2 font-serif text-2xl text-[var(--ui-text-1)]">{graphData.links.length}</div>
          </div>
          <div className="ui-panel-muted px-3 py-3">
            <div className="ui-kicker">Dormant</div>
            <div className="mt-2 font-serif text-2xl text-[var(--ui-text-1)]">{decayingBridgeCards.length}</div>
          </div>
        </div>

        <section className="ui-panel p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-1)]">
            <GitBranchPlus className="h-4 w-4 text-[var(--ui-accent)]" />
            Selected Bridge
          </div>

          <AnimatePresence mode="wait">
            {!selectedBridge || !selectedBridgeContext ? (
              <motion.p
                key="bridge-empty"
                className="mt-3 text-sm leading-6 text-[var(--ui-text-3)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                Choose a line in the graph to inspect the note, age, and current strength behind the connection.
              </motion.p>
            ) : (
              <motion.div
                key={selectedBridge.id}
                className="mt-3 space-y-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div>
                  <div className="ui-kicker">
                    {(selectedBridgeContext.sourceWorkbench?.name ?? "Unknown project")} to {(selectedBridgeContext.targetWorkbench?.name ?? "Unknown project")}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ui-text-1)]">{selectedBridge.note}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="ui-panel-muted px-3 py-3">
                    <div className="text-[var(--ui-text-3)]">Strength</div>
                    <div className="mt-1 text-sm font-medium text-[var(--ui-text-1)]">{selectedBridgeContext.effectiveStrength}</div>
                  </div>
                  <div className="ui-panel-muted px-3 py-3">
                    <div className="text-[var(--ui-text-3)]">Age</div>
                    <div className="mt-1 text-sm font-medium text-[var(--ui-text-1)]">{selectedBridgeContext.ageDays}d</div>
                  </div>
                  <div className="ui-panel-muted px-3 py-3">
                    <div className="text-[var(--ui-text-3)]">State</div>
                    <div className="mt-1 text-sm font-medium capitalize text-[var(--ui-text-1)]">{selectedBridgeContext.freshness}</div>
                  </div>
                </div>

                <div className="ui-panel-muted p-3">
                  <div className="ui-kicker">Endpoints</div>
                  <div className="mt-2 space-y-2 text-sm text-[var(--ui-text-2)]">
                    <div>{getItemSummary(selectedBridgeContext.sourceItem)}</div>
                    <div className="text-[var(--ui-text-3)]">to</div>
                    <div>{getItemSummary(selectedBridgeContext.targetItem)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedBridgeContext.sourceWorkbench && (
                    <AnimatedButton
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        handleOpenWorkbench(
                          selectedBridgeContext.sourceWorkbench!.id,
                          selectedBridgeContext.sourceWorkbench!.shopId
                        )
                      }
                    >
                      Open source
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </AnimatedButton>
                  )}
                  {selectedBridgeContext.targetWorkbench && (
                    <AnimatedButton
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        handleOpenWorkbench(
                          selectedBridgeContext.targetWorkbench!.id,
                          selectedBridgeContext.targetWorkbench!.shopId
                        )
                      }
                    >
                      Open target
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </AnimatedButton>
                  )}
                </div>

                <AnimatedButton
                  onClick={() => void handleReinforce(selectedBridge.id)}
                  isLoading={reinforceBridge.isPending}
                  variant="primary"
                  className="w-full justify-center gap-2"
                  data-testid="btn-reinforce-selected-bridge"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Still true
                </AnimatedButton>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="ui-panel p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ui-text-1)]">
            <Sparkles className="h-4 w-4 text-[var(--ui-accent)]" />
            Decay Prompts
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--ui-text-3)]">
            Old bridges fade unless you revisit them on purpose.
          </p>

          {decayingBridgeCards.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ui-text-3)]">No dormant bridges right now.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {decayingBridgeCards.map((entry) => (
                <article key={entry.bridge.id} className="ui-panel-muted p-3">
                  <div className="ui-kicker">
                    {(entry.sourceWorkbench?.name ?? "Unknown")} to {(entry.targetWorkbench?.name ?? "Unknown")}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--ui-text-1)]">
                    You once connected &quot;{getItemSummary(entry.sourceItem)}&quot; to &quot;{getItemSummary(entry.targetItem)}&quot;. Still true?
                  </p>
                  <div className="mt-2 text-xs text-[var(--ui-text-3)]">
                    Last reinforced {formatDistanceToNow(entry.bridge.lastReinforcedAt ?? entry.bridge.createdAt, { addSuffix: true })} - {entry.ageDays} days old
                  </div>
                  <div className="mt-3 flex gap-2">
                    <AnimatedButton
                      variant="ghost"
                      className="text-xs"
                      onClick={() => setSelectedBridgeId(entry.bridge.id)}
                    >
                      View Note
                    </AnimatedButton>
                    <AnimatedButton
                      variant="primary"
                      className="text-xs"
                      onClick={() => void handleReinforce(entry.bridge.id)}
                      isLoading={reinforceBridge.isPending && selectedBridgeId === entry.bridge.id}
                      data-testid={`btn-reinforce-bridge-${entry.bridge.id}`}
                    >
                      Still true
                    </AnimatedButton>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
