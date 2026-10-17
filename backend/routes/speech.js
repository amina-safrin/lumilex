const express = require("express");
const multer = require("multer");

const router = express.Router();

// Keep the uploaded audio in memory.
// We don't need to permanently save recordings.
const upload = multer({
    storage: multer.memoryStorage()
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                error: "No audio file received"
            });
        }

        console.log("Audio received from LumiLex");

        // Convert the uploaded audio into a Blob
        const audioBlob = new Blob(
            [req.file.buffer],
            {
                type: req.file.mimetype
            }
        );

        // Create form data for the Python Whisper server
        const formData = new FormData();

        formData.append(
            "audio",
            audioBlob,
            req.file.originalname
        );

        console.log("Sending audio to Whisper...");

        // Send audio to our local Python server
        const whisperResponse = await fetch(
            "http://127.0.0.1:8000/transcribe",
            {
                method: "POST",
                body: formData
            }
        );

        const whisperData = await whisperResponse.json();

        if (!whisperResponse.ok) {
            return res.status(500).json({
                error: whisperData.error || "Whisper transcription failed"
            });
        }

        console.log("Whisper transcription:", whisperData.text);

        // Send Whisper's result back to LumiLex
        res.json(whisperData);

    } catch (error) {

        console.error("Speech route error:", error);

        res.status(500).json({
            error: "Speech transcription failed",
            details: error.message
        });
    }
});

module.exports = router;