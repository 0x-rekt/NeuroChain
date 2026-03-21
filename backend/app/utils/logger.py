"""
Logger — Simple console logger with ISO timestamps.
"""

import logging
import sys
from datetime import datetime

# Configure logger
logger = logging.getLogger("cognitive-graph")
logger.setLevel(logging.INFO)

# Console handler
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)

# Format: [timestamp] [level] message
formatter = logging.Formatter(
    fmt="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S"
)
handler.setFormatter(formatter)

logger.addHandler(handler)
