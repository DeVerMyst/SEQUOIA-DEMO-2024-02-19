#### Real time traffic monitoring 

**virtual environnement**
`python -m venv .flask_app`

(linux/mac os)
`source .flask_app/bin/activate `

**upgrade pip**
`pip install --upgrade pip`

**install requirements** 
`pip install -r requirements.txt`

**run application**
`python run.py`

**Virtual environnement version** 
> NOT NEEDED
> Flask-Leaflet needs python 3.11 or higher

## Web App Architecture

```bash
SEQUOIA-DEMO-2024-02-19/
│
├── sequoia_demo/
│   ├── __init__.py
│   ├── routes.py
│   ├── components/
│       ├── __init__.py
│       ├── logging_utils.py
│       ├── sensors_utils.py
│       └── *.py
│   ├── templates/
│   │   ├── base.html   
│   │   └── index.html
│   └── static/
│       ├── css/
│       │   ├── *.css
│       │   └── style.css
│       ├── data/
│           └── sensors.json
│       ├── js/
│       │   ├── *.js
│       │   ├── main.js
│       │   └── components/
│       │       └── *.mjs
│       └── img/
│           └── logo.png
│
├── tests/
│   └── test_demo.py
│
├── flask_app/  (virtual Python environnement)
│
├── config.py
├── run.py
└── requirements.txt
```
