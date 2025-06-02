# backend/src/ml_scripts/predict_wait_time.py
import sys
import json

def estimate_wait_time(queue_length, avg_processing_time_minutes):
    """
    Placeholder for ML model prediction.
    Currently uses a simple heuristic.
    """
    try:
        # Convert inputs to numbers
        ql = int(queue_length)
        apt = float(avg_processing_time_minutes)

        if ql < 0 or apt < 0:
            return {"error": "Inputs must be non-negative."}

        # Simple heuristic: Estimated Wait Time = Queue Length * Avg Processing Time
        predicted_wait_minutes = ql * apt
        
        # You could add more complex placeholder logic here,
        # e.g., adjustments based on time of day if passed as an argument.
        
        return {
            "estimatedWaitTimeMinutes": round(predicted_wait_minutes),
            "calculationBasis": "Python placeholder script" 
        }
    except ValueError:
        return {"error": "Invalid input: queue_length and avg_processing_time_minutes must be numbers."}
    except Exception as e:
        return {"error": f"An unexpected error occurred in Python script: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) == 3: # Expecting script_name, queue_length, avg_processing_time
        queue_length_arg = sys.argv[1]
        avg_processing_time_arg = sys.argv[2]
        
        result = estimate_wait_time(queue_length_arg, avg_processing_time_arg)
        
        # Output result as a JSON string to stdout
        print(json.dumps(result))
    else:
        # Output error as JSON string to stdout if incorrect args
        error_result = {
            "error": "Incorrect number of arguments. Expected: queue_length avg_processing_time_minutes"
        }
        print(json.dumps(error_result))
        sys.exit(1) # Exit with error code