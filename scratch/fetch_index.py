import urllib.request

try:
    response = urllib.request.urlopen('http://127.0.0.1:5000')
    html = response.read().decode('utf-8')
    print("STATUS OK")
    print(html[:1000])  # Print first 1000 characters
except Exception as e:
    print("ERROR:", e)
