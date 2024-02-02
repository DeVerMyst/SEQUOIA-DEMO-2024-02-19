try:
    from sequoia_demo.components.logging_utils import logging
except ModuleNotFoundError:
    from logging_utils import logging

try:
    import config as config
except ModuleNotFoundError:
    import os
    import sys

    parent_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..', '..'))
    sys.path.append(parent_dir)
    import config as config


import pandas as pd
import json


def config_sensors(path=config.CALIBRATION_PATH):
    # ========================================
    #                 TBD
    # ========================================
    # arrayCoordinates, sensors not usesul
    # ========================================
    # ONLY RESULT IS NEEDED -> Change the test
    # ========================================
    # Handle exceptions gracefully
    try:
        # Load calibration files
        with open(path, 'r') as f:
            data = json.load(f)
            df = pd.DataFrame(data)
        logging.info(" # [admin] Calibration files loaded successfully")
    except FileNotFoundError:
        logging.error(" # [admin] Calibration file not found: %s",
                      path,
                      exc_info=True)

    # sensors coordinates and lenght
    array_coordinates = df.arrayCoordinates
    sensors = df.sensors
    logging.info(" # [admin] Calibration files:\
                 {} sensors".format(len(array_coordinates)))
    return array_coordinates, sensors, data


if __name__ == '__main__':
    sensors = config_sensors()
    print(len(sensors))
