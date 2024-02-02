from sequoia_demo import app
from sequoia_demo import routes


def get_routes():
    return routes


get_routes()


if __name__ == '__main__':
    app.run(debug=True)
