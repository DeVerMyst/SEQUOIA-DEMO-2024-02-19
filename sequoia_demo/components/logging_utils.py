import logging
import os
import socket
import logging.config


class HostnameFilter(logging.Filter):
    def filter(self, record):
        hostname = socket.gethostname()
        record.hostname = hostname
        record.levelno = logging.INFO
        return True


def configure_logging(log_file_path):
    # Configure logging
    log_folder = os.path.dirname(log_file_path)
    if not os.path.exists(log_folder):
        os.makedirs(log_folder)

    if not os.path.isfile(log_file_path):
        with open(log_file_path, 'w'):
            pass

    logging.config.dictConfig({
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {
            'hostname': {
                '()': HostnameFilter
            }
        },
        'handlers': {
            'file': {
                'class': 'logging.FileHandler',
                'filename': log_file_path,
                'mode': 'a',
                'formatter': 'verbose',
                'filters': ['hostname']
            },
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
                'filters': ['hostname']
            },
        },
        'formatters': {
            'verbose': {
                'format': '%(asctime)s %(levelname)-8s %(hostname)s %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            },
        },
        'loggers': {
            '': {
                'handlers': ['file', 'console'],
                'level': logging.INFO,
            },
        }
    })
