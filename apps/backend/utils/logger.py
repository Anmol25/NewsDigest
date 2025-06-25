import logging
import logging.config
from pathlib import Path
import yaml
# Setup Logging
config_path = "utils/logger.yaml"
with open(config_path, 'r') as file:
    config = yaml.safe_load(file)
    logging.config.dictConfig(config)
