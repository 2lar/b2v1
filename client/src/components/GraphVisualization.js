import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import './GraphVisualization.css';

// Register the cola layout
cytoscape.use(cola);

const GraphVisualization = ({ data }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);

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
            'background-color': '#3498db',
            // Remove labels for cleaner look
            'label': '', 
            'width': 20,
            'height': 20,
            'border-width': 2,
            'border-color': '#2980b9',
            'transition-property': 'background-color, border-width, border-color, width, height',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'data(strength)',
            'line-color': '#95a5a6',
            'curve-style': 'bezier',
            'opacity': 0.7,
            'transition-property': 'width, line-color',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#e74c3c',
            'width': 25,
            'height': 25
          }
        },
        {
          selector: 'node:active',
          style: {
            'background-color': '#2ecc71',
            'width': 25,
            'height': 25
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 3,
            'line-color': '#e74c3c',
          }
        }
      ],
      layout: {
        name: 'grid' // Initial layout
      },
      // Set min/max zoom levels to prevent "losing" the graph
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3, // Make zoom less sensitive
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
    
    const handleNodeTap = (event) => {
      const node = event.target;
      
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
    
    const handleNodeMouseOver = (event) => {
      const node = event.target;
      if (!isSidebarPinned) {
        setHoveredNode({
          id: node.id(),
          content: node.data('content'),
          label: node.data('label'),
          createdAt: node.data('createdAt')
        });
      }
    };
    
    const handleNodeMouseOut = () => {
      if (!isSidebarPinned) {
        setHoveredNode(null);
      }
    };
    
    const handleBackgroundTap = (event) => {
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
    
    // Convert to cytoscape format
    const elements = [
      ...data.nodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          content: node.content,
          createdAt: node.createdAt
        },
        group: 'nodes',
      })),
      ...data.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          strength: edge.strength * 5, // Scale up for visibility
        },
        group: 'edges',
      })),
    ];

    // Update elements
    cy.elements().remove();
    cy.add(elements);
    
    // Apply layout
    const layout = cy.layout({
      name: 'cola',
      animate: true,
      refresh: 1,
      maxSimulationTime: 4000,
      nodeSpacing: 40,
      edgeLength: function(edge) {
        return 100 / (edge.data('strength') || 1);
      },
      fit: true,
      padding: 30,
    });
    
    layout.run();
  }, [data]); // Only re-run when data changes

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { 
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