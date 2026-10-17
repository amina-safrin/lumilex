from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
import tempfile
import os

app = Flask(__name__)
CORS(app)

# =========================================================
# LOAD ACCURATE WHISPER MODEL
# "base.en" offers significantly higher accuracy for children's
# reading voices than "tiny", while remaining fast on CPU.
# =========================================================

MODEL_NAME = os.environ.get("WHISPER_MODEL", "base.en")
print(f"Loading Whisper model ({MODEL_NAME})...")

try:
    model = WhisperModel(
        MODEL_NAME,
        device="cpu",
        compute_type="int8"
    )
    print(f"Whisper model ({MODEL_NAME}) loaded successfully!")
except Exception as err:
    print(f"Failed to load {MODEL_NAME}, falling back to 'base' or 'tiny':", err)
    try:
        model = WhisperModel("base", device="cpu", compute_type="int8")
        print("Whisper model (base) loaded successfully!")
    except Exception:
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        print("Whisper model (tiny) loaded successfully!")


@app.route("/")
def home():
    return jsonify({
        "message": "LumiLex Dyslexia-Friendly Whisper Server is running!",
        "status": "ready"
    })


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({
            "error": "No audio file received"
        }), 400

    audio_file = request.files["audio"]
    # Optional prompt containing expected story words to guide Whisper's decoder
    prompt = request.form.get("prompt", "")

    temp_path = None

    try:
        # Create a temporary audio file with appropriate extension
        suffix = os.path.splitext(audio_file.filename)[1] or ".webm"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name

        print(f"Transcribing audio with prompt context: '{prompt[:60]}...'")

        # Transcribe with voice activity detection and accuracy optimizations
        # vad_filter removes ambient room noise and breathing artifacts.
        # temperature=0.0 prevents hallucinations during pauses.
        segments, info = model.transcribe(
            temp_path,
            language="en",
            initial_prompt=prompt if prompt else None,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400),
            beam_size=5,
            temperature=0.0,
            condition_on_previous_text=False,
            word_timestamps=True
        )

        text_parts = []
        words = []

        for segment in segments:
            text_parts.append(segment.text.strip())
            if segment.words:
                for word in segment.words:
                    clean_word = word.word.strip()
                    if clean_word:
                        words.append({
                            "word": clean_word,
                            "start": word.start,
                            "end": word.end,
                            "probability": word.probability
                        })

        full_text = " ".join(text_parts).strip()
        print("Whisper transcription result:", full_text)

        return jsonify({
            "text": full_text,
            "words": words,
            "language": info.language,
            "duration": info.duration
        })

    except Exception as error:
        print("Transcription error:", error)
        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


if __name__ == "__main__":
    port = int(os.environ.get("WHISPER_PORT", 8000))
    print(f"Starting LumiLex Whisper service on port {port}...")
    app.run(
        host="127.0.0.1",
        port=port,
        debug=False
    )