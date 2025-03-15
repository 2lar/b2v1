import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, NodeSingular } from 'cytoscape';
import cola from 'cytoscape-cola';
import { GraphData } from '../../../shared/types';
import './GraphVisualization.css';

// Register the cola layout
cytoscape.use(cola);

interface GraphVisualizationProps {
  data: GraphData;
}

interface DisplayNode {
  id: string;
  content: string;
  label: string;
  createdAt: string;
}

// Color spectrum for the visualization - ordered like a rainbow/spectrum
const NODE_COLORS = [
  '#ffcb05', // yellow
  '#ff9500', // orange
  '#ff4800', // orange-red
  '#ff0000', // red
  '#d10f7c', // magenta
  '#9b00d9', // purple
  '#5215e8', // indigo
  '#2e58e8', // blue
  '#00c2dd', // cyan
  '#0dea88', // green
];

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<DisplayNode | null>(null);
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<DisplayNode | null>(null);

  // Initialize cytoscape once on component mount
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'width': 25, // Larger nodes as requested
            'height': 25, // Larger nodes as requested
            'border-width': 2,
            'border-color': 'data(borderColor)',
            'border-opacity': 1,
            'label': '', // No labels for cleaner look
            'transition-property': 'background-color, border-width, border-color, width, height, opacity',
            'transition-duration': 300
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele: { data: (arg0: string) => number; }) => {
              // Scale width based on edge strength
              const strength = ele.data('strength') || 0.5;
              return Math.max(1.5, Math.min(strength * 7, 12));
            },
            'line-color': 'data(color)',
            'opacity': 0.8, // Fixed high opacity for all edges
            'curve-style': 'bezier',
            'transition-property': 'width, line-color, opacity',
            'transition-duration': 300,
            'target-arrow-shape': 'none', // No arrows for cleaner look
            'z-index': 0 // Edges below nodes
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#ffffff',
            'width': 35,
            'height': 35,
            'z-index': 999
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 5,
            'opacity': 1,
            'z-index': 998
          }
        },
        {
          selector: '.highlighted',
          style: {
            'opacity': 1,
            'z-index': 900
          }
        }
      ],
      layout: {
        name: 'grid' // Initial layout, will be replaced
      },
      // Set min/max zoom levels
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3,
      motionBlur: false // Disable motion blur for better performance
    });

    // Store reference to cytoscape instance
    cyRef.current = cy;
    
    return () => {
      // Clean up only when component unmounts
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []); // Empty dependency array means this only runs once on mount

  // Set up event handlers separately to avoid recreating on every state change
  useEffect(() => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    
    const handleNodeTap = (event: cytoscape.EventObject) => {
      const node = event.target as NodeSingular;
      
      if (selectedNode && selectedNode.id === node.id()) {
        // If clicking the same node, toggle pin state
        setIsSidebarPinned(!isSidebarPinned);
      } else {
        // If clicking a new node, select it and pin sidebar
        setSelectedNode({
          id: node.id(),
          content: node.data('content'),
          label: node.data('label'),
          createdAt: node.data('createdAt')
        });
        setIsSidebarPinned(true);
      }
    };
    
    const handleNodeMouseOver = (event: cytoscape.EventObject) => {
      const node = event.target as NodeSingular;
      if (!isSidebarPinned) {
        setHoveredNode({
          id: node.id(),
          content: node.data('content'),
          label: node.data('label'),
          createdAt: node.data('createdAt')
        });
      }
      
      // Highlight connected edges
      const connectedEdges = node.connectedEdges();
      connectedEdges.addClass('highlighted');
    };
    
    const handleNodeMouseOut = () => {
      if (!isSidebarPinned) {
        setHoveredNode(null);
      }
      
      // Remove highlights
      cy.edges().removeClass('highlighted');
    };
    
    const handleBackgroundTap = (event: cytoscape.EventObject) => {
      // If clicking the background (not a node)
      if (event.target === cy) {
        // Unpin sidebar if it's pinned
        if (isSidebarPinned) {
          setIsSidebarPinned(false);
          setSelectedNode(null);
        }
      }
    };
    
    // Add event listeners
    cy.on('tap', 'node', handleNodeTap);
    cy.on('mouseover', 'node', handleNodeMouseOver);
    cy.on('mouseout', 'node', handleNodeMouseOut);
    cy.on('tap', handleBackgroundTap);
    
    // Clean up event listeners when component updates
    return () => {
      cy.removeListener('tap', 'node', handleNodeTap);
      cy.removeListener('mouseover', 'node', handleNodeMouseOver);
      cy.removeListener('mouseout', 'node', handleNodeMouseOut);
      cy.removeListener('tap', handleBackgroundTap);
    };
  }, [selectedNode, isSidebarPinned]); // Only re-run when these states change

  // Update elements when data changes
  useEffect(() => {
    if (!cyRef.current || !data) return;
    
    const cy = cyRef.current;
    
    // Check if we have actual data to show
    if (!data.nodes || !data.edges || data.nodes.length === 0) return;
    
    // Remove all existing elements
    cy.elements().remove();

    // First, assign node clusters based on connectivity
    const clusters = assignClusters(data);
    
    // Add nodes with color data
    data.nodes.forEach(node => {
      const clusterInfo = clusters.get(node.id) || { clusterId: node.id, clusterSize: 1, colorIndex: 0 };
      const color = NODE_COLORS[clusterInfo.colorIndex];
      
      cy.add({
        group: 'nodes',
        data: {
          id: node.id,
          label: node.label,
          content: node.content,
          createdAt: node.createdAt,
          color: color,
          borderColor: color,
          clusterId: clusterInfo.clusterId
        }
      });
    });
    
    // Add edges with color data
    data.edges.forEach(edge => {
      // Get source node's color
      const sourceNode = cy.getElementById(edge.source);
      const sourceColor = sourceNode.data('color');
      
      cy.add({
        group: 'edges',
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          strength: edge.strength,
          color: sourceColor
        }
      });
    });
    
    // Apply layout - modified cola layout to get better spread and visibility
    const layout = cy.layout({
      name: 'cola' as any,
      animate: true,
      refresh: 1,
      maxSimulationTime: 5000,
      nodeSpacing: function() { return 50; },
      edgeLength: function(edge: any) {
        // Stronger connections = shorter edges
        const strength = edge.data('strength') || 0.5;
        return 80 + (1 - strength) * 150;
      },
      // Group nodes by cluster
      alignment: function(node: any) {
        // Nodes in the same cluster tend to align together
        const clusterId = node.data('clusterId');
        if (clusterId) {
          // Create a predictable but varied position for each cluster
          const hash = clusterId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          return {
            x: Math.cos(hash % 360 * Math.PI / 180),
            y: Math.sin(hash % 360 * Math.PI / 180)
          };
        }
        return { x: 0, y: 0 };
      },
      gravity: 0.6,
      fit: true,
      padding: 30,
      randomize: false,
      avoidOverlap: true,
      infinite: false,
      // Higher quality but slower layout
      unconstrIter: 10,
      userConstIter: 15,
      allConstIter: 20,
      // Stop callback
      stop: function() {
        // Ensure edges are visible
        cy.edges().style('opacity', 0.8);
      },
      ready: function() {
        // Initialize edges with full opacity
        cy.edges().style('opacity', 0.8);
        
        // Add a small random offset to nodes to prevent perfect grid alignments
        cy.nodes().positions(function(node, i) {
          const position = node.position();
          return {
            x: position.x + (Math.random() - 0.5) * 20,
            y: position.y + (Math.random() - 0.5) * 20
          };
        });
      }
    } as any);
    
    layout.run();
    
    // Add background effects
    addBackgroundEffects();
    
    // Add subtle animation to nodes
    setTimeout(() => {
      animateNodes();
    }, 2000);
    
  }, [data]); // Only re-run when data changes
  
  // Function to assign clusters and colors to nodes based on connectivity
  const assignClusters = (graphData: GraphData) => {
    // Map to store node cluster assignments: nodeId -> { clusterId, clusterSize, colorIndex }
    const nodeClusters = new Map<string, { clusterId: string, clusterSize: number, colorIndex: number }>();
    
    // Map to track cluster sizes: clusterId -> size
    const clusterSizes = new Map<string, number>();
    
    // Map to assign colors to clusters: clusterId -> colorIndex
    const clusterColors = new Map<string, number>();
    
    // Initialize cluster mapping - each node starts in its own cluster
    graphData.nodes.forEach(node => {
      nodeClusters.set(node.id, { clusterId: node.id, clusterSize: 1, colorIndex: 0 });
      clusterSizes.set(node.id, 1);
    });
    
    // First pass: build the clusters
    graphData.edges.forEach(edge => {
      const sourceCluster = nodeClusters.get(edge.source)!.clusterId;
      const targetCluster = nodeClusters.get(edge.target)!.clusterId;
      
      if (sourceCluster !== targetCluster) {
        // Merge clusters - keep the larger one
        const sourceSize = clusterSizes.get(sourceCluster) || 1;
        const targetSize = clusterSizes.get(targetCluster) || 1;
        
        if (sourceSize >= targetSize) {
          // Merge target into source
          mergeIntoClusters(graphData, nodeClusters, clusterSizes, edge.target, sourceCluster);
        } else {
          // Merge source into target
          mergeIntoClusters(graphData, nodeClusters, clusterSizes, edge.source, targetCluster);
        }
      }
    });
    
    // Second pass: assign colors to clusters
    // Find unique clusters
    const uniqueClusters = new Set<string>();
    nodeClusters.forEach(({ clusterId }) => {
      uniqueClusters.add(clusterId);
    });
    
    // Sort clusters by size for deterministic coloring
    const sortedClusters = Array.from(uniqueClusters).sort((a, b) => {
      return (clusterSizes.get(b) || 0) - (clusterSizes.get(a) || 0);
    });
    
    // Assign colors to clusters - larger ones first, using the spectrum
    sortedClusters.forEach((clusterId, index) => {
      clusterColors.set(clusterId, index % NODE_COLORS.length);
    });
    
    // Update node records with cluster colors
    nodeClusters.forEach((value, nodeId) => {
      const colorIndex = clusterColors.get(value.clusterId) || 0;
      nodeClusters.set(nodeId, { ...value, colorIndex });
    });
    
    return nodeClusters;
  };
  
  // Helper to merge a node into a cluster
  const mergeIntoClusters = (
    graphData: GraphData,
    nodeClusters: Map<string, { clusterId: string, clusterSize: number, colorIndex: number }>,
    clusterSizes: Map<string, number>,
    nodeId: string,
    newClusterId: string
  ) => {
    // Skip if already in this cluster
    if (nodeClusters.get(nodeId)?.clusterId === newClusterId) return;
    
    const oldClusterId = nodeClusters.get(nodeId)?.clusterId || nodeId;
    
    // Update the node's cluster
    nodeClusters.set(nodeId, { 
      ...nodeClusters.get(nodeId)!,
      clusterId: newClusterId 
    });
    
    // Update cluster sizes
    const oldSize = clusterSizes.get(oldClusterId) || 1;
    const newSize = clusterSizes.get(newClusterId) || 1;
    
    clusterSizes.set(oldClusterId, oldSize - 1);
    clusterSizes.set(newClusterId, newSize + 1);
    
    // Recursively merge connected nodes
    graphData.edges.forEach(edge => {
      if (edge.source === nodeId && nodeClusters.get(edge.target)?.clusterId === oldClusterId) {
        mergeIntoClusters(graphData, nodeClusters, clusterSizes, edge.target, newClusterId);
      } else if (edge.target === nodeId && nodeClusters.get(edge.source)?.clusterId === oldClusterId) {
        mergeIntoClusters(graphData, nodeClusters, clusterSizes, edge.source, newClusterId);
      }
    });
  };
  
  // Create background star effect
  const addBackgroundEffects = () => {
    if (!containerRef.current) return;
    
    // Clear any existing canvas
    const existingCanvas = containerRef.current.querySelector('.star-background');
    if (existingCanvas) {
      existingCanvas.remove();
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.setAttribute('class', 'star-background');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    
    containerRef.current.appendChild(canvas);
    
    // Set canvas size
    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create stars
    const stars: {x: number, y: number, size: number, opacity: number}[] = [];
    
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    
    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * (0.5 + Math.sin(Date.now() / 1000) * 0.5)})`;
        ctx.fill();
        
        // Slowly move stars
        star.y -= 0.05;
        
        // Reset stars that go off screen
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Animate nodes with subtle movement
  const animateNodes = () => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    
    // Add subtle randomized movement to nodes
    cy.nodes().forEach(node => {
      const randomDelay = Math.random() * 8000;
      const randomDuration = 3000 + Math.random() * 5000;
      
      setTimeout(() => {
        animateNode(node, randomDuration);
      }, randomDelay);
    });
  };
  
  // Subtle animation for nodes
  const animateNode = (node: any, duration: number) => {
    if (!cyRef.current) return;
    
    // Original position
    const originalPos = node.position();
    
    // Don't animate if node is being dragged
    if (node.grabbed()) return;
    
    // Small random movement
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    
    node.animate({
      position: { x: originalPos.x + offsetX, y: originalPos.y + offsetY },
      style: { opacity: 1 }
    }, {
      duration: duration / 2,
      easing: 'ease-in-out-sine',
      complete: function() {
        node.animate({
          position: { x: originalPos.x, y: originalPos.y }
        }, {
          duration: duration / 2,
          easing: 'ease-in-out-sine',
          complete: function() {
            // Continue animation with random delay
            setTimeout(() => {
              animateNode(node, duration);
            }, Math.random() * 3000);
          }
        });
      }
    });
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  };
  
  // Function to reset view (fit graph to viewport)
  const handleResetView = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50); // 50px padding
      cyRef.current.center();
    }
  };

  // Determine if sidebar should be visible
  const displayNode = selectedNode || (!isSidebarPinned && hoveredNode);
  const sidebarClass = `graph-sidebar ${displayNode ? 'visible' : ''} ${isSidebarPinned ? 'pinned' : ''}`;

  return (
    <div className="graph-container">
      <div className="graph-tools">
        <button className="reset-view-button" onClick={handleResetView}>
          Reset View
        </button>
      </div>
      
      <div ref={containerRef} className="graph-visualization"></div>
      
      <div className={sidebarClass}>
        {displayNode && (
          <>
            <div className="sidebar-header">
              <h3>{displayNode.label}</h3>
              {isSidebarPinned && (
                <button 
                  className="unpin-button"
                  onClick={() => {
                    setIsSidebarPinned(false);
                    setSelectedNode(null);
                  }}
                  aria-label="Close sidebar"
                >
                  ×
                </button>
              )}
            </div>
            <div className="sidebar-date">{formatDate(displayNode.createdAt)}</div>
            <div className="sidebar-content">{displayNode.content}</div>
            <div className="sidebar-footer">
              {!isSidebarPinned && (
                <div className="sidebar-instruction">Click to pin this note</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GraphVisualization;