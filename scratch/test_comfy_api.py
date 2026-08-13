import urllib.request
import urllib.parse
import json
import os
import argparse
import time

def trigger_comfy_3d(comfy_url, image_path, output_filename="output_head.glb"):
    """
    Demonstrates programmatic invocation of ComfyUI REST API.
    """
    server_address = comfy_url.replace("http://", "").replace("https://", "").strip("/")
    
    # 1. Upload the source portrait image
    print(f"Uploading {image_path} to ComfyUI server...")
    with open(image_path, "rb") as f:
        img_data = f.read()
        
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    data = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="{os.path.basename(image_path)}"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + img_data + f"\r\n--{boundary}--\r\n".encode("utf-8")
    
    req = urllib.request.Request(
        f"http://{server_address}/upload/image",
        data=data,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            upload_result = json.loads(res.read().decode("utf-8"))
            uploaded_name = upload_result["name"]
            print(f"Image uploaded successfully as: {uploaded_name}")
    except Exception as e:
        print(f"Failed to upload image: {e}")
        return False

    # 2. Define the ComfyUI 3D API Workflow JSON
    # This matches the node sequence: LoadImage -> SV3D -> InstantMesh -> SaveGLB
    workflow = {
        "3": {
            "inputs": {
                "image": uploaded_name,
                "upload": "image"
            },
            "class_type": "LoadImage"
        },
        "10": {
            "inputs": {
                "ckpt_name": "sv3d_p.safetensors"
            },
            "class_type": "ImageOnlyCheckpointLoader"
        },
        "12": {
            "inputs": {
                "width": 512,
                "height": 512,
                "video_frames": 21,
                "fps": 6,
                "elevation": 0.0,
                "images": ["3", 0],
                "checkpoint": ["10", 0]
            },
            "class_type": "SV3D_BatchPrediction"
        },
        "20": {
            "inputs": {
                "images": ["12", 0],
                "model_name": "InstantMesh"
            },
            "class_type": "InstantMesh_Reconstruction"
        },
        "30": {
            "inputs": {
                "mesh": ["20", 0],
                "filename_prefix": "reconstructed_head"
            },
            "class_type": "SaveGLB"
        }
    }

    # 3. Queue the prompt
    print("Triggering 3D reconstruction workflow...")
    prompt_data = json.dumps({"prompt": workflow}).encode("utf-8")
    req = urllib.request.Request(
        f"http://{server_address}/prompt",
        data=prompt_data,
        headers={"Content-Type": "application/json"}
    )
    
    prompt_id = ""
    try:
        with urllib.request.urlopen(req) as res:
            result = json.loads(res.read().decode("utf-8"))
            prompt_id = result["prompt_id"]
            print(f"Workflow queued. Prompt ID: {prompt_id}")
    except Exception as e:
        print(f"Failed to queue workflow: {e}")
        return False

    # 4. Poll status until complete
    print("Polling job status...")
    while True:
        try:
            status_req = urllib.request.urlopen(f"http://{server_address}/history/{prompt_id}")
            history = json.loads(status_req.read().decode("utf-8"))
            
            if prompt_id in history:
                # Execution finished! Get output filename
                outputs = history[prompt_id]["outputs"]
                glb_node_output = outputs.get("30", {})
                glb_files = glb_node_output.get("gltf", [])
                
                if glb_files:
                    filename = glb_files[0]["filename"]
                    print(f"3D reconstruction complete! Downloading {filename}...")
                    
                    # Download completed GLB
                    dl_url = f"http://{server_address}/view?filename={filename}&type=output"
                    urllib.request.urlretrieve(dl_url, output_filename)
                    print(f"Successfully downloaded 3D mesh model to: {output_filename}")
                    return True
                break
        except Exception as e:
            pass
        time.sleep(2)
        
    return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test ComfyUI 3D API Invocation")
    parser.add_argument("--url", default="http://127.0.0.1:8188", help="ComfyUI server URL")
    parser.add_argument("--image", required=True, help="Path to input face photo")
    args = parser.parse_args()
    
    trigger_comfy_3d(args.url, args.image)
