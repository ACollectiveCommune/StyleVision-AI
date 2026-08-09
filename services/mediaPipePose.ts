/**
 * Head pose estimation helper using 3D MediaPipe Face Landmarker landmarks.
 */

export interface HeadPose {
  yaw: number;     // Left/Right horizontal rotation in degrees (-90 to 90)
  pitch: number;   // Up/Down vertical rotation in degrees (-90 to 90)
  roll: number;    // Side tilt in degrees (-90 to 90)
  faceX: number;   // Horizontal position of face center (0.0 to 1.0)
  faceY: number;   // Vertical position of face center (0.0 to 1.0)
  faceScale: number; // Face scale relative to canvas (approx 0.1 to 0.8)
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export function estimateHeadPose(landmarks: any[]): HeadPose | null {
  if (!landmarks || landmarks.length < 263) return null;

  // Key landmarks
  const nose = landmarks[1];        // Nose tip
  const chin = landmarks[152];      // Chin bottom
  const leftEye = landmarks[33];    // Left eye outer corner
  const rightEye = landmarks[263];  // Right eye outer corner

  // Map to Cartesian coordinate system:
  // x increases right, y increases up (inverted from screen coordinates), z increases forward
  const getCartesian = (lm: any): Vector3D => ({
    x: lm.x,
    y: 1 - lm.y,
    z: -lm.z
  });

  const pNose = getCartesian(nose);
  const pChin = getCartesian(chin);
  const pLeftEye = getCartesian(leftEye);
  const pRightEye = getCartesian(rightEye);

  // Math helper functions
  const sub = (a: Vector3D, b: Vector3D): Vector3D => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  });

  const cross = (a: Vector3D, b: Vector3D): Vector3D => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  });

  const norm = (v: Vector3D): Vector3D => {
    const len = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  };

  const toDegrees = (rad: number) => rad * (180 / Math.PI);

  // eyeMidpoint
  const eyeMid: Vector3D = {
    x: (pLeftEye.x + pRightEye.x) / 2,
    y: (pLeftEye.y + pRightEye.y) / 2,
    z: (pLeftEye.z + pRightEye.z) / 2
  };

  // Base vectors
  const Vx = norm(sub(pRightEye, pLeftEye));      // Horizontal rightward axis
  const VyHelper = norm(sub(eyeMid, pChin));       // Vertical upward axis
  const Vz = norm(cross(Vx, VyHelper));          // Forward normal axis

  // Euler angles in degrees
  const yaw = toDegrees(Math.atan2(Vz.x, Vz.z));
  const pitch = toDegrees(Math.atan2(-Vz.y, Vz.z));
  const roll = toDegrees(Math.atan2(Vx.y, Vx.x));

  // Centering and sizing metrics (using normalized screen coordinates directly)
  const faceX = (leftEye.x + rightEye.x) / 2;
  const faceY = (leftEye.y + chin.y) / 2;
  
  const width = Math.abs(rightEye.x - leftEye.x);
  const height = Math.abs(chin.y - leftEye.y);
  const faceScale = Math.hypot(width, height);

  return {
    yaw: Math.round(yaw),
    pitch: Math.round(pitch),
    roll: Math.round(roll),
    faceX,
    faceY,
    faceScale
  };
}
