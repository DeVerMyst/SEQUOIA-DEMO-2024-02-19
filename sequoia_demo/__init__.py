from sequoia_demo.components.logging_utils import configure_logging, logging
import config as config
from flask import Flask


app = Flask(__name__)

# Load the handle for monitoring
log_file_path = config.LOG_PATH
configure_logging(log_file_path)

# monitoring ready to use
logger = logging.getLogger(__name__)
logger.info(" # [admin] Application Starting")
