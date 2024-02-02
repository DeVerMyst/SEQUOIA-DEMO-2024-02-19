import pytest
import os
import json
from sequoia_demo.components.sensors_utils import config_sensors

# Utilisez un chemin de test pour le fichier de calibration
TEST_CALIBRATION_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '../tests/calibration.json'))


@pytest.fixture
def create_test_calibration_file():
    # Create a fake calibration file
    test_data = {'arrayCoordinates': [1, 2, 3], 'sensors': [1, 2, 3]}

    # Check that repository is existing
    if not os.path.exists(os.path.dirname(TEST_CALIBRATION_PATH)):
        os.makedirs(os.path.dirname(TEST_CALIBRATION_PATH))

    with open(TEST_CALIBRATION_PATH, 'w') as f:
        json.dump(test_data, f)

    yield TEST_CALIBRATION_PATH

    # delete the file after the test
    os.remove(path=TEST_CALIBRATION_PATH)


class TestConfigSensors:
    def test_config_sensors(self, create_test_calibration_file, caplog):
        print("Test test_config_sensors called with path:",
              TEST_CALIBRATION_PATH)

        # try to execute the configuration file
        arrayCoordinates, sensors, d = config_sensors(path=TEST_CALIBRATION_PATH)

        # check the result
        assert len(arrayCoordinates) == 3
        assert len(sensors) == 3

        # error message in case of failure
        assert "Calibration files loaded successfully" in caplog.text


if __name__ == '__main__':
    pytest.main([__file__])
