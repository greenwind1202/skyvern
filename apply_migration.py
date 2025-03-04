import os
import sys
from sqlalchemy import create_engine
from alembic import command
from alembic.config import Config

# Set the DATABASE_STRING environment variable
os.environ["DATABASE_STRING"] = "postgresql+psycopg://skyvern:skyvern@localhost/skyvern"

# Get the absolute path to the alembic.ini file
alembic_ini_path = os.path.abspath("alembic.ini")

# Create an Alembic configuration object
alembic_cfg = Config(alembic_ini_path)

# Apply the migration
command.upgrade(alembic_cfg, "head")

print("Migration applied successfully!")
