"""
Task queue initialization — Huey task queue for background processing.
"""

from huey import SqliteHuey
import os

# Create Huey instance with SQLite storage
# This allows tasks to persist across restarts
huey = SqliteHuey(
    'neurochain',
    filename=os.path.join(os.path.dirname(__file__), '../../huey.db'),
    immediate=False,  # Set to True for testing (executes immediately)
    results=True,     # Store task results
    store_none=False,
    utc=True,
)
