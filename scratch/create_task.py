import urllib.request
import urllib.parse
import json

# Setup cookie handler to persist session
from urllib.request import HTTPCookieProcessor
from http.cookiejar import CookieJar

cj = CookieJar()
opener = urllib.request.build_opener(HTTPCookieProcessor(cj))

# 1. Register a test user
register_data = urllib.parse.urlencode({
    'username': 'testuser',
    'password': 'testpassword'
}).encode('utf-8')

try:
    req = urllib.request.Request('http://127.0.0.1:5000/register', data=register_data)
    with opener.open(req) as resp:
        print("Register Status:", resp.status)
except Exception as e:
    print("Register failed (might already exist):", e)

# 2. Login
login_data = urllib.parse.urlencode({
    'username': 'testuser',
    'password': 'testpassword'
}).encode('utf-8')

try:
    req = urllib.request.Request('http://127.0.0.1:5000/login', data=login_data)
    with opener.open(req) as resp:
        print("Login Status:", resp.status)
except Exception as e:
    print("Login failed:", e)

# 3. Add a Task
add_data = json.dumps({
    'title': 'Test focused UI spacing task',
    'priority': 'High'
}).encode('utf-8')

try:
    req = urllib.request.Request('http://127.0.0.1:5000/add', data=add_data, headers={'Content-Type': 'application/json'})
    with opener.open(req) as resp:
        print("Add Task Status:", resp.status)
        print("Response:", resp.read().decode('utf-8'))
except Exception as e:
    print("Add Task failed:", e)

# 4. Fetch the dashboard
try:
    with opener.open('http://127.0.0.1:5000/') as resp:
        html = resp.read().decode('utf-8')
        print("Dashboard Status:", resp.status)
        # Find where task-card starts
        idx = html.find('class="task-card')
        if idx != -1:
            print("Task Card HTML snippet:")
            print(html[idx-100:idx+600])
        else:
            print("No task-card found in dashboard HTML.")
except Exception as e:
    print("Fetch dashboard failed:", e)
