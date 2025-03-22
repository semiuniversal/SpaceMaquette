import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, ButtonGroup, Tooltip, Typography, Paper, Slider } from '@mui/material';
import { 
  Create as PencilIcon,
  Timeline as LineIcon,
  RadioButtonUnchecked as CircleIcon,
  Gesture as PolygonIcon,
  FormatColorFill as FillIcon,
  Delete as EraserIcon,
  ColorLens as ColorPickerIcon,
  Save as SaveIcon,
  Layers as LayersIcon,
  CameraAlt as CameraIcon,
  Crop as CropIcon
} from '@mui/icons-material';
import { NoGoRegion } from '../../types';

interface MapPreviewProps {
  overheadImage?: string;
  heightMap?: string;
  noGoRegions: NoGoRegion[];
  onNoGoRegionsChange: (regions: NoGoRegion[]) => void;
  onTakeOverheadImage: () => void;
  onScanRegion: () => void;
  currentPosition: { x: number; y: number; pan: number; tilt: number };
}

type DrawingTool = 'pencil' | 'line' | 'circle' | 'polygon' | 'fill' | 'eraser' | 'picker';
type DrawingColor = 'green' | 'red';

const MapPreview: React.FC<MapPreviewProps> = ({
  overheadImage,
  heightMap,
  noGoRegions,
  onNoGoRegionsChange,
  onTakeOverheadImage,
  onScanRegion,
  currentPosition
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [currentColor, setCurrentColor] = useState<DrawingColor>('green');
  const [showHeightMap, setShowHeightMap] = useState(true);
  const [showNoGoRegions, setShowNoGoRegions] = useState(true);
  const [opacity, setOpacity] = useState(70);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);
  
  // Mock height map data for legend
  const heightRange = {
    min: 0,
    max: 100
  };
  
  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background image if available
        if (overheadImage) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            drawLayers();
          };
          img.src = overheadImage;
        } else {
          // Draw placeholder grid
          drawPlaceholderGrid(ctx, canvas.width, canvas.height);
          drawLayers();
        }
      }
    }
  }, [overheadImage, heightMap, noGoRegions, showHeightMap, showNoGoRegions, opacity]);
  
  const drawLayers = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Draw height map if available and enabled
    if (heightMap && showHeightMap) {
      const img = new Image();
      img.onload = () => {
        ctx.globalAlpha = opacity / 100;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
        
        // Draw no-go regions if enabled
        if (showNoGoRegions) {
          drawNoGoRegions(ctx);
        }
        
        // Draw current position indicator
        drawPositionIndicator(ctx);
      };
      img.src = heightMap;
    } else {
      // Draw no-go regions if enabled
      if (showNoGoRegions) {
        drawNoGoRegions(ctx);
      }
      
      // Draw current position indicator
      drawPositionIndicator(ctx);
    }
  };
  
  const drawPlaceholderGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Draw grid
    const gridSize = 20;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw border
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Overhead Image Not Available', width / 2, height / 2 - 10);
    ctx.fillText('Use "Take Overhead Image" to capture', width / 2, height / 2 + 10);
  };
  
  const drawNoGoRegions = (ctx: CanvasRenderingContext2D) => {
    noGoRegions.forEach(region => {
      ctx.fillStyle = region.color === '#ff0000' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';
      ctx.strokeStyle = region.color;
      ctx.lineWidth = 2;
      
      if (region.type === 'rectangle') {
        const [topLeft, bottomRight] = region.points;
        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;
        
        ctx.fillRect(topLeft.x, topLeft.y, width, height);
        ctx.strokeRect(topLeft.x, topLeft.y, width, height);
      } else if (region.type === 'circle') {
        const [center, edge] = region.points;
        const radius = Math.sqrt(
          Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
        );
        
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (region.type === 'polygon') {
        ctx.beginPath();
        ctx.moveTo(region.points[0].x, region.points[0].y);
        
        for (let i = 1; i < region.points.length; i++) {
          ctx.lineTo(region.points[i].x, region.points[i].y);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });
  };
  
  const drawPositionIndicator = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { x, y, pan } = currentPosition;
    
    // Scale position to canvas
    const canvasX = (x / 300) * canvas.width;
    const canvasY = (y / 300) * canvas.height;
    
    // Draw position dot
    ctx.fillStyle = '#00bcd4';
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw direction indicator (frustum)
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 2;
    
    const radians = (pan * Math.PI) / 180;
    const fovRadians = (120 * Math.PI) / 180;
    const length = 30;
    
    const leftAngle = radians - fovRadians / 2;
    const rightAngle = radians + fovRadians / 2;
    
    const leftX = canvasX + Math.cos(leftAngle) * length;
    const leftY = canvasY + Math.sin(leftAngle) * length;
    const rightX = canvasX + Math.cos(rightAngle) * length;
    const rightY = canvasY + Math.sin(rightAngle) * length;
    
    ctx.beginPath();
    ctx.moveTo(canvasX, canvasY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.stroke();
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    
    if (currentTool === 'pencil' || currentTool === 'eraser') {
      setPoints([{ x, y }]);
    } else if (currentTool === 'line' || currentTool === 'circle') {
      setStartPoint({ x, y });
    } else if (currentTool === 'polygon') {
      if (points.length === 0) {
        setPoints([{ x, y }]);
      } else {
        setPoints([...points, { x, y }]);
      }
    } else if (currentTool === 'fill') {
      // In a real implementation, this would use a flood fill algorithm
      // For now, we'll just add a rectangle covering a portion of the canvas
      const newRegion: NoGoRegion = {
        id: `nogo-${Date.now()}`,
        type: 'rectangle',
        points: [
          { x: x - 50, y: y - 50 },
          { x: x + 50, y: y + 50 }
        ],
        color: currentColor === 'green' ? '#00ff00' : '#ff0000'
      };
      
      onNoGoRegionsChange([...noGoRegions, newRegion]);
    } else if (currentTool === 'picker') {
      // In a real implementation, this would pick the color at the clicked point
      // For now, we'll just toggle between red and green
      setCurrentColor(currentColor === 'green' ? 'red' : 'green');
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'pencil' || currentTool === 'eraser') {
      setPoints([...points, { x, y }]);
      
      // Draw temporary line
      const ctx = canvas.getContext('2d');
      if (ctx && points.length > 0) {
        ctx.strokeStyle = currentTool === 'pencil' 
          ? (currentColor === 'green' ? '#00ff00' : '#ff0000')
          : '#000000';
        ctx.lineWidth = currentTool === 'eraser' ? 10 : 2;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'pencil' && points.length > 1) {
      const newRegion: NoGoRegion = {
        id: `nogo-${Date.now()}`,
        type: 'polygon',
        points: [...points],
        color: currentColor === 'green' ? '#00ff00' : '#ff0000'
      };
      
      onNoGoRegionsChange([...noGoRegions, newRegion]);
      setPoints([]);
    } else if (currentTool === 'eraser' && points.length > 1) {
      // In a real implementation, this would erase regions that intersect with the path
      // For now, we'll just remove the last added region
      if (noGoRegions.length > 0) {
        onNoGoRegionsChange(noGoRegions.slice(0, -1));
      }
      setPoints([]);
    } else if (currentTool === 'line' && startPoint) {
      const newRegion: NoGoRegion = {
        id: `nogo-${Date.now()}`,
        type: 'polygon',
        points: [startPoint, { x, y }],
        color: currentColor === 'green' ? '#00ff00' : '#ff0000'
      };
      
      onNoGoRegionsChange([...noGoRegions, newRegion]);
      setStartPoint(null);
    } else if (currentTool === 'circle' && startPoint) {
      const radius = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );
      
      const newRegion: NoGoRegion = {
        id: `nogo-${Date.now()}`,
        type: 'circle',
        points: [startPoint, { x, y }],
        color: currentColor === 'green' ? '#00ff00' : '#ff0000'
      };
      
      onNoGoRegionsChange([...noGoRegions, newRegion]);
      setStartPoint(null);
    }
    
    setIsDrawing(false);
  };
  
  const handleDoubleClick = () => {
    if (!editMode || currentTool !== 'polygon' || points.length < 3) return;
    
    const newRegion: NoGoRegion = {
      id: `nogo-${Date.now()}`,
      type: 'polygon',
      points: [...points],
      color: currentColor === 'green' ? '#00ff00' : '#ff0000'
    };
    
    onNoGoRegionsChange([...noGoRegions, newRegion]);
    setPoints([]);
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setPoints([]);
    setStartPoint(null);
    setIsDrawing(false);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Toggle Height Map">
            <Button 
              onClick={() => setShowHeightMap(!showHeightMap)}
              variant={showHeightMap ? 'contained' : 'outlined'}
              color="primary"
            >
              <LayersIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Toggle No-Go Regions">
            <Button 
              onClick={() => setShowNoGoRegions(!showNoGoRegions)}
              variant={showNoGoRegions ? 'contained' : 'outlined'}
              color="primary"
            >
              <LayersIcon fontSize="small" />
            </Button>
          </Tooltip>
        </ButtonGroup>
        
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="Take Overhead Image">
            <Button onClick={onTakeOverheadImage} color="primary">
              <CameraIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Scan Region">
            <Button onClick={onScanRegion} color="primary">
              <CropIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title={editMode ? "Exit Edit Mode" : "Edit No-Go Regions"}>
            <Button 
              onClick={toggleEditMode}
              variant={editMode ? 'contained' : 'outlined'}
              color="primary"
            >
              {editMode ? "Save" : "Edit No-Go"}
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Box>
      
      {editMode && (
        <Box sx={{ mb: 1 }}>
          <Paper sx={{ p: 1, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Drawing Tools
            </Typography>
            <ButtonGroup size="small" variant="outlined" sx={{ mb: 1 }}>
              <Tooltip title="Pencil">
                <Button 
                  onClick={() => setCurrentTool('pencil')}
                  variant={currentTool === 'pencil' ? 'contained' : 'outlined'}
                >
                  <PencilIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Line">
                <Button 
                  onClick={() => setCurrentTool('line')}
                  variant={currentTool === 'line' ? 'contained' : 'outlined'}
                >
                  <LineIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Circle">
                <Button 
                  onClick={() => setCurrentTool('circle')}
                  variant={currentTool === 'circle' ? 'contained' : 'outlined'}
                >
                  <CircleIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Polygon">
                <Button 
                  onClick={() => setCurrentTool('polygon')}
                  variant={currentTool === 'polygon' ? 'contained' : 'outlined'}
                >
                  <PolygonIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Fill">
                <Button 
                  onClick={() => setCurrentTool('fill')}
                  variant={currentTool === 'fill' ? 'contained' : 'outlined'}
                >
                  <FillIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Eraser">
                <Button 
                  onClick={() => setCurrentTool('eraser')}
                  variant={currentTool === 'eraser' ? 'contained' : 'outlined'}
                >
                  <EraserIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Tooltip title="Color Picker">
                <Button 
                  onClick={() => setCurrentTool('picker')}
                  variant={currentTool === 'picker' ? 'contained' : 'outlined'}
                >
                  <ColorPickerIcon fontSize="small" />
                </Button>
              </Tooltip>
            </ButtonGroup>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                Color:
              </Typography>
              <ButtonGroup size="small">
                <Button 
                  onClick={() => setCurrentColor('green')}
                  variant={currentColor === 'green' ? 'contained' : 'outlined'}
                  sx={{ bgcolor: currentColor === 'green' ? 'success.main' : 'transparent', minWidth: '30px' }}
                >
                  Go
                </Button>
                <Button 
                  onClick={() => setCurrentColor('red')}
                  variant={currentColor === 'red' ? 'contained' : 'outlined'}
                  sx={{ bgcolor: currentColor === 'red' ? 'error.main' : 'transparent', minWidth: '30px' }}
                >
                  No-Go
                </Button>
              </ButtonGroup>
            </Box>
          </Paper>
        </Box>
      )}
      
      <Box sx={{ position: 'relative', flexGrow: 1, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'block',
            cursor: editMode ? 'crosshair' : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />
        
        {/* Height map legend */}
        {showHeightMap && (
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 10, 
              right: 10, 
              width: 30, 
              height: 150,
              bgcolor: 'background.paper',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 1,
              p: 0.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Box 
              sx={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(to top, #000000, #ffffff)',
                mb: 0.5
              }} 
            />
            <Typography variant="caption">{heightRange.max} cm</Typography>
            <Typography variant="caption">{heightRange.min} cm</Typography>
          </Box>
        )}
        
        {/* Opacity control */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            width: 150,
            bgcolor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 1,
            p: 1
          }}
        >
          <Typography variant="caption" gutterBottom>
            Overlay Opacity: {opacity}%
          </Typography>
          <Slider
            size="small"
            value={opacity}
            onChange={(_, newValue) => setOpacity(newValue as number)}
            min={0}
            max={100}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MapPreview;
