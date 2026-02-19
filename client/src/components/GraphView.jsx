import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import axios from "axios";
import Card from "./ui/Card";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Simple force-directed layout for node positioning
function computeLayout(nodes, edges, width, height) {
  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n, vx: 0, vy: 0 }]));
  const centerX = width / 2;
  const centerY = height / 2;

  // Initialize positions in a circle
  const n = nodeMap.size;
  let i = 0;
  nodeMap.forEach((node) => {
    const angle = (2 * Math.PI * i) / n;
    node.x = centerX + Math.cos(angle) * Math.min(width, height) * 0.35;
    node.y = centerY + Math.sin(angle) * Math.min(width, height) * 0.35;
    i++;
  });

  // Run a few iterations of force-directed layout
  const iterations = 80;
  const repulsion = 800;
  const attraction = 0.05;

  for (let iter = 0; iter < iterations; iter++) {
    nodeMap.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
    });

    // Repulsion between nodes
    const nodeList = Array.from(nodeMap.values());
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i];
        const b = nodeList[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    // Attraction along edges
    edges.forEach((edge) => {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = dist * attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    });

    // Apply and clamp to bounds
    const padding = 40;
    nodeMap.forEach((node) => {
      node.x += node.vx * 0.1;
      node.y += node.vy * 0.1;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });
  }

  return Array.from(nodeMap.values());
}

