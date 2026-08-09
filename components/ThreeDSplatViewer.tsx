import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { AppState, Gender, StyleOption } from '../types';
import { 
  HAIR_COLORS, 
  HAIR_STYLES_MALE, 
  HAIR_STYLES_FEMALE, 
  BEARD_STYLES, 
  OUTFIT_STYLES
} from '../constants';
import { uploadImageToStorage } from '../services/firebase';

interface ThreeDSplatViewerProps {
  uid: string;
  appState: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onClose: () => void;
}

interface SplatPoint {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  originalColor: { r: number; g: number; b: number };
  styledColor: { r: number; g: number; b: number };
  type: 'skin' | 'hair' | 'beard' | 'eyes' | 'clothes';
  size: number;
}

export const ThreeDSplatViewer: React.FC<ThreeDSplatViewerProps> = ({
  uid,
  appState,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // View states
  const [viewMode, setViewMode] = useState<'3d' | '25d'>('3d');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showStyleSummary, setShowStyleSummary] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>("Loading 3D Splat Mesh...");

  // RunPod Live API states
  const [runpodApiKey, setRunpodApiKey] = useState<string>(
    (process.env.RUNPOD_API_KEY as string) || localStorage.getItem("stylevision_runpod_api_key") || ""
  );
  const [runpodEndpointId, setRunpodEndpointId] = useState<string>(
    localStorage.getItem("stylevision_runpod_endpoint_id") || ""
  );
  const [reconstructionStatus, setReconstructionStatus] = useState<'idle' | 'uploading' | 'triggering' | 'polling' | 'parsing' | 'completed' | 'failed'>('idle');
  const [reconstructionLogs, setReconstructionLogs] = useState<string[]>([]);
  const [plyModelPoints, setPlyModelPoints] = useState<SplatPoint[] | null>(null);
  const [runpodModelData, setRunpodModelData] = useState<any | null>(null);

  // 3D Rotation
  const [rotX, setRotX] = useState(-0.1); 
  const [rotY, setRotY] = useState(0.0);    
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Lightbulb
  const [lightPos, setLightPos] = useState({ x: 180, y: 80 }); 
  const [isDraggingLight, setIsDraggingLight] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cached Pixel Samplers & HTMLImageElement References
  const [textureSamplers, setTextureSamplers] = useState<Record<string, ImageData> | null>(null);
  const [originalSamplers, setOriginalSamplers] = useState<Record<string, ImageData> | null>(null);
  const [originalImages, setOriginalImages] = useState<Record<string, HTMLImageElement> | null>(null);
  const [styledImages, setStyledImages] = useState<Record<string, HTMLImageElement> | null>(null);

  // Style details
  const selectedHair = appState.selectedHairStyle || (appState.gender === Gender.FEMALE ? HAIR_STYLES_FEMALE[0] : HAIR_STYLES_MALE[0]);
  const selectedColor = appState.selectedHairColor || HAIR_COLORS[0];
  const selectedBeard = appState.selectedBeardStyle || BEARD_STYLES[0];
  const selectedOutfit = appState.selectedOutfit || OUTFIT_STYLES[0];

  const styleHash = `${selectedHair?.id || 'none'}_${selectedColor?.id || 'none'}_${selectedBeard?.id || 'none'}`;
  const isDemoMode = !appState.current180Session?.frames;

  // Sync favorites
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem(`favorites_3d_${uid || 'guest'}`) || '[]');
    setIsFavorited(favorites.some((f: any) => f.hash === styleHash));
  }, [styleHash, uid]);

  // Handle resizing of the canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };
    
    window.addEventListener('resize', handleResize);
    const t = setTimeout(handleResize, 150);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [showDiagnostics]);

  // Load and sample the 5 photos for texture projection
  useEffect(() => {
    let active = true;
    setLoadingText("Mapping 3D texture projection...");

    const loadImages = async () => {
      const sessionFrames = appState.current180Session?.frames;
      const defaultFaceUrl = appState.gender === Gender.FEMALE 
        ? "presets/female_hair_original.jpg" 
        : "presets/male_hair_original.jpg";

      const originalUrls = {
        left: sessionFrames?.left || defaultFaceUrl,
        front_left: sessionFrames?.front_left || defaultFaceUrl,
        front: sessionFrames?.front || defaultFaceUrl,
        front_right: sessionFrames?.front_right || defaultFaceUrl,
        right: sessionFrames?.right || defaultFaceUrl
      };

      const previewHistory = JSON.parse(localStorage.getItem("guest_360_previews") || "[]");
      const currentPreview = previewHistory.find((p: any) => p.userId === (uid || "guest") && p.hairstyleId === selectedHair.id);
      
      const styledUrls = currentPreview?.frameUrls ? {
        left: currentPreview.frameUrls[0],
        front_left: currentPreview.frameUrls[1],
        front: currentPreview.frameUrls[2],
        front_right: currentPreview.frameUrls[3],
        right: currentPreview.frameUrls[4]
      } : originalUrls; 

      const loadAndGetPixels = async (sources: Record<string, string>) => {
        const samplers: Record<string, ImageData> = {};
        const elements: Record<string, HTMLImageElement> = {};
        for (const [angle, url] of Object.entries(sources)) {
          if (!active) return null;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; 
          });

          elements[angle] = img;

          const offscreen = document.createElement('canvas');
          offscreen.width = 160;
          offscreen.height = 160;
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 160, 160);
            samplers[angle] = ctx.getImageData(0, 0, 160, 160);
          }
        }
        return { samplers, elements };
      };

      const origResult = await loadAndGetPixels(originalUrls);
      const styledResult = await loadAndGetPixels(styledUrls);

      if (active) {
        if (origResult) {
          setOriginalSamplers(origResult.samplers);
          setOriginalImages(origResult.elements);
        }
        if (styledResult) {
          setTextureSamplers(styledResult.samplers);
          setStyledImages(styledResult.elements);
        }
        setLoadingText(null);
      }
    };

    loadImages();

    return () => {
      active = false;
    };
  }, [appState.current180Session, selectedHair, uid]);

  const hairRGB = useMemo(() => {
    switch (selectedColor.id) {
      case 'black': return { r: 24, g: 24, b: 27 };
      case 'dark_brown': return { r: 78, g: 48, b: 24 };
      case 'light_brown': return { r: 139, g: 90, b: 53 };
      case 'blonde': return { r: 226, g: 186, b: 111 };
      case 'auburn': return { r: 155, g: 58, b: 28 };
      case 'gray': return { r: 168, g: 172, b: 178 };
      case 'platinum_blonde': return { r: 245, g: 241, b: 225 };
      case 'pink': return { r: 244, g: 114, b: 182 };
      case 'blue': return { r: 96, g: 165, b: 250 };
      case 'red': return { r: 239, g: 68, b: 68 };
      default: return { r: 60, g: 50, b: 42 };
    }
  }, [selectedColor]);

  // Construct projected point cloud (Fallback simulation if no server PLY loaded)
  const simulatedPoints = useMemo(() => {
    const points: SplatPoint[] = [];

    const getPixelColor = (samplerMap: Record<string, ImageData> | null, angle: string, u: number, v: number, defaultRGB: { r: number; g: number; b: number }) => {
      if (!samplerMap || !samplerMap[angle]) return defaultRGB;
      const imgData = samplerMap[angle];
      const px = Math.max(0, Math.min(159, Math.floor(u * 160)));
      const py = Math.max(0, Math.min(159, Math.floor(v * 160)));
      const idx = (py * 160 + px) * 4;
      return {
        r: imgData.data[idx],
        g: imgData.data[idx + 1],
        b: imgData.data[idx + 2]
      };
    };

    const blendMultiView = (samplerMap: Record<string, ImageData> | null, x: number, y: number, z: number, nx: number, nz: number, defaultRGB: { r: number; g: number; b: number }) => {
      if (!samplerMap) return defaultRGB;

      const u_front = (x + 5.0) / 10.0;
      const u_left = (z + 5.0) / 10.0;
      const u_right = (5.0 - z) / 10.0;
      
      const rx_l = x * 0.707 + z * 0.707;
      const u_fl = (rx_l + 5.0) / 10.0;

      const rx_r = x * 0.707 - z * 0.707;
      const u_fr = (rx_r + 5.0) / 10.0;

      const v = (y + 6.5) / 13.0;

      const w_front = Math.pow(Math.max(0, nz), 2.5);
      const w_left = Math.pow(Math.max(0, -nx), 2.5);
      const w_right = Math.pow(Math.max(0, nx), 2.5);
      const w_fl = Math.pow(Math.max(0, -nx * 0.707 + nz * 0.707), 2.5);
      const w_fr = Math.pow(Math.max(0, nx * 0.707 + nz * 0.707), 2.5);

      const totalW = w_front + w_left + w_right + w_fl + w_fr;
      if (totalW <= 0) return defaultRGB;

      const c_front = getPixelColor(samplerMap, 'front', u_front, v, defaultRGB);
      const c_left = getPixelColor(samplerMap, 'left', u_left, v, defaultRGB);
      const c_right = getPixelColor(samplerMap, 'right', u_right, v, defaultRGB);
      const c_fl = getPixelColor(samplerMap, 'front_left', u_fl, v, defaultRGB);
      const c_fr = getPixelColor(samplerMap, 'front_right', u_fr, v, defaultRGB);

      return {
        r: Math.floor((c_front.r * w_front + c_left.r * w_left + c_right.r * w_right + c_fl.r * w_fl + c_fr.r * w_fr) / totalW),
        g: Math.floor((c_front.g * w_front + c_left.g * w_left + c_right.g * w_right + c_fl.g * w_fl + c_fr.g * w_fr) / totalW),
        b: Math.floor((c_front.b * w_front + c_left.b * w_left + c_right.b * w_right + c_fl.b * w_fl + c_fr.b * w_fr) / totalW)
      };
    };

    const step = 0.065;
    for (let lat = -Math.PI / 2; lat < Math.PI / 2; lat += step) {
      for (let lon = -Math.PI; lon < Math.PI; lon += step) {
        const jLat = lat + (Math.random() - 0.5) * step * 0.7;
        const jLon = lon + (Math.random() - 0.5) * step * 0.7;

        const x = 5.0 * Math.cos(jLat) * Math.sin(jLon);
        const y = -6.5 * Math.sin(jLat);
        const z = 5.0 * Math.cos(jLat) * Math.cos(jLon);
        
        const nx = Math.cos(jLat) * Math.sin(jLon);
        const ny = -Math.sin(jLat);
        const nz = Math.cos(jLat) * Math.cos(jLon);

        const isFaceRegion = z > 1.2 && Math.abs(x) < 4.0 && y > -4.5 && y < 4.0;
        
        if (isFaceRegion) {
          const origColor = blendMultiView(originalSamplers, x, y, z, nx, nz, { r: 243, g: 202, b: 172 });
          const styledColor = blendMultiView(textureSamplers, x, y, z, nx, nz, { r: 243, g: 202, b: 172 });

          points.push({
            x, y, z, nx, ny, nz,
            originalColor: origColor,
            styledColor: styledColor,
            type: 'skin',
            size: 4.2
          });
        } else if (z < 0.8) {
          const origColor = blendMultiView(originalSamplers, x, y, z, nx, nz, { r: 50, g: 45, b: 40 });
          const styledColor = blendMultiView(textureSamplers, x, y, z, nx, nz, { r: 50, g: 45, b: 40 });

          points.push({
            x, y, z, nx, ny, nz,
            originalColor: origColor,
            styledColor: styledColor,
            type: 'skin',
            size: 3.5
          });
        }
      }
    }

    const hairLengthMult = selectedHair.id.includes('long') ? 2.5 : selectedHair.id.includes('medium') ? 1.5 : 0.6;
    for (let u = 0; u < 1600; u++) {
      const theta = Math.random() * Math.PI * 1.05 - Math.PI * 0.025; 
      const phi = Math.random() * Math.PI * 1.3 - Math.PI * 0.65;
      
      const r_scale = 5.15 + Math.random() * 0.35;
      const x = r_scale * Math.sin(theta) * Math.sin(phi);
      const y = -6.6 - Math.random() * 0.6 + (theta * 1.15 * hairLengthMult);
      const z = r_scale * Math.sin(theta) * Math.cos(phi);

      const nx = Math.sin(theta) * Math.sin(phi);
      const ny = -Math.cos(theta);
      const nz = Math.sin(theta) * Math.cos(phi);

      if (y < 2.0 && z < 3.8) {
        const origColor = blendMultiView(originalSamplers, x, y, z, nx, nz, { r: 60, g: 50, b: 42 });

        points.push({
          x, y, z, nx, ny, nz,
          originalColor: origColor,
          styledColor: hairRGB, 
          type: 'hair',
          size: 5.2
        });
      }
    }

    if (appState.gender === Gender.MALE && selectedBeard.id !== 'beard_none') {
      const density = selectedBeard.id.includes('full') ? 850 : 450;
      for (let b = 0; b < density; b++) {
        const cheekY = 0.5 + Math.random() * 4.2; 
        const cheekAngle = Math.random() * Math.PI * 0.7 - Math.PI * 0.35; 
        
        const x = 4.85 * Math.sin(cheekAngle);
        const y = cheekY;
        const z = 4.85 * Math.cos(cheekAngle);

        const nx = Math.sin(cheekAngle);
        const ny = 0.2;
        const nz = Math.cos(cheekAngle);

        const origColor = blendMultiView(originalSamplers, x, y, z, nx, nz, { r: 243, g: 202, b: 172 });

        points.push({
          x, y, z, nx, ny, nz,
          originalColor: origColor, 
          styledColor: hairRGB, 
          type: 'beard',
          size: 3.8
        });
      }
    }

    points.push({ x: -1.6, y: -1.2, z: 4.8, nx: 0, ny: 0, nz: 1, originalColor: { r: 30, g: 50, b: 70 }, styledColor: { r: 30, g: 50, b: 70 }, type: 'eyes', size: 2.5 });
    points.push({ x: 1.6, y: -1.2, z: 4.8, nx: 0, ny: 0, nz: 1, originalColor: { r: 30, g: 50, b: 70 }, styledColor: { r: 30, g: 50, b: 70 }, type: 'eyes', size: 2.5 });

    for (let clothes = 0; clothes < 250; clothes++) {
      const angle = Math.random() * Math.PI * 2;
      const x = 5.8 * Math.cos(angle);
      const y = 6.8 + Math.random() * 1.5;
      const z = 5.8 * Math.sin(angle);

      const clothesColor = blendMultiView(originalSamplers, x, y, z, Math.cos(angle), Math.sin(angle), { r: 40, g: 60, b: 90 });

      points.push({
        x, y, z, nx: Math.cos(angle), ny: 1.0, nz: Math.sin(angle),
        originalColor: clothesColor,
        styledColor: clothesColor,
        type: 'clothes',
        size: 6.2
      });
    }

    return points;
  }, [selectedHair, selectedBeard, appState.gender, hairRGB, originalSamplers, textureSamplers]);

  // Use either parsed PLY points or simulated points
  const activeSplatPoints = plyModelPoints || simulatedPoints;

  // Helper to generate a blended UV texture map of the face from 5 views
  const generateBlendedHeadTexture = (
    samplers: Record<string, ImageData> | null,
    width: number = 512,
    height: number = 512
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    if (!samplers) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, width, height);
      return canvas;
    }

    for (let py = 0; py < height; py++) {
      const v = py / height;
      const theta = v * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let px = 0; px < width; px++) {
        const u = px / width;
        const phi = (u * 2 * Math.PI) - Math.PI;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // Ellipsoid unit normals
        const nx = sinTheta * sinPhi;
        const ny = -cosTheta;
        const nz = sinTheta * cosPhi;

        // Calculate weights for projection
        let w_front = Math.max(0, nz) ** 2.5;
        let w_left = Math.max(0, -nx) ** 2.5;
        let w_right = Math.max(0, nx) ** 2.5;
        let w_fl = Math.max(0, -nx * 0.707 + nz * 0.707) ** 2.5;
        let w_fr = Math.max(0, nx * 0.707 + nz * 0.707) ** 2.5;

        const total_w = w_front + w_left + w_right + w_fl + w_fr;
        let r = 200, g = 200, b = 200;

        if (total_w > 0) {
          let r_sum = 0, g_sum = 0, b_sum = 0;

          const views = [
            { angle: "front", w: w_front, u_lookup: (nx + 1.0) / 2.0 },
            { angle: "left", w: w_left, u_lookup: (nz + 1.0) / 2.0 },
            { angle: "right", w: w_right, u_lookup: (1.0 - nz) / 2.0 },
            { angle: "front_left", w: w_fl, u_lookup: (nx * 0.707 + nz * 0.707 + 1.0) / 2.0 },
            { angle: "front_right", w: w_fr, u_lookup: (nx * 0.707 - nz * 0.707 + 1.0) / 2.0 }
          ];

          for (const view of views) {
            if (view.w > 0 && samplers[view.angle]) {
              const sampler = samplers[view.angle];
              const sw = sampler.width;
              const sh = sampler.height;
              const sx = Math.max(0, Math.min(sw - 1, Math.floor(view.u_lookup * sw)));
              const sy = Math.max(0, Math.min(sh - 1, Math.floor(v * sh)));
              const idx = (sy * sw + sx) * 4;
              
              r_sum += sampler.data[idx] * view.w;
              g_sum += sampler.data[idx+1] * view.w;
              b_sum += sampler.data[idx+2] * view.w;
            }
          }

          r = Math.floor(r_sum / total_w);
          g = Math.floor(g_sum / total_w);
          b = Math.floor(b_sum / total_w);
        }

        // Back-of-head dark hair/shadow color fill
        if (total_w <= 0.05) {
          r = hairRGB.r * 0.45;
          g = hairRGB.g * 0.45;
          b = hairRGB.b * 0.45;
        }

        const pixelIdx = (py * width + px) * 4;
        data[pixelIdx] = r;
        data[pixelIdx+1] = g;
        data[pixelIdx+2] = b;
        data[pixelIdx+3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  };

  // Helper to generate parametric head geometry (ellipsoid/ovoid)
  const createParametricHeadGeometry = (): THREE.BufferGeometry => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const lats = 60;
    const lons = 60;

    for (let lat = 0; lat <= lats; lat++) {
      const theta = (lat * Math.PI) / lats;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let lon = 0; lon <= lons; lon++) {
        const phi = (lon * 2 * Math.PI) / lons;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const scaleZ = 2.0;
        const scaleX = 2.0;
        const scaleY = -2.8;

        const x = scaleX * sinTheta * sinPhi;
        const y = scaleY * cosTheta;
        const z = scaleZ * sinTheta * cosPhi;

        vertices.push(x, y, z);

        const u = 1 - (lon / lons);
        const v = 1 - (lat / lats);
        uvs.push(u, v);
      }
    }

    for (let lat = 0; lat < lats; lat++) {
      for (let lon = 0; lon < lons; lon++) {
        const first = lat * (lons + 1) + lon;
        const second = first + lons + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  };

  // Main Render Loop (renders either Three.js 3D Mesh or 2.5D interpolated cross-fades)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (viewMode === '25d') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let animFrame: number;

      const render = () => {
        const w = canvas.width / window.devicePixelRatio;
        const h = canvas.height / window.devicePixelRatio;
        if (w <= 0 || h <= 0) {
          animFrame = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const imagesMap = showOriginal ? originalImages : styledImages;
        if (imagesMap) {
          const normY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotY));
          const fIdx = ((normY + Math.PI / 2) / Math.PI) * 4;
          const idx1 = Math.floor(fIdx);
          const idx2 = Math.min(4, idx1 + 1);
          const frac = fIdx - idx1;

          const anglesOrder = ['left', 'front_left', 'front', 'front_right', 'right'];
          const img1 = imagesMap[anglesOrder[idx1]];
          const img2 = imagesMap[anglesOrder[idx2]];

          const boxSize = Math.min(w, h) * 0.75;
          const dx = (w - boxSize) / 2;
          const dy = (h - boxSize) / 2 - 15;

          if (img1 && img1.complete) {
            ctx.globalAlpha = 1 - frac;
            ctx.drawImage(img1, dx, dy, boxSize, boxSize);
          }
          if (img2 && img2.complete && frac > 0.01) {
            ctx.globalAlpha = frac;
            ctx.drawImage(img2, dx, dy, boxSize, boxSize);
          }
          ctx.globalAlpha = 1.0;
        } else {
          ctx.fillStyle = '#6b7280';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Loading 2.5D frames...', w / 2, h / 2);
        }

        ctx.restore();
        animFrame = requestAnimationFrame(render);
      };

      render();
      return () => cancelAnimationFrame(animFrame);
    } else {
      // --- THREE.JS WebGL 3D Mesh Renderer ---
      const parent = canvas.parentElement;
      if (!parent) return;

      const w = parent.clientWidth;
      const h = parent.clientHeight;
      
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
      });
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(window.devicePixelRatio);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
      camera.position.set(0, 0, 8.5);

      // Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
      keyLight.position.set(4, 4, 6);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
      fillLight.position.set(-4, 2, 3);
      scene.add(fillLight);

      let headMesh: THREE.Mesh;
      const activeSamplers = showOriginal ? originalSamplers : textureSamplers;

      if (runpodModelData) {
        // Watertight fitted model from RunPod reconstruction
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(runpodModelData.vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(runpodModelData.uvs, 2));
        geometry.setIndex(runpodModelData.faces);
        geometry.computeVertexNormals();

        const texture = new THREE.TextureLoader().load(runpodModelData.texture);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.55,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        headMesh = new THREE.Mesh(geometry, material);
      } else {
        // Fallback: Parametric ovoid mesh with dynamically blended UV texture map
        const geometry = createParametricHeadGeometry();
        const textureCanvas = generateBlendedHeadTexture(activeSamplers);
        const texture = new THREE.CanvasTexture(textureCanvas);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.6,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        headMesh = new THREE.Mesh(geometry, material);
      }

      scene.add(headMesh);

      let animFrame: number;
      const render = () => {
        headMesh.rotation.y = rotY;
        headMesh.rotation.x = rotX;
        renderer.render(scene, camera);
        animFrame = requestAnimationFrame(render);
      };

      render();

      const handleResize = () => {
        const rw = parent.clientWidth;
        const rh = parent.clientHeight;
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh, false);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animFrame);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        headMesh.geometry.dispose();
        if (Array.isArray(headMesh.material)) {
          headMesh.material.forEach(m => m.dispose());
        } else {
          headMesh.material.dispose();
        }
      };
    }
  }, [viewMode, showOriginal, originalSamplers, textureSamplers, runpodModelData, rotY, rotX, originalImages, styledImages]);

  const handleImageDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingImage(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleImageDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingImage) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    setRotY(prev => prev + dx * 0.015);
    setRotX(prev => Math.max(-0.6, Math.min(0.6, prev + dy * 0.015)));

    dragStartRef.current = { x: clientX, y: clientY };
  };

  const handleImageDragEnd = () => {
    setIsDraggingImage(false);
  };

  const handleLightDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingLight(true);
  };

  const handleLightDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingLight || !containerRef.current) return;
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = Math.max(15, Math.min(rect.width - 15, clientX - rect.left));
    const y = Math.max(15, Math.min(rect.height - 15, clientY - rect.top));

    setLightPos({ x, y });
  };

  const handleLightDragEnd = () => {
    setIsDraggingLight(false);
  };

  const handleToggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem(`favorites_3d_${uid || 'guest'}`) || '[]');

    if (isFavorited) {
      const updated = favorites.filter((f: any) => f.hash !== styleHash);
      localStorage.setItem(`favorites_3d_${uid || 'guest'}`, JSON.stringify(updated));
      setIsFavorited(false);
      triggerToast('Removed from favorites');
    } else {
      const newFav = {
        hash: styleHash,
        hairStyle: selectedHair,
        hairColor: selectedColor,
        beardStyle: selectedBeard,
        gender: appState.gender,
        createdAt: new Date().toISOString()
      };
      favorites.push(newFav);
      localStorage.setItem(`favorites_3d_${uid || 'guest'}`, JSON.stringify(favorites));
      setIsFavorited(true);
      triggerToast('Saved to favorites! ⭐');
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // RunPod Endpoint ID & Api Key updates
  const handleSaveEndpointConfig = (endpointId: string, apiKey: string) => {
    setRunpodEndpointId(endpointId);
    setRunpodApiKey(apiKey);
    localStorage.setItem("stylevision_runpod_endpoint_id", endpointId);
    localStorage.setItem("stylevision_runpod_api_key", apiKey);
    triggerToast("RunPod credentials saved! ⚙");
  };

  // Live RunPod 3D Splatting reconstruction request
  const handleTriggerReconstruction = async () => {
    if (!runpodEndpointId) {
      addLog("ERROR: RunPod Endpoint ID is required.");
      return;
    }
    if (!runpodApiKey) {
      addLog("ERROR: RunPod API Key is required.");
      return;
    }

    try {
      setReconstructionStatus('uploading');
      setReconstructionLogs([]);
      addLog("Starting live 3D reconstruction pipeline...");

      const sessionFrames = appState.current180Session?.frames;
      
      const makeAbsoluteUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image")) {
          return url;
        }
        const originHost = window.location.origin;
        if (url.startsWith("/")) {
          return `${originHost}${url}`;
        }
        return `${originHost}/${url}`;
      };

      const defaultFaceUrl = appState.gender === Gender.FEMALE 
        ? makeAbsoluteUrl("presets/female_hair_original.jpg") 
        : makeAbsoluteUrl("presets/male_hair_original.jpg");

      const originalUrls = {
        left: makeAbsoluteUrl(sessionFrames?.left || defaultFaceUrl),
        front_left: makeAbsoluteUrl(sessionFrames?.front_left || defaultFaceUrl),
        front: makeAbsoluteUrl(sessionFrames?.front || defaultFaceUrl),
        front_right: makeAbsoluteUrl(sessionFrames?.front_right || defaultFaceUrl),
        right: makeAbsoluteUrl(sessionFrames?.right || defaultFaceUrl)
      };

      const previewHistory = JSON.parse(localStorage.getItem("guest_360_previews") || "[]");
      const currentPreview = previewHistory.find((p: any) => p.userId === (uid || "guest") && p.hairstyleId === selectedHair.id);
      
      const styledUrls = currentPreview?.frameUrls ? {
        left: makeAbsoluteUrl(currentPreview.frameUrls[0]),
        front_left: makeAbsoluteUrl(currentPreview.frameUrls[1]),
        front: makeAbsoluteUrl(currentPreview.frameUrls[2]),
        front_right: makeAbsoluteUrl(currentPreview.frameUrls[3]),
        right: makeAbsoluteUrl(currentPreview.frameUrls[4])
      } : originalUrls; 

      // 1. Upload frames to Firebase Storage
      addLog("Step 1/4: Uploading 5 angles to Firebase Storage...");
      const uploadedUrls: Record<string, string> = {};
      
      for (const [angle, url] of Object.entries(styledUrls)) {
        if (url.startsWith("data:image")) {
          addLog(`Uploading base64 frame: ${angle}...`);
          const publicUrl = await uploadImageToStorage(uid || "guest", url, `users/${uid || "guest"}/captures/styled_${angle}.jpg`);
          uploadedUrls[angle] = publicUrl;
        } else {
          uploadedUrls[angle] = url;
        }
      }
      addLog("Frames uploaded successfully.");

      // 2. Trigger RunPod serverless job
      setReconstructionStatus('triggering');
      addLog("Step 2/4: Triggering RunPod Serverless reconstruction...");
      const runRes = await fetch(`https://api.runpod.ai/v2/${runpodEndpointId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${runpodApiKey}`
        },
        body: JSON.stringify({
          input: {
            images: uploadedUrls,
            userId: uid || "guest"
          }
        })
      });

      if (!runRes.ok) {
        throw new Error(`RunPod trigger failed: HTTP ${runRes.status}`);
      }

      const runResult = await runRes.json();
      const jobId = runResult.id;
      addLog(`Job triggered. Job ID: ${jobId}`);

      // 3. Poll status
      setReconstructionStatus('polling');
      addLog("Step 3/4: Polling RunPod worker job status...");
      
      const pollJob = async (): Promise<any> => {
        return new Promise((resolve, reject) => {
          const checkStatus = async () => {
            try {
              const statusRes = await fetch(`https://api.runpod.ai/v2/${runpodEndpointId}/status/${jobId}`, {
                headers: {
                  'Authorization': `Bearer ${runpodApiKey}`
                }
              });
              const statusResult = await statusRes.json();
              addLog(`Status: ${statusResult.status}...`);

              if (statusResult.status === 'COMPLETED') {
                resolve(statusResult.output);
              } else if (statusResult.status === 'FAILED') {
                reject(new Error(statusResult.error || "RunPod job failed"));
              } else {
                setTimeout(checkStatus, 2500);
              }
            } catch (err) {
              reject(err);
            }
          };
          checkStatus();
        });
      };

      const output = await pollJob();
      addLog(`Success! Job complete.`);

      // 4. Processing 3D mesh model data
      setReconstructionStatus('parsing');
      addLog("Step 4/4: Processing 3D mesh model data...");

      if (output.meshData) {
        addLog("Solid 3D textured mesh data loaded successfully from output.");
        setRunpodModelData(output.meshData);
        setReconstructionStatus('completed');
        triggerToast("3D Head Mesh Reconstruction Loaded! 🚀");
      } else {
        let plyText = "";
        if (output.plyData) {
          addLog("Reading PLY data directly from response payload...");
          plyText = output.plyData;
        } else if (output.modelUrl) {
          addLog(`Downloading PLY data from URL: ${output.modelUrl}`);
          const plyRes = await fetch(output.modelUrl);
          plyText = await plyRes.text();
        }
        
        if (plyText) {
          const parsedPoints = parsePLYData(plyText);
          addLog(`PLY parsed successfully. Total reconstructed points: ${parsedPoints.length}`);
          setPlyModelPoints(parsedPoints);
          setReconstructionStatus('completed');
          triggerToast("Reconstruction Loaded! 3D splats updated.");
        } else {
          throw new Error("No meshData or plyData returned from RunPod worker.");
        }
      }

    } catch (err: any) {
      console.error(err);
      addLog(`ERROR: ${err.message || String(err)}`);
      setReconstructionStatus('failed');
      triggerToast("Reconstruction failed.");
    }
  };

  const addLog = (msg: string) => {
    setReconstructionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Client-side PLY parser
  const parsePLYData = (text: string): SplatPoint[] => {
    const lines = text.split('\n');
    const points: SplatPoint[] = [];
    let isHeader = true;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (isHeader) {
        if (trimmed === 'end_header') {
          isHeader = false;
        }
        continue;
      }
      
      const parts = trimmed.split(/\s+/);
      if (parts.length < 6) continue;
      
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parseFloat(parts[2]);
      const r = parseInt(parts[3]);
      const g = parseInt(parts[4]);
      const b = parseInt(parts[5]);
      
      const nx = parts[6] ? parseFloat(parts[6]) : 0;
      const ny = parts[7] ? parseFloat(parts[7]) : 0;
      const nz = parts[8] ? parseFloat(parts[8]) : 1;
      
      points.push({
        x, y, z, nx, ny, nz,
        originalColor: { r, g, b },
        styledColor: { r, g, b },
        type: 'skin', // render with skin classification
        size: 3.5
      });
    }
    return points;
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col z-50 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-slate-950 border-b border-white/10 z-30">
        <div className="flex-1 flex justify-start">
          <button 
            onClick={onClose} 
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold hover:bg-white/10 transition-all text-neutral-300 active:scale-95"
          >
            <svg className="w-3.5 h-3.5 rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <div className="flex-[2] text-center min-w-0 px-2">
          <h2 className="text-xs sm:text-sm font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-wider truncate">
            ✨ Volumetric 3D Splat Mirror
          </h2>
        </div>

        <div className="flex-1 flex justify-end gap-1.5">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition ${
              showDiagnostics 
                ? 'bg-amber-500 text-neutral-950 shadow-lg' 
                : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            ⚙ Debug
          </button>
        </div>
      </div>

      {/* Main Viewport Workspace - Split Grid if Diagnostics active */}
      <div className={`flex-1 flex ${showDiagnostics ? 'flex-col md:flex-row' : 'flex-col'} justify-between bg-slate-950 relative overflow-hidden min-h-0`}>
        
        {/* Loading Overlay */}
        {loadingText && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-50">
            <div className="w-10 h-10 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300">{loadingText}</span>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="absolute top-4 left-4 right-4 bg-emerald-600/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl text-center text-xs z-50 shadow-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-top-4 flex items-center justify-center gap-2 pointer-events-auto">
            <span className="text-sm">✓</span>
            <span className="font-extrabold uppercase tracking-widest text-[9px]">{successToast}</span>
          </div>
        )}

        {/* 3D Canvas Box Container */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          
          {/* Status Indicator */}
          <div className="text-center py-2 bg-slate-950 border-b border-white/5 z-20 flex-shrink-0 flex flex-col items-center gap-1">
            <span className="text-[9px] text-yellow-400 font-extrabold uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
              {plyModelPoints ? "Live 3D Reconstructed Model" : isDemoMode ? "3D Demo Mode (Sample Model)" : "Background Removed (Studio Backdrop)"}
            </span>
            {isDemoMode && (
              <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-wider">
                Scan your face in the 180° camera tab to view yourself in 3D!
              </span>
            )}
          </div>

          <div 
            ref={containerRef}
            className="flex-1 touch-none relative overflow-hidden min-h-0"
            onMouseMove={(e) => { handleLightDragMove(e); handleImageDragMove(e); }}
            onTouchMove={(e) => { handleLightDragMove(e); handleImageDragMove(e); }}
            onMouseDown={handleImageDragStart}
            onTouchStart={handleImageDragStart}
            onMouseUp={() => { handleLightDragEnd(); handleImageDragEnd(); }}
            onTouchEnd={() => { handleLightDragEnd(); handleImageDragEnd(); }}
          >
            {/* Radiant Studio Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#f1f5f9_50%,_#cbd5e1_100%)] z-0"></div>
            
            {/* Subtle grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"></div>

            {/* Interactive full-size transparent canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" />

            {/* Draggable Lightbulb (3D mode only) */}
            {viewMode === '3d' && (
              <div 
                onMouseDown={handleLightDragStart}
                onTouchStart={handleLightDragStart}
                className="absolute w-10 h-10 rounded-full bg-yellow-400 border-2 border-white shadow-[0_0_24px_#fbbf24] flex items-center justify-center cursor-move select-none z-20 hover:scale-105 active:scale-95 transition-transform"
                style={{ 
                  left: `${lightPos.x}px`, 
                  top: `${lightPos.y}px`,
                  transform: 'translate(-50%, -50%)' 
                }}
                title="Drag me to cast shadows"
              >
                💡
              </div>
            )}

            {/* Favorite toggle star */}
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
              className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition active:scale-90 z-20 ${
                isFavorited 
                  ? 'bg-yellow-500 border-yellow-500 text-neutral-950 shadow-[0_0_12px_#fbbf24]' 
                  : 'bg-black/35 border-white/10 text-white hover:bg-black/65 shadow-lg'
              }`}
              title="Add to Favorites"
            >
              ★
            </button>

            {/* User rotation instruction */}
            <div className="absolute inset-x-0 bottom-4 text-center text-neutral-800 text-[9px] uppercase tracking-widest font-black pointer-events-none z-20">
              ◀ Drag left or right to rotate head ◀
            </div>
          </div>

          {/* Mode Selector & Toolbar Controls */}
          <div className="mx-4 mb-2 p-1 bg-white/5 border border-white/10 rounded-xl flex items-center gap-1.5 backdrop-blur-xl pointer-events-auto justify-between flex-shrink-0 z-20">
            <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
              
              {/* View Mode Toggle */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === '3d' ? '25d' : '3d')}
                className={`flex-1 min-w-0 h-9 rounded-lg border flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  viewMode === '25d'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                🎥 {viewMode === '25d' ? "2.5D Interpolated" : "3D Point Cloud"}
              </button>

              {/* Auto Play spin */}
              <button
                type="button"
                onClick={() => {
                  const startY = rotY;
                  let t = 0;
                  const interval = setInterval(() => {
                    t += 0.03;
                    setRotY(startY + Math.sin(t) * (Math.PI / 2));
                  }, 30);
                  setTimeout(() => clearInterval(interval), 3000);
                }}
                className="flex-1 min-w-0 h-9 rounded-lg border bg-white/5 border-white/5 text-neutral-400 hover:text-white flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
              >
                <span>▶ Auto-Spin</span>
              </button>

              {/* Zoom Toggle */}
              <button
                type="button"
                onClick={() => setIsZoomed(!isZoomed)}
                className={`flex-1 min-w-0 h-9 rounded-lg border flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  isZoomed
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                    : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <span>🔍 {isZoomed ? "Zoomed" : "Zoom"}</span>
              </button>

              {/* Before/After comparison hold toggle */}
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className={`flex-1 min-w-0 h-9 rounded-lg border flex items-center justify-center gap-1 transition-all text-[9px] font-black uppercase tracking-wider ${
                  showOriginal
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <span>👁 Compare</span>
              </button>
            </div>
          </div>
        </div>

        {/* Diagnostic Mode Side Panel */}
        {showDiagnostics && (
          <div className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-white/10 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-none z-20 flex-shrink-0 animate-in slide-in-from-right-4 duration-200">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">⚙ Diagnostic Console</span>
              <button 
                onClick={() => setShowDiagnostics(false)} 
                className="text-neutral-500 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 font-mono text-[9px] text-neutral-300">
              
              {/* Credentials Form */}
              <div className="space-y-2">
                <p className="text-neutral-500 font-extrabold uppercase text-[8px]">RunPod Serverless Credentials</p>
                <div className="p-2 bg-black/45 rounded-lg border border-white/5 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[8px] text-neutral-400">ENDPOINT ID:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. yz12abcd3456" 
                      value={runpodEndpointId}
                      onChange={(e) => handleSaveEndpointConfig(e.target.value, runpodApiKey)}
                      className="w-full bg-slate-800 border border-white/10 px-2 py-1 rounded text-white text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-neutral-400">API KEY:</label>
                    <input 
                      type="password" 
                      placeholder="rpa_..." 
                      value={runpodApiKey}
                      onChange={(e) => handleSaveEndpointConfig(runpodEndpointId, e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 px-2 py-1 rounded text-white text-[9px]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={reconstructionStatus === 'uploading' || reconstructionStatus === 'triggering' || reconstructionStatus === 'polling'}
                onClick={handleTriggerReconstruction}
                className="w-full h-8 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase text-[9px] rounded-lg tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>⚙ RUN LIVE RECONSTRUCTION</span>
              </button>

              {/* Console Logs */}
              {reconstructionLogs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-neutral-500 font-extrabold uppercase text-[8px]">Console Logs</p>
                  <div className="p-2 bg-black/80 border border-white/5 rounded-lg text-[8px] max-h-36 overflow-y-auto no-scrollbar space-y-1 text-emerald-400">
                    {reconstructionLogs.map((log, i) => (
                      <p key={i}>{log}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Angle Frames Check */}
              <div className="space-y-1">
                <p className="text-neutral-500 font-extrabold uppercase text-[8px]">180° Camera Frame Buffers</p>
                <div className="p-2 bg-black/45 rounded-lg border border-white/5 space-y-1.5">
                  {['left', 'front_left', 'front', 'front_right', 'right'].map((angle) => {
                    const hasFrame = !!(appState.current180Session?.frames?.[angle as keyof typeof appState.current180Session.frames]);
                    const styledMap = showOriginal ? originalImages : styledImages;
                    const loaded = styledMap && !!styledMap[angle];
                    return (
                      <div key={angle} className="flex justify-between items-center">
                        <span className="text-neutral-400">{angle.toUpperCase()}:</span>
                        <div className="flex gap-2">
                          <span className={hasFrame ? 'text-emerald-400' : 'text-rose-400'}>
                            {hasFrame ? '✓ CAPTURED' : '✗ EMPTY'}
                          </span>
                          <span className={loaded ? 'text-indigo-400' : 'text-neutral-600'}>
                            {loaded ? '160x160 TXT' : 'NO TXT'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pipeline Status */}
              <div className="space-y-1">
                <p className="text-neutral-500 font-extrabold uppercase text-[8px]">Pipeline Metrics</p>
                <div className="p-2 bg-black/45 rounded-lg border border-white/5 space-y-1">
                  <p>Session State: <span className="text-yellow-400">{appState.current180Session?.status || 'Active'}</span></p>
                  <p>Background Removal: <span className="text-emerald-400">Enabled (Client-side Alpha)</span></p>
                  <p>AI Generation: <span className="text-indigo-400">Independent Multi-view (Gemini)</span></p>
                  <p>Splat Particles: <span className="text-indigo-400">{activeSplatPoints.length} points</span></p>
                  <p>Reconstruction: <span className="text-amber-400">{reconstructionStatus.toUpperCase()}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Collapsible Style Snapshot Info */}
      <div className="mx-4 mb-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl pointer-events-auto flex-shrink-0 z-20">
        <button
          type="button"
          onClick={() => setShowStyleSummary(!showStyleSummary)}
          className="w-full px-4 py-2.5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:text-white active:bg-white/5 transition-all"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            <span>Active Style Snapshot</span>
          </span>
          <svg 
            className="w-3.5 h-3.5 text-neutral-400 transition-transform duration-300" 
            style={{ transform: showStyleSummary ? 'rotate(180deg)' : 'rotate(0deg)' }}
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showStyleSummary && (
          <div className="px-4 pb-3 pt-1.5 flex flex-wrap gap-1.5 border-t border-white/5 bg-black/25 max-h-24 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-200">
            {selectedHair && (
              <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-[9px] rounded-lg text-indigo-300 font-extrabold uppercase tracking-wider">
                Hair: {selectedHair.label}
              </span>
            )}
            {selectedColor && (
              <span className="px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 text-[9px] rounded-lg text-pink-300 font-extrabold uppercase tracking-wider">
                Color: {selectedColor.label}
              </span>
            )}
            {selectedBeard && selectedBeard.id !== 'beard_none' && (
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] rounded-lg text-amber-300 font-extrabold uppercase tracking-wider">
                Beard: {selectedBeard.label}
              </span>
            )}
            {selectedOutfit && (
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[9px] rounded-lg text-emerald-300 font-extrabold uppercase tracking-wider">
                Outfit: {selectedOutfit.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* CTA Footer buttons */}
      <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] bg-slate-950 border-t border-white/5 pointer-events-auto z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-[2] h-11 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-[11px] font-bold uppercase tracking-wider text-neutral-300 rounded-xl transition-all shadow-md flex items-center justify-center"
          >
            Adjust Selections
          </button>
          
          <button 
            type="button"
            onClick={() => {
              triggerToast('3D Look Saved & Finished! ✨');
              setTimeout(onClose, 1000);
            }}
            className="flex-[3] h-11 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <span>✨ Save & Finish</span>
          </button>
        </div>
      </div>

    </div>
  );
};
