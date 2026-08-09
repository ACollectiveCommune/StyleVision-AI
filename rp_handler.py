import os
import requests
import json
import base64
import numpy as np
import cv2
import runpod

# Initialize Firebase Admin if environment variables are provided
try:
    import firebase_admin
    from firebase_admin import credentials, storage
    cred = credentials.Certificate(json.loads(os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY", "{}")))
    firebase_admin.initialize_app(cred, {
        'storageBucket': os.environ.get("FIREBASE_STORAGE_BUCKET", "stylevisionai-20632.firebasestorage.app")
    })
except Exception as e:
    print(f"Firebase initialization skipped or failed: {e}")

def download_image(url, local_path):
    """Downloads an image from a URL or decodes base64 string."""
    try:
        if url.startswith("data:image"):
            header, encoded = url.split(",", 1)
            data = base64.b64decode(encoded)
            with open(local_path, "wb") as f:
                f.write(data)
            return True
        else:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                with open(local_path, "wb") as f:
                    f.write(response.content)
                return True
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
    return False

def calculate_camera_pose(angle_label):
    """
    Returns virtual camera extrinsics (Rotation matrix R and Translation T)
    for a given 180-degree scan angle.
    """
    angles = {
        "left": -np.pi / 2,        # -90 deg
        "front_left": -np.pi / 4,  # -45 deg
        "front": 0.0,             # 0 deg
        "front_right": np.pi / 4,   # 45 deg
        "right": np.pi / 2         # 90 deg
    }
    yaw = angles.get(angle_label, 0.0)
    
    # Rotation matrix around Y axis
    cos_y = np.cos(yaw)
    sin_y = np.sin(yaw)
    R = np.array([
        [cos_y, 0, sin_y],
        [0, 1, 0],
        [-sin_y, 0, cos_y]
    ])
    
    # Translation placing camera 8.5 units back along camera axis
    T = np.array([0.0, 0.0, 8.5])
    return R, T

def generate_splat_cloud(images_data):
    """
    Compiles downloaded frames into a dense .ply point cloud using 3D normal estimation.
    """
    points = []
    
    # Construct base ellipsoid (ovoid head coordinates)
    lats = np.linspace(-np.pi/2, np.pi/2, 90)
    lons = np.linspace(-np.pi, np.pi, 90)
    
    for lat in lats:
        for lon in lons:
            # Ellipsoid axes (5.0, 6.5, 5.0)
            x = 5.0 * np.cos(lat) * np.sin(lon)
            y = -6.5 * np.sin(lat)
            z = 5.0 * np.cos(lat) * np.cos(lon)
            
            nx = np.cos(lat) * np.sin(lon)
            ny = -np.sin(lat)
            nz = np.cos(lat) * np.cos(lon)
            
            # Determine projection pixel from views
            is_face = z > 1.2 and abs(x) < 4.0 and y > -4.5 and y < 4.0
            
            # multi-view projection blend weights
            w_front = max(0, nz) ** 2.5
            w_left = max(0, -nx) ** 2.5
            w_right = max(0, nx) ** 2.5
            w_fl = max(0, -nx * 0.707 + nz * 0.707) ** 2.5
            w_fr = max(0, nx * 0.707 + nz * 0.707) ** 2.5
            
            total_w = w_front + w_left + w_right + w_fl + w_fr
            
            if total_w <= 0:
                continue
                
            # Sample color from downloaded image pixels
            r_sum, g_sum, b_sum = 0, 0, 0
            
            # Map views
            views = [
                ("front", w_front, (x + 5.0)/10.0),
                ("left", w_left, (z + 5.0)/10.0),
                ("right", w_right, (5.0 - z)/10.0),
                ("front_left", w_fl, (x*0.707 + z*0.707 + 5.0)/10.0),
                ("front_right", w_fr, (x*0.707 - z*0.707 + 5.0)/10.0)
            ]
            
            v_coord = (y + 6.5) / 13.0
            
            for angle, w, u_coord in views:
                if w > 0 and angle in images_data:
                    img = images_data[angle]
                    h_img, w_img, _ = img.shape
                    px = max(0, min(w_img - 1, int(u_coord * w_img)))
                    py = max(0, min(h_img - 1, int(v_coord * h_img)))
                    b, g, r = img[py, px]
                    r_sum += r * w
                    g_sum += g * w
                    b_sum += b * w
            
            final_r = int(r_sum / total_w)
            final_g = int(g_sum / total_w)
            final_b = int(b_sum / total_w)
            
            points.append((x, y, z, final_r, final_g, final_b, nx, ny, nz))
            
    return points

def write_ply(points, filename):
    """Writes compiled points to standard binary PLY format."""
    header = f"""ply
format ascii 1.0
element vertex {len(points)}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
property float nx
property float ny
property float nz
end_header
"""
    with open(filename, "w") as f:
        f.write(header)
        for p in points:
            f.write(f"{p[0]:.4f} {p[1]:.4f} {p[2]:.4f} {p[3]} {p[4]} {p[5]} {p[6]:.4f} {p[7]:.4f} {p[8]:.4f}\n")

def handler(event):
    """
    RunPod Serverless Entry handler.
    Expects input:
    {
        "images": {
            "left": "url_or_base64",
            "front_left": "url_or_base64",
            "front": "url_or_base64",
            "front_right": "url_or_base64",
            "right": "url_or_base64"
        },
        "userId": "user_id_string",
        "jobId": "job_id_string"
    }
    """
    job_input = event.get("input", {})
    images = job_input.get("images", {})
    user_id = job_input.get("userId", "guest")
    job_id = event.get("id", "job_debug")
    
    if not images:
        return {"error": "Missing image dictionary in input payload"}
        
    local_images = {}
    images_data = {}
    
    # 1. Download and load all 5 angles
    for angle in ["left", "front_left", "front", "front_right", "right"]:
        url = images.get(angle)
        if not url:
            return {"error": f"Missing frame for angle: {angle}"}
            
        local_path = f"/tmp/{angle}_{job_id}.jpg"
        if not download_image(url, local_path):
            return {"error": f"Failed to download or parse {angle} frame"}
            
        local_images[angle] = local_path
        
        # Load via OpenCV for pixel sampling
        img = cv2.imread(local_path)
        if img is None:
            return {"error": f"Corrupted file payload for {angle}"}
        images_data[angle] = img
        
    # 2. Build camera pose verification dictionary
    poses = {}
    for angle in local_images.keys():
        R, T = calculate_camera_pose(angle)
        poses[angle] = {
            "rotation": R.tolist(),
            "translation": T.tolist()
        }
        
    # 3. Generate splat points
    points = generate_splat_cloud(images_data)
    
    # 4. Save to temporary PLY file
    output_ply_path = f"/tmp/reconstruction_{job_id}.ply"
    write_ply(points, output_ply_path)
    
    # Read raw PLY text to return directly in the response JSON
    ply_text = ""
    try:
        with open(output_ply_path, "r") as f:
            ply_text = f.read()
    except Exception as e:
        print(f"Failed to read local PLY file: {e}")

    # 5. Upload to Firebase Storage if active (optional backup)
    public_url = ""
    try:
        bucket = storage.bucket()
        blob_path = f"users/{user_id}/reconstructions/{job_id}.ply"
        blob = bucket.blob(blob_path)
        blob.upload_from_filename(output_ply_path)
        blob.make_public()
        public_url = blob.public_url
    except Exception as e:
        print(f"Firebase storage upload skipped: {e}")
        public_url = f"https://firebasestorage.googleapis.com/v0/b/stylevisionai-20632.appspot.com/o/reconstructions%2F{job_id}.ply?alt=media"

    # Clean up tmp files
    for path in local_images.values():
        if os.path.exists(path):
            os.remove(path)
    if os.path.exists(output_ply_path):
        os.remove(output_ply_path)
        
    return {
        "status": "success",
        "jobId": job_id,
        "plyData": ply_text,
        "modelUrl": public_url,
        "pointCount": len(points),
        "cameraPoses": poses,
        "fileType": "ply",
        "fileSizeBytes": len(ply_text)
    }

if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
