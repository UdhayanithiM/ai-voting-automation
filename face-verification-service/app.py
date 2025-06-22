from flask import Flask, request, jsonify
from deepface import DeepFace
import traceback

app = Flask(__name__)

MODEL_NAME = "SFace"
DETECTOR_BACKEND = "opencv"
THRESHOLD = 0.6  # Recommended for cosine distance

# Load model at startup
print("Loading face model...")
try:
    _ = DeepFace.build_model(MODEL_NAME)
    print(f"Model '{MODEL_NAME}' loaded successfully.")
except Exception as e:
    print(f"Failed to load model: {e}")

@app.route('/verify', methods=['POST'])
def verify_face():
    try:
        input_data = request.get_json()
        if not input_data or 'img1_base64' not in input_data or 'img2_base64' not in input_data:
            return jsonify({"verified": False, "error": "Missing base64 images"}), 400

        result = DeepFace.verify(
            img1_path=input_data['img1_base64'],
            img2_path=input_data['img2_base64'],
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True
        )

        # Force secure decision
        if result["verified"] and result["distance"] <= THRESHOLD:
            return jsonify({
                "verified": True,
                "distance": result["distance"],
                "threshold": THRESHOLD,
                "model": MODEL_NAME
            }), 200
        else:
            return jsonify({
                "verified": False,
                "distance": result.get("distance"),
                "threshold": THRESHOLD,
                "message": "Face mismatch or low similarity"
            }), 401

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"verified": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001)
