import os
import logging

CONFIG = {
    "loglevel": int(os.environ.get("CRYSTOOLS_LOGLEVEL", logging.INFO))
}
