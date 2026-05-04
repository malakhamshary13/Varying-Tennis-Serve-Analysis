"""
Tennis Video Validator
======================
Lightweight pre-flight check that runs BEFORE the full extraction.
Samples ~8 evenly-spaced frames and verifies:

  1. A person (pose landmarks) is detected in at least 2 of those frames.
  2. At least 1 frame shows a raised arm (wrist landmark above nose level)
     — the key indicator of a serve or overhead motion.

Uses MediaPipe IMAGE mode so it can seek to arbitrary frames without
needing a monotonically-increasing timestamp.

Raises:
    ValueError with a user-friendly message on failure.
"""

import cv2
import mediapipe as mp
from extractor import ensure_model, MODEL_PATH

# Minimum frames (out of SAMPLE_COUNT) that must contain a detected person.
_MIN_PERSON_FRAMES = 2
# At least this many frames must show a raised arm (wrist y < nose y in
# normalised coords, where 0 = top of frame).
_MIN_RAISED_ARM_FRAMES = 1
# Number of frames to sample across the video.
_SAMPLE_COUNT = 8


def validate_tennis_video(video_path: str) -> None:
    """
    Run a quick pose-based sanity check on the uploaded video.

    Args:
        video_path: absolute path to the video file (already validated for
                    extension and size by app.py).

    Raises:
        ValueError: descriptive message surfaced directly to the frontend.
    """
    ensure_model()

    BaseOptions           = mp.tasks.BaseOptions
    PoseLandmarker        = mp.tasks.vision.PoseLandmarker
    PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
    VisionRunningMode     = mp.tasks.vision.RunningMode

    # ── Open video ────────────────────────────────────────────────────────────
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Cannot open video file.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames < 15:
        cap.release()
        raise ValueError(
            "Video is too short. Please upload a tennis clip of at least a few seconds."
        )

    # Evenly-spaced frame indices across the full clip
    step = max(1, total_frames // _SAMPLE_COUNT)
    sample_indices = [i * step for i in range(_SAMPLE_COUNT)]

    # ── Run MediaPipe in IMAGE mode (arbitrary seeks, no timestamp needed) ────
    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
    )

    person_frames    = 0
    raised_arm_frames = 0

    with PoseLandmarker.create_from_options(options) as landmarker:
        for frame_idx in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            success, frame = cap.read()
            if not success:
                continue

            rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image  = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = landmarker.detect(image)   # IMAGE mode → .detect()

            if not result.pose_landmarks:
                continue

            person_frames += 1
            lm = result.pose_landmarks[0]

            # Landmark 0  = nose
            # Landmark 15 = left wrist  (normalised; 0.0 = top of frame)
            # Landmark 16 = right wrist
            nose_y        = lm[0].y
            left_wrist_y  = lm[15].y if len(lm) > 15 else 1.0
            right_wrist_y = lm[16].y if len(lm) > 16 else 1.0

            # Wrist above nose → arm is raised (serve / overhead motion)
            if left_wrist_y < nose_y or right_wrist_y < nose_y:
                raised_arm_frames += 1

    cap.release()

    # ── Decision rules ────────────────────────────────────────────────────────
    if person_frames < _MIN_PERSON_FRAMES:
        raise ValueError(
            "No player detected in the video. "
            "Please upload footage of a tennis serve with a clearly visible player."
        )

    if raised_arm_frames < _MIN_RAISED_ARM_FRAMES:
        raise ValueError(
            "No serve motion detected. "
            "The video does not appear to contain a tennis serve — "
            "ensure the player's full upper body is visible during the serve motion."
        )
