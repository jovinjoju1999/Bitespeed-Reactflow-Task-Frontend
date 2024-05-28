import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import Sidebar from "../sidebar/Sidebar";
import NavigationBar from "./NavigationBar";
import "reactflow/dist/style.css";
import Node from "../ui/Node";
import MessageBox from "../sidebar/MessageBox";
import { Alert, Snackbar } from "@mui/material";

const bgstyle = {
  backgroundColor: "#ffffff",
  height: "80%",
  width: "60%",
};

// Create node types
const nodeTypes = { custom: Node };

// Create node IDs
let id = 1;
const getId = () => `node_${id++}`;

const MainView = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodeLabel, setNodeLabel] = useState("textNode");
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorSnackbarMsg, setErrorSnackbarMsg] = useState("");

  // error message
  const showError = (snackBarMsg) => {
    setErrorSnackbarOpen(true);
    setErrorSnackbarMsg(snackBarMsg);
  };

  //Node Connections
  const onConnect = useCallback(
    (params) => {
      if (params.source === params.target) {
        showError(
          "Connection error: source handle cannot link to its own target handle!"
        );
        return;
      }

      // Create edge
      setEdges((edg) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: "arrow" },
            style: {
              strokeWidth: 3,
            },
          },
          edg
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = e.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      // Calculate node position and create new node
      const position = reactFlowInstance.project({
        x: e.clientX - reactFlowBounds.left,
        y: e.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: nodeLabel },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodeLabel, setNodes]
  );

  //Node selection for display
  const handleNodeSelection = (e, node) => {
    setNodeLabel(node.data.label);
    setSelectedNodeId((prev) => {
      if (prev) {
        if (prev !== node.id) {
          return node.id;
        }

        setNodes((prev) => {
          let currentNode = prev?.find((p) => p.id === node.id);
          if (currentNode) {
            currentNode.selected = false;
          }
          return [...prev];
        });
        return null;
      }
      return node.id;
    });
  };

  const handlePaneClick = (e) => {
    setSelectedNodeId(null);
  };

  // Update node title
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          node.data = {
            ...node.data,
            label: nodeLabel,
          };
        }
        return node;
      })
    );
  }, [nodeLabel, setNodes, selectedNodeId]);

  return (
    <div>
      <div
        className="reactFlow-wrapper"
        ref={reactFlowWrapper}
        style={{ height: 900, width: 1500 }}
      >
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeSelection}
          onPaneClick={handlePaneClick}
          style={bgstyle}
        >
          <Background />
          <Controls />
        </ReactFlow>
        <NavigationBar nodes={nodes} edges={edges} />
        {selectedNodeId === null ? (
          <Sidebar />
        ) : (
          <MessageBox
            nodeLabel={nodeLabel}
            nodes={nodes}
            setNodes={setNodes}
            setNodeLabel={setNodeLabel}
            setSelectedNodeId={setSelectedNodeId}
          />
        )}
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={errorSnackbarOpen}
        autoHideDuration={2500}
        onClose={() => setErrorSnackbarOpen(false)}
      >
        <Alert severity="error">{errorSnackbarMsg}</Alert>
      </Snackbar>
    </div>
  );
};

export default MainView;
