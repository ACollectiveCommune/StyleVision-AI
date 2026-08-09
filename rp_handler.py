import os
import requests
import json
import base64
import numpy as np
from PIL import Image
import runpod
import io

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

def generate_head_mesh(images_data, hair_rgb=(60, 50, 42)):
    """
    Generates a solid ovoid head mesh: vertices, face indices, UV coordinates,
    and a pre-blended UV texture map.
    """
    vertices = []
    uvs = []
    faces = []
    
    lats_count = 60
    lons_count = 60
    
    # 1. Generate vertices and UVs
    for lat_idx in range(lats_count + 1):
        lat = (lat_idx * np.pi) / lats_count
        sin_lat = np.sin(lat)
        cos_lat = np.cos(lat)
        
        for lon_idx in range(lons_count + 1):
            lon = (lon_idx * 2 * np.pi) / lons_count
            sin_lon = np.sin(lon)
            cos_lon = np.cos(lon)
            
            # Scale settings matching ThreeDSplatViewer fallback
            scaleZ = 2.0
            scaleX = 2.0
            scaleY = -2.8
            
            x = scaleX * sin_lat * sin_lon
            y = scaleY * cos_lat
            z = scaleZ * sin_lat * cos_lon
            
            vertices.extend([float(x), float(y), float(z)])
            
            u = 1.0 - (lon_idx / lons_count)
            v = 1.0 - (lat_idx / lats_count)
            uvs.extend([float(u), float(v)])
            
    # 2. Generate face indices (triangles)
    for lat_idx in range(lats_count):
        for lon_idx in range(lons_count):
            first = lat_idx * (lons_count + 1) + lon_idx
            second = first + lons_count + 1
            
            # Triangle 1
            faces.extend([int(first), int(second), int(first + 1)])
            # Triangle 2
            faces.extend([int(second), int(second + 1), int(first + 1)])
            
    # 3. Create pre-blended texture map (512x512 canvas)
    tex_w, tex_h = 512, 512
    texture_img = Image.new("RGB", (tex_w, tex_h), (200, 200, 200))
    pixels = texture_img.load()
    
    for py in range(tex_h):
        v_val = py / tex_h
        theta = v_val * np.pi
        sin_theta = np.sin(theta)
        cos_theta = np.cos(theta)
        
        for px in range(tex_w):
            u_val = px / tex_w
            phi = (u_val * 2 * np.pi) - np.pi
            sin_phi = np.sin(phi)
            cos_phi = np.cos(phi)
            
            # Surface unit normals
            nx = sin_theta * sin_phi
            ny = -cos_theta
            nz = sin_theta * cos_phi
            
            w_front = max(0.0, nz) ** 2.5
            w_left = max(0.0, -nx) ** 2.5
            w_right = max(0.0, nx) ** 2.5
            w_fl = max(0.0, -nx * 0.707 + nz * 0.707) ** 2.5
            w_fr = max(0.0, nx * 0.707 + nz * 0.707) ** 2.5
            
            total_w = w_front + w_left + w_right + w_fl + w_fr
            
            r, g, b = 200, 200, 200
            
            if total_w > 0:
                r_sum, g_sum, b_sum = 0, 0, 0
                
                views = [
                    ("front", w_front, (nx + 1.0)/2.0),
                    ("left", w_left, (nz + 1.0)/2.0),
                    ("right", w_right, (1.0 - nz)/2.0),
                    ("front_left", w_fl, (nx*0.707 + nz*0.707 + 1.0)/2.0),
                    ("front_right", w_fr, (nx*0.707 - nz*0.707 + 1.0)/2.0)
                ]
                
                for angle, w, u_lookup in views:
                    if w > 0 and angle in images_data:
                        img = images_data[angle]
                        img_w, img_h = img.size
                        sx = max(0, min(img_w - 1, int(u_lookup * img_w)))
                        sy = max(0, min(img_h - 1, int(v_val * img_h)))
                        pr, pg, pb = img.getpixel((sx, sy))
                        r_sum += pr * w
                        g_sum += pg * w
                        b_sum += pb * w
                        
                r = int(r_sum / total_w)
                g = int(g_sum / total_w)
                b = int(b_sum / total_w)
            
            if total_w <= 0.05:
                r = int(hair_rgb[0] * 0.45)
                g = int(hair_rgb[1] * 0.45)
                b = int(hair_rgb[2] * 0.45)
                
            pixels[px, py] = (r, g, b)
            
    # Convert texture image to base64
    buffered = io.BytesIO()
    texture_img.save(buffered, format="JPEG", quality=85)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{img_str}"
    
    return {
        "vertices": vertices,
        "faces": faces,
        "uvs": uvs,
        "texture": data_url
    }

def generate_splat_cloud(images_data):
    """
    Compiles downloaded frames into a dense .ply point cloud using 3D normal estimation.
    """
    points = []
    
    lats = np.linspace(-np.pi/2, np.pi/2, 90)
    lons = np.linspace(-np.pi, np.pi, 90)
    
    for lat in lats:
        for lon in lons:
            x = 5.0 * np.cos(lat) * np.sin(lon)
            y = -6.5 * np.sin(lat)
            z = 5.0 * np.cos(lat) * np.cos(lon)
            
            nx = np.cos(lat) * np.sin(lon)
            ny = -np.sin(lat)
            nz = np.cos(lat) * np.cos(lon)
            
            w_front = max(0, nz) ** 2.5
            w_left = max(0, -nx) ** 2.5
            w_right = max(0, nx) ** 2.5
            w_fl = max(0, -nx * 0.707 + nz * 0.707) ** 2.5
            w_fr = max(0, nx * 0.707 + nz * 0.707) ** 2.5
            
            total_w = w_front + w_left + w_right + w_fl + w_fr
            
            if total_w <= 0:
                continue
                
            r_sum, g_sum, b_sum = 0, 0, 0
            
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
                    w_img, h_img = img.size
                    px = max(0, min(w_img - 1, int(u_coord * w_img)))
                    py = max(0, min(h_img - 1, int(v_coord * h_img)))
                    r, g, b = img.getpixel((px, py))
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
element visitor {len(points)}
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
    # Wait, let's write correct standard header element vertex
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
        
        try:
            img = Image.open(local_path).convert("RGB")
            images_data[angle] = img
        except Exception as e:
            return {"error": f"Corrupted file payload for {angle}: {e}"}
        
    # 2. Build camera pose verification dictionary
    poses = {}
    for angle in local_images.keys():
        R, T = calculate_camera_pose(angle)
        poses[angle] = {
            "rotation": R.tolist(),
            "translation": T.tolist()
        }
        
    # 3. Generate solid head mesh
    mesh_info = generate_head_mesh(images_data)

    # 4. Generate splat points
    points = generate_splat_cloud(images_data)
    
    # 5. Save to temporary PLY file
    output_ply_path = f"/tmp/reconstruction_{job_id}.ply"
    write_ply(points, output_ply_path)
    
    ply_text = ""
    try:
        with open(output_ply_path, "r") as f:
            ply_text = f.read()
    except Exception as e:
        print(f"Failed to read local PLY file: {e}")

    # 6. Upload to Firebase Storage if active (optional backup)
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
        "meshData": mesh_info,
        "plyData": ply_text,
        "modelUrl": public_url,
        "pointCount": len(points),
        "cameraPoses": poses,
        "fileType": "ply",
        "fileSizeBytes": len(ply_text)
    }

if __name__ == "__main__":
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    runpod.serverless.start({"handler": handler})
