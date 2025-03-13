import React, { useState, useEffect } from 'react';
import { GraphData } from '../../../shared/types';
import { graphApi } from '../services/api';
import GraphVisualization from '../components/GraphVisualization';
import './GraphPage.css';

const GraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const response = await graphApi.getGraphData();
      setGraphData(response);
      setError('');
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError('Failed to load knowledge graph. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchGraphData();
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      await graphApi.recalculateConnections();
      await fetchGraphData();
      setError('');
    } catch (err) {
      console.error('Error recalculating connections:', err);
      setError('Failed to recalculate connections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="graph-page">
      <div className="graph-header">
        <h1>Knowledge Graph</h1>
        <div className="graph-actions">
          <button onClick={handleRefresh} className="refresh-button">
            Refresh
          </button>
          <button onClick={handleRecalculate} className="recalculate-button">
            Recalculate Connections
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-container">Loading knowledge graph...</div>
      ) : graphData.nodes.length === 0 ? (
        <div className="empty-container">
          <p>No data available for visualization yet.</p>
          <p>Add more notes to start building your knowledge graph.</p>
        </div>
      ) : (
        <>
          <div className="graph-info">
            <p>Nodes: {graphData.nodes.length}</p>
            <p>Connections: {graphData.edges.length}</p>
            <p className="graph-tip">Tip: Click on a node to see its content.</p>
          </div>
          
          <div className="graph-visualization-container">
            <GraphVisualization data={graphData} />
          </div>
        </>
      )}
    </div>
  );
};

export default GraphPage;