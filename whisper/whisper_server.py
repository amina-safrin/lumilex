from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel
import tempfile
import os

app = Flask(__name__)
CORS(app)

print("Loading Whisper model...")

model = WhisperModel(
    "tiny",
    device="cpu",
    compute_type="int8"
)

print("Whisper model loaded successfully!")


@app.route("/")
def home():
    return jsonify({
        "message": "LumiLex Whisper server is running!"
    })


@app.route("/transcribe", methods=["POST"])
def transcribe():

    if "audio" not in request.files:
        return jsonify({
            "error": "No audio file received"
        }), 400

    audio_file = request.files["audio"]

    temp_path = None

    try:
        # Create a temporary audio file
        suffix = os.path.splitext(audio_file.filename)[1] or ".webm"

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            audio_file.save(temp_file.name)
            temp_path = temp_file.name

        print("Transcribing audio...")

        # Transcribe the audio
        segments, info = model.transcribe(
            temp_path,
            language="en",
            word_timestamps=True
        )

        text = ""
        words = []

        for segment in segments:

            text += segment.text + " "

            if segment.words:

                for word in segment.words:

                    words.append({
                        "word": word.word.strip(),
                        "start": word.start,
                        "end": word.end
                    })

        text = text.strip()

        print("Transcription:", text)

        return jsonify({
            "text": text,
            "words": words
        })

    except Exception as error:

        print("Transcription error:", error)

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=8000,
        debug=True
    )