function GraphView({ data }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const isRenderingRef = useRef(false);
  const lastDimensionsRef = useRef({ width: 800, height: 400 });
  
  // Build ring membership map
  const ringMembership = useMemo(() => {
    const map = new Map();
    if (data?.fraud_rings) {
      data.fraud_rings.forEach((ring) => {
        ring.member_accounts?.forEach((accountId) => {
          map.set(accountId, ring.ring_id);
        });
      });
    }
    return map;
  }, [data?.fraud_rings]);

  const fetchGraphData = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/graph`);
      const { nodes, edges } = response.data;
      if (!nodes || !Array.isArray(nodes)) {
        setGraphData({ nodes: [], edges: edges || [] });
      } else {
        setGraphData({ nodes, edges: edges || [] });
      }
    } catch (err) {
      console.error("[GraphView] Error fetching graph data:", err);
      setError(err.message || "Failed to load graph");
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [data, fetchGraphData]);

  // Observe container size with debouncing and change detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading) return;

    let timeoutId = null;
    const updateSize = () => {
      if (container && !isRenderingRef.current) {
        const rect = container.getBoundingClientRect();
        const newWidth = Math.max(400, rect.width || 800);
        const newHeight = Math.max(320, rect.height || 400);
        
        // Only update if dimensions changed significantly (more than 5px difference)
        const lastDims = lastDimensionsRef.current;
        const widthDiff = Math.abs(newWidth - lastDims.width);
        const heightDiff = Math.abs(newHeight - lastDims.height);
        
        if (widthDiff > 5 || heightDiff > 5) {
          lastDimensionsRef.current = { width: newWidth, height: newHeight };
          setDimensions({ width: newWidth, height: newHeight });
        }
      }
    };

    // Initial size calculation
    updateSize();
    
    // Debounced resize observer
    const ro = new ResizeObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 150); // 150ms debounce
    });
    
    ro.observe(container);
    return () => {
      ro.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // Render SVG when we have data and dimensions
  useEffect(() => {
    if (loading || !svgRef.current || graphData.nodes.length === 0) {
      return;
    }

    // Prevent concurrent renders
    if (isRenderingRef.current) return;
    isRenderingRef.current = true;

    const { width, height } = dimensions;
    const positionedNodes = computeLayout(
      graphData.nodes,
      graphData.edges,
      width,
      height
    );

    const svg = svgRef.current;
    if (!svg) {
      isRenderingRef.current = false;
      return;
    }
    
    svg.innerHTML = "";
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Draw edges first - highlight ring edges
    graphData.edges.forEach((edge) => {
      const source = positionedNodes.find((n) => n.id === edge.source);
      const target = positionedNodes.find((n) => n.id === edge.target);
      if (!source || !target) return;

      const sourceRing = ringMembership.get(edge.source);
      const targetRing = ringMembership.get(edge.target);
      const isRingEdge = sourceRing && targetRing && sourceRing === targetRing;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", source.x);
      line.setAttribute("y1", source.y);
      line.setAttribute("x2", target.x);
      line.setAttribute("y2", target.y);
      
      if (isRingEdge) {
        // Highlight fraud ring edges
        line.setAttribute("stroke", "#ef4444");
        line.setAttribute("stroke-width", "2.5");
        line.setAttribute("opacity", "0.8");
      } else {
        line.setAttribute("stroke", edge.color || "#cbd5e1");
        line.setAttribute("stroke-width", edge.size || 1);
        line.setAttribute("opacity", "0.4");
      }
      svg.appendChild(line);
    });

    // Draw nodes - highlight fraud ring members
    positionedNodes.forEach((node) => {
      const isFanIn = node.in_degree > node.out_degree + 3;
      const isFanOut = node.out_degree > node.in_degree + 3;
      const isRingMember = ringMembership.has(node.id);
      const isSuspicious = (node.suspicion_score || 0) >= 80;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", node.x);
      circle.setAttribute("cy", node.y);
      
      // Larger nodes for ring members and suspicious accounts
      const baseRadius = Math.max(4, Math.min(12, node.size || 6));
      const radius = isRingMember || isSuspicious ? baseRadius * 1.3 : baseRadius;
      circle.setAttribute("r", radius);
      
      // Color coding: ring members get red, suspicious get orange, others blue
      if (isRingMember) {
        circle.setAttribute("fill", "#ef4444");
        circle.setAttribute("stroke", "#991b1b");
        circle.setAttribute("stroke-width", "3");
        circle.style.filter = "drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))";
      } else if (isSuspicious) {
        circle.setAttribute("fill", "#f97316");
        circle.setAttribute("stroke", "#c2410c");
        circle.setAttribute("stroke-width", "2.5");
        circle.style.filter = "drop-shadow(0 0 6px rgba(249, 115, 22, 0.7))";
      } else {
        circle.setAttribute("fill", node.color || "#3b82f6");
        circle.setAttribute("stroke", "#0f172a");
        circle.setAttribute("stroke-width", "1.5");
      }
      
      if (isFanIn || isFanOut) {
        circle.setAttribute("stroke", isFanIn ? "#22c55e" : "#f97316");
        if (!isRingMember && !isSuspicious) {
          circle.setAttribute("stroke-width", "2.5");
        }
      }

      circle.setAttribute("data-id", node.id);
      circle.style.cursor = "pointer";

      circle.addEventListener("mouseenter", () => setHoveredNode(node.id));
      circle.addEventListener("mouseleave", () => setHoveredNode(null));
      circle.addEventListener("click", () => console.log("Node clicked:", node));
      svg.appendChild(circle);
    });
    
    // Mark rendering as complete after DOM updates
    requestAnimationFrame(() => {
      isRenderingRef.current = false;
    });
  }, [loading, graphData.nodes.length, graphData.edges.length, dimensions.width, dimensions.height, data?.fraud_rings]);

  const hoveredNodeData = graphData.nodes.find((n) => n.id === hoveredNode);

  return (
    <Card
      title="Interactive Graph Visualization"
      subtitle="All account nodes with directed edges representing money flow. Fraud rings are clearly highlighted."
    >
      {error && (
        <div className="mb-3 rounded-2xl border border-red-100 bg-red-50/80 px-3 py-2 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-200">
          Failed to load graph: {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 dark:border-primary-900 dark:border-t-primary-400" />
        </div>
      ) : graphData.nodes.length === 0 ? (
        <div className="flex h-80 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          Upload a CSV to render the transaction graph.
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800/80 dark:bg-slate-900/60"
            style={{ minHeight: "320px", height: "500px" }}
          >
            <svg
              ref={svgRef}
              className="block w-full h-full"
              style={{ minHeight: "320px", maxHeight: "500px" }}
            />
          </div>

          {hoveredNodeData && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Node Details
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Account ID:</span> {hoveredNodeData.label}
                </div>
                <div>
                  <span className="font-medium">Fraud Score:</span>{" "}
                  {hoveredNodeData.suspicion_score || 0}
                </div>
                <div>
                  <span className="font-medium">Fan-In Degree:</span> {hoveredNodeData.in_degree}
                </div>
                <div>
                  <span className="font-medium">Fan-Out Degree:</span> {hoveredNodeData.out_degree}
                </div>
                {hoveredNodeData.ring_id && (
                  <div className="col-span-2">
                    <span className="font-medium">Ring ID:</span> {hoveredNodeData.ring_id}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Normal node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border-2 border-red-700" />
              <span>Fraud ring member</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.7)]" />
              <span>Suspicious node (≥80 score)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-400" />
              <span>Fan-in hub</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-amber-400" />
              <span>Fan-out hub</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default GraphView;